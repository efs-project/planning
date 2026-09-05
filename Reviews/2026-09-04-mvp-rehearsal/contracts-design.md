# efs-lab/1 Solidity workflow contract

Experimental ABI v1; NOT C0, SR-17, canonical EFS IDs, or permanent architecture.
One immutable owner/semantic contract plus its constructor-deployed Core-only
byte store. No upgrades, arbitrary validators, relays with authority, or public
deployment. Contract name `EfsLab`; constructor `(address owner_,bytes32 runId_)`.
The byte store is `EfsLabBytes`, available as `byteStore()`.

## Exact integration ABI (frozen for this increment)

```solidity
struct Operation {
  uint8 kind; // 1 mkdir, 2 create file, 3 revise file, 4 publish typed record
  bytes32 target; // parent for create, file for revise, root for typed record
  string name; // nonempty ASCII [A-Za-z0-9._-], max64 for create; empty otherwise
  bytes32 schemaId; // nonzero only for kind4
  bytes data; // empty mkdir; max16384 otherwise
  bytes32 salt; // nonzero create; zero revise/typed
  uint64 expectedRevision; // zero create/typed, exact current file revision otherwise
  uint64 nonce; // owner nonce or selected grant's consumed-write count
  uint64 deadline;
  bytes32 grantId; // zero owner/direct, nonzero session
}
struct Grant {
  address key;
  bytes32 scope; // existing node; target must be it or descendant (depth <=16)
  uint8 operations; // mask: 1 mkdir, 2 create file, 4 revise; no typed-data grants
  uint64 expiry;
  uint32 maxWrites;
  uint64 maxBytes;
  uint64 nonce; // unique grant nonce, never reusable
}
struct Node { uint8 kind; bytes32 parent; string name; uint64 revision; }
struct Revision { bytes32 contentId; bytes32 previous; }
struct TypedRecord { bytes32 schemaId; bytes32 contentId; }
struct Receipt {
 bytes operationBytes; bytes witness; uint8 mode; address signer;
 bytes32 resultId; uint64 revision; uint64 blockNumber; uint64 timestamp; bytes32 digest;
}
function execute(Operation calldata op, bytes calldata signature) external returns(bytes32 resultId);
function executeDirect(Operation calldata op) external returns(bytes32 resultId);
function registerGrant(Grant calldata grant,bytes calldata ownerSignature) external returns(bytes32 grantId);
function revokeGrant(bytes32 grantId) external; // owner transaction
function grantInfo(bytes32 id) external view returns(Grant memory grant,bytes memory approval,bool revoked,uint32 writes,uint64 payloadBytes);
function grantBasis(bytes32 id) external view returns(uint256 registeredAtReceipt,uint256 revokedAtReceipt,uint64 registeredBlock,uint64 revokedBlock,uint64 registeredTimestamp,uint64 revokedTimestamp);
function registerSchema(bytes calldata descriptor) external returns(bytes32 schemaId); // owner transaction
function getSchema(bytes32 id) external view returns(bytes memory);
function getNode(bytes32 id) external view returns(Node memory);
function getRevision(bytes32 file,uint64 revision) external view returns(Revision memory);
function getRecord(bytes32 id) external view returns(TypedRecord memory);
function child(bytes32 parent,string calldata name) external view returns(bytes32);
function list(bytes32 directory,uint256 cursor,uint32 limit) external view returns(bytes32[] memory ids,uint256 next,uint256 total);
function records(uint256 cursor,uint32 limit) external view returns(bytes32[] memory ids,uint256 next,uint256 total);
function schemas(uint256 cursor,uint32 limit) external view returns(bytes32[] memory ids,uint256 next,uint256 total);
function receipt(uint256 ordinal) external view returns(Receipt memory);
function receiptCount() external view returns(uint256);
function ownerNonce() external view returns(uint64);
function rootId() external view returns(bytes32);
function runId() external view returns(bytes32);
function owner() external view returns(address);
function byteStore() external view returns(address);
// byte-store ABI:
function read(bytes32 contentId) external view returns(bytes memory);
function readRange(bytes32 contentId,uint64 offset,uint32 length) external view returns(bytes memory);
function exists(bytes32 contentId) external view returns(bool);
```

Pages limit=1..64, append-only insertion order, exact total at supplied RPC block.
Missing exact getters revert, except `child` returns zero for proved local absence.
Caller MUST pin every read to one block hash/number and preserve RPC uncertainty;
these raw methods do not attest provider authenticity, finality, or completeness
across mismatched bases. Root kind1, file kind2. Initial file revision1.
Maximum node ancestry16, directory children256, schemas64, fields8, receipts4096,
unique records4096. No deletion/rename. Namespace collisions reject; file revision
CAS rejects stale expectations. All writes and payload storage are atomic.

## Independent identity and authorization formulas

All `H` are keccak256. Strings below hash their UTF-8 bytes. All outer tuples use
standard `abi.encode`, NOT packed encoding.

```
rootId = H(abi.encode(H("efs-lab/root/1"),runId,owner))
nodeId = H(abi.encode(H("efs-lab/node/1"),runId,owner,kind,target,H(bytes(name)),salt))
contentId = H(abi.encode(H("efs-lab/bytes/1"),H(data)))
schemaId = H(abi.encode(H("efs-lab/schema/1"),H(descriptor)))
recordId = H(abi.encode(H("efs-lab/record/1"),schemaId,H(data)))
revisionId = H(abi.encode(H("efs-lab/revision/1"),fileId,uint64(revision),contentId,previous))
```

`previous` is zero for revision1; otherwise prior revisionId. Receipt `resultId`
is nodeId for mkdir/create/revise and recordId for typed records. Receipt stores
exact `abi.encode(op)`; `digest` is the EIP712 operation digest, even direct mode.

Domain: `{name:"efs-lab",version:"1",chainId,verifyingContract:EfsLab}`.
Exact EIP712 type strings:

```
Operation(uint8 kind,bytes32 target,string name,bytes32 schemaId,bytes data,bytes32 salt,uint64 expectedRevision,uint64 nonce,uint64 deadline,bytes32 grantId)
Grant(address key,bytes32 scope,uint8 operations,uint64 expiry,uint32 maxWrites,uint64 maxBytes,uint64 nonce)
```

Dynamic string/bytes hash normally per EIP712. `grantId` equals Grant's full
EIP712 digest (no self-field). Owner signs that digest for registration; exact
grant/approval retained. Normal owner Operation requires grantId zero and current
ownerNonce; direct path additionally requires owner sender and no signature.
Session Operation requires matching key, grant, operation mask, target ancestry,
expiry, remaining write and aggregate payload-byte ceilings; nonce equals grant
consumed-write count. Registration nonce is globally unique and retained forever.
Signature encoding exactly65 bytes, low-s, v27/28, nonzero recovery.
Modes: 1 DIRECT_TRANSACTION, 2 EOA_EIP712, 3 SESSION_EIP712. Direct mode's empty
witness is weaker transaction-bound evidence; retrieve transaction for sender
proof. Session receipts preserve original grant scope/approval and admitted
ordinal so revocation never changes historical approval facts. Grant boundaries
record `receiptCount` at registration/revocation plus block/timestamp. Receipt n
must be >=registeredAtReceipt and, if revoked, <revokedAtReceipt. This distinguishes
same-block revocation ordering. Independent replay counts all earlier matching
grant receipts to validate nonce/write/byte consumption, not current counters.

Owner/session dispatch calls separate internal authorization helpers, avoiding
nested conditionals vulnerable to dangling-else formatter transformations.
Tests exercise least-privilege masks1/2/4 independently, not only all-operations7.

## Strict declarative typed data

Descriptor = 1..8 fields, one field tag each: 1=u64 (8-byte big-endian),
2=bool (one byte0/1), 3=bytes32, 4=ASCII text (u16 big-endian byte length then
0..256 printable ASCII bytes), 5=typed record reference (32-byte ID of an already
admitted record). Tag5 is followed in the descriptor by the exact existing
target schemaId (32 bytes); its referenced Record MUST have that exact schema.
Descriptor maximum264 bytes. Fields consume in order; truncated/trailing/noncanonical input
rejects. No JSON/coercion, arbitrary validator calls, recursion, schema mutation,
or implied semantic compatibility. Reference schemas form a creation-ordered DAG;
self/mutually recursive schemas are deliberately unsupported.

## Validation plan

Test real directory/file/revision and historical reads; namespace/CAS/expiry/
signature/replay/substitution rejections; session scope/budget/revocation; strict
typed payload rejection; bounded listing; carrier access/empty bytes/ranges;
atomic rollback after byte storage on forced receipt-cap failure. Enforce ordinary
EIP170 runtime limits and report real Foundry evidence separately from browser
wallet prompts, account/storage proofs and full C0 conformance.

## Compile-in Solidity read helper

`consumer/LabRead.sol` is an internal stateless library; no library deployment is
required. `LabReadConsumer` is a real example consumer that compiles it in.

```solidity
enum Status { FOUND, UNKNOWN, MISMATCH, UNSUPPORTED }
struct FileResult {
  Status status; bytes32 fileId; uint64 revision; bytes32 contentId; bytes32 previous;
}
function currentFile(address core,bytes32 codeHash,bytes32 runId,uint16 profile,
  bytes32 fileId) external view returns(FileResult memory);
function score(address core,bytes32 codeHash,bytes32 runId,uint16 profile,
  bytes32 recordId,bytes32 schemaId) external view returns(Status,uint64);
```

The risk-bearing consumer supplies the explicit Core address, exact deployed
runtime hash (including immutable values), runId and profile1. No default venue,
singleton or mutable resolver is consulted. `currentFile` verifies bounded exact
Node/revision ABI and returns current revision/content. `score` only supports the
exact one-u64 descriptor, checks exact schema/record/content identity and decodes
the eight retained bytes. Other valid data profiles are not implicitly cast.

Each call uses a 60,000-gas `staticcall` with zero output buffer. It checks
`returndatasize` BEFORE allocating/copying; caps are32 bytes for fixed identities,
64 for revision/typed-record pairs,96 for schema/u64 payload,256 for Node. Dynamic
offsets/lengths and expected static widths are checked before decoding. Failed,
oversized or malformed data yields UNKNOWN; mismatched pin/identity yields
MISMATCH, unknown helper profile/non-file/wrong supported shape yields UNSUPPORTED.
No helper path reports absence; a revert is never an absence proof. Static calls
within one transaction observe one EVM state, not proof of finality.

Gas exhaustion of the whole caller can still revert the caller; the stipend is
failure containment for the external dependency, not an unlimited-gas promise.
This helper handles one file head and one exact typed scalar, not arbitrary
schemas, path walks, directory scans or a permanent Solidity SDK.
