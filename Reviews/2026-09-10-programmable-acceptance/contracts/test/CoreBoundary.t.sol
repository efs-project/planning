// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {AcceptanceCore} from "../src/AcceptanceCore.sol";
import {AT} from "../src/AcceptanceTypes.sol";

interface Vm {
    function prank(address) external;
    function deal(address, uint256) external;
    function addr(uint256) external returns (address);
    function sign(uint256, bytes32) external returns (uint8, bytes32, bytes32);
    function warp(uint256) external;
    function chainId(uint256) external;
    function etch(address, bytes calldata) external;
    function expectRevert() external;
    function expectRevert(bytes calldata) external;
    function expectCall(address, bytes calldata, uint64) external;
}

abstract contract CoreFixture {
    Vm constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
    AcceptanceCore internal core;
    address internal author;
    bytes32 internal note;

    function setUp() public virtual {
        core = new AcceptanceCore();
        author = vm.addr(123);
        note = core.registerType(keccak256("Note"), hex"00", AT.Rule(0, 0, 0, 0));
        vm.deal(author, 100 ether);
        vm.deal(address(this), 100 ether);
    }

    function plan(bytes memory body) internal view returns (AT.Plan memory p) {
        p = AT.Plan(author, address(0), core.nonces(author), block.timestamp + 100, new AT.Item[](1));
        p.items[0] = AT.Item(note, 0, body, 0);
    }

    function signature(AT.Plan memory p) internal returns (bytes memory) {
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(123, core.hashPlan(p));
        return abi.encodePacked(r, s, v);
    }

    function fails(AT.Plan memory p, bytes memory sig, uint256 value) internal {
        vm.prank(author);
        (bool ok,) = address(core).call{value: value}(abi.encodeCall(core.execute, (p, sig)));
        require(!ok, "unauthorized/invalid plan accepted");
    }
}

contract CoreBoundaryTest is CoreFixture {
    function testDirectStoresExactReceiptAndRetry() public {
        AT.Plan memory p = plan(abi.encode(uint256(7)));
        vm.prank(author);
        bytes32[] memory ids = core.execute(p, "");
        require(ids.length == 1, "missing receipt");
        AT.Receipt memory r = core.getReceipt(ids[0]);
        require(r.accepted && r.author == author && r.typeId == note, "wrong authority");
        require(
            r.bodyHash == keccak256(p.items[0].body) && keccak256(core.getBody(ids[0])) == r.bodyHash, "wrong payload"
        );
        require(r.core == address(core) && r.chainId == block.chainid && r.planId == core.hashPlan(p), "wrong domain");
        vm.warp(p.deadline + 1);
        vm.prank(author);
        bytes32[] memory retry = core.execute(p, "");
        require(retry[0] == ids[0] && core.nonces(author) == 1, "retry changed outcome");
        fails(p, "", 1);
    }

    function testForgedAuthorRejected() public {
        AT.Plan memory p = plan(abi.encode(uint256(7)));
        (bool ok,) = address(core).call(abi.encodeCall(core.execute, (p, "")));
        require(!ok, "forged author accepted");
    }

    function testOriginalSubmitterRetainedAcrossAnotherRelayerRetry() public {
        AT.Plan memory p = plan(abi.encode(uint256(7)));
        vm.prank(author);
        bytes32 id = core.execute(p, "")[0];
        require(core.getReceipt(id).submitter == author, "original submitter absent");
        bytes memory sig = signature(p);
        core.execute(p, sig);
        require(core.getReceipt(id).submitter == author, "retry rewrote payer");
    }

    function testRelayBindsIntentExecutorChainAndCore() public {
        AT.Plan memory p = plan(abi.encode(uint256(7)));
        p.executor = address(this);
        bytes memory sig = signature(p);
        p.items[0].body = abi.encode(uint256(8));
        (bool intentOk,) = address(core).call(abi.encodeCall(core.execute, (p, sig)));
        require(!intentOk, "intent substitution");
        p.items[0].body = abi.encode(uint256(7));
        vm.chainId(block.chainid + 1);
        (bool chainOk,) = address(core).call(abi.encodeCall(core.execute, (p, sig)));
        require(!chainOk, "chain replay");
        vm.chainId(block.chainid - 1);
        AcceptanceCore other = new AcceptanceCore();
        (bool coreOk,) = address(other).call(abi.encodeCall(other.execute, (p, sig)));
        require(!coreOk, "core replay");
        bytes32[] memory ids = core.execute(p, sig);
        require(ids.length == 1, "relay missing receipt");
        fails(p, sig, 0); // author is not the signed executor, even on retry
    }

    function testDirectExecutorConstraintAndForgedSignature() public {
        AT.Plan memory p = plan(abi.encode(uint256(7)));
        p.executor = address(this);
        fails(p, "", 0);
        p.executor = address(0);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(456, core.hashPlan(p));
        fails(p, abi.encodePacked(r, s, v), 0);
        fails(p, hex"01", 0);
        (v, r, s) = vm.sign(123, core.hashPlan(p));
        bytes32 highS = bytes32(0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141 - uint256(s));
        fails(p, abi.encodePacked(r, highS, v == 27 ? uint8(28) : uint8(27)), 0);
    }

    function testSignedOrderedItemsAndEveryIntentFieldBound() public {
        AT.Plan memory p = plan(abi.encode(uint256(7)));
        p.executor = address(this);
        AT.Item memory a = p.items[0];
        p.items = new AT.Item[](2);
        p.items[0] = a;
        p.items[1] = AT.Item(note, 0, abi.encode(uint256(8)), 0);
        bytes memory sig = signature(p);
        for (uint256 i; i < 8; ++i) {
            AT.Plan memory q = abi.decode(abi.encode(p), (AT.Plan));
            if (i == 0) {
                q.items[0] = p.items[1];
                q.items[1] = p.items[0];
            }
            if (i == 1) q.author = address(this);
            if (i == 2) q.executor = address(0);
            if (i == 3) q.nonce = 1;
            if (i == 4) q.deadline += 1;
            if (i == 5) q.items[0].typeId = bytes32(uint256(1));
            if (i == 6) q.items[0].activationId = bytes32(uint256(1));
            if (i == 7) q.items[0].value = 1;
            (bool ok,) = address(core).call(abi.encodeCall(core.execute, (q, sig)));
            require(!ok, "signed field substituted");
        }
        require(core.execute(p, sig).length == 2, "signed ordered batch refused");
    }

    function testStructureNonceExpiryAndFundingRejected() public {
        AT.Plan memory p = plan(hex"01");
        fails(p, "", 0);
        p.items[0].body = abi.encode(uint256(7));
        p.nonce = 1;
        fails(p, "", 0);
        p.nonce = 0;
        p.deadline = 0;
        vm.warp(1);
        fails(p, "", 0);
        p.deadline = 100;
        fails(p, "", 1);
        p.items[0].value = 1;
        fails(p, "", 1);
        require(core.nonces(author) == 0 && address(core).balance == 0, "invalid plan effects");
    }

    function testCanonicalAddressAndBoolWordsRejected() public {
        bytes32 t = core.registerType(keccak256("canonical"), hex"0103", AT.Rule(0, 0, 0, 0));
        AT.Plan memory p = plan(abi.encode(type(uint256).max, uint256(1)));
        p.items[0].typeId = t;
        fails(p, "", 0);
        p.items[0].body = abi.encode(address(1), uint256(2));
        fails(p, "", 0);
    }

    function testRawRelationDoesNotCreateAcceptance() public {
        bytes32 raw = core.retainRaw(bytes32(uint256(9)));
        require(core.rawAuthor(raw) == address(this), "missing raw evidence");
        require(!core.getReceipt(raw).accepted, "raw upgraded to accepted");
    }

    function testAdditiveTypeDoesNotReplaceOriginal() public {
        AT.TypeInfo memory beforeType = core.getType(note);
        bytes32 second = core.registerType(keccak256("Note v2"), hex"0002", AT.Rule(0, 0, 0, 0));
        require(second != note && beforeType.exists && core.getType(second).exists, "type replacement");
        require(keccak256(core.getType(note).kinds) == keccak256(hex"00"), "old type changed");
    }

    function testFiniteCapsAndExplicitNoRuleCannotBorrowActivation() public {
        AT.Plan memory p = plan(abi.encode(uint256(7)));
        p.items = new AT.Item[](9);
        fails(p, "", 0);
        p.items = new AT.Item[](0);
        fails(p, "", 0);
        for (uint256 i; i < 4; ++i) {
            bytes memory kinds = hex"00";
            if (i == 0) kinds = hex"";
            if (i == 1) kinds = hex"000000000000000000";
            if (i == 2) kinds = hex"04";
            AT.Rule memory rule = i == 3 ? AT.Rule(bytes32(uint256(1)), 0, 0, 0) : AT.Rule(0, 0, 0, 0);
            (bool ok,) = address(core).call(abi.encodeCall(core.registerType, (bytes32(0), kinds, rule)));
            require(!ok, "invalid Type definition accepted");
        }
        p = plan(abi.encode(uint256(7)));
        p.items[0].activationId = bytes32(uint256(1));
        fails(p, "", 0);
        require(core.nonces(author) == 0, "bounded failure changed nonce");
    }
}
