# Standalone acceptance ABI v1 (disposable)

This is the task-1 integration contract; not the C0 ABI. Solidity 0.8.30,
Cancun, optimizer 200, via IR. No production deployment or protocol approval.

## Types and identities

`AcceptanceTypes.sol` defines these structs in library `AT`:

```solidity
struct Rule { bytes32 codeHash; bytes32 semanticConfig; uint8 mode; uint32 gasLimit; }
struct Item { bytes32 typeId; bytes32 activationId; bytes body; uint256 value; }
struct Plan { address author; address executor; uint256 nonce; uint256 deadline; Item[] items; }
struct TypeInfo { bool exists; bytes32 descriptor; bytes kinds; bytes32 ruleId; Rule rule; }
struct Activation { bool exists; bytes32 typeId; address hook; bytes32 localConfig; }
struct Receipt {
  bool accepted; address author; bytes32 typeId; bytes32 bodyHash;
  bytes32 ruleId; bytes32 activationId; bytes32 basis; bytes32 planId;
  uint256 index; uint256 blockNumber; uint256 chainId; address core; address submitter;
}
struct Context {
  address author; address submitter; bytes32 typeId; bytes32 bodyHash;
  bytes32 activationId; bytes32 planId; uint256 index;
}
```

Kinds are bytes: `0=uint256,1=address,2=bytes32,3=bool`; max 8 words.
Bodies are concatenated canonical ABI words (exact length; address upper bits
zero; bool 0/1). No dynamic/nested fields. Max 8 items per plan.
Descriptor is a developer-supplied `bytes32` semantic descriptor commitment.
All following hashes use `keccak256(abi.encode(...))`, except where stated.
Domain labels are the keccak256 of the exact quoted UTF-8 strings:

- shapeId = hash(label `efs.acceptance.shape.v1`, kinds)
- no-rule RuleId = zero; Rule must be entirely zero.
- ruled RuleId = hash(label `efs.acceptance.rule.v1`, codeHash, semanticConfig, mode, gasLimit)
- typeId = hash(label `efs.acceptance.type.v1`, descriptor, shapeId, ruleId)
- activationId = hash(label `efs.acceptance.activation.v1`, chainId, core, typeId, hook, codeHash, localConfig, mode, gasLimit)
- receiptId = hash(label `efs.acceptance.receipt.v1`, planId, itemIndex)
- bodyHash = keccak256(body).

Mode 1 STATICCALL, mode 2 CALL. Gas limit 25,000..500,000. No-rule item
activationId/value must be zero. Ruled items pin an exact activation, never a
default/first activation. Anyone can register an exact Type or additional
content-addressed activation; neither grants author authority or a write bypass.

## Methods

```solidity
registerType(bytes32 descriptor, bytes kinds, AT.Rule rule) returns (bytes32);
activate(bytes32 typeId, address hook, bytes32 localConfig) returns (bytes32);
execute(AT.Plan plan, bytes signature) payable returns (bytes32[] receiptIds);
hashPlan(AT.Plan plan) view returns (bytes32); // EIP-712 signing digest and planId
receiptId(bytes32 planId, uint256 index) pure returns (bytes32);
getType(bytes32 typeId) view returns (AT.TypeInfo);
getActivation(bytes32 activationId) view returns (AT.Activation);
getReceipt(bytes32 receiptId) view returns (AT.Receipt);
getBody(bytes32 receiptId) view returns (bytes);
nonces(address author) view returns (uint256);
retainRaw(bytes32 target) returns (bytes32); // explicitly unaccepted, separate map
rawAuthor(bytes32 rawId) view returns (address);
```

EIP-712 domain `EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)`;
name `EFS Acceptance Lab`, version `1`. Item type string
`Item(bytes32 typeId,bytes32 activationId,bytes32 bodyHash,uint256 value)`.
Plan type string
`Plan(address author,address executor,uint256 nonce,uint256 deadline,bytes32 itemsHash)`.
Each item hash is hash(Item typehash,typeId,activationId,keccak256(body),value).
itemsHash is keccak256 of packed ordered bytes32 item hashes.
Plan struct hash is hash(Plan typehash,author,executor,nonce,deadline,itemsHash).
Digest = keccak256(0x1901 || domainSeparator || planStructHash).
Empty signature requires msg.sender=author. Nonempty signature is canonical
65-byte ECDSA (low-s,v 27/28) recovering author. executor zero permits any
submitter; otherwise msg.sender must equal executor, on direct and relay paths.
The nonce is sequential per author. Auth and executor checks precede retained
retry lookup; an authenticated exact retry returns original receipt IDs with
zero value, even after deadline; no new acceptance. New plans must be unexpired
and match current nonce. Exact total funding only, no refunds/credit balance.

## Hook and activation binding

```solidity
binding() view returns (address core, bytes32 semanticConfig, bytes32 localConfig);
accept(AT.Context context, bytes body) [payable] returns (bytes32 magic, bytes32 basis);
```

Expected magic is keccak256(`efs.acceptance.ok.v1`). Exact 64-byte hook return;
bounded copied returndata. binding() exact 96 bytes, bounded STATICCALL.
Core compares actual EXTCODEHASH with Rule.codeHash and binding.core to itself,
binding.semanticConfig to the Rule and binding.localConfig to activation, both
at activation and acceptance. Runtime bytes are constructor-independent in the
supplied hooks; constructor-set storage has no mutation entrypoint for bindings.
No proxy/delegatecall rule is supplied or claimed safe. A self-reported binding
does not prove arbitrary storage semantics: choosing trusted codeHash and local
activation remains an explicit consumer/deployer responsibility.

Complete structure/value preflight precedes hooks. Hooks run in signed order,
seeing prior staged receipts and ordinary EVM effects. Own receipt is written
only after hook success. Receipt basis is the hook-returned application state
commitment, not an independently validated oracle. Any later failure reverts
all Core/app writes/value. Core mutations (registration, activation, execute,
raw retention) share one lock; getters deliberately remain callable by hooks.
Historical reads never invoke hooks. No migration/upgrade/admin accept API.
Receipt submitter retains the original transaction sender (also payer); an
exact retry through another allowed relay does not rewrite it. Chain/Core can
also be inferred from Context.planId's authenticated signing domain.

Bounded errors: `InvalidItem(uint256 index)` for structural/activation/value-mode
preflight, `IncorrectFunding(uint256 expected,uint256 actual)` for total value,
`HookRefused(uint256 index)` for hook false/revert/return-size/gas rejection.
`Refused()` covers auth/nonce/expiry/retry/registration/binding/lock rejection.
No untrusted revert data or diagnostic text is copied into the failure ABI.

## Application constructor ABI

`OutfitRule(address core)` checks `(uint256 species,uint256 shirt,uint256 pants)`; species
1 plus shirt 2 is incompatible, as are shirt 2 plus pants 3. Semantic config = keccak256(`outfit.compatibility.v1`),
local config = hash(core). `EquipRule(address core,address admin,bytes32 outfitType)`
checks `(bytes32 outfitReceipt)` for an accepted exact Outfit authored by the
new action author. Semantic config = hash(keccak256(`equip.current.v1`),outfitType);
Zero outfitReceipt explicitly means the immediately preceding signed plan item;
index zero refuses. The rule resolves that staged receipt using context planId
and index-1, checks exact Type/author, and returns basis = hash(policyVersion,
resolvedOutfitReceipt). This is application policy, not generic forward references.
local config = hash(core,admin). Admin `setAllowed(bool)` increments policyVersion;
new actions must be allowed, while `grandfathered(bytes32 equipReceipt)` checks
historical accepted Equip under this activation hook, never reruns eligibility.
Grandfathering preserves prior actions, not a full current-selection/lifecycle engine.
OutfitRule also accepts a 4-word structurally checked Outfit V2: the same first
three compatibility fields plus a structural-only fourth badge uint256. V2
keeps the mandatory rule, has a distinct exact Type, and is not automatically
eligible under an EquipRule pinned to V1.
`PaidClaimRule(address core,address treasury,uint256 fee)` checks `(bytes32 claimKey)`;
semantic config = hash(keccak256(`paid.unique.v1`),fee), local config = hash(core,treasury).
One global use per claimKey per hook, exact fee transferred to treasury, counter
incremented; only bound Core may invoke accept. Getter `used(bytes32)` and `count()`.
Uniqueness is explicitly per executor deployment. Activations pointing to the
same hook share its state; different hook deployments/chains do not. No claim
of cross-activation universal uniqueness. Ordinary CALL effects are same-chain
transaction effects only. Forced ETH at Core is not a funding credit, cannot be
spent by execute, and has no recovery API in this disposable arm.
