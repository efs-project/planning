// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Ledger} from "../src/Ledger.sol";
import {LensReader} from "../src/LensReader.sol";
import {ILedgerReads, ILensReads} from "../src/JoinedConsumer.sol";

/// TEST-ONLY, DESK-CHECKED. A forwarding reader that implements exactly the public read ABI `JoinedConsumer` uses
/// (`ILedgerReads` + `ILensReads`) on top of the real Ledger and LensReader, and — when one fault is armed — returns a
/// corrupted or missing ACTUAL reply for that call while every other reply stays faithful. It exists so the paid
/// consumer's refusals are exercised against bad replies (this branch), not only against wrong expectations (the
/// `test_paid_slice_refuses_*` negatives, the other branch). Not a Core change: Ledger and LensReader are untouched.
contract FaultyReads is ILedgerReads, ILensReads {
    uint8 public constant NONE = 0;
    uint8 public constant MISSING_PAIR = 1; // record(target) -> zero Type, empty body (an absent record)
    uint8 public constant WRONG_TYPE_ITEM = 2; // record(target) -> a foreign Type id
    uint8 public constant ADMISSION_NOT_BIND = 3; // admission(*) -> kind PUBLISH (1) instead of BIND (3)
    uint8 public constant ADMISSION_OUT_OF_RANGE = 4; // admission(*) -> publication 1, whose admission range never covers a head admission
    uint8 public constant SHORT_EVIDENCE = 5; // evidence(*) -> a one-word reply (ABI decoding in the consumer must fail closed)
    uint8 public constant PARTIAL_CLAIMS_ENDED = 6; // list(*) -> status PARTIAL while the cursor still says every list was exhausted

    Ledger public immutable real;
    LensReader public immutable realLens;
    uint8 public mode;
    bytes32 public target;

    constructor(Ledger real_, LensReader realLens_) {
        real = real_;
        realLens = realLens_;
    }

    function fault(uint8 mode_, bytes32 target_) external {
        mode = mode_;
        target = target_;
    }

    // ------------------------------------------------------------------ ILedgerReads
    function record(bytes32 id) external view returns (bytes32 typeId, uint64 firstAdmission, uint32 occurrences, bytes memory data) {
        (typeId, firstAdmission, occurrences, data) = real.record(id);
        if (id == target) {
            if (mode == MISSING_PAIR) return (bytes32(0), 0, 0, new bytes(0));
            if (mode == WRONG_TYPE_ITEM) typeId = keccak256("faulty/not-an-item");
        }
    }

    function admission(uint64 ordinal)
        external
        view
        returns (uint8 kind, uint16 leaf, uint64 publication, uint64 bindingOrdinal, uint32 expectedRevision, bool withdrawn, bytes32 a, bytes32 b)
    {
        (kind, leaf, publication, bindingOrdinal, expectedRevision, withdrawn, a, b) = real.admission(ordinal);
        if (mode == ADMISSION_NOT_BIND) kind = 1;
        if (mode == ADMISSION_OUT_OF_RANGE) publication = 1;
    }

    /// Raw forwarding (no 13-way destructuring): the faithful reply bytes, or a one-word truncation of them.
    function evidence(uint64 publication)
        external
        view
        returns (address, uint8, uint8, uint16, uint64, bytes32, bytes32, uint64, uint64, uint64, bytes32, bytes32, bytes32)
    {
        (bool ok, bytes memory reply) = address(real).staticcall(abi.encodeWithSelector(Ledger.evidence.selector, publication));
        require(ok, "faulty: forward evidence");
        uint256 len = mode == SHORT_EVIDENCE ? 32 : reply.length;
        assembly ("memory-safe") {
            return(add(reply, 32), len)
        }
    }

    function counts() external view returns (uint64, uint64, uint64, uint64) {
        return real.counts();
    }

    function positionCell(bytes32 position) external view returns (bytes32, bytes32, bytes32) {
        return real.positionCell(position);
    }

    function registry() external view returns (address) {
        return address(real.registry());
    }

    // ------------------------------------------------------------------ ILensReads
    function resolve(address[] calldata lens, bytes32 purpose, bytes32 subject, bytes32 role)
        external
        view
        returns (uint8, bytes32, uint32, address, uint64)
    {
        return realLens.resolve(lens, purpose, subject, role);
    }

    function resolveNoTiebreak(address[] calldata lens, bytes32 purpose, bytes32 subject, bytes32 role)
        external
        view
        returns (uint8, LensReader.Entry[] memory)
    {
        return realLens.resolveNoTiebreak(lens, purpose, subject, role);
    }

    function list(address[] calldata lens, bytes32 purpose, bytes32 subject, LensReader.Cursor calldata cursor, uint256 budget)
        external
        view
        returns (LensReader.Page memory page)
    {
        page = realLens.list(lens, purpose, subject, cursor, budget);
        if (mode == PARTIAL_CLAIMS_ENDED) page.status = 1; // PARTIAL, while page.next still says every list was exhausted
    }

    function historyByRole(address author, bytes32 purpose, bytes32 subject, bytes32 role, uint64 asOf)
        external
        view
        returns (uint8, bool, bytes32, uint32, uint64)
    {
        return realLens.historyByRole(author, purpose, subject, role, asOf);
    }

    function index() external view returns (address) {
        return address(realLens.index());
    }
}
