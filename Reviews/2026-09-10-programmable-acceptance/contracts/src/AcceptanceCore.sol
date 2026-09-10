// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {AT, IAcceptanceHook} from "./AcceptanceTypes.sol";

/// @notice Disposable standalone boundary. No upgrade or privileged acceptance.
contract AcceptanceCore {
    error Refused();
    error InvalidItem(uint256 index);
    error IncorrectFunding(uint256 expected, uint256 actual);
    error HookRefused(uint256 index);
    bytes32 public constant OK = keccak256("efs.acceptance.ok.v1");
    bytes32 private constant ITEM =
        keccak256("Item(bytes32 typeId,bytes32 activationId,bytes32 bodyHash,uint256 value)");
    bytes32 private constant PLAN =
        keccak256("Plan(address author,address executor,uint256 nonce,uint256 deadline,bytes32 itemsHash)");
    mapping(bytes32 => AT.TypeInfo) private types;
    mapping(bytes32 => AT.Activation) private activations;
    mapping(bytes32 => AT.Receipt) private receipts;
    mapping(bytes32 => bytes) private bodies;
    mapping(bytes32 => uint256) private outcomes;
    mapping(address => uint256) public nonces;
    mapping(bytes32 => address) public rawAuthor;
    uint256 private entered;
    uint256 private rawNonce;
    event Accepted(
        bytes32 indexed receipt, bytes32 indexed typeId, address indexed author, bytes32 planId, uint256 index
    );
    modifier guarded() {
        if (entered != 0) revert Refused();
        entered = 1;
        _;
        entered = 0;
    }

    function registerType(bytes32 descriptor, bytes calldata kinds, AT.Rule calldata rule)
        external
        guarded
        returns (bytes32 id)
    {
        if (kinds.length == 0 || kinds.length > 8) revert Refused();
        for (uint256 i; i < kinds.length; ++i) {
            if (uint8(kinds[i]) > 3) revert Refused();
        }
        bytes32 ruleId;
        if (rule.mode == 0) {
            if (rule.codeHash != 0 || rule.semanticConfig != 0 || rule.gasLimit != 0) revert Refused();
        } else {
            if (rule.mode > 2 || rule.codeHash == 0 || rule.gasLimit < 25_000 || rule.gasLimit > 500_000) {
                revert Refused();
            }
            ruleId = keccak256(
                abi.encode(
                    keccak256("efs.acceptance.rule.v1"), rule.codeHash, rule.semanticConfig, rule.mode, rule.gasLimit
                )
            );
        }
        bytes32 shape = keccak256(abi.encode(keccak256("efs.acceptance.shape.v1"), kinds));
        id = keccak256(abi.encode(keccak256("efs.acceptance.type.v1"), descriptor, shape, ruleId));
        if (!types[id].exists) types[id] = AT.TypeInfo(true, descriptor, kinds, ruleId, rule);
    }

    function activate(bytes32 tid, address hook, bytes32 localConfig) external guarded returns (bytes32 id) {
        AT.Rule storage r = types[tid].rule;
        if (!types[tid].exists || r.mode == 0) revert Refused();
        checkBinding(r, hook, localConfig);
        id = keccak256(
            abi.encode(
                keccak256("efs.acceptance.activation.v1"),
                block.chainid,
                address(this),
                tid,
                hook,
                r.codeHash,
                localConfig,
                r.mode,
                r.gasLimit
            )
        );
        activations[id] = AT.Activation(true, tid, hook, localConfig);
    }

    function execute(AT.Plan calldata p, bytes calldata sig) external payable guarded returns (bytes32[] memory ids) {
        bytes32 pid = hashPlan(p);
        if (p.author == address(0) || (p.executor != address(0) && p.executor != msg.sender)) revert Refused();
        if (sig.length == 0) {
            if (msg.sender != p.author) revert Refused();
        } else {
            if (sig.length != 65) revert Refused();
            bytes32 r;
            bytes32 s;
            uint8 v;
            assembly ("memory-safe") {
                r := calldataload(sig.offset)
                s := calldataload(add(sig.offset, 32))
                v := byte(0, calldataload(add(sig.offset, 64)))
            }
            if (
                uint256(s) > 0x7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0 || (v != 27 && v != 28)
                    || ecrecover(pid, v, r, s) != p.author
            ) revert Refused();
        }
        uint256 prior = outcomes[pid];
        if (prior != 0) {
            if (msg.value != 0) revert Refused();
            ids = new bytes32[](prior);
            for (uint256 i; i < prior; ++i) {
                ids[i] = receiptId(pid, i);
            }
            return ids;
        }
        if (p.items.length == 0 || p.items.length > 8 || p.nonce != nonces[p.author] || block.timestamp > p.deadline) {
            revert Refused();
        }
        uint256 funding;
        for (uint256 i; i < p.items.length; ++i) {
            AT.Item calldata it = p.items[i];
            AT.TypeInfo storage t = types[it.typeId];
            if (!t.exists || it.body.length != t.kinds.length * 32) revert InvalidItem(i);
            for (uint256 j; j < t.kinds.length; ++j) {
                uint256 word;
                bytes calldata body = it.body;
                assembly ("memory-safe") { word := calldataload(add(body.offset, mul(j, 32))) }
                if ((uint8(t.kinds[j]) == 1 && word > type(uint160).max) || (uint8(t.kinds[j]) == 3 && word > 1)) {
                    revert InvalidItem(i);
                }
            }
            if (t.rule.mode == 0) {
                if (it.activationId != 0 || it.value != 0) revert InvalidItem(i);
            } else {
                AT.Activation storage a = activations[it.activationId];
                if (!a.exists || a.typeId != it.typeId || (t.rule.mode == 1 && it.value != 0)) revert InvalidItem(i);
            }
            funding += it.value;
        }
        if (msg.value != funding) revert IncorrectFunding(funding, msg.value);
        ++nonces[p.author];
        ids = new bytes32[](p.items.length);
        for (uint256 i; i < p.items.length; ++i) {
            AT.Item calldata it = p.items[i];
            bytes32 id = receiptId(pid, i);
            ids[i] = id;
            bytes32 basis;
            AT.TypeInfo storage t = types[it.typeId];
            if (t.rule.mode != 0) {
                AT.Activation storage a = activations[it.activationId];
                checkBinding(t.rule, a.hook, a.localConfig);
                AT.Context memory context =
                    AT.Context(p.author, msg.sender, it.typeId, keccak256(it.body), it.activationId, pid, i);
                basis = invoke(t.rule, a.hook, abi.encodeCall(IAcceptanceHook.accept, (context, it.body)), it.value, i);
                checkBinding(t.rule, a.hook, a.localConfig);
            }
            receipts[id] = AT.Receipt(
                true,
                p.author,
                it.typeId,
                keccak256(it.body),
                t.ruleId,
                it.activationId,
                basis,
                pid,
                i,
                block.number,
                block.chainid,
                address(this),
                msg.sender
            );
            bodies[id] = it.body;
            emit Accepted(id, it.typeId, p.author, pid, i);
        }
        outcomes[pid] = p.items.length;
    }

    function checkBinding(AT.Rule storage rule, address hook, bytes32 localConfig) private view {
        if (hook.code.length == 0 || hook.codehash != rule.codeHash) revert Refused();
        bytes memory input = abi.encodeCall(IAcceptanceHook.binding, ());
        bytes memory output = new bytes(96);
        bool ok;
        uint256 size;
        assembly ("memory-safe") {
            ok := staticcall(30000, hook, add(input, 32), mload(input), add(output, 32), 96)
            size := returndatasize()
        }
        if (!ok || size != 96) revert Refused();
        (address boundCore, bytes32 semantic, bytes32 local) = abi.decode(output, (address, bytes32, bytes32));
        if (boundCore != address(this) || semantic != rule.semanticConfig || local != localConfig) revert Refused();
    }

    function invoke(AT.Rule storage rule, address hook, bytes memory input, uint256 value, uint256 index)
        private
        returns (bytes32 basis)
    {
        uint256 gasLimit = rule.gasLimit;
        // EIP-150 headroom plus enough gas for bounded failure; never copy attacker-sized returndata.
        if (gasleft() < gasLimit + gasLimit / 63 + 30_000) revert HookRefused(index);
        bytes memory output = new bytes(64);
        bool ok;
        uint256 size;
        if (rule.mode == 1) {
            assembly ("memory-safe") {
                ok := staticcall(gasLimit, hook, add(input, 32), mload(input), add(output, 32), 64)
                size := returndatasize()
            }
        } else {
            assembly ("memory-safe") {
                ok := call(gasLimit, hook, value, add(input, 32), mload(input), add(output, 32), 64)
                size := returndatasize()
            }
        }
        if (!ok || size != 64) revert HookRefused(index);
        bytes32 magic;
        (magic, basis) = abi.decode(output, (bytes32, bytes32));
        if (magic != OK) revert HookRefused(index);
    }

    function hashPlan(AT.Plan calldata p) public view returns (bytes32) {
        bytes32[] memory hashes = new bytes32[](p.items.length);
        for (uint256 i; i < p.items.length; ++i) {
            AT.Item calldata it = p.items[i];
            hashes[i] = keccak256(abi.encode(ITEM, it.typeId, it.activationId, keccak256(it.body), it.value));
        }
        bytes32 domain = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256("EFS Acceptance Lab"),
                keccak256("1"),
                block.chainid,
                address(this)
            )
        );
        bytes32 h =
            keccak256(abi.encode(PLAN, p.author, p.executor, p.nonce, p.deadline, keccak256(abi.encodePacked(hashes))));
        return keccak256(abi.encodePacked(hex"1901", domain, h));
    }

    function receiptId(bytes32 pid, uint256 index) public pure returns (bytes32) {
        return keccak256(abi.encode(keccak256("efs.acceptance.receipt.v1"), pid, index));
    }

    function getType(bytes32 id) external view returns (AT.TypeInfo memory) {
        return types[id];
    }

    function getActivation(bytes32 id) external view returns (AT.Activation memory) {
        return activations[id];
    }

    function getReceipt(bytes32 id) external view returns (AT.Receipt memory) {
        return receipts[id];
    }

    function getBody(bytes32 id) external view returns (bytes memory) {
        return bodies[id];
    }

    function retainRaw(bytes32 target) external guarded returns (bytes32 id) {
        id = keccak256(
            abi.encode(keccak256("efs.acceptance.raw.v1"), address(this), block.chainid, msg.sender, target, rawNonce++)
        );
        rawAuthor[id] = msg.sender;
    }
}
