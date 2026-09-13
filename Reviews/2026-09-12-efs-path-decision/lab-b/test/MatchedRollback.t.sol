// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Keys} from "../src/Keys.sol";
import {Ledger} from "../src/Ledger.sol";
import {IndexModule} from "../src/IndexModule.sol";
import {IIndexModule} from "../src/Interfaces.sol";
import {QuoteAcceptor} from "../src/LabAcceptors.sol";
import {LabBase} from "./LabBase.sol";

/// Disposable test-only index: use the real maintenance path, then optionally
/// refuse one exact final BIND.
contract LateRefusingIndexModule is IndexModule {
    bytes32 public immutable poisonBindingKey;

    error E_LATE_INDEX(bytes32 bindingKey);

    constructor(address ledger_, bytes32 poisonBindingKey_) IndexModule(ledger_) {
        poisonBindingKey = poisonBindingKey_;
    }

    function onAdmission(uint64 publication, IIndexModule.Effect[] calldata effects) public override {
        super.onAdmission(publication, effects);
        uint256 n = effects.length;
        if (
            n != 0 && poisonBindingKey != bytes32(0) && effects[n - 1].kind == 3
                && effects[n - 1].bindingKey == poisonBindingKey
        ) {
            revert E_LATE_INDEX(poisonBindingKey);
        }
    }
}

/// The complete signed A1 rollback control at the real Ledger/Index boundary.
contract MatchedRollbackTest is LabBase {
    bytes32 internal constant QUOTE_J_SHAPE = keccak256("lab/type/quote-joined/1");
    bytes32 internal constant MARKET = keccak256("market");
    bytes32 internal constant ETH_USDC = keccak256("eth-usdc");
    bytes32 internal constant FILE_SALT = bytes32(uint256(1));
    bytes internal constant NOTE_BYTES = hex"7265666572656e63652071756f7465";
    uint256 internal constant MANTISSA = 2_500_000_000;
    uint64 internal constant OBSERVED_AT = 1_800_000_000;

    bytes32 internal QUOTE_J;
    QuoteAcceptor internal quoteAcceptor;
    LateRefusingIndexModule internal lateIndex;

    struct Scenario {
        bytes itemABytes;
        bytes itemBBytes;
        bytes pairBytes;
        bytes32 itemA;
        bytes32 itemB;
        bytes32 pairId;
        bytes32 subject;
        bytes32 headPosition;
        bytes32 folderPosition;
        bytes32 tagPosition;
        bytes32 headKey;
        bytes32 folderKey;
        bytes32 tagKey;
    }

    struct SignedA1 {
        Ledger.Action[] actions;
        bytes[] bodies;
        Ledger.Intent intent;
        bytes signature;
        bytes quoteBytes;
        bytes32 quoteId;
        bytes32 publicationId;
    }

    function setUp() public override {
        super.setUp();
        quoteAcceptor = new QuoteAcceptor();
        bytes32[] memory pairRef = new bytes32[](1);
        pairRef[0] = PAIR;
        QUOTE_J = registry.register(QUOTE_J_SHAPE, address(quoteAcceptor), pairRef);
    }

    function test_scale_seven_complete_a1_reverts_with_full_mandatory_error_and_s0() public {
        Scenario memory s = _scenario(false);
        SignedA1 memory a1 = _signedA1(s, 7);
        require(a1.quoteId != rid(QUOTE_J, _quote(s.pairId, 6)), "scale 7 must recompute the record id");
        require(a1.actions[2].target == a1.quoteId, "scale 7 must recompute the HEAD target");
        _assertS0(s, a1);

        try ledger.executeSigned(a1.intent, a1.actions, a1.bodies, a1.signature) {
            require(false, "scale 7 must be refused");
        } catch (bytes memory err) {
            _expectExact(err, abi.encodeWithSelector(Ledger.E_REJECTED.selector, uint256(1), QUOTE_J), 68, "full mandatory refusal");
        }

        _assertS0(s, a1);
    }

    function test_scale_six_complete_a1_late_tag_refusal_rolls_back_full_prefix() public {
        Scenario memory s = _scenario(true);
        SignedA1 memory a1 = _signedA1(s, 6);
        _assertS0(s, a1);

        bytes memory inner = abi.encodeWithSelector(LateRefusingIndexModule.E_LATE_INDEX.selector, s.tagKey);
        bytes memory expected = abi.encodeWithSelector(Ledger.E_INDEX.selector, inner);
        try ledger.executeSigned(a1.intent, a1.actions, a1.bodies, a1.signature) {
            require(false, "late market poison must refuse after normal maintenance");
        } catch (bytes memory err) {
            _expectExact(err, expected, 132, "full nested late-index refusal");
        }

        _assertS0(s, a1);
    }

    function test_scale_six_complete_a1_zero_poison_calibrates_full_state() public {
        Scenario memory s = _scenario(false);
        SignedA1 memory a1 = _signedA1(s, 6);
        _assertS0(s, a1);

        (uint64 publication, uint64 firstAdmission) = ledger.executeSigned(a1.intent, a1.actions, a1.bodies, a1.signature);
        require(publication == 2 && firstAdmission == 4, "literal A1 ordinals");
        _assertCalibration(s, a1);
    }

    function test_direct_late_index_call_remains_ledger_only() public {
        _install(bytes32(0));
        IIndexModule.Effect[] memory effects = new IIndexModule.Effect[](0);
        try lateIndex.onAdmission(1, effects) {
            require(false, "direct callback must be refused");
        } catch (bytes memory err) {
            _expectExact(err, abi.encodeWithSelector(IndexModule.E_LEDGER.selector), 4, "Ledger-only callback");
        }
    }

    function _scenario(bool poisoned) internal returns (Scenario memory s) {
        s.itemABytes = abi.encode(uint256(1));
        s.itemBBytes = abi.encode(uint256(2));
        s.itemA = rid(ITEM, s.itemABytes);
        s.itemB = rid(ITEM, s.itemBBytes);
        s.pairBytes = abi.encode(s.itemA, s.itemB, uint256(1));
        s.pairId = rid(PAIR, s.pairBytes);
        s.subject = Keys.subject(pid(eoaA), FILE_SALT);
        s.headPosition = Keys.position(HEAD, s.subject, NO_ROLE);
        s.folderPosition = Keys.position(FOLDER, SWAPS, ETH_USDC);
        s.tagPosition = Keys.position(TAG, s.subject, MARKET);
        s.headKey = Keys.binding(pid(eoaA), s.headPosition);
        s.folderKey = Keys.binding(pid(eoaA), s.folderPosition);
        s.tagKey = Keys.binding(pid(eoaA), s.tagPosition);

        _install(poisoned ? s.tagKey : bytes32(0));
        _admitPrefix(s);
    }

    function _install(bytes32 poison) internal {
        lateIndex = new LateRefusingIndexModule(address(ledger), poison);
        index = IndexModule(address(lateIndex));
        ledger.setIndexModule(address(lateIndex));
        require(lateIndex.attachedFrom() == 1 && lateIndex.lastProcessed() == 0, "module attached before admission 1");
        require(ledger.indexModule() == address(lateIndex), "selected required index");
    }

    function _admitPrefix(Scenario memory s) internal {
        Ledger.Action[] memory actions = new Ledger.Action[](3);
        actions[0] = aPublish(ITEM, s.itemABytes);
        actions[1] = aPublish(ITEM, s.itemBBytes);
        actions[2] = aPublish(PAIR, s.pairBytes);
        bytes[] memory bodies = new bytes[](3);
        bodies[0] = s.itemABytes;
        bodies[1] = s.itemBBytes;
        bodies[2] = s.pairBytes;
        (uint64 publication, uint64 firstAdmission) = alice.execute(actions, bodies);
        require(publication == 1 && firstAdmission == 1, "literal Items/Pair prefix ordinals");
    }

    function _signedA1(Scenario memory s, uint8 scale) internal view returns (SignedA1 memory z) {
        z.quoteBytes = _quote(s.pairId, scale);
        z.quoteId = rid(QUOTE_J, z.quoteBytes);
        z.actions = new Ledger.Action[](5);
        z.actions[0] = aCreate(FILE_SALT);
        z.actions[1] = aPublish(QUOTE_J, z.quoteBytes);
        z.actions[2] = aBind(HEAD, s.subject, NO_ROLE, z.quoteId, 0);
        z.actions[3] = aBind(FOLDER, SWAPS, ETH_USDC, s.subject, 0);
        z.actions[4] = aBind(TAG, s.subject, MARKET, s.subject, 0);
        z.bodies = new bytes[](5);
        z.bodies[1] = z.quoteBytes;
        (z.intent, z.signature) = signed(PK_A, ledger, 0, z.actions);
        bytes32 actionsHash = keccak256(abi.encode(z.actions));
        z.publicationId = keccak256(abi.encode(eoaA, uint64(0), actionsHash));
        require(z.intent.indexObligations == ledger.indexObligations(), "fresh module obligation");
        require(z.intent.acceptanceProfile == ledger.acceptanceProfileOf(z.actions), "fresh A1 acceptance profile");
    }

    function _quote(bytes32 pairId, uint8 scale) internal pure returns (bytes memory) {
        return abi.encode(pairId, MANTISSA, scale, OBSERVED_AT, keccak256(NOTE_BYTES));
    }

    function _assertS0(Scenario memory s, SignedA1 memory a1) internal view {
        _assertCounts(3, 3, 0, 1);
        require(ledger.nonces(eoaA) == 0, "S0 A protocol nonce");
        require(ledger.indexModule() == address(lateIndex), "S0 required index attached");
        require(lateIndex.attachedFrom() == 1, "S0 attachedFrom");
        require(lateIndex.lastProcessed() == 3 && lateIndex.lastPublication() == 1, "S0 frontier");
        require(lateIndex.generation() == 0 && !lateIndex.gapped(), "S0 generation and gap");
        _assertAllCoverage(3);

        _assertRecord(s.itemA, ITEM, 1, s.itemABytes);
        _assertRecord(s.itemB, ITEM, 2, s.itemBBytes);
        _assertRecord(s.pairId, PAIR, 3, s.pairBytes);
        (bytes32 quoteType, uint64 quoteFirst, uint32 quoteOccurrences, bytes memory quoteBody) = ledger.record(a1.quoteId);
        require(quoteType == bytes32(0) && quoteFirst == 0 && quoteOccurrences == 0 && quoteBody.length == 0, "attempted Quote absent");
        require(ledger.subjectCreatedAt(s.subject) == 0, "attempted File absent");

        _assertZeroReply(abi.encodeWithSelector(Ledger.evidence.selector, uint64(2)), 13, "publication 2 evidence absent");
        _assertZeroReply(abi.encodeWithSelector(Ledger.sourceEvidence.selector, uint64(2)), 12, "publication 2 source evidence absent");
        require(ledger.publicationOf(a1.publicationId) == 0, "publication retry key absent");
        for (uint64 ordinal = 4; ordinal <= 8; ++ordinal) {
            _assertZeroReply(abi.encodeWithSelector(Ledger.admission.selector, ordinal), 8, "attempted admission absent");
        }

        _assertZeroReply(abi.encodeWithSelector(Ledger.head.selector, s.headKey), 6, "HEAD absent");
        _assertZeroReply(abi.encodeWithSelector(Ledger.head.selector, s.folderKey), 6, "FOLDER absent");
        _assertZeroReply(abi.encodeWithSelector(Ledger.head.selector, s.tagKey), 6, "TAG absent");
        _assertZeroReply(abi.encodeWithSelector(Ledger.positionCell.selector, s.headPosition), 3, "HEAD position absent");
        _assertZeroReply(abi.encodeWithSelector(Ledger.positionCell.selector, s.folderPosition), 3, "FOLDER position absent");
        _assertZeroReply(abi.encodeWithSelector(Ledger.positionCell.selector, s.tagPosition), 3, "TAG position absent");
        require(ledger.bindingPosition(1) == bytes32(0) && ledger.bindingPosition(2) == bytes32(0) && ledger.bindingPosition(3) == bytes32(0), "binding ordinals absent");

        _assertPrefixLists(s);
        _assertList(Keys.byTypeList(QUOTE_J), 0, 0, 0, 0, 0, "Quote by-Type empty");
        _assertList(Keys.byAuthorList(pid(eoaA)), 0, 0, 0, 0, 0, "A by-author empty");
        _assertAttemptLists(s, a1.quoteId, false);
    }

    function _assertCalibration(Scenario memory s, SignedA1 memory a1) internal view {
        _assertCounts(8, 4, 3, 2);
        require(ledger.nonces(eoaA) == 1, "calibration A protocol nonce");
        require(lateIndex.lastProcessed() == 8 && lateIndex.lastPublication() == 2, "calibration frontier");
        require(lateIndex.generation() == 0 && !lateIndex.gapped(), "calibration generation and gap");
        _assertAllCoverage(8);

        _assertRecord(s.itemA, ITEM, 1, s.itemABytes);
        _assertRecord(s.itemB, ITEM, 2, s.itemBBytes);
        _assertRecord(s.pairId, PAIR, 3, s.pairBytes);
        _assertRecord(a1.quoteId, QUOTE_J, 5, a1.quoteBytes);
        require(ledger.subjectCreatedAt(s.subject) == 4, "File admitted at 4");
        _assertEvidence(a1);
        require(ledger.publicationOf(a1.publicationId) == 2, "publication retry key retained");
        _assertZeroReply(abi.encodeWithSelector(Ledger.sourceEvidence.selector, uint64(2)), 12, "signed publication has no source-import evidence");

        _assertAdmission(4, 5, 0, 2, 0, FILE_SALT, bytes32(0));
        _assertAdmission(5, 1, 1, 2, 0, keccak256(a1.quoteBytes), QUOTE_J);
        _assertAdmission(6, 3, 2, 2, 1, a1.quoteId, bytes32(0));
        _assertAdmission(7, 3, 3, 2, 2, s.subject, bytes32(0));
        _assertAdmission(8, 3, 4, 2, 3, s.subject, bytes32(0));

        _assertHead(s.headKey, 6, 1, a1.quoteId, "HEAD calibration");
        _assertHead(s.folderKey, 7, 2, s.subject, "FOLDER calibration");
        _assertHead(s.tagKey, 8, 3, s.subject, "TAG calibration");
        _assertPosition(s.headPosition, HEAD, s.subject, NO_ROLE, "HEAD position");
        _assertPosition(s.folderPosition, FOLDER, SWAPS, ETH_USDC, "FOLDER position");
        _assertPosition(s.tagPosition, TAG, s.subject, MARKET, "TAG position");
        require(ledger.bindingPosition(1) == s.headPosition, "HEAD binding ordinal");
        require(ledger.bindingPosition(2) == s.folderPosition, "FOLDER binding ordinal");
        require(ledger.bindingPosition(3) == s.tagPosition, "TAG binding ordinal");

        _assertPrefixLists(s);
        _assertList(Keys.byTypeList(QUOTE_J), 1, 1, 5, 0, 5, "Quote by-Type");
        _assertList(Keys.byAuthorList(pid(eoaA)), 1, 1, 5, 0, 5, "A by-author");
        _assertAttemptLists(s, a1.quoteId, true);
    }

    function _assertPrefixLists(Scenario memory s) internal view {
        _assertList(Keys.byTypeList(ITEM), 2, 2, 2, 0, uint256(1) | (uint256(2) << 48), "Item by-Type");
        _assertList(Keys.byTypeList(PAIR), 1, 1, 3, 0, 3, "Pair by-Type");
        _assertList(Keys.byAuthorList(pid(address(alice))), 3, 3, 3, 0, uint256(1) | (uint256(2) << 48) | (uint256(3) << 96), "operator by-author");
        require(s.itemA != bytes32(0), "prefix fixture present");
    }

    function _assertAttemptLists(Scenario memory s, bytes32 quoteId, bool present) internal view {
        if (!present) {
            _assertList(Keys.scopeList(Keys.scope(pid(eoaA), HEAD, s.subject)), 0, 0, 0, 0, 0, "HEAD scope empty");
            _assertList(Keys.scopeList(Keys.scope(pid(eoaA), FOLDER, SWAPS)), 0, 0, 0, 0, 0, "FOLDER scope empty");
            _assertList(Keys.scopeList(Keys.scope(pid(eoaA), TAG, s.subject)), 0, 0, 0, 0, 0, "TAG scope empty");
            _assertList(Keys.historyList(s.headKey), 0, 0, 0, 0, 0, "HEAD history empty");
            _assertList(Keys.historyList(s.folderKey), 0, 0, 0, 0, 0, "FOLDER history empty");
            _assertList(Keys.historyList(s.tagKey), 0, 0, 0, 0, 0, "TAG history empty");
            _assertList(Keys.backlinkList(quoteId), 0, 0, 0, 0, 0, "Quote backlink empty");
            _assertList(Keys.backlinkList(s.subject), 0, 0, 0, 0, 0, "File backlink empty");
            return;
        }
        _assertList(Keys.scopeList(Keys.scope(pid(eoaA), HEAD, s.subject)), 1, 1, 1, 1, 1, "HEAD scope");
        _assertList(Keys.scopeList(Keys.scope(pid(eoaA), FOLDER, SWAPS)), 1, 1, 2, 1, 2, "FOLDER scope");
        _assertList(Keys.scopeList(Keys.scope(pid(eoaA), TAG, s.subject)), 1, 1, 3, 1, 3, "TAG scope");
        _assertList(Keys.historyList(s.headKey), 1, 1, 6, 1, 6, "HEAD history");
        _assertList(Keys.historyList(s.folderKey), 1, 1, 7, 1, 7, "FOLDER history");
        _assertList(Keys.historyList(s.tagKey), 1, 1, 8, 1, 8, "TAG history");
        _assertList(Keys.backlinkList(quoteId), 1, 1, 6, 0, 6, "Quote backlink");
        _assertList(Keys.backlinkList(s.subject), 2, 2, 8, 0, uint256(7) | (uint256(8) << 48), "File backlinks");
    }

    function _assertAllCoverage(uint64 through) internal view {
        _assertCoverage(lateIndex.FAMILY_SCOPE(), through);
        _assertCoverage(lateIndex.FAMILY_HISTORY(), through);
        _assertCoverage(lateIndex.FAMILY_BACKLINK(), through);
        _assertCoverage(lateIndex.FAMILY_BY_TYPE(), through);
        _assertCoverage(lateIndex.FAMILY_BY_AUTHOR(), through);
    }

    function _assertCoverage(bytes32 family, uint64 through) internal view {
        (uint8 status, uint64 fromAdmission, uint64 throughAdmission) = lateIndex.coverage(family, bytes32(0));
        require(status == 2 && fromAdmission == 1 && throughAdmission == through, "literal COMPLETE frontier");
    }

    function _assertCounts(uint64 admissions_, uint64 records_, uint64 bindings_, uint64 publications_) internal view {
        (uint64 admissionsNow, uint64 recordsNow, uint64 bindingsNow, uint64 publicationsNow) = ledger.counts();
        require(admissionsNow == admissions_ && recordsNow == records_ && bindingsNow == bindings_ && publicationsNow == publications_, "literal Ledger counters");
    }

    function _assertRecord(bytes32 id, bytes32 expectedType, uint64 expectedFirst, bytes memory expectedBody) internal view {
        (bytes32 typeId, uint64 firstAdmission, uint32 occurrences, bytes memory body) = ledger.record(id);
        require(typeId == expectedType && firstAdmission == expectedFirst && occurrences == 1, "literal record row");
        require(keccak256(body) == keccak256(expectedBody), "exact record body");
    }

    function _assertEvidence(SignedA1 memory a1) internal view {
        (
            address author,
            uint8 proofKind,
            ,
            uint16 leafCount,
            uint64 firstAdmission,
            ,
            ,
            uint64 nonce,
            ,
            ,
            bytes32 acceptanceProfile,
            bytes32 indexObligations,
            bytes32 actionsHash
        ) = ledger.evidence(2);
        require(author == eoaA && proofKind == 2 && leafCount == 5 && firstAdmission == 4 && nonce == 0, "literal signed evidence row");
        require(acceptanceProfile == a1.intent.acceptanceProfile && indexObligations == a1.intent.indexObligations, "fresh authority commitments retained");
        require(actionsHash == keccak256(abi.encode(a1.actions)), "exact A1 actions retained");
    }

    function _assertAdmission(uint64 ordinal, uint8 kind_, uint16 leaf_, uint64 publication_, uint64 bindingOrdinal_, bytes32 a_, bytes32 b_) internal view {
        (uint8 kind, uint16 leaf, uint64 publication, uint64 bindingOrdinal, uint32 expectedRevision, bool withdrawn, bytes32 a, bytes32 b) = ledger.admission(ordinal);
        require(kind == kind_ && leaf == leaf_ && publication == publication_ && bindingOrdinal == bindingOrdinal_, "literal admission header");
        require(expectedRevision == 0 && !withdrawn && a == a_ && b == b_, "literal admission payload");
    }

    function _assertHead(bytes32 key, uint64 admission, uint64 bindingOrdinal, bytes32 target, string memory label) internal view {
        (uint8 state, uint32 revision, uint64 admissionOrdinal, uint64 previous, uint64 bindingOrdinalNow, bytes32 targetNow) = ledger.head(key);
        require(state == 1 && revision == 1 && admissionOrdinal == admission && previous == 0, label);
        require(bindingOrdinalNow == bindingOrdinal && targetNow == target, label);
    }

    function _assertPosition(bytes32 position, bytes32 purpose, bytes32 subject, bytes32 role, string memory label) internal view {
        (bytes32 purposeNow, bytes32 subjectNow, bytes32 roleNow) = ledger.positionCell(position);
        require(purposeNow == purpose && subjectNow == subject && roleNow == role, label);
    }

    function _assertList(bytes32 key, uint64 count, uint64 live, uint64 last, uint16 flags, uint256 word0, string memory label) internal view {
        (uint64 countNow, uint64 liveNow, uint64 lastNow, uint16 flagsNow) = lateIndex.postingHead(key);
        require(countNow == count && liveNow == live && lastNow == last && flagsNow == flags, label);
        require(lateIndex.postingWord(key, 0) == word0, label);
    }

    function _assertZeroReply(bytes memory input, uint256 words, string memory label) internal view {
        (bool ok, bytes memory output) = address(ledger).staticcall(input);
        require(ok && output.length == words * 32, label);
        for (uint256 i; i < words; ++i) {
            bytes32 word;
            assembly ("memory-safe") {
                word := mload(add(add(output, 32), mul(i, 32)))
            }
            require(word == bytes32(0), label);
        }
    }

    function _expectExact(bytes memory observed, bytes memory expected, uint256 expectedLength, string memory label) internal pure {
        require(observed.length == expectedLength, label);
        require(keccak256(observed) == keccak256(expected), label);
    }
}
