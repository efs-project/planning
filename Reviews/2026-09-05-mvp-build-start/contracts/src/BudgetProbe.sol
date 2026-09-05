// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

contract ProbeCarrier {
    address private immutable controller;
    mapping(bytes32 => bytes) private bodies;
    constructor() { controller = msg.sender; }
    function put(bytes calldata data) external returns (bytes32 id) {
        require(msg.sender == controller, "controller only");
        id = keccak256(data);
        bodies[id] = data;
    }
    function read(bytes32 id) external view returns (bytes memory) { return bodies[id]; }
}

// Mechanism comparison only: not EFS Core, a grant verifier, or a fee limit.
contract BudgetProbe {
    address public immutable controller;
    ProbeCarrier public immutable carrier;
    uint256 public constant ACCOUNTING_TAIL_ALLOWANCE = 25_000;
    uint256 public nonce;
    uint256 public remaining;
    bytes32 public head;
    constructor(uint256 budget) {
        controller = msg.sender;
        remaining = budget;
        carrier = new ProbeCarrier();
    }

    function _check(bytes calldata data, uint256 ceiling) private view {
        require(msg.sender == controller, "controller only");
        require(data.length <= 1024, "payload bound");
        require(ceiling > 0 && ceiling <= 2_000_000 && ceiling <= remaining, "budget");
    }

    function stipend(bytes calldata data, uint256 ceiling, bool lateFailure) external returns (uint256) {
        _check(data, ceiling);
        remaining -= ceiling;
        ++nonce;
        bytes memory input = abi.encodeCall(this.work, (data, lateFailure));
        bool ok;
        uint256 size;
        // No returndata allocation before the exact fixed-size result check.
        // EIP-150 may forward less than ceiling if the outer call is underfunded.
        assembly ("memory-safe") {
            ok := call(ceiling, address(), 0, add(input, 32), mload(input), 0, 0)
            size := returndatasize()
        }
        require(ok && size == 32, "execution failed");
        return ceiling;
    }

    function measured(bytes calldata data, uint256 ceiling, bool lateFailure) external returns (uint256 charged) {
        uint256 entry = gasleft();
        _check(data, ceiling);
        ++nonce;
        _work(data, lateFailure);
        charged = entry - gasleft() + ACCOUNTING_TAIL_ALLOWANCE;
        require(charged <= ceiling, "execution budget exceeded");
        remaining -= charged;
        // Fixed, cold/warm-tested accounting tail only; no further external calls.
    }

    function work(bytes calldata data, bool lateFailure) external returns (bytes32) {
        require(msg.sender == address(this), "self only");
        return _work(data, lateFailure);
    }

    function _work(bytes calldata data, bool lateFailure) private returns (bytes32 id) {
        id = carrier.put(data);
        head = id;
        require(!lateFailure, "late failure");
    }

    function retained(bytes32 id) external view returns (bytes memory) { return carrier.read(id); }
}
