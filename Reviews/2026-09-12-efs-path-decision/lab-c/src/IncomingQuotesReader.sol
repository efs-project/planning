// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import { IStoreRead } from "@latticexyz/store/src/IStoreRead.sol";
import { Ledger } from "./Ledger.sol";
import { IndexModule } from "./IndexModule.sol";
import { Records, Types } from "./tables/LedgerTables.sol";
import { Backlinks } from "./tables/IndexTables.sol";

/// Disposable, IDs-only retained-Record query over C's existing checked-reference postings.
/// Independently expected runtimes are a trust input, not a self-authenticating code allowlist.
contract CIncomingQuotesReader {
  uint8 public constant UNKNOWN = 0;
  uint8 public constant PARTIAL = 1;
  uint8 public constant COMPLETE = 2;
  uint8 public constant REFERENCE_ORDINAL = 0;
  uint32 public constant MAX_PAGE_BUDGET = 64;
  bytes32 internal constant FAMILY_BACKLINKS = keccak256("efs2/lab-c/index/backlinks");

  Ledger public immutable ledger;
  IndexModule public immutable index;
  bytes32 public immutable ledgerCodehash;
  bytes32 public immutable indexCodehash;
  bytes32 public immutable quoteType;
  bytes32 public immutable pairType;
  bytes32 public immutable quoteRuleCodehash;

  struct Cursor {
    address reader; address ledger; bytes32 ledgerCodehash; address index; bytes32 indexCodehash; bytes32 realmOrigin;
    bytes32 sourceType; uint8 referenceOrdinal; bytes32 target;
    uint64 basisAdmission; uint64 moduleGeneration; uint64 position;
  }
  struct Page {
    bytes32[] records; uint32 scanned; uint32 headerReads; uint32 bodyReads; uint64 rawTotal;
    uint8 status; Cursor next;
  }

  constructor(address ledger_, address index_, bytes32 expectedLedgerCodehash, bytes32 expectedIndexCodehash,
    bytes32 quoteType_, bytes32 pairType_, bytes32 expectedQuoteRuleCodehash)
  {
    ledger = Ledger(ledger_);
    index = IndexModule(index_);
    ledgerCodehash = expectedLedgerCodehash;
    indexCodehash = expectedIndexCodehash;
    quoteType = quoteType_;
    pairType = pairType_;
    quoteRuleCodehash = expectedQuoteRuleCodehash;
    require(quoteType_ != bytes32(0) && pairType_ != bytes32(0) && expectedQuoteRuleCodehash != bytes32(0), "invalid profile");
    _checkIdentity();
    _checkProfile(ledger.highWater());
  }

  function _checkIdentity() internal view {
    require(address(ledger).code.length != 0 && address(ledger).codehash == ledgerCodehash, "Ledger runtime mismatch");
    require(address(index).code.length != 0 && address(index).codehash == indexCodehash, "Index runtime mismatch");
    require(address(ledger.index()) == address(index) && ledger.indexCodehash() == indexCodehash,
      "Ledger attachment mismatch");
    require(index.ledger() == address(ledger) && index.ledgerCodehash() == ledgerCodehash, "Index attachment mismatch");
  }

  function _checkProfile(uint64 basis) internal view {
    (address acceptor, bytes32 rule, uint64 admission, bytes32 refType) =
      Types.getOneRefHeader(IStoreRead(address(ledger)), quoteType);
    require(admission != 0 && admission <= basis && refType == pairType, "invalid source Type profile");
    require(rule == quoteRuleCodehash && acceptor.code.length != 0 && acceptor.codehash == rule, "Quote rule mismatch");
  }

  function _cursor(bytes32 pair, uint64 basis, Cursor calldata supplied) internal view returns (Cursor memory c) {
    c.reader = address(this); c.ledger = address(ledger); c.ledgerCodehash = ledgerCodehash;
    c.index = address(index); c.indexCodehash = indexCodehash; c.realmOrigin = ledger.realmOrigin();
    c.sourceType = quoteType; c.referenceOrdinal = REFERENCE_ORDINAL; c.target = pair;
    c.basisAdmission = basis; c.moduleGeneration = index.generation();
    Cursor memory empty;
    if (keccak256(abi.encode(supplied)) == keccak256(abi.encode(empty))) return c;
    c.position = supplied.position;
    require(keccak256(abi.encode(c)) == keccak256(abi.encode(supplied)), "cursor mismatch");
  }

  function incomingQuotes(bytes32 pair, uint64 basis, uint32 budget, Cursor calldata cursor)
    external view returns (Page memory page)
  {
    require(budget != 0 && budget <= MAX_PAGE_BUDGET, "invalid budget");
    _checkIdentity();
    uint64 highWater = ledger.highWater();
    require(basis != 0 && basis <= highWater, "invalid basis");
    _checkProfile(basis);
    (bytes32 targetType, uint64 targetAdmission) = Records.getHeader(IStoreRead(address(ledger)), pair);
    require(targetType == pairType && targetAdmission != 0 && targetAdmission <= basis, "invalid Pair");
    page.next = _cursor(pair, basis, cursor);
    uint256 total = Backlinks.length(IStoreRead(address(index)), pair);
    // Other Types can repeat Pair in many checked references: total may exceed highWater.
    require(total <= type(uint64).max && page.next.position <= total, "invalid posting count or position");
    page.rawTotal = uint64(total);
    uint256 end = uint256(page.next.position) + budget;
    if (end > total) end = total;
    bytes32[] memory candidates = Backlinks.slice(IStoreRead(address(index)), pair, page.next.position, end);
    require(candidates.length == end - page.next.position, "invalid posting slice");
    page.records = new bytes32[](candidates.length);
    uint256 kept;
    bool terminal = end == total;
    for (uint256 i; i < candidates.length; i++) {
      page.scanned++; page.headerReads++; page.next.position++;
      (bytes32 sourceType, uint64 firstAdmission) = Records.getHeader(IStoreRead(address(ledger)), candidates[i]);
      require(firstAdmission != 0 && firstAdmission <= highWater, "invalid source admission");
      if (firstAdmission > basis) { terminal = true; break; }
      if (sourceType == quoteType) page.records[kept++] = candidates[i];
    }
    bytes32[] memory records = page.records;
    assembly ("memory-safe") { mstore(records, kept) }
    (uint8 coverage, uint64 through) = index.coverage(FAMILY_BACKLINKS, bytes32(0));
    page.status = terminal && coverage == 1 && through >= basis ? COMPLETE : PARTIAL;
    // Completion never returns a restart cursor. An old-basis future sentinel is charged,
    // then skips the rest of the append-ordered (nondecreasing first-admission) posting tail.
    if (page.status == COMPLETE) page.next.position = page.rawTotal;
  }
}
