// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import { IStoreRead } from "@latticexyz/store/src/IStoreRead.sol";
import "../src/EfsTypes.sol";
import "../src/LedgerErrors.sol";
import { Ledger } from "../src/Ledger.sol";
import { IndexModule } from "../src/IndexModule.sol";
import { Records, Types, Admissions, Evidence, Nonces } from "../src/tables/LedgerTables.sol";
import { ByType, ByAuthor, Occurrences } from "../src/tables/IndexTables.sol";
import { Deploy } from "./Deploy.sol";
import { FixtureRealm } from "./FixtureRealm.sol";
import "./FixtureActors.sol"; // Required by the artifact-only actor deployments below.

/// Disposable C repair tests. No shared two-field fixture builders are used.
/// Expectations use the literal meta domain and the retained Record-ID formula,
/// independently of EfsIds.recordId and Ledger.decodeTypeBody.
contract TypeRuleCommitmentTest {
  FixtureRealm internal realm;
  Ledger internal ledger;
  IndexModule internal index;
  address internal strictRule;
  address internal permissiveRule;

  function setUp() public {
    realm = FixtureRealm(Deploy.deployArtifact("FixtureRealm.sol:FixtureRealm", ""));
    (index, ledger, ) = realm.deployRealm(bytes32(0));
    strictRule = Deploy.deployArtifact("FixtureActors.sol:QuoteAcceptorV1", "");
    permissiveRule = Deploy.deployArtifact("FixtureActors.sol:PassAcceptor", "");
  }

  /// Break: ignoring the body's mandatoryRuleId permits a weaker implementation
  /// to define the committed exact Type, and commits the earlier batch prefix.
  function test_reject_strictRuleCommitmentBoundToPermissiveRuntime_noEffects() public {
    require(strictRule.codehash != permissiveRule.codehash, "fixture needs distinct immutable rules");
    bytes[] memory bodies = new bytes[](2);
    bodies[0] = abi.encode(bytes32("pair-shape"), new bytes32[](0), permissiveRule.codehash);
    bytes32 prefixType = keccak256(abi.encode(keccak256("efs2/lab-c/type-meta/2"), keccak256(bodies[0])));
    bytes32[] memory refTypes = new bytes32[](1);
    refTypes[0] = prefixType;
    bodies[1] = abi.encode(bytes32("quote-shape"), refTypes, strictRule.codehash);
    bytes32 strictType = keccak256(abi.encode(keccak256("efs2/lab-c/type-meta/2"), keccak256(bodies[1])));

    Action[] memory actions = new Action[](2);
    actions[0] = _declaration(bodies[0], permissiveRule);
    actions[1] = _declaration(bodies[1], permissiveRule); // Deliberate rule/runtime mismatch.
    Intent memory intent = _nativeIntent(ledger, 1, actions);
    bytes32 publicationId = keccak256(abi.encode(intent.author, uint64(1), keccak256(abi.encode(actions))));

    (bool accepted, bytes memory errorData) = address(ledger).call(abi.encodeCall(Ledger.publishNative, (intent, bodies)));
    require(!accepted, "strict rule commitment accepted a permissive runtime");
    require(
      keccak256(errorData) == keccak256(abi.encodeWithSelector(AcceptorRuleMismatch.selector, strictType, strictRule.codehash, permissiveRule.codehash)),
      "wrong mismatch Type or runtime commitments"
    );

    _assertTypeAbsent(ledger, index, prefixType);
    _assertTypeAbsent(ledger, index, strictType);
    IStoreRead store = IStoreRead(address(ledger));
    require(ledger.highWater() == 0, "rejected batch advanced admission high-water");
    require(Nonces.get(store, intent.author) == 0, "rejected batch consumed nonce");
    require(Admissions.get(store, 1).publicationId == bytes32(0), "prefix admission survived rejection");
    require(Admissions.get(store, 2).publicationId == bytes32(0), "mismatched admission survived rejection");
    require(Evidence.get(store, publicationId).firstAdmission == 0, "rejected batch retained evidence");
    require(ByType.length(IStoreRead(address(index)), TYPE_META) == 0, "rejected batch changed Type inventory");
    require(ByAuthor.length(IStoreRead(address(index)), intent.author) == 0, "rejected batch changed author inventory");

    // Same body, nonce, author, prefix and public entrypoint; only fix the local
    // rule selection. This prevents an unrelated setup refusal from passing.
    intent.actions[1].target = bytes32(uint256(uint160(strictRule)));
    ledger.publishNative(intent, bodies);
    _assertDeclared(ledger, index, prefixType, bodies[0], permissiveRule, 1);
    _assertDeclared(ledger, index, strictType, bodies[1], strictRule, 2);
    require(ledger.highWater() == 2, "corrected declaration batch not admitted");
  }

  /// Break: introducing local acceptor address or Realm identity into TypeID
  /// makes the same committed immutable rule a different Type after relocation.
  function test_sameImmutableRuntimeAtDifferentAddresses_preservesTypeAcrossRealms() public {
    address relocatedRule = Deploy.deployArtifact("FixtureActors.sol:QuoteAcceptorV1", "");
    require(relocatedRule != strictRule, "fixture needs different local addresses");
    require(relocatedRule.codehash == strictRule.codehash, "fixture needs identical runtime code");
    (IndexModule otherIndex, Ledger otherLedger, ) = realm.deployRealm(bytes32(0));
    require(otherLedger.realmId() != ledger.realmId(), "fixture needs different Realms");

    bytes[] memory bodies = new bytes[](1);
    bodies[0] = abi.encode(bytes32("quote-shape"), new bytes32[](0), strictRule.codehash);
    bytes32 expectedType = keccak256(abi.encode(keccak256("efs2/lab-c/type-meta/2"), keccak256(bodies[0])));
    Action[] memory actions = new Action[](1);
    actions[0] = _declaration(bodies[0], strictRule);
    ledger.publishNative(_nativeIntent(ledger, 1, actions), bodies);
    actions[0].target = bytes32(uint256(uint160(relocatedRule)));
    otherLedger.publishNative(_nativeIntent(otherLedger, 1, actions), bodies);

    _assertDeclared(ledger, index, expectedType, bodies[0], strictRule, 1);
    _assertDeclared(otherLedger, otherIndex, expectedType, bodies[0], relocatedRule, 1);
    bytes32[] memory localInventory = ByType.slice(IStoreRead(address(index)), TYPE_META, 0, 1);
    bytes32[] memory otherInventory = ByType.slice(IStoreRead(address(otherIndex)), TYPE_META, 0, 1);
    require(localInventory.length == 1 && localInventory[0] == expectedType, "local exact Type missing");
    require(otherInventory.length == 1 && otherInventory[0] == expectedType, "relocated exact Type changed");
  }

  /// Break: deriving TypeID from only shape/refTypes collapses two different
  /// mandatory rules into one exact Type or refuses the second as a duplicate.
  function test_differentMandatoryRuleCommitment_changesExactType() public {
    address stricterRule = Deploy.deployArtifact("FixtureActors.sol:QuoteAcceptorV2", "");
    require(stricterRule.codehash != strictRule.codehash, "fixture needs different immutable runtimes");
    bytes[] memory bodies = new bytes[](2);
    bodies[0] = abi.encode(bytes32("quote-shape"), new bytes32[](0), strictRule.codehash);
    bodies[1] = abi.encode(bytes32("quote-shape"), new bytes32[](0), stricterRule.codehash);
    bytes32 firstType = keccak256(abi.encode(keccak256("efs2/lab-c/type-meta/2"), keccak256(bodies[0])));
    bytes32 secondType = keccak256(abi.encode(keccak256("efs2/lab-c/type-meta/2"), keccak256(bodies[1])));
    require(firstType != secondType, "independent exact-Type commitments must differ");
    Action[] memory actions = new Action[](2);
    actions[0] = _declaration(bodies[0], strictRule);
    actions[1] = _declaration(bodies[1], stricterRule);
    ledger.publishNative(_nativeIntent(ledger, 1, actions), bodies);

    _assertDeclared(ledger, index, firstType, bodies[0], strictRule, 1);
    _assertDeclared(ledger, index, secondType, bodies[1], stricterRule, 2);
    bytes32[] memory inventory = ByType.slice(IStoreRead(address(index)), TYPE_META, 0, 2);
    require(inventory.length == 2, "distinct mandatory rules collapsed in Type inventory");
    require(inventory[0] == firstType && inventory[1] == secondType, "inventory lost distinct exact Types");
  }

  function _declaration(bytes memory body, address rule) internal pure returns (Action memory action) {
    action.kind = KIND_DECLARE_TYPE;
    action.typeId = TYPE_META;
    action.digestKind = DIGEST_BODY_HASH;
    action.digest = keccak256(body);
    action.target = bytes32(uint256(uint160(rule)));
  }

  function _nativeIntent(Ledger target, uint64 nonce, Action[] memory actions) internal view returns (Intent memory intent) {
    intent.author = EfsIds.contractPrincipal(target.realmOrigin(), address(this));
    intent.nonce = nonce;
    intent.acceptanceProfile = ACCEPTANCE_PROFILE_V2;
    intent.indexObligations = INDEX_OBLIGATIONS_V1;
    intent.actions = actions;
  }

  function _assertTypeAbsent(Ledger target, IndexModule targetIndex, bytes32 typeId) internal view {
    IStoreRead store = IStoreRead(address(target));
    (address rule, bytes32 ruleHash, uint64 typeAdmission, bytes32[] memory refs) = Types.get(store, typeId);
    require(rule == address(0) && ruleHash == bytes32(0) && typeAdmission == 0 && refs.length == 0, "Type row survived rejection");
    (bytes32 metaType, uint64 recordAdmission, bytes memory body) = Records.get(store, typeId);
    require(metaType == bytes32(0) && recordAdmission == 0 && body.length == 0, "Type Record survived rejection");
    require(Occurrences.get(IStoreRead(address(targetIndex)), typeId) == 0, "rejected Type has an indexed occurrence");
  }

  function _assertDeclared(
    Ledger target,
    IndexModule targetIndex,
    bytes32 expectedType,
    bytes memory expectedBody,
    address expectedRule,
    uint64 expectedAdmission
  ) internal view {
    IStoreRead store = IStoreRead(address(target));
    (address rule, bytes32 ruleHash, uint64 typeAdmission, ) = Types.get(store, expectedType);
    require(rule == expectedRule && ruleHash == expectedRule.codehash, "exact Type bound to wrong local runtime");
    require(typeAdmission == expectedAdmission, "exact Type declaration missing");
    (bytes32 metaType, uint64 recordAdmission, bytes memory body) = Records.get(store, expectedType);
    require(metaType == keccak256("efs2/lab-c/type-meta/2") && recordAdmission == expectedAdmission, "exact Type Record missing");
    require(keccak256(body) == keccak256(expectedBody), "committed Type body not retained");
    require(Occurrences.get(IStoreRead(address(targetIndex)), expectedType) == 1, "exact Type occurrence missing");
  }
}
