// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/*
 * LensReader: resolve / list / listTagged / history over the Ledger and IndexModule
 * using ONLY their public IStoreRead ABI (plus three identity views). Stateless.
 *
 * Point law (road-b §8.4): ORDERED lens = first principal in order that has a binding
 * decides; a whiteout (target 0) from that principal masks lower principals. NO_TIEBREAK
 * lens = all principals equal rank; distinct targets => CONFLICT, never an order winner.
 * Listing law: page reducer == point reducer; each name is emitted at most once, at the
 * scope position of its winning binding (dedupes the same name across author scopes);
 * bounded candidate budget; items/scanned/hydrated/rawTotal/selected/status returned;
 * cursor = (basisAdmission, indexGeneration, rulesEpoch, coreCodeCommitment, scopeKey,
 * lensHash, position); a continuation whose generation/epoch/code no longer match reverts
 * StaleCursor; a continuation at an older basis is answered as-of that basis via history.
 *
 * Stack discipline: no memory mover is available (vendored assembly is not memory-safe),
 * so loops carry their state in small memory structs (Hit, ListCtx) and stay <= ~10 locals.
 */

import { IStoreRead } from "@latticexyz/store/src/IStoreRead.sol";
import "./EfsTypes.sol";
import { Bindings, Admissions, AdmissionData, Counters } from "./tables/LedgerTables.sol";
import { Scopes, BindingHistory } from "./tables/IndexTables.sol";

contract LensReader {
  IStoreRead public immutable ledger;
  IStoreRead public immutable index;

  uint8 public constant MODE_ORDERED = 0;
  uint8 public constant MODE_NO_TIEBREAK = 1;

  uint8 public constant P_UNKNOWN = 0;
  uint8 public constant P_FOUND = 1;
  uint8 public constant P_ABSENT_PROVEN = 2;
  uint8 public constant P_CONFLICT = 3;

  uint8 public constant C_UNKNOWN = 0;
  uint8 public constant C_COMPLETE = 1;
  uint8 public constant C_PARTIAL = 2;

  struct Lens {
    bytes32[] principals;
    uint8 mode;
  }

  struct Resolution {
    uint8 status;
    bytes32 target;
    uint32 revision;
    bytes32 selectedBy; // principal whose binding decided (first bound principal for CONFLICT)
    bytes32 selectedKey; // that principal's binding key
    uint64 admission;
    uint64 basis;
    uint32 reads; // external IStoreRead calls consumed
  }

  /// Seven fields; nothing caller-supplied is echoed back as a fact (no selectedSoFar).
  struct Cursor {
    uint64 basisAdmission;
    uint32 indexGeneration;
    uint32 rulesEpoch;
    bytes32 coreCodeCommitment;
    bytes32 scopeKey;
    bytes32 lensHash;
    uint32 position;
  }

  struct Item {
    bytes32 name; // FOLDER scope: nameHash; TAG scope: tagged subject
    bytes32 target;
    bytes32 selectedBy;
    uint32 revision;
    uint8 status; // P_FOUND or P_CONFLICT
  }

  struct Page {
    Item[] items;
    uint32 scanned; // raw scope entries consumed
    uint32 hydrated; // external reads charged (scope slice + per-candidate resolution)
    uint32 rawTotal; // current scope entry count (all authors, all time)
    uint32 selected; // items selected on THIS page (a running total would echo caller-supplied state)
    uint8 status; // C_COMPLETE when the scan reached rawTotal, else C_PARTIAL
    Cursor next;
  }

  /// One principal's binding as of a basis.
  struct Hit {
    bool bound;
    bytes32 target;
    uint32 revision;
    uint64 admission;
    uint32 reads;
  }

  struct ListCtx {
    bytes32 purpose;
    bytes32 scope;
    bytes32 scopeKey;
    uint64 basis;
    uint256 total;
    uint256 i;
    uint256 end;
    uint256 w;
    uint256 count;
  }

  error EmptyLens();
  error StaleCursor();
  error CursorMismatch();

  constructor(IStoreRead ledger_, IStoreRead index_) {
    ledger = ledger_;
    index = index_;
  }

  function lensHash(Lens memory l) public pure returns (bytes32) {
    return keccak256(abi.encode(l.principals, l.mode));
  }

  function highWater() public view returns (uint64) {
    return Counters.get(ledger, COUNTER_ADMISSIONS);
  }

  // ---------------------------------------------------------------------------
  // point reads
  // ---------------------------------------------------------------------------

  function resolve(
    Lens memory lens,
    bytes32 purpose,
    bytes32 subject,
    bytes32 role
  ) public view returns (Resolution memory) {
    return resolveAt(lens, purpose, subject, role, highWater());
  }

  function resolveAt(
    Lens memory lens,
    bytes32 purpose,
    bytes32 subject,
    bytes32 role,
    uint64 basis
  ) public view returns (Resolution memory r) {
    if (lens.principals.length == 0) revert EmptyLens();
    r.basis = basis;
    bool any;
    bool conflict;
    for (uint256 p = 0; p < lens.principals.length; p++) {
      bytes32 key = EfsIds.bindingKey(lens.principals[p], purpose, subject, role);
      Hit memory h = _bindingAt(key, basis);
      r.reads += h.reads;
      if (!h.bound) continue;
      if (lens.mode == MODE_ORDERED) {
        _take(r, lens.principals[p], key, h);
        r.status = h.target == bytes32(0) ? P_ABSENT_PROVEN : P_FOUND; // mask beats fallthrough
        return r;
      }
      if (!any) {
        any = true;
        _take(r, lens.principals[p], key, h);
      } else if (h.target != r.target) {
        conflict = true;
      }
    }
    if (!any) {
      r.status = P_ABSENT_PROVEN;
      return r;
    }
    if (conflict) {
      r.status = P_CONFLICT;
      r.target = bytes32(0);
      return r;
    }
    r.status = r.target == bytes32(0) ? P_ABSENT_PROVEN : P_FOUND;
  }

  function _take(Resolution memory r, bytes32 principal, bytes32 key, Hit memory h) internal pure {
    r.selectedBy = principal;
    r.selectedKey = key;
    r.revision = h.revision;
    r.admission = h.admission;
    r.target = h.target;
  }

  /// Binding value as of `basis`: current head when its admission <= basis, else walk the
  /// binding's admission history (bounded by its revision count) back to the last admission <= basis.
  function _bindingAt(bytes32 key, uint64 basis) internal view returns (Hit memory h) {
    (bytes32 t, uint32 cur, uint64 a) = Bindings.get(ledger, key);
    h.reads = 1;
    if (cur == 0) return h;
    if (a <= basis) {
      h.bound = true;
      h.target = t;
      h.revision = cur;
      h.admission = a;
      return h;
    }
    uint256 n = BindingHistory.length(index, key);
    uint64[] memory hist = BindingHistory.slice(index, key, 0, n);
    h.reads += 2;
    for (uint256 j = n; j > 0; j--) {
      if (hist[j - 1] <= basis) {
        h.reads++;
        h.bound = true;
        h.target = Admissions.get(ledger, hist[j - 1]).target;
        h.revision = uint32(j);
        h.admission = hist[j - 1];
        return h;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // listing
  // ---------------------------------------------------------------------------

  function _freshCursor(bytes32 sk, bytes32 lh) internal view returns (Cursor memory c) {
    c.basisAdmission = highWater();
    c.indexGeneration = IIndexModule(address(index)).generation();
    c.rulesEpoch = ILedgerView(address(ledger)).rulesEpoch();
    c.coreCodeCommitment = ILedgerView(address(ledger)).coreCodeCommitment();
    c.scopeKey = sk;
    c.lensHash = lh;
  }

  function _checkCursor(Cursor memory c, bytes32 sk, bytes32 lh) internal view {
    if (c.scopeKey != sk || c.lensHash != lh) revert CursorMismatch();
    if (
      c.indexGeneration != IIndexModule(address(index)).generation() ||
      c.rulesEpoch != ILedgerView(address(ledger)).rulesEpoch() ||
      c.coreCodeCommitment != ILedgerView(address(ledger)).coreCodeCommitment() ||
      c.basisAdmission > highWater()
    ) revert StaleCursor();
  }

  function _inLens(Lens memory lens, bytes32 principal) internal pure returns (bool) {
    for (uint256 p = 0; p < lens.principals.length; p++) {
      if (lens.principals[p] == principal) return true;
    }
    return false;
  }

  /// scope = folderId for PURPOSE_FOLDER, concept for PURPOSE_TAG, subjectId for PURPOSE_HEAD.
  function list(
    Lens memory lens,
    bytes32 purpose,
    bytes32 scope,
    Cursor memory cursor,
    uint32 budget
  ) public view returns (Page memory page) {
    ListCtx memory c;
    c.purpose = purpose;
    c.scope = scope;
    c.scopeKey = EfsIds.scopeKey(purpose, scope);
    bytes32 lh = lensHash(lens);
    if (cursor.basisAdmission == 0) cursor = _freshCursor(c.scopeKey, lh);
    else _checkCursor(cursor, c.scopeKey, lh);
    c.basis = cursor.basisAdmission;
    c.total = Scopes.length(index, c.scopeKey) / 3;
    c.i = cursor.position;
    c.end = c.i + budget;
    if (c.end > c.total) c.end = c.total;
    page.rawTotal = uint32(c.total);
    page.hydrated = c.end > c.i ? 2 : 1;
    bytes32[] memory words = Scopes.slice(index, c.scopeKey, c.i * 3, c.end * 3);
    Item[] memory buf = new Item[](c.end > c.i ? c.end - c.i : 0);
    for (; c.i < c.end; c.i++) {
      page.scanned++;
      _visit(lens, words, c, buf, page);
    }
    page.items = new Item[](c.count);
    for (uint256 j = 0; j < c.count; j++) page.items[j] = buf[j];
    page.selected = uint32(c.count);
    page.status = c.i >= c.total ? C_COMPLETE : C_PARTIAL;
    page.next = cursor;
    page.next.position = uint32(c.i);
  }

  /// One scope entry (author, name, bindingKey): emit it only if it is the lens's winner for its name at basis.
  function _visit(
    Lens memory lens,
    bytes32[] memory words,
    ListCtx memory c,
    Item[] memory buf,
    Page memory page
  ) internal view {
    bytes32 author = words[c.w];
    bytes32 name = words[c.w + 1];
    bytes32 key = words[c.w + 2];
    c.w += 3;
    if (!_inLens(lens, author)) return;
    page.hydrated++;
    if (BindingHistory.first(index, key) > c.basis) return; // did not exist at basis
    Resolution memory r = c.purpose == PURPOSE_TAG
      ? resolveAt(lens, c.purpose, name, c.scope, c.basis)
      : resolveAt(lens, c.purpose, c.scope, name, c.basis);
    page.hydrated += r.reads;
    if (r.selectedKey != key) return; // a losing candidate; the winner is emitted at its own position
    if (r.status == P_FOUND) {
      buf[c.count++] = Item(name, r.target, r.selectedBy, r.revision, P_FOUND);
    } else if (r.status == P_CONFLICT) {
      buf[c.count++] = Item(name, bytes32(0), bytes32(0), 0, P_CONFLICT);
    }
  }

  /// Folder page filtered by a File-level tag stance, using the SAME lens/basis as the folder selection.
  function listTagged(
    Lens memory lens,
    bytes32 folderId,
    bytes32 concept,
    Cursor memory cursor,
    uint32 budget
  ) public view returns (Page memory page) {
    page = list(lens, PURPOSE_FOLDER, folderId, cursor, budget);
    Item[] memory kept = new Item[](page.items.length);
    uint256 c;
    for (uint256 j = 0; j < page.items.length; j++) {
      if (page.items[j].status != P_FOUND) continue;
      Resolution memory t = resolveAt(lens, PURPOSE_TAG, page.items[j].target, concept, page.next.basisAdmission);
      page.hydrated += t.reads;
      if (t.status == P_FOUND && t.target == TAG_ASSERT) kept[c++] = page.items[j];
    }
    page.items = new Item[](c);
    for (uint256 j = 0; j < c; j++) page.items[j] = kept[j];
    page.selected = uint32(c);
  }

  // ---------------------------------------------------------------------------
  // history
  // ---------------------------------------------------------------------------

  function history(
    bytes32 bindingKey,
    uint32 from,
    uint32 limit
  ) external view returns (uint64[] memory admissions, bytes32[] memory targets, uint32 total) {
    uint256 n = BindingHistory.length(index, bindingKey);
    total = uint32(n);
    uint256 end = uint256(from) + limit;
    if (end > n) end = n;
    admissions = BindingHistory.slice(index, bindingKey, from, end);
    targets = new bytes32[](admissions.length);
    for (uint256 j = 0; j < admissions.length; j++) {
      targets[j] = Admissions.get(ledger, admissions[j]).target;
    }
  }
}
