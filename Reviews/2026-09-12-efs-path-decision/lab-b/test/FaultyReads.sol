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
    uint8 public constant WRONG_SELECTED_REVISION = 7; // resolve(*) -> right head/author/admission, wrong revision
    uint8 public constant ZERO_RECORD_FIRST_ADMISSION = 8; // record(target) -> firstAdmission 0
    uint8 public constant FUTURE_RECORD_FIRST_ADMISSION = 9; // record(target) -> firstAdmission after the current basis
    uint8 public constant ZERO_SELECTED_ADMISSION = 10; // resolve(*) -> admission 0
    uint8 public constant FUTURE_SELECTED_ADMISSION = 11; // resolve(*) -> admission after the current basis
    uint8 public constant ZERO_PLACEMENT_ADMISSION = 12; // list(*) -> item admission 0
    uint8 public constant FUTURE_PLACEMENT_ADMISSION = 13; // list(*) -> item admission after the current basis
    uint8 public constant WRONG_BINDING_POSITION = 14; // bindingPosition(*) -> `target`, a real but wrong coordinate
    uint8 public constant WRONG_ADMISSION_REVISION = 15; // admission(*) -> expectedRevision does not precede the observed revision
    uint8 public constant MAX_ADMISSION_REVISION = 16; // admission(*) -> uint32 max (must not wrap to revision 0)
    uint8 public constant IMPORTED_PUBLICATION = 17; // isImported(*) -> true
    uint8 public constant CURSOR_GENERATION_MISMATCH = 18;
    uint8 public constant CURSOR_EPOCH_MISMATCH = 19;
    uint8 public constant CURSOR_CORE_MISMATCH = 20;
    uint8 public constant CURSOR_SCOPE_MISMATCH = 21;
    uint8 public constant CURSOR_LENS_MISMATCH = 22;

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
            if (mode == ZERO_RECORD_FIRST_ADMISSION) firstAdmission = 0;
            if (mode == FUTURE_RECORD_FIRST_ADMISSION) {
                (uint64 basis,,,) = real.counts();
                firstAdmission = basis + 1;
            }
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
        if (mode == WRONG_ADMISSION_REVISION) expectedRevision += 1;
        if (mode == MAX_ADMISSION_REVISION) expectedRevision = type(uint32).max;
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

    function coreCodeCommitment() external view returns (bytes32) {
        return real.coreCodeCommitment();
    }

    function isImported(uint64 publication) external view returns (bool) {
        return mode == IMPORTED_PUBLICATION || real.isImported(publication);
    }

    function bindingPosition(uint64 ordinal) external view returns (bytes32) {
        return mode == WRONG_BINDING_POSITION ? target : real.bindingPosition(ordinal);
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
        returns (uint8 status, bytes32 selected, uint32 revision, address author, uint64 admission)
    {
        (status, selected, revision, author, admission) = realLens.resolve(lens, purpose, subject, role);
        if (mode == WRONG_SELECTED_REVISION) revision += 1;
        if (mode == MAX_ADMISSION_REVISION) revision = 0;
        if (mode == ZERO_SELECTED_ADMISSION) admission = 0;
        if (mode == FUTURE_SELECTED_ADMISSION) {
            (uint64 basis,,,) = real.counts();
            admission = basis + 1;
        }
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
        if (mode == ZERO_PLACEMENT_ADMISSION && page.items.length != 0) page.items[0].admission = 0;
        if (mode == FUTURE_PLACEMENT_ADMISSION && page.items.length != 0) page.items[0].admission = page.next.basisAdmission + 1;
        if (mode == MAX_ADMISSION_REVISION && page.items.length != 0) page.items[0].revision = 0;
        if (mode == CURSOR_GENERATION_MISMATCH) page.next.indexGeneration += 1;
        if (mode == CURSOR_EPOCH_MISMATCH) page.next.rulesEpoch += 1;
        if (mode == CURSOR_CORE_MISMATCH) page.next.coreCodeCommitment = keccak256("faulty/core");
        if (mode == CURSOR_SCOPE_MISMATCH) page.next.scopeKey = keccak256("faulty/scope");
        if (mode == CURSOR_LENS_MISMATCH) page.next.lensHash = keccak256("faulty/lens");
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
