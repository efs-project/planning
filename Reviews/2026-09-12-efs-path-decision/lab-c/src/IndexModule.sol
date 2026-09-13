// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/*
 * IndexModule: the SEPARATE mandatory-index responsibility (road-c-review finding 3).
 * Own Store (own storage, own tables in namespace "efsidx"); called exactly once per
 * publication by the Ledger in the same transaction; any revert here reverts the
 * publication. Mandatory set for this probe: scope lists (folder placements, tag
 * scopes, per-subject heads), binding history, backlinks, by-Type, by-author,
 * per-record occurrence counter. coverage(family, scope) reports COMPLETE for the
 * mandatory families (maintained since genesis), PARTIAL/COMPLETE for a declared
 * optional family by its backfill frontier, UNKNOWN for an undeclared family.
 *
 * Authority: `attach(ledger)` is a one-shot call by the deployer that seals the
 * reciprocal binding (the Ledger must already name this module, the Ledger must
 * have code; its address AND codehash are recorded). Afterwards there is no
 * privileged function. `poisonConcept` is an immutable TEST LEVER: a tag binding to
 * that concept reverts inside the index so the late-index rollback path can be forced;
 * zero disables it (the measured deployment uses zero).
 */

import { EfsStoreCore } from "./EfsStoreCore.sol";
import "./EfsTypes.sol";
import {
  Scopes,
  BindingHistory,
  Backlinks,
  ByType,
  ByAuthor,
  Occurrences,
  Coverage
} from "./tables/IndexTables.sol";

contract IndexModule is EfsStoreCore, IIndexModule {
  address public immutable deployer;
  bytes32 public immutable poisonConcept;
  address public ledger;
  bytes32 public ledgerCodehash;

  uint8 public constant COV_UNKNOWN = 0;
  uint8 public constant COV_COMPLETE = 1;
  uint8 public constant COV_PARTIAL = 2;

  bytes32 public constant FAMILY_SCOPES = keccak256("efs2/lab-c/index/scopes");
  bytes32 public constant FAMILY_HISTORY = keccak256("efs2/lab-c/index/binding-history");
  bytes32 public constant FAMILY_BACKLINKS = keccak256("efs2/lab-c/index/backlinks");
  bytes32 public constant FAMILY_BY_TYPE = keccak256("efs2/lab-c/index/by-type");
  bytes32 public constant FAMILY_BY_AUTHOR = keccak256("efs2/lab-c/index/by-author");
  bytes32 public constant FAMILY_OCCURRENCES = keccak256("efs2/lab-c/index/occurrences");
  /// Declared-but-never-backfilled optional family, present only to exercise PARTIAL coverage.
  bytes32 public constant FAMILY_OPTIONAL_DIGEST = keccak256("efs2/lab-c/index/optional-digest");

  error NotLedger(address caller);
  error NotDeployer(address caller);
  error AlreadyAttached();
  error BadAttachment(address given);
  error NotReciprocal(address given, address itNames);
  error IndexPoisoned(bytes32 concept);

  constructor(bytes32 poison) {
    deployer = msg.sender;
    poisonConcept = poison;
  }

  function _registerEfsTables() internal override {
    Scopes._register();
    BindingHistory._register();
    Backlinks._register();
    ByType._register();
    ByAuthor._register();
    Occurrences._register();
    Coverage._register();
    Coverage._set(FAMILY_SCOPES, true, true, 0, 0);
    Coverage._set(FAMILY_HISTORY, true, true, 0, 0);
    Coverage._set(FAMILY_BACKLINKS, true, true, 0, 0);
    Coverage._set(FAMILY_BY_TYPE, true, true, 0, 0);
    Coverage._set(FAMILY_BY_AUTHOR, true, true, 0, 0);
    Coverage._set(FAMILY_OCCURRENCES, true, true, 0, 0);
    Coverage._set(FAMILY_OPTIONAL_DIGEST, false, true, 0, 0);
  }

  /// One-shot reciprocal seal: rejects zero/no-code addresses and a Ledger that names another module.
  function attach(address ledger_) external {
    if (msg.sender != deployer) revert NotDeployer(msg.sender);
    if (ledger != address(0)) revert AlreadyAttached();
    if (ledger_ == address(0) || ledger_.code.length == 0) revert BadAttachment(ledger_);
    address named = ILedgerView(ledger_).index();
    if (named != address(this)) revert NotReciprocal(ledger_, named);
    ledger = ledger_;
    ledgerCodehash = ledger_.codehash;
  }

  function obligationsId() external pure returns (bytes32) {
    return INDEX_OBLIGATIONS_V1;
  }

  function generation() external pure returns (uint32) {
    return 1;
  }

  function onPublication(bytes32, uint64, Effect[] calldata effects) external {
    if (msg.sender != ledger || ledger == address(0) || msg.sender.codehash != ledgerCodehash) {
      revert NotLedger(msg.sender);
    }
    for (uint256 i = 0; i < effects.length; i++) {
      _index(effects[i]);
    }
  }

  function _index(Effect calldata e) internal {
    ByAuthor._push(e.author, e.admission);
    if (e.kind == KIND_RECORD || e.kind == KIND_DECLARE_TYPE) {
      Occurrences._set(e.recordId, Occurrences._get(e.recordId) + 1);
      if (e.fresh) {
        ByType._push(e.typeId, e.recordId);
        for (uint256 k = 0; k < e.refs.length; k++) {
          Backlinks._push(e.refs[k], e.recordId);
        }
      }
    } else if (e.kind == KIND_BIND) {
      if (poisonConcept != bytes32(0) && e.purpose == PURPOSE_TAG && e.role == poisonConcept) revert IndexPoisoned(e.role);
      BindingHistory._push(e.bindingKey, e.admission);
      if (e.revision == 1) {
        // first revision of this binding key: register it once in its scope list
        if (e.purpose == PURPOSE_TAG) {
          Scopes._push3(EfsIds.scopeKey(PURPOSE_TAG, e.role), e.author, e.subject, e.bindingKey);
        } else {
          Scopes._push3(EfsIds.scopeKey(e.purpose, e.subject), e.author, e.role, e.bindingKey);
        }
      }
    }
    // KIND_SUBJECT / KIND_IMPORT: by-author only
  }

  /// scope is accepted for API symmetry; every family here is global, so coverage does not vary by scope.
  function coverage(bytes32 family, bytes32) external view returns (uint8 status, uint64 through) {
    (bool mandatory, bool declared, , uint64 frontier) = Coverage._get(family);
    if (!declared || ledger == address(0)) return (COV_UNKNOWN, 0); // pre-attach: never revert, never claim coverage
    uint64 hw = ILedgerView(ledger).highWater();
    if (mandatory) return (COV_COMPLETE, hw);
    return (frontier >= hw ? COV_COMPLETE : COV_PARTIAL, frontier);
  }
}
