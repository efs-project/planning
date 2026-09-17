// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Keys} from "./Keys.sol";
import {IIndexModule,IIndexReadiness,IndexReadinessProfile} from "./Interfaces.sol";
import {ExecutionSlots} from "./ExecutionSlots.sol";
import {IndexSource, IIndexSource} from "./IndexSource.sol";
import {IndexFieldProfile} from "./IndexFieldProfile.sol";
import {IndexWork} from "./IndexWork.sol";
import {IndexReplaySource,IndexReplayDecoder,IReplayLedger} from "./IndexReplaySource.sol";

interface ILedgerCounts {
    function counts() external view returns (uint64 admissions, uint64 records, uint64 bindings, uint64 publications);
    function extsload(bytes32 slot) external view returns (bytes32);
}

/// @title IndexModule — the separate index responsibility (coordinator delta 3)
/// @notice DISPOSABLE LAB, NO PROTOCOL CLAIM. Owns EVERY query structure; the Ledger keeps
///         none. Called for contiguous ordered-prefix segments; a revert here reverts
///         the accepted logical action (mandatory-index rollback).
///
/// Mandatory families (maintained here, coverage reported):
///   scope     kind 10  per (author, purpose, subject): binding ordinals, one per fresh key (audit list)
///   history   kind 8   per binding key: admission ordinals of every head change (audit list)
///   backlink  kind 5   per target: admission ordinals of binds; `live` = heads still pointing there
///   by-type   kind 1   per Type: publish/reuse admissions; `live` decremented on withdraw
///   by-author kind 4   per author: publish/reuse admissions; `live` decremented on withdraw
///   by-record kind12  per Record: the same authored-occurrence unit
///   unique    kind13  per Type: retained Records, first admission once (audit)
///   reference kind11  per exact Type/leading reference ordinal/target (audit)
///   scalar/digest kinds14/15: retained Records under immutable exact-Type specs
/// Per-record occurrence count lives in the Ledger's Record row (delta 3 allows this).
/// Optional families are declared with a start admission; this lab maintains no optional data.
///
/// Inline-singleton representation v2: head word =
/// count u64 at bit 0 | live u64 at 64 | last u48 at 128 | flags u16 at 176 (1 = audit list); data words hold
/// five 48-bit ordinals each at shift 48*(index%5), materialized only on the SECOND
/// append. Public word/ordinal getters synthesize the singleton from `last`.
contract IndexModule is IIndexModule {
    uint8 public constant UNKNOWN = 0;
    uint8 public constant PARTIAL = 1;
    uint8 public constant COMPLETE = 2;
    bytes32 public constant FAMILY_SCOPE = keccak256("efs2/family/scope/1");
    bytes32 public constant FAMILY_HISTORY = keccak256("efs2/family/history/1");
    bytes32 public constant FAMILY_BACKLINK = keccak256("efs2/family/backlink/1");
    bytes32 public constant FAMILY_BY_TYPE = keccak256("efs2/family/by-type/1");
    bytes32 public constant FAMILY_BY_AUTHOR = keccak256("efs2/family/by-author/1");
    bytes32 public constant FAMILY_BY_RECORD = keccak256("efs2/family/by-record/1");
    bytes32 public constant FAMILY_UNIQUE_BY_TYPE = keccak256("efs2/family/unique-by-type/1");
    bytes32 public constant FAMILY_REFERENCE_POSITION = keccak256("efs2/family/reference-position/1");
    bytes32 public constant FAMILY_SCALAR = keccak256("efs2/family/scalar-equality/1");
    bytes32 public constant FAMILY_DIGEST = keccak256("efs2/family/content-digest/1");
    function PHYSICAL_PROFILE() public pure returns(bytes32) { return _physicalProfile(); }
    uint64 private constant GUARD = (uint64(1) << 48) - 1;

    struct Family {
        bool declared;
        bool mandatory;
        uint64 fromAdmission;
    }

    address public immutable ledger;
    address public immutable admin;
    IndexReplayDecoder public immutable replayDecoder;
    bytes32 private immutable replayDecoderCodehash;
    uint64 public immutable attachedFrom; // first admission this module could have seen
    uint64 public lastProcessed; // last admission ordinal indexed
    uint64 public lastPublication; // staged maintenance marker, NOT a final-completion receipt
    uint64 public generation; // bumped by the admin after a backfill/re-index; part of a cursor's basis
    bool public gapped; // retained legacy diagnostic; current ingress rejects gaps without advancing the frontier
    bool private _liveStarted;
    struct ShadowHead { bytes32 target; uint64 ordinal; uint32 revision; uint8 state; }
    mapping(bytes32=>ShadowHead) private _shadow;
    mapping(uint64=>bool) private _withdrawn;

    mapping(bytes32 => Family) private _family;
    mapping(bytes32 => uint256) private _postingHead;
    mapping(bytes32 => mapping(uint64 => uint256)) private _postingWord;
    bytes32[] private _required;

    event FamilyDeclared(bytes32 indexed family, bool mandatory, uint64 fromAdmission);

    error E_LEDGER();
    error E_ADMIN();
    error E_MANDATORY_FAMILY();
    error E_ORDER(bytes32 key, uint64 last, uint64 proposed);
    error E_GUARD();
    error E_SEGMENT();
    error E_RECORD();
    error E_FIELD();

    constructor(address ledger_) {
        ledger = ledger_;
        admin = msg.sender;
        replayDecoder=new IndexReplayDecoder(ledger_);
        replayDecoderCodehash=address(replayDecoder).codehash;
        (uint64 admissions,,,) = ILedgerCounts(ledger_).counts();
        attachedFrom = admissions + 1;
        _declare(FAMILY_SCOPE, true, admissions + 1);
        _declare(FAMILY_HISTORY, true, admissions + 1);
        _declare(FAMILY_BACKLINK, true, admissions + 1);
        _declare(FAMILY_BY_TYPE, true, admissions + 1);
        _declare(FAMILY_BY_AUTHOR, true, admissions + 1);
        _declare(FAMILY_BY_RECORD, true, admissions + 1);
        _declare(FAMILY_UNIQUE_BY_TYPE, true, admissions + 1);
        _declare(FAMILY_REFERENCE_POSITION, true, admissions + 1);
        _declare(FAMILY_SCALAR, true, admissions + 1);
        _declare(FAMILY_DIGEST, true, admissions + 1);
    }

    function declareOptional(bytes32 family, uint64 fromAdmission) external {
        _requireIdle();
        if (msg.sender != admin) revert E_ADMIN();
        _declare(family, false, fromAdmission);
    }

    /// A new index generation invalidates every outstanding listing cursor.
    function bumpGeneration() external {
        _requireIdle();
        if (msg.sender != admin) revert E_ADMIN();
        ++generation;
    }

    function _requireIdle() private view {
        if (ILedgerCounts(ledger).extsload(ExecutionSlots.PUBLICATION_ACTIVE) != 0) {
            revert ExecutionSlots.E_PUBLICATION_ACTIVE();
        }
    }

    function _declare(bytes32 family, bool mandatory, uint64 fromAdmission) internal {
        // Direct deployments only: base and derived constructors define the required set.
        // Runtime optional declarations cannot replace it; this is not a proxy initializer.
        if (_family[family].mandatory || (mandatory && address(this).code.length != 0)) {
            revert E_MANDATORY_FAMILY();
        }
        _family[family] = Family(true, mandatory, fromAdmission);
        if (mandatory) {
            if (_required.length >= 32) revert E_MANDATORY_FAMILY();
            _required.push(family);
        }
        emit FamilyDeclared(family, mandatory, fromAdmission);
    }

    // ---------------------------------------------------------------- maintenance
    function onAdmission(uint64 publication, Effect[] calldata effects) public virtual {
        if (msg.sender != ledger) revert E_LEDGER();
        _liveStarted = true;
        uint256 n = effects.length;
        (uint64 through,,, uint64 stagedPublication) = ILedgerCounts(ledger).counts();
        if (
            n == 0 || publication != stagedPublication || publication < lastPublication
                || effects[n - 1].admission != through
        ) revert E_SEGMENT();
        for (uint256 i; i < n; ++i) {
            Effect calldata e = effects[i];
            if (e.admission != lastProcessed + i + 1 || e.kind == 0 || e.kind > 7) revert E_SEGMENT();
            _foldEffect(e);
        }
        lastProcessed = effects[n - 1].admission;
        lastPublication = publication;
    }

    /// A fresh detached index always starts at zero. After live ingress this
    /// instance cannot backfill later detachments: deploy a new genesis replay.
    function replayNextPublication() external {
        _requireIdle();
        if(_liveStarted||IReplayLedger(ledger).indexModule()==address(this))revert E_SEGMENT();
        uint64 publication=lastPublication+1;
        IndexReplaySource.Fact[] memory facts=_replayFacts(publication);
        Effect[] memory effects=new Effect[](facts.length);
        for(uint256 i;i<facts.length;i++){
            IndexReplaySource.Fact memory f=facts[i];Effect memory e;
            e.kind=f.kind;e.admission=f.admission;e.author=f.author;e.recordId=f.recordId;e.typeId=f.typeId;
            if(f.kind==3||f.kind==4||f.kind==7){
                e.bindingKey=f.bindingKey;e.scopeKey=f.scopeKey;
                e.bindingOrdinal=f.bindingOrdinal;ShadowHead storage h=_shadow[e.bindingKey];
                if(h.revision!=f.expectedRevision||h.revision>=type(uint32).max-1)revert E_SEGMENT();
                e.freshBinding=h.ordinal==0;e.oldLive=h.state==1;e.oldTarget=h.target;
                // Allowed old-state bitsets: bind=0/1/2/3, mask=1,
                // release=1/2. Out-of-profile states cannot pass this shift.
                uint256 allowed=f.kind==3?15:f.kind==4?2:6;
                if(((allowed>>h.state)&1)==0||(!e.freshBinding&&h.ordinal!=f.bindingOrdinal))revert E_SEGMENT();
                e.target=f.kind==3?f.recordId:bytes32(0);
                h.target=e.target;h.ordinal=f.bindingOrdinal;h.revision++;h.state=f.kind==3?1:f.kind==4?2:3;
            }else if(f.kind==6){
                if(_withdrawn[f.withdrawalTarget])revert E_SEGMENT();
                _withdrawn[f.withdrawalTarget]=true;
            }
            effects[i]=e;_foldEffect(e);
        }
        _validatePublication(effects);
        lastProcessed=effects[effects.length-1].admission;
        lastPublication=publication;
    }

    function _replayFacts(uint64 publication) private view returns(IndexReplaySource.Fact[] memory){
        address decoder=address(replayDecoder);
        if(decoder.codehash!=replayDecoderCodehash)revert E_SEGMENT();
        bytes memory input=abi.encodeCall(IndexReplayDecoder.publication,(publication,lastProcessed+1));
        bytes memory output=new bytes(20_544);bool ok;uint256 size;
        assembly("memory-safe"){
            ok:=staticcall(gas(),decoder,add(input,32),mload(input),add(output,32),20544)
            size:=returndatasize()
        }
        if(!ok||size<384||size>20_544)revert E_SEGMENT();
        uint256 offset;uint256 n;
        assembly("memory-safe"){offset:=mload(add(output,32)) n:=mload(add(output,64)) mstore(output,size)}
        // Exact size384..20544 and checked size==64+n*320 imply1<=n<=64.
        if(offset!=32||size!=64+n*320)revert E_SEGMENT();
        return abi.decode(output,(IndexReplaySource.Fact[]));
    }

    function provenFrom() public view returns(uint64){return gapped?0:1;}

    function _physicalProfile() internal pure virtual returns(bytes32) { return IndexReadinessProfile.PHYSICAL; }

    function replayReadiness() external view returns(IIndexReadiness.Ready memory r){
        (uint64 a,,,uint64 p)=ILedgerCounts(ledger).counts();
        bool active=ILedgerCounts(ledger).extsload(ExecutionSlots.PUBLICATION_ACTIVE)!=0;
        bytes32 manifest=manifestHash();
        r=IIndexReadiness.Ready(ledger,_physicalProfile(),IndexReadinessProfile.CALLBACK,manifest,
            gapped?bytes32(0):manifest,provenFrom(),lastProcessed,lastPublication,generation,
            active?2:(!gapped&&lastProcessed==a&&lastPublication==p?1:0));
    }

    /// The same ordered memory-effect fold is the only family implementation for
    /// live maintenance and a later canonical replay driver. No public effect injection.
    function _foldEffect(Effect memory e) internal virtual {
        if (e.kind == 1 || e.kind == 2) {
            _append(Keys.byTypeList(e.typeId), e.admission, false);
            _append(Keys.byAuthorList(e.author), e.admission, false);
            _append(Keys.byRecordList(e.recordId), e.admission, false);
            _retain(e);
        } else if (e.kind == 3) {
            if (e.freshBinding) _append(Keys.scopeList(e.scopeKey), e.bindingOrdinal, true);
            if (e.oldLive) _release(Keys.backlinkList(e.oldTarget));
            _append(Keys.backlinkList(e.target), e.admission, false);
            _append(Keys.historyList(e.bindingKey), e.admission, true);
        } else if (e.kind == 4 || e.kind == 7) {
            if (e.oldLive) _release(Keys.backlinkList(e.oldTarget));
            _append(Keys.historyList(e.bindingKey), e.admission, true);
        } else if (e.kind == 6) {
            _release(Keys.byTypeList(e.typeId));
            _release(Keys.byAuthorList(e.author));
            _release(Keys.byRecordList(e.recordId));
        }
        // kind 5 (create) maintains no list in this lab
    }

    function _retain(Effect memory e) private {
        (bytes32 t, uint64 first, uint32 size) = IndexSource.header(ledger, e.recordId);
        if (t != e.typeId || first == 0 || first > e.admission || size > 8192) revert E_RECORD();
        if (first != e.admission) return;
        _append(Keys.uniqueByTypeList(t), first, true);
        (bool registered,,,,, uint8 count,) = IIndexSource(ledger).registry().typeInfo(t);
        if (!registered || count > 8 || size < uint256(count) * 32) revert E_RECORD();
        for (uint8 i; i < count; i++) {
            _append(Keys.referenceList(t, i, IndexSource.word(ledger, e.recordId, i)), first, true);
        }
        _retainFields(e.recordId, t, first, size);
    }

    /// Default has no scalar/digest declarations. A derived profile may return
    /// only a constructor-pinned helper; never a runtime administrator setting.
    function fieldProfile() public view virtual returns (IndexFieldProfile) {
        return IndexFieldProfile(address(0));
    }

    function _retainFields(bytes32 id, bytes32 t, uint64 first, uint32 size) private {
        IndexFieldProfile profile = fieldProfile();
        if (address(profile) == address(0)) return;
        IndexFieldProfile.Spec memory s = profile.spec(t);
        for (uint8 i; i < s.scalars.length; i++) {
            IndexFieldProfile.Scalar memory scalar = s.scalars[i];
            if (uint256(scalar.word) * 32 + 32 > size) revert E_FIELD();
            _append(Keys.scalarList(t, i, scalar.kind, IndexSource.word(ledger, id, scalar.word)), first, true);
        }
        if (s.digest.enabled) {
            if (
                uint256(s.digest.word) * 32 + 32 > size || uint256(s.digest.algorithmWord) * 32 + 32 > size
                    || IndexSource.word(ledger, id, s.digest.algorithmWord) != s.digest.algorithm
            ) revert E_FIELD();
            _append(Keys.digestList(s.digest.algorithm, IndexSource.word(ledger, id, s.digest.word)), first, true);
        }
    }

    /// Unit: 1 authored occurrence, 2 retained unique Record, 3 distinct binding
    /// coordinate, 4 retained head change, 5 historical bind. Live: 1 not-withdrawn
    /// occurrences, 2 count (audit), 3 current heads. Recipes use abi.encode and
    /// Keys.DOM_POSTING; the field profile enumerates exact extraction offsets.
    struct ManifestEntry {
        bytes32 family;
        uint8 kind;
        uint8 unit;
        uint8 live;
        bytes32 recipe;
        bool required;
    }

    function manifestCount() external view returns (uint256) {
        return _required.length;
    }

    function manifestEntry(uint256 i) public view returns (ManifestEntry memory m) {
        bytes32 f = _required[i];
        m.family = f;
        m.required = true;
        if (f == FAMILY_BY_TYPE) {
            m = ManifestEntry(f, 1, 1, 1, keccak256("T,1,0,0"), true);
        } else if (f == FAMILY_BY_AUTHOR) {
            m = ManifestEntry(f, 4, 1, 1, keccak256("0,4,0,Principal"), true);
        } else if (f == FAMILY_BY_RECORD) {
            m = ManifestEntry(f, 12, 1, 1, keccak256("0,12,0,Record"), true);
        } else if (f == FAMILY_UNIQUE_BY_TYPE) {
            m = ManifestEntry(f, 13, 2, 2, keccak256("T,13,0,0"), true);
        } else if (f == FAMILY_REFERENCE_POSITION) {
            m = ManifestEntry(f, 11, 2, 2, keccak256("T,11,checked-ref-ordinal,target"), true);
        } else if (f == FAMILY_SCALAR) {
            m = ManifestEntry(
                f, 14, 2, 2, keccak256("T,14,spec-ordinal,keccak(abi.encode(uint8(kind),bytes32(value)))"), true
            );
        } else if (f == FAMILY_DIGEST) {
            m = ManifestEntry(
                f,
                15,
                2,
                2,
                keccak256(
                    "0,15,0,keccak(abi.encode(bytes32(algorithm),bytes32(digest))):finite-declared-Type-universe"
                ),
                true
            );
        } else if (f == FAMILY_SCOPE) {
            m = ManifestEntry(f, 10, 3, 2, keccak256("0,10,0,scope"), true);
        } else if (f == FAMILY_HISTORY) {
            m = ManifestEntry(f, 8, 4, 2, keccak256("0,8,0,binding"), true);
        } else if (f == FAMILY_BACKLINK) {
            m = ManifestEntry(f, 5, 5, 3, keccak256("0,5,0,target"), true);
        } else {
            m = _extensionEntry(f);
        }
    }

    function _extensionEntry(bytes32) internal view virtual returns (ManifestEntry memory) {
        // Extension semantics are defined by the derived implementation and must
        // override this entry. Unknown required families cannot silently qualify.
        revert E_MANDATORY_FAMILY();
    }

    function _manifestExtension() internal view virtual returns (bytes32) {
        return 0;
    }

    /// Fixed14-word semantic header preimage: version, key domain, ordinal guard,
    /// body/ref/Type/scalar/digest/action/family bounds, prefix/final selectors,
    /// work model and exact extension identity. No progress or physical layout.
    function manifestHeader() public view returns (bytes memory) {
        return abi.encode(
            keccak256("efs.lab.index-manifest/1:posting-abi:all-registered-types:retained-first-admission"),
            Keys.DOM_POSTING,
            GUARD,
            uint16(8192),
            uint8(8),
            uint8(16),
            uint8(4),
            uint8(1),
            uint8(64),
            uint8(32),
            IIndexModule.onAdmission.selector,
            IIndexModule.afterPublication.selector,
            IndexWork.PROFILE,
            _manifestExtension()
        );
    }

    function manifestHash() public view returns (bytes32 h) {
        h = keccak256(manifestHeader());
        for (uint256 i; i < _required.length; i++) {
            h = keccak256(abi.encode(h, manifestEntry(i)));
        }
        IndexFieldProfile p = fieldProfile();
        h = keccak256(abi.encode(h, address(p) == address(0) ? bytes32(0) : p.dataHash()));
    }

    /// No state writes: final obligations may inspect the complete proposed publication.
    /// Outside this transaction success is committed; within it, consult the Core lock
    /// before interpreting evidence/lastPublication as completion. Coverage is prefix-only.
    function afterPublication(uint64 publication, Effect[] calldata effects) public view virtual returns (bytes4) {
        if (msg.sender != ledger) revert E_LEDGER();
        (uint64 through,,, uint64 stagedPublication) = ILedgerCounts(ledger).counts();
        uint256 n = effects.length;
        if (
            n == 0 || publication != stagedPublication || publication != lastPublication || through != lastProcessed
                || effects[n - 1].admission != through
        ) revert E_SEGMENT();
        for (uint256 i = 1; i < n; ++i) {
            if (effects[i].admission != effects[i - 1].admission + 1) revert E_SEGMENT();
        }
        _validatePublication(effects);
        return IIndexModule.afterPublication.selector;
    }

    /// Shared final checks use the complete publication's terminal admission,
    /// whether entered through live callbacks or canonical historical replay.
    function _validatePublication(Effect[] memory) internal view virtual {}

    // ---------------------------------------------------------------- coverage
    /// COMPLETE only if the mandatory family has a proven genesis prefix through
    /// current admission, from shared live folds or canonical replay with final
    /// checks. A detach without catch-up is PARTIAL; undeclared families are UNKNOWN.
    /// A nonzero scope on Type
    /// families is an exact registered Type, not an unbounded future universe.
    /// Scalar/digest coverage covers that Type's enumerated specs ONLY; a query
    /// must match its kind/ordinal/algorithm against the immutable profile first.
    function coverage(bytes32 family, bytes32 scope)
        public
        view
        returns (uint8 status, uint64 fromAdmission, uint64 throughAdmission)
    {
        Family storage f = _family[family];
        if (!f.declared) return (UNKNOWN, 0, 0);
        if (
            scope != 0
                && (family == FAMILY_BY_TYPE
                    || family == FAMILY_UNIQUE_BY_TYPE
                    || family == FAMILY_REFERENCE_POSITION
                    || family == FAMILY_SCALAR
                    || family == FAMILY_DIGEST)
        ) {
            (bool registered,,,,,,) = IIndexSource(ledger).registry().typeInfo(scope);
            if (!registered) return (UNKNOWN, 0, 0);
        }
        if (family == FAMILY_SCALAR || family == FAMILY_DIGEST) {
            IndexFieldProfile p = fieldProfile();
            if (address(p) == address(0)) return (UNKNOWN, 0, 0);
            if (family == FAMILY_DIGEST && scope == 0) {
                if (!p.declaresDigest(0)) return (UNKNOWN, 0, 0);
            } else {
                IndexFieldProfile.Spec memory s = p.spec(scope);
                if (family == FAMILY_SCALAR ? s.scalars.length == 0 : !s.digest.enabled) return (UNKNOWN, 0, 0);
            }
        }
        (uint64 admissions,,,) = ILedgerCounts(ledger).counts();
        fromAdmission = f.mandatory ? provenFrom() : f.fromAdmission;
        throughAdmission = lastProcessed;
        bool upToDate = lastProcessed == admissions && !gapped;
        status = (f.mandatory && fromAdmission == 1 && upToDate) ? COMPLETE : PARTIAL;
    }

    function scalarCoverage(bytes32 t, uint8 ordinal, uint8 kind) external view returns (uint8, uint64, uint64) {
        IndexFieldProfile p = fieldProfile();
        if (address(p) == address(0)) return (UNKNOWN, 0, 0);
        IndexFieldProfile.Spec memory s = p.spec(t);
        if (ordinal >= s.scalars.length || s.scalars[ordinal].kind != kind) return (UNKNOWN, 0, 0);
        return coverage(FAMILY_SCALAR, t);
    }

    /// t==0 qualifies the global posting against the finite manifest universe;
    /// nonzero t checks an exact declared spec, NOT an O(1) Type-filtered count.
    function digestCoverage(bytes32 t, bytes32 algorithm) external view returns (uint8, uint64, uint64) {
        IndexFieldProfile p = fieldProfile();
        if (address(p) == address(0) || algorithm == 0) return (UNKNOWN, 0, 0);
        if (t == 0) {
            if (!p.declaresDigest(algorithm)) return (UNKNOWN, 0, 0);
        } else {
            IndexFieldProfile.Spec memory s = p.spec(t);
            if (!s.digest.enabled || s.digest.algorithm != algorithm) return (UNKNOWN, 0, 0);
        }
        return coverage(FAMILY_DIGEST, t);
    }


    // ---------------------------------------------------------------- reads
    function postingHead(bytes32 key) external view returns (uint64 count, uint64 live, uint64 last, uint16 flags) {
        uint256 hw = _postingHead[key];
        return (uint64(hw), uint64(hw >> 64), uint64((hw >> 128) & GUARD), uint16(hw >> 176));
    }

    function postingWord(bytes32 key, uint64 index) external view returns (uint256) {
        uint256 hw = _postingHead[key];
        if (uint64(hw) == 1) return index == 0 ? (hw >> 128) & GUARD : 0;
        return _postingWord[key][index];
    }

    function postingAt(bytes32 key, uint64 index) external view returns (uint64) {
        uint256 hw = _postingHead[key];
        uint64 count = uint64(hw);
        if (index >= count) return 0;
        if (count == 1) return uint64((hw >> 128) & GUARD);
        return uint64((_postingWord[key][index / 5] >> (48 * (index % 5))) & GUARD);
    }

    // ---------------------------------------------------------------- packed lists
    function _append(bytes32 key, uint64 ordinal, bool audit) internal {
        uint256 hw = _postingHead[key];
        uint64 count = uint64(hw);
        uint64 live = uint64(hw >> 64);
        uint64 last = uint64((hw >> 128) & GUARD);
        if (ordinal <= last) revert E_ORDER(key, last, ordinal);
        if (ordinal >= GUARD || count >= GUARD - 1) revert E_GUARD();
        if (count == 1) _postingWord[key][0] = uint256(last) | (uint256(ordinal) << 48);
        else if (count > 1) _postingWord[key][count / 5] |= uint256(ordinal) << (48 * (count % 5));
        _postingHead[key] = uint256(count + 1) | (uint256(live + 1) << 64) | (uint256(ordinal) << 128)
            | (audit ? (uint256(1) << 176) : 0);
    }

    /// One fewer live entry. A list this module never saw (attached late) is left at zero:
    /// that family is already reported PARTIAL, never COMPLETE.
    function _release(bytes32 key) private {
        uint256 hw = _postingHead[key];
        uint64 live = uint64(hw >> 64);
        if (live == 0) return;
        _postingHead[key] = (hw & ~(uint256(type(uint64).max) << 64)) | (uint256(live - 1) << 64);
    }
}
