// Disposable producer. The cold reader imports none of this module.
import { readFileSync } from 'node:fs';
import { AbiCoder, Wallet, keccak256, toUtf8Bytes, concat, toBeHex, ZeroHash } from '../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
import { encodeGroup, derive } from '../2026-09-05-mvp-build-start/type-inputs/encoder.mjs';
export const abi = AbiCoder.defaultAbiCoder();
export const domain = text => keccak256(toUtf8Bytes(text));
export const HEADER = 'tuple(uint16 profile,bytes32 principalId,bytes32 authorityRef,uint64 authEpoch,bytes32 pubNonce,uint64 notAfter)';
export const EFFECTS = 'tuple(bytes32 realmId,address core,bytes32 routeConfigId,bytes32 genesisReceiptHash,uint8 operationKind,bytes32 envelopeId,uint64 leafMask,bytes32 expectedRevisionsHash,address stateByteStore,bytes32 byteCommitment)';
export const PLAN = 'tuple(bytes32 c0ProfileId,bytes32 publicationDigest,bytes32 realmId,bytes32 realmEffectsDigest,address executor,bytes32 executorCodeHash,uint192 nonceKey,uint64 nonceSeq,uint64 notAfter)';
const PUBLICATION_STRING = 'PublicationEnvelope(uint16 profile,bytes32 principalId,bytes32 authorityRef,uint64 authEpoch,bytes32 pubNonce,uint64 notAfter,bytes32[] recordIds)';
const EFFECTS_STRING = 'C0RealmEffects(bytes32 realmId,address core,bytes32 routeConfigId,bytes32 genesisReceiptHash,uint8 operationKind,bytes32 envelopeId,uint64 leafMask,bytes32 expectedRevisionsHash,address stateByteStore,bytes32 byteCommitment)';
const PLAN_STRING = 'WritePlan(bytes32 c0ProfileId,bytes32 publicationDigest,bytes32 realmId,bytes32 realmEffectsDigest,address executor,bytes32 executorCodeHash,uint192 nonceKey,uint64 nonceSeq,uint64 notAfter)';
// Public, synthetic, non-funded outside managed Anvil. Never use with a public RPC.
export const SYNTHETIC_KEYS = { schema: toBeHex(0xC001,32), bootstrap: toBeHex(0xC002,32), payer: toBeHex(0xC003,32), stranger: toBeHex(0xC004,32) };
export function recordId(typeId, body) { return keccak256(abi.encode(['bytes32','bytes32','bytes32'],[domain('efs2/record/1'),typeId,keccak256(body)])); }
export function principal(address) {
  const descriptor = concat(['0x0100',address]);
  return { descriptor, id: keccak256(abi.encode(['bytes32','uint256','bytes32'],[domain('efs2/principal/1'),1,keccak256(descriptor)])) };
}
export function publicationIds(h, recordIds) {
  const ds = keccak256(abi.encode(['bytes32','bytes32','bytes32'],[domain('EIP712Domain(string name,string version)'),domain('EFS2-Envelope'),domain('1')]));
  const sh = keccak256(abi.encode(['bytes32',HEADER,'bytes32'],[domain(PUBLICATION_STRING),h,keccak256(concat(recordIds))]));
  const publicationDigest = keccak256(concat(['0x1901',ds,sh]));
  const envelopeId = keccak256(abi.encode(['bytes32','bytes32'],[domain('efs2/envelope/1'),publicationDigest]));
  return { publicationDigest,envelopeId,occurrenceKey:keccak256(abi.encode(['bytes32','bytes32','uint256'],[domain('efs2/occurrence/1'),envelopeId,0])) };
}
export function effectsDigest(effects) { return keccak256(abi.encode(['bytes32',EFFECTS],[domain(EFFECTS_STRING),effects])); }
export function planDigest(plan, chainId, core) {
  const ds = keccak256(abi.encode(['bytes32','bytes32','bytes32','uint256','address'],[domain('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)'),domain('EFS2-MVP-C0-WritePlan'),domain('1'),chainId,core]));
  return keccak256(concat(['0x1901',ds,keccak256(abi.encode(['bytes32',PLAN],[domain(PLAN_STRING),plan]))]));
}
export function makeRunInputs() {
  const candidates = JSON.parse(readFileSync(new URL('../2026-09-05-mvp-build-start/type-inputs/artifacts.v1.json',import.meta.url),'utf8'));
  const intrinsicDescriptor = { name:'ProbeTypeSchemaGroup/1',meaning:'Temporary partial C0 admission probe intrinsic; no permanent Codex identity.',specDigest:null,qualifier:Buffer.from('c0-admission-probe-20260905-v1').toString('hex').padEnd(64,'0'),fields:[{name:'groupBytes',kind:'BYTES',max:8190}],roles:[],indexes:[],constraints:[] };
  const intrinsicGroup = '0x'+encodeGroup([intrinsicDescriptor]).toString('hex');
  const declared = { fieldKinds:new Set(),roleClasses:new Set(),indexKinds:new Set(),constraintKinds:new Set(),digestAlgorithms:new Set() };
  function walk(f) { declared.fieldKinds.add(f.kind); if(f.inner)walk(f.inner);if(f.members)f.members.forEach(walk);if(f.key)walk(f.key);if(f.value)walk(f.value); }
  for(const g of candidates.groups)for(const m of g.members){const d=m.descriptor;d.fields.forEach(walk);d.roles.forEach(r=>declared.roleClasses.add(r.targetClass));d.indexes.forEach(i=>declared.indexKinds.add(i.kind));d.constraints.forEach(c=>declared.constraintKinds.add(c.kind));if(d.specDigest)declared.digestAlgorithms.add(d.specDigest.algCode);}
  const documentaryInventory = { format:'c0-admission-probe-declaration-inventory/1',activeCapabilityManifest:false,candidateDeclarations:Object.fromEntries(Object.entries(declared).map(([k,v])=>[k,[...v].sort()])),implemented:['finite ordered Type-group admission','ASCII MC/1 descriptor subset','DIRECT role closure','parsed-cache retention','seven automatic bounded inventory indexes','composite EOA WritePlan authentication'],notImplemented:['G0-G3 capability/Codex initialization','Unicode16 STRUCT-FULL','general E1 extraction compiler','arbitrary Record-body validation','Binding','Lens','digest-instance lookup','scalar-instance indexing','byte carrier','Files actions','session authorization'],groupByteHashes:candidates.groups.map(g=>keccak256('0x'+g.groupHex)) };
  const declarationInventory = '0x'+Buffer.from(JSON.stringify(documentaryInventory)).toString('hex');
  const config = {realmId:domain('temporary/partial-c0-admission-probe/2026-09-05'),stateByteStore:'0x000000000000000000000000000000000000c0b0',schemaAuthor:new Wallet(SYNTHETIC_KEYS.schema).address,bootstrapAuthor:new Wallet(SYNTHETIC_KEYS.bootstrap).address,groupByteHashes:documentaryInventory.groupByteHashes};
  const probeCommitment = keccak256(abi.encode(['bytes32','bytes32','address','address','address','bytes32[4]','bytes32','bytes32'],[domain('efs2/c0-admission-probe/run/1'),config.realmId,config.stateByteStore,config.schemaAuthor,config.bootstrapAuthor,config.groupByteHashes,keccak256(intrinsicGroup),keccak256(declarationInventory)]));
  const c0ProfileId = keccak256(abi.encode(['bytes32','bytes32'],[domain('efs2/mvp-c0/profile/1'),probeCommitment]));
  return {candidates,config,intrinsicDescriptor,intrinsicGroup,declarationInventory,documentaryInventory,probeCommitment,c0ProfileId,metaTypeId:derive(Buffer.from(intrinsicGroup.slice(2),'hex')).ids[0]};
}
export function makePublication(run, deployment, groupIndex, { nonceSeq=groupIndex+1,pubNonce=toBeHex(nonceSeq,32),nonceKey=0,notAfter=0,signer=new Wallet(SYNTHETIC_KEYS.schema),headerPatch={},effectsPatch={},planPatch={},chainId=deployment.chainId } = {}) {
  const canonicalBody = '0x'+run.candidates.groups[groupIndex].recordBodyHex;
  const recordIds = [recordId(run.metaTypeId,canonicalBody)];
  const publication = {profile:1,principalId:principal(run.config.schemaAuthor).id,authorityRef:ZeroHash,authEpoch:0,pubNonce,notAfter,...headerPatch};
  const ids = publicationIds(publication,recordIds);
  const effects = {realmId:run.config.realmId,core:deployment.core,routeConfigId:ZeroHash,genesisReceiptHash:ZeroHash,operationKind:1,envelopeId:ids.envelopeId,leafMask:1,expectedRevisionsHash:keccak256('0x'),stateByteStore:run.config.stateByteStore,byteCommitment:ZeroHash,...effectsPatch};
  const plan = {c0ProfileId:run.c0ProfileId,publicationDigest:ids.publicationDigest,realmId:run.config.realmId,realmEffectsDigest:effectsDigest(effects),executor:deployment.core,executorCodeHash:deployment.runtimeCodeHash,nonceKey,nonceSeq,notAfter,...planPatch};
  const writePlanDigest = planDigest(plan,chainId,deployment.core);
  const witness = signer.signingKey.sign(writePlanDigest).serialized;
  return {publication,recordIds,canonicalBody,effects,plan,witness,...ids,writePlanDigest};
}
export const callArgs = p => [p.publication,p.recordIds,p.canonicalBody,p.effects,p.plan,p.witness];
