// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Ledger} from "./Ledger.sol";
import {IndexModule} from "./IndexModule.sol";
import {Keys} from "./Keys.sol";
import {BQuoteProfile, SelectiveReferenceIndexModule} from "./SelectiveReferenceIndexModule.sol";

/// DISPOSABLE LAB. Caller supplies independently reviewed runtime hashes, NOT hashes learned
/// from an arbitrary ABI-compatible contract. Runtime identity includes deployed immutables.
/// This explicit trust boundary excludes arbitrary corrupted-index recovery. Both readers
/// prove the same immutable one-Pair Quote descriptor and mandatory 160-byte rule.
/// Pair preflight may return 8,352 ABI bytes (MAX_BODY 8192); the Page limit is separate.
abstract contract BIncomingQuotesReader {
    uint8 public constant UNKNOWN = 0;
    uint8 public constant PARTIAL = 1;
    uint8 public constant COMPLETE = 2;
    uint8 public constant REFERENCE_ORDINAL = 0;
    uint32 public constant MAX_PAGE_BUDGET = 64;

    struct Cursor {
        address reader; address ledger; bytes32 ledgerCodehash; address index; bytes32 indexCodehash; bytes32 realmOrigin;
        bytes32 sourceType; uint8 referenceOrdinal; bytes32 target;
        uint64 basisAdmission; uint64 moduleGeneration; uint64 position;
    }
    struct Page {
        bytes32[] records; uint32 scanned; uint32 headerReads; uint32 bodyReads; uint64 rawTotal;
        uint8 status; Cursor next;
    }

    Ledger public immutable ledger;
    IndexModule public immutable index;
    bytes32 public immutable ledgerCodehash;
    bytes32 public immutable indexCodehash;
    bytes32 public immutable quoteType;
    bytes32 public immutable pairType;
    bytes32 public immutable quoteRuleCodehash;
    bool internal immutable selective;

    error E_IDENTITY();
    error E_BOUNDS();
    error E_PAIR();
    error E_CURSOR();
    error E_COVERAGE();
    error E_CANDIDATE();

    constructor(address ledger_, address index_, bytes32 expectedLedgerCodehash_, bytes32 expectedIndexCodehash_, bytes32 quoteType_, bytes32 pairType_, bytes32 expectedQuoteRuleCodehash_, bool selective_) {
        ledger = Ledger(ledger_);
        index = IndexModule(index_);
        ledgerCodehash = expectedLedgerCodehash_;
        indexCodehash = expectedIndexCodehash_;
        quoteType = quoteType_;
        pairType = pairType_;
        quoteRuleCodehash = expectedQuoteRuleCodehash_;
        selective = selective_;
        _identityAndProfile();
    }

    function _identityAndProfile() internal view {
        if (address(ledger).code.length == 0 || address(index).code.length == 0
            || address(ledger).codehash != ledgerCodehash || address(index).codehash != indexCodehash
            || ledger.indexModule() != address(index) || index.ledger() != address(ledger)) revert E_IDENTITY();
        bytes32 shape = BQuoteProfile.check(ledger, quoteType, pairType, quoteRuleCodehash);
        if (selective) {
            SelectiveReferenceIndexModule module = SelectiveReferenceIndexModule(address(index));
            if (module.sourceType() != quoteType || module.referenceOrdinal() != 0 || module.pairType() != pairType
                || module.expectedShape() != shape || module.expectedRuleCodehash() != quoteRuleCodehash) revert E_IDENTITY();
        }
    }

    function incomingQuotes(bytes32 pair, uint64 basis, uint32 budget, Cursor calldata cursor)
        external view returns (Page memory page)
    {
        if (budget == 0 || budget > MAX_PAGE_BUDGET) revert E_BOUNDS();
        _identityAndProfile();
        (uint64 highWater, uint64 recordCount, uint64 bindings, uint64 publications) = ledger.counts();
        if (basis == 0 || basis > highWater || recordCount > highWater || bindings > highWater
            || publications == 0 || publications > highWater) revert E_BOUNDS();
        (bytes32 t, uint64 first,,) = ledger.record(pair);
        if (t != pairType || first == 0 || first > basis) revert E_PAIR();
        bytes32 key = selective ? Keys.referenceList(quoteType, 0, pair) : Keys.byTypeList(quoteType);
        bytes32 family = selective ? keccak256("efs2/family/reference-position/1") : index.FAMILY_BY_TYPE();
        (uint8 coverage, uint64 from, uint64 through) = index.coverage(family, key);
        if (coverage == UNKNOWN || coverage > COMPLETE || from == 0 || through > highWater) revert E_COVERAGE();
        (uint64 total, uint64 live, uint64 last,) = index.postingHead(key);
        if (total > highWater || live > total || last > highWater || (total == 0) != (last == 0)) revert E_BOUNDS();
        page.rawTotal = total;
        page.next = Cursor(address(this), address(ledger), ledgerCodehash, address(index), indexCodehash,
            ledger.realmOrigin(), quoteType, 0, pair, basis, index.generation(), cursor.position);
        Cursor memory zero;
        bool start = keccak256(abi.encode(cursor)) == keccak256(abi.encode(zero));
        if (!start && keccak256(abi.encode(cursor)) != keccak256(abi.encode(page.next))) revert E_CURSOR();
        if (cursor.position > total) revert E_CURSOR();
        page.records = new bytes32[](budget);
        uint256 found;
        bool exhausted;
        while (page.next.position < total && page.scanned < budget) {
            uint64 ordinal = index.postingAt(key, page.next.position++);
            ++page.scanned;
            if (ordinal == 0 || ordinal > highWater) revert E_CANDIDATE();
            // The trusted append-only ordinal is enough to charge and stop on a future sentinel.
            if (ordinal > basis) { exhausted = true; break; }
            (uint8 kind,,,,,, bytes32 a, bytes32 b) = ledger.admission(ordinal);
            ++page.headerReads;
            bytes32 id;
            if (selective) {
                if (kind != 1 || b != quoteType) revert E_CANDIDATE();
                id = Keys.recordFromHash(quoteType, a);
            } else {
                if (kind == 1 && b == quoteType) id = Keys.recordFromHash(quoteType, a);
                else if (kind == 2) id = a;
                else revert E_CANDIDATE();
                (bytes32 source, uint64 admitted,, bytes memory body_) = ledger.record(id);
                ++page.bodyReads;
                if (source != quoteType || admitted == 0 || admitted > ordinal || body_.length != 160) revert E_CANDIDATE();
                bytes32 target;
                assembly ("memory-safe") { target := mload(add(body_, 32)) }
                if (admitted != ordinal || target != pair) continue;
            }
            page.records[found++] = id;
        }
        exhausted = exhausted || page.next.position == total;
        page.status = exhausted && coverage == COMPLETE && from == 1 && through >= basis ? COMPLETE : PARTIAL;
        if (page.status == COMPLETE) page.next.position = total;
        bytes32[] memory records = page.records;
        assembly ("memory-safe") { mstore(records, found) }
    }
}

contract BScanIncomingQuotesReader is BIncomingQuotesReader {
    constructor(address ledger_, address index_, bytes32 expectedLedgerCodehash_, bytes32 expectedIndexCodehash_, bytes32 quoteType_, bytes32 pairType_, bytes32 expectedQuoteRuleCodehash_)
        BIncomingQuotesReader(ledger_, index_, expectedLedgerCodehash_, expectedIndexCodehash_, quoteType_, pairType_, expectedQuoteRuleCodehash_, false) {}
}

contract BIndexedIncomingQuotesReader is BIncomingQuotesReader {
    constructor(address ledger_, address index_, bytes32 expectedLedgerCodehash_, bytes32 expectedIndexCodehash_, bytes32 quoteType_, bytes32 pairType_, bytes32 expectedQuoteRuleCodehash_)
        BIncomingQuotesReader(ledger_, index_, expectedLedgerCodehash_, expectedIndexCodehash_, quoteType_, pairType_, expectedQuoteRuleCodehash_, true) {}
}
