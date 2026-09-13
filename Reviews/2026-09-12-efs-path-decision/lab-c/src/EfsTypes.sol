// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/*
 * Disposable Road C lab. Shared constants, structs, interfaces and id formulas.
 * Nothing here is an EFS protocol byte. Shapes follow road-b §8 plus the
 * coordinator's four pre-seal checks (origin-qualified principals, digest
 * discriminator, Evidence realm/code retention + import, seven-field cursor)
 * so both arms price the same authorship closure.
 */

// ---- action / proof / digest / principal kinds ------------------------------
uint8 constant KIND_DECLARE_TYPE = 1;
uint8 constant KIND_RECORD = 2;
uint8 constant KIND_SUBJECT = 3;
uint8 constant KIND_BIND = 4;
uint8 constant KIND_IMPORT = 5; // only valid as the single action of a destination authorization

uint8 constant DIGEST_BODY_HASH = 1; // Action.digest = keccak256(body); recordId derived = keccak(typeId, digest)
uint8 constant DIGEST_RECORD_ID = 2; // Action.digest = existing recordId (reuse); typeId must match the record
uint8 constant DIGEST_PACKET = 3; // KIND_IMPORT: Action.digest = packetCommitment

uint8 constant PROOF_NATIVE = 1; // author = origin-qualified contract principal of msg.sender; no signature bytes
uint8 constant PROOF_EOA_SIG = 2; // author = EOA principal recovered from the EIP-712 PublicationIntent signature

uint8 constant PRINCIPAL_EOA = 1; // realmOrigin = 0 (chain-independent)
uint8 constant PRINCIPAL_CONTRACT = 2; // realmOrigin = keccak(chainId, coreCodeCommitment)

// Source-evidence grade of an Evidence cell. Grade zero = no verified source witness (native admissions at
// their own Realm). Coordinator handoff: a native (grade-zero) SOURCE can never authorise writes as that
// principal at a destination; this probe REJECTS such imports (`UnsupportedSourceProof`) — no attributed
// cell is minted either — until a chain-state witness profile exists.
uint8 constant GRADE_UNVERIFIED = 0;
uint8 constant GRADE_SIGNATURE_VERIFIED = 1; // imported EOA evidence re-verified at the destination

// ---- domain tags -------------------------------------------------------------
bytes32 constant TAG_SUBJECT = keccak256("efs2/subject/1");
bytes32 constant TAG_REALM = keccak256("efs2/realm/1");
bytes32 constant TAG_ORIGIN = keccak256("efs2/origin/1");
bytes32 constant TYPE_META = keccak256("efs2/lab-c/type-meta/2");
bytes32 constant ACCEPTANCE_PROFILE_V2 = keccak256("efs2/lab-c/acceptance/2");
bytes32 constant INDEX_OBLIGATIONS_V1 = keccak256("efs2/lab-c/index-obligations/1");
bytes32 constant PURPOSE_FOLDER = keccak256("efs2/lab-c/purpose/folder");
bytes32 constant PURPOSE_HEAD = keccak256("efs2/lab-c/purpose/head");
bytes32 constant PURPOSE_TAG = keccak256("efs2/lab-c/purpose/tag");
bytes32 constant COUNTER_ADMISSIONS = keccak256("efs2/lab-c/counter/admissions");
bytes32 constant TAG_ASSERT = bytes32(uint256(1));
bytes4 constant ACCEPT_MAGIC = bytes4(keccak256("efs2/lab-c/accept-magic"));

// EIP-712. The domain deliberately carries no chainId/verifyingContract: realmId and
// coreCodeCommitment are inside the signed struct, which keeps the digest reconstructible
// from a destination Realm that holds only the retained Evidence cell.
bytes32 constant EIP712_DOMAIN_TYPEHASH = keccak256("EIP712Domain(string name,string version)");
bytes32 constant INTENT_TYPEHASH =
  keccak256(
    "PublicationIntent(bytes32 realmId,bytes32 coreCodeCommitment,bytes32 author,uint64 nonce,uint64 deadline,bytes32 acceptanceProfile,bytes32 indexObligations,bytes32 actionsHash)"
  );

// ---- structs -----------------------------------------------------------------

/// One action of a publication. The full tuple is inside the signed actionsHash.
///  kind=DECLARE_TYPE: typeId=TYPE_META, digestKind=BODY_HASH,
///                     digest=keccak(abi.encode(bytes32 shape, bytes32[] refTypes, bytes32 mandatoryRuleId)),
///                     target=bytes32(uint160(acceptor)); its runtime codehash must equal mandatoryRuleId.
///                     The local address is not Type identity; the mandatory rule commitment is. Other fields 0.
///  kind=RECORD:       typeId; digestKind=BODY_HASH (digest=keccak(body)) or RECORD_ID (digest=existing recordId);
///                     body=abi.encode(bytes32[] refs, bytes payload); other fields 0.
///  kind=SUBJECT:      subject = keccak(TAG_SUBJECT, author principal, salt); other fields 0.
///  kind=BIND:         purpose ∈ {FOLDER, HEAD, TAG}; (subject, role, target, expectedRevision) per purpose:
///                     FOLDER: subject=folderId, role=nameHash, target=subjectId or 0 (whiteout)
///                     HEAD:   subject=subjectId, role=0,       target=recordId  or 0 (unset)
///                     TAG:    subject=subjectId|recordId, role=concept, target=TAG_ASSERT or 0 (retract)
///  kind=IMPORT:       digestKind=PACKET, digest=packetCommitment; other fields 0 (destination authorization only).
struct Action {
  uint8 kind;
  bytes32 typeId;
  uint8 digestKind;
  bytes32 digest;
  bytes32 purpose;
  bytes32 subject;
  bytes32 role;
  bytes32 target;
  uint32 expectedRevision;
  bytes32 salt;
}

struct Intent {
  bytes32 author; // PrincipalId (full bytes32)
  uint64 nonce;
  uint64 deadline; // 0 = none
  bytes32 acceptanceProfile;
  bytes32 indexObligations;
  Action[] actions;
}

struct Sig {
  uint8 v;
  bytes32 r;
  bytes32 s;
}

/// Source-Realm evidence carried by an import packet (mirrors the Evidence cell minus derived fields).
struct SourceEvidence {
  bytes32 realmId;
  bytes32 coreCodeCommitment;
  bytes32 author;
  uint8 proofKind;
  uint8 v;
  bytes32 r;
  bytes32 s;
  uint64 nonce;
  uint64 deadline;
  bytes32 acceptanceProfile;
  bytes32 indexObligations;
  uint64 firstAdmission; // source ordinal (informational; not re-derived at the destination)
  uint16 leafCount;
  uint64 basis; // source acceptance basis (informational)
}

struct ImportPacket {
  SourceEvidence source;
  Action[] actions;
  bytes[] bodies;
}

/// What the Ledger hands the IndexModule for one admitted action (same tx).
struct Effect {
  bytes32 author;
  uint8 kind;
  bytes32 typeId;
  bytes32 recordId; // RECORD/DECLARE_TYPE: record id (typeId for a Type); SUBJECT: subjectId; BIND/IMPORT: 0
  bool fresh; // RECORD/DECLARE_TYPE: true if the Record row was created by this action
  bytes32 purpose;
  bytes32 subject;
  bytes32 role;
  bytes32 target;
  bytes32 bindingKey;
  uint32 revision;
  uint64 admission;
  bytes32[] refs; // RECORD: typed reference targets in declared role order
}

// ---- interfaces --------------------------------------------------------------

/// View-only developer acceptance. Must return ACCEPT_MAGIC; any revert or other value rejects the whole publication.
interface IAcceptor {
  function accept(
    bytes32 typeId,
    bytes32 recordId,
    bytes32[] calldata refs,
    bytes calldata payload
  ) external view returns (bytes4);
}

interface IIndexModule {
  function onPublication(bytes32 publicationId, uint64 firstAdmission, Effect[] calldata effects) external;

  function obligationsId() external view returns (bytes32);

  function generation() external view returns (uint32);

  function ledger() external view returns (address);
}

interface ILedgerView {
  function highWater() external view returns (uint64);

  function rulesEpoch() external view returns (uint32);

  function coreCodeCommitment() external view returns (bytes32);

  function index() external view returns (address);
}

/// Inputs of the EIP-712 digest, passed as one memory struct so no function needs nine live stack slots
/// (the vendored Store's non-memory-safe assembly disables via-IR's stack-to-memory mover).
struct DigestInput {
  bytes32 realmId;
  bytes32 coreCodeCommitment;
  bytes32 author;
  uint64 nonce;
  uint64 deadline;
  bytes32 acceptanceProfile;
  bytes32 indexObligations;
  bytes32 actionsHash;
}

// ---- id formulas -------------------------------------------------------------
library EfsIds {
  function recordId(bytes32 typeId, bytes32 bodyHash) internal pure returns (bytes32) {
    return keccak256(abi.encode(typeId, bodyHash));
  }

  /// subjectId = keccak("efs2/subject/1", principalId, creatorSalt)
  function subjectId(bytes32 creatorPrincipal, bytes32 creatorSalt) internal pure returns (bytes32) {
    return keccak256(abi.encode(TAG_SUBJECT, creatorPrincipal, creatorSalt));
  }

  function bindingKey(bytes32 author, bytes32 purpose, bytes32 subject, bytes32 role) internal pure returns (bytes32) {
    return keccak256(abi.encode(author, purpose, subject, role));
  }

  function scopeKey(bytes32 purpose, bytes32 scope) internal pure returns (bytes32) {
    return keccak256(abi.encode(purpose, scope));
  }

  /// principal = (kind, realmOrigin, address)
  function principalId(uint8 kind, bytes32 realmOrigin, address account) internal pure returns (bytes32) {
    return keccak256(abi.encode(kind, realmOrigin, account));
  }

  /// Deployment-bound identity (coordinator handoff): native identity is qualified by the ORIGINAL CHAIN +
  /// LEDGER DEPLOYMENT + account, never by code hash alone. Two Ledger deployments on one chain are two
  /// Realms with two origins BY DESIGN; a verified import keeps the original principal; the code hash is
  /// recorded in the Evidence cell as execution evidence only.
  /// realmOrigin = keccak("efs2/origin/1", chainId, ledgerAddress) for contracts; zero for EOAs.
  function realmOrigin(uint256 chainId, address ledger) internal pure returns (bytes32) {
    return keccak256(abi.encode(TAG_ORIGIN, chainId, ledger));
  }

  function eoaPrincipal(address account) internal pure returns (bytes32) {
    return principalId(PRINCIPAL_EOA, bytes32(0), account);
  }

  function contractPrincipal(bytes32 origin, address account) internal pure returns (bytes32) {
    return principalId(PRINCIPAL_CONTRACT, origin, account);
  }

  function publicationId(bytes32 author, uint64 nonce, bytes32 actionsHash) internal pure returns (bytes32) {
    return keccak256(abi.encode(author, nonce, actionsHash));
  }

  /// EIP-712 digest of a PublicationIntent; pure so a destination can recompute a source digest from the
  /// retained cell alone. Replay is bound to the source CHAIN + LEDGER DEPLOYMENT (realmId) as well as the
  /// code (coreCodeCommitment) and rule context (acceptanceProfile, indexObligations) — coordinator handoff.
  function intentDigest(DigestInput memory d) internal pure returns (bytes32) {
    bytes32 domain = keccak256(abi.encode(EIP712_DOMAIN_TYPEHASH, keccak256("EFS Lab C"), keccak256("1")));
    bytes32 structHash = keccak256(
      abi.encode(
        INTENT_TYPEHASH,
        d.realmId,
        d.coreCodeCommitment,
        d.author,
        d.nonce,
        d.deadline,
        d.acceptanceProfile,
        d.indexObligations,
        d.actionsHash
      )
    );
    return keccak256(abi.encodePacked("\x19\x01", domain, structHash));
  }
}
