// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import { IStoreRead } from "@latticexyz/store/src/IStoreRead.sol";
import "../src/EfsTypes.sol";
import "../src/LedgerErrors.sol";
import { Ledger } from "../src/Ledger.sol";
import { IndexModule } from "../src/IndexModule.sol";
import { LensReader } from "../src/LensReader.sol";
import { QuoteConsumer } from "../src/Consumer.sol";
import { Records, Admissions, AdmissionData, Evidence, EvidenceData, Bindings, Subjects } from "../src/tables/LedgerTables.sol";
import { Occurrences, ByType, Backlinks } from "../src/tables/IndexTables.sol";
import { LabBase } from "./LabBase.sol";
import { QuoteAcceptorV2, EvidenceReconstructor } from "./Fixture.sol";

/*
 * sdk-fixture steps 5–6, the cursor/dedupe/coverage law and the unrelated paid consumer (split for EIP-3860). Unrun.
 */

contract SelectionTest is LabBase {
  function setUp() public {
    _boot(true);
  }

  function _lensA() internal view returns (LensReader.Lens memory) {
    return lensOf(A, B, 0);
  }

  function _lensB() internal view returns (LensReader.Lens memory) {
    return lensOf(B, A, 0);
  }

  function _lensEq() internal view returns (LensReader.Lens memory) {
    return lensOf(A, B, 1);
  }

  function test_step5_threeLenses_agree_point_list_tag() public {
    _a1();
    _a2();
    _b1();
    LensReader.Resolution memory r = reader.resolve(_lensA(), PURPOSE_HEAD, FILE, bytes32(0));
    require(r.status == 1 && r.target == QUOTE_A2 && r.selectedBy == A, "A-first selects A2");
    r = reader.resolve(_lensB(), PURPOSE_HEAD, FILE, bytes32(0));
    require(r.status == 1 && r.target == QUOTE_B1 && r.selectedBy == B, "B-first selects B1");
    r = reader.resolve(_lensEq(), PURPOSE_HEAD, FILE, bytes32(0));
    require(r.status == 3 && r.target == bytes32(0), "no-tiebreak reports CONFLICT with no winner");
    LensReader.Page memory p = reader.list(_lensA(), PURPOSE_FOLDER, SWAPS, zeroCursor(), 10);
    require(p.items.length == 1 && p.items[0].selectedBy == A && p.rawTotal == 2, "A-first page agrees with point read");
    p = reader.list(_lensB(), PURPOSE_FOLDER, SWAPS, zeroCursor(), 10);
    require(p.items.length == 1 && p.items[0].selectedBy == B, "B-first page agrees with point read");
    p = reader.listTagged(_lensB(), SWAPS, MARKET, zeroCursor(), 10);
    require(p.items.length == 1 && p.items[0].target == FILE, "tag stance falls through to A under B-first");
    p = reader.list(_lensEq(), PURPOSE_FOLDER, SWAPS, zeroCursor(), 10);
    require(p.items.length == 1 && p.items[0].status == 1, "both placements target the same subject: no conflict in the folder");
  }
  function test_step6_move_replace_remove_restore() public {
    _a1();
    _a2();
    _b1();
    Action[] memory acts = new Action[](2);
    acts[0] = bindAction(PURPOSE_FOLDER, SWAPS, NAME, bytes32(0), 1); // whiteout the old placement
    acts[1] = bindAction(PURPOSE_FOLDER, MARKETS, NAME, FILE, 0); // place at the new path
    _publishA(acts, noBodies(2));
    bytes32 G = EfsIds.subjectId(A, SALT_G);
    acts = new Action[](2);
    acts[0] = subjectAction(A, SALT_G);
    acts[1] = bindAction(PURPOSE_FOLDER, SWAPS, NAME, G, 2); // unrelated File takes the vacated path
    _publishA(acts, noBodies(2));

    LensReader.Page memory p = reader.list(_lensA(), PURPOSE_FOLDER, SWAPS, zeroCursor(), 10);
    require(p.items.length == 1 && p.items[0].target == G, "A-first: /swaps shows the replacement");
    p = reader.list(_lensB(), PURPOSE_FOLDER, SWAPS, zeroCursor(), 10);
    require(p.items.length == 1 && p.items[0].target == FILE, "B-first: B never moved its placement");
    p = reader.list(_lensA(), PURPOSE_FOLDER, MARKETS, zeroCursor(), 10);
    require(p.items.length == 1 && p.items[0].target == FILE, "/markets shows FILE");
    p = reader.listTagged(_lensA(), SWAPS, MARKET, zeroCursor(), 10);
    require(p.items.length == 0, "replacement carries no market tag");
    p = reader.listTagged(_lensA(), MARKETS, MARKET, zeroCursor(), 10);
    require(p.items.length == 1 && p.items[0].target == FILE, "tag followed the File");

    acts = new Action[](1);
    acts[0] = bindAction(PURPOSE_FOLDER, MARKETS, NAME, bytes32(0), 1); // remove
    _publishA(acts, noBodies(1));
    p = reader.list(_lensA(), PURPOSE_FOLDER, MARKETS, zeroCursor(), 10);
    require(p.items.length == 0 && p.status == 1 && p.rawTotal == 1, "removed: complete, zero selected, evidence retained");

    acts = new Action[](1);
    acts[0] = bindAction(PURPOSE_FOLDER, MARKETS, NAME, FILE, 2); // restore
    _publishA(acts, noBodies(1));
    p = reader.list(_lensA(), PURPOSE_FOLDER, MARKETS, zeroCursor(), 10);
    require(p.items.length == 1 && p.items[0].target == FILE && p.items[0].revision == 3, "restored as a new revision");

    LensReader.Resolution memory r = reader.resolve(_lensA(), PURPOSE_HEAD, FILE, bytes32(0));
    require(r.target == QUOTE_A2, "A-first head unchanged by moves");
    r = reader.resolve(_lensB(), PURPOSE_HEAD, FILE, bytes32(0));
    require(r.target == QUOTE_B1, "B-first head unchanged by moves");
    r = reader.resolve(_lensA(), PURPOSE_TAG, FILE, MARKET);
    require(r.status == 1 && r.target == TAG_ASSERT, "tag still bound to the stable subject");
    r = reader.resolve(_lensA(), PURPOSE_TAG, G, MARKET);
    require(r.status == 2, "replacement: tag absent (proven)");
    (uint64[] memory adms, bytes32[] memory tgts, uint32 total) = reader.history(
      EfsIds.bindingKey(A, PURPOSE_FOLDER, MARKETS, NAME),
      0,
      10
    );
    require(total == 3 && adms.length == 3 && tgts[0] == FILE && tgts[1] == bytes32(0) && tgts[2] == FILE, "placement history");
  }
  function test_cursor_basisPinned_and_stale() public {
    _a1();
    _b1();
    LensReader.Page memory p1 = reader.list(_lensA(), PURPOSE_FOLDER, SWAPS, zeroCursor(), 1);
    require(p1.items.length == 1 && p1.status == 2 && p1.next.position == 1 && p1.rawTotal == 2 && p1.selected == 1, "page one partial");
    uint64 basis = p1.next.basisAdmission;
    Action[] memory acts = new Action[](1);
    acts[0] = bindAction(PURPOSE_FOLDER, SWAPS, NAME2, FILE, 0); // admitted after the cursor's basis
    _publishA(acts, noBodies(1));
    LensReader.Page memory p2 = reader.list(_lensA(), PURPOSE_FOLDER, SWAPS, p1.next, 10);
    require(p2.next.basisAdmission == basis, "continuation stays at its basis");
    require(p2.items.length == 0 && p2.status == 1 && p2.rawTotal == 3, "later entry omitted; B's entry is a loser; complete");
    LensReader.Page memory fresh = reader.list(_lensA(), PURPOSE_FOLDER, SWAPS, zeroCursor(), 10);
    require(fresh.items.length == 2, "a fresh listing includes the later entry");
    LensReader.Cursor memory stale = p1.next;
    stale.indexGeneration = 99;
    try reader.list(_lensA(), PURPOSE_FOLDER, SWAPS, stale, 10) {
      revert("must revert");
    } catch (bytes memory err) {
      expectSel(err, LensReader.StaleCursor.selector, "stale generation");
    }
    try reader.list(_lensA(), PURPOSE_FOLDER, MARKETS, p1.next, 10) {
      revert("must revert");
    } catch (bytes memory err) {
      expectSel(err, LensReader.CursorMismatch.selector, "wrong scope");
    }
    require(p1.hydrated > 0 && p2.scanned == 2, "hydration and scan budgets are reported");
  }
  function test_dedupe_sameName_acrossAuthors() public {
    _a1();
    _b1();
    LensReader.Page memory p = reader.list(_lensA(), PURPOSE_FOLDER, SWAPS, zeroCursor(), 10);
    require(p.rawTotal == 2 && p.scanned == 2 && p.items.length == 1 && p.items[0].selectedBy == A, "one selected entry per name");
    p = reader.list(_lensB(), PURPOSE_FOLDER, SWAPS, zeroCursor(), 10);
    require(p.items.length == 1 && p.items[0].selectedBy == B, "the other lens selects the other author, still once");
  }
  function test_coverage_families() public view {
    (uint8 st, uint64 thr) = index.coverage(index.FAMILY_SCOPES(), bytes32(0));
    require(st == 1 && thr == ledger.highWater(), "mandatory: COMPLETE through high-water");
    (st, thr) = index.coverage(index.FAMILY_OPTIONAL_DIGEST(), bytes32(0));
    require(st == 2 && thr == 0, "declared optional family with no backfill: PARTIAL(0)");
    (st, ) = index.coverage(keccak256("never declared"), bytes32(0));
    require(st == 0, "undeclared family: UNKNOWN, never empty/complete");
  }
  function test_consumer_paidRead() public {
    _a1();
    _a2();
    _b1();
    QuoteConsumer c = new QuoteConsumer();
    (bytes32 rid, uint256 mantissa) = c.consume(reader, L(), _lensA(), FILE);
    require(rid == QUOTE_A2 && mantissa == 2_502_000_000, "A-first consumer value");
    (rid, mantissa) = c.consume(reader, L(), _lensB(), FILE);
    require(rid == QUOTE_B1 && mantissa == 2_501_000_000, "B-first consumer value");
    try c.consume(reader, L(), _lensEq(), FILE) {
      revert("conflict must not yield a quote");
    } catch (bytes memory err) {
      expectSel(err, QuoteConsumer.NotSelected.selector, "NotSelected(CONFLICT)");
    }
  }
}
