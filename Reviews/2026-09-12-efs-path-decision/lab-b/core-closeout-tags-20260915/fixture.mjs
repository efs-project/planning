// Standalone experiment fixture. Never imported by the owner-served browser.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createEnvironment} from '../script/compact-environment.mjs';

export async function createTagEnvironment(){
  const env=await createEnvironment({protocol:'compact-guarded-v2',evidenceMode:'append'});
  try{
    const e=env.ethers,Z=e.ZeroHash,coder=e.AbiCoder.defaultAbiCoder();
    const t=env.manifest.types,h=env.manifest.ruleHashes;
    const reg=async(key,file,name,shape,args=[],refs=[])=>{
      const rule=await env.deploy(key+'Rule',file,name,args);
      const type=(await env.call('registry','typeIdOf',[e.id(shape),rule,refs]))[0];
      await env.transact('registry','register',[e.id(shape),rule,refs],`tags/register/${key}`);
      t[key]=type;h[key]=env.contracts[key+'Rule'].codeHash;return type;
    };
    await reg('directory','FilesDirectoryProfile.sol','FilesDirectoryRule','lab/type/files-directory/1');
    await reg('bytes','FilesCarrierProfile.sol','FilesBytesRule','lab/type/files-bytes/1');
    await reg('content','FilesCarrierProfile.sol','FilesContentRule','lab/type/files-content/1',[t.bytes],[t.bytes]);
    await reg('carrierRoot','FilesCarrierProfile.sol','FilesCarrierRootRule','lab/type/files-carrier-root/1',[],[t.content]);
    await reg('carrierChild','FilesCarrierProfile.sol','FilesCarrierChildRule','lab/type/files-carrier-child/1',[t.root,t.child,t.carrierRoot],[Z,t.content]);
    await reg('concept','FilesCarrierProfile.sol','FilesConceptRule','lab/type/files-concept/1');
    await reg('quote','LiveFilesAdapter.sol','LiveQuoteRule','lab/type/live-quote-u128-bool-max100/1');
    const providerArtifact=JSON.parse(await readFile(join(process.env.FOUNDRY_OUT,'LiveFilesAdapter.sol','LiveQuoteProvider.json')));
    const selectedProviderHash=e.keccak256(providerArtifact.deployedBytecode.object);
    const adapter=await env.deploy('liveAdapter','LiveFilesAdapter.sol','LiveFilesAdapter',[env.contracts.ledger.address,t.quote,selectedProviderHash]);
    const descriptorRule=(await env.call('liveAdapter','descriptorRule'))[0];
    t.liveDescriptor=(await env.call('registry','typeIdOf',[e.id('lab/type/files-live-descriptor/1'),descriptorRule,[]]))[0];
    h.liveDescriptor=e.keccak256(await env.rpc('eth_getCode',[descriptorRule,'latest']));
    await env.transact('registry','register',[e.id('lab/type/files-live-descriptor/1'),descriptorRule,[]],'tags/register/liveDescriptor');
    await reg('liveRoot','LiveFilesProfile.sol','LiveFilesRootRule','lab/type/files-live-root/1',[],[t.liveDescriptor]);
    await reg('liveChild','LiveFilesProfile.sol','LiveFilesChildRule','lab/type/files-live-child/1',[[t.root,t.child,t.carrierRoot,t.carrierChild,t.liveRoot]],[Z,t.liveDescriptor]);
    const purpose=e.id('efs.lab/tag-stance/1'),family=e.id('efs.lab/tag-role-inventory/1');
    const label='TagStanceToken/1:1=ASSERT;2=DENY;3=SILENT';
    const descriptor=e.solidityPacked(['bytes4','address','bytes32','bytes32','uint16','string','bytes32','bytes32','uint8','uint8','uint16','uint256','uint256','bytes32'],
      ['0x01010001',env.wallets.alice.address,purpose,Z,e.toUtf8Bytes(label).length,label,e.toBeHex(1,32),e.id('stance-word'),3,0,32,0,e.MaxUint256,Z]);
    t.token=(await env.call('registry','describedTypeId',[descriptor]))[0];
    const digest=(await env.call('registry','declarationDigest',[t.token]))[0];
    const declaration=env.wallets.alice.signingKey.sign(digest).serialized;
    await env.transact('registry','registerDescribed',[descriptor,declaration,e.ZeroAddress,e.ZeroAddress,'0x'],'tags/register/described-token');
    const wrapper=(await env.call('registry','describedRule'))[0];h.token=e.keccak256(await env.rpc('eth_getCode',[wrapper,'latest']));
    const legacy=[t.root,t.child,h.root,h.child,t.name,h.name,t.directory,h.directory];
    const carrier=['bytes','content','carrierRoot','carrierChild','concept'];const live=['liveDescriptor','liveRoot','liveChild'];
    const configuration=[legacy,carrier.map(k=>t[k]),carrier.map(k=>h[k]),live.map(k=>t[k]),live.map(k=>h[k])];
    const ledger=env.contracts.ledger.address;
    const final=await env.deploy('finalValidator','FilesFinalValidator.sol','FilesFinalValidator',[ledger,t.name,h.name,t.directory,h.directory]);
    const validator=await env.deploy('stanceValidator','TagStanceProfile.sol','TagStanceValidator',[ledger,...configuration,t.token,h.token,descriptor]);
    const args=[ledger,...configuration,final,env.contracts.finalValidator.codeHash,validator,env.contracts.stanceValidator.codeHash];
    assert.equal((await env.call('ledger','counts'))[0],0n,'new profile must precede admission one');
    await env.deploy('tagIndex','TagStanceProfile.sol','TagStanceIndex',args);
    await env.transact('ledger','setIndexModule',[env.contracts.tagIndex.address],'tags/required-from-genesis');
    assert.equal((await env.call('tagIndex','attachedFrom'))[0],1n);
    const hash=(types,values)=>e.keccak256(coder.encode(types,values));
    const record=(type,body)=>hash(['bytes32','bytes32','bytes32'],[e.id('efs2/record/1'),type,e.keccak256(body)]);
    const principals=Object.fromEntries(await Promise.all(Object.entries(env.wallets).map(async([k,w])=>[k,(await env.call('ledger','principalOf',[w.address]))[0]])));
    const publish=async(type,body,label)=>{await env.transact('ledger','publish',[type,body],label);return record(type,body);};
    const create=async(label)=>{const salt=e.id('tags/'+label);await env.transact('ledger','create',[salt],`tags/create/${label}`);return hash(['bytes32','bytes32','bytes32'],[e.id('efs2/subject/1'),principals.deployer,salt]);};
    const tokens=[];for(let i=1;i<=3;i++)tokens.push(await publish(t.token,coder.encode(['uint256'],[i]),`tags/token/${i}`));
    const conceptC=await publish(t.concept,e.concat([e.id('namespace-a'),e.toUtf8Bytes('shared')]),'tags/concept/C');
    const conceptC2=await publish(t.concept,e.concat([e.id('namespace-b'),e.toUtf8Bytes('shared')]),'tags/concept/C2');
    const fileF=await create('F'),fileG=await create('G'),orphanH=await create('H'),seed=await create('D');
    const directoryD=await publish(t.directory,coder.encode(['bytes32'],[seed]),'tags/directory/D');
    const revision1=await publish(t.root,coder.encode(['bytes32'],[fileF]),'tags/revision/1');
    const revision2=await publish(t.child,coder.encode(['bytes32','bytes32'],[revision1,fileF]),'tags/revision/2');
    for(const [name,file] of [['f',fileF],['g',fileG]]){
      await publish(t.name,e.hexlify(e.toUtf8Bytes(name)),`tags/name/${name}`);
      await env.transact('ledger','bind',[e.id('efs2/purpose/folder/1'),directoryD,e.id(name),file,0],`tags/place/${name}`);
    }
    const inventory=(principal,concept)=>hash(['bytes32','bytes32','bytes32','bytes32'],[family,principal,purpose,concept]);
    return Object.assign(env,{tags:{purpose,family,descriptor,declaration,configuration,indexArgs:args,principals,tokens,conceptC,conceptC2,fileF,fileG,orphanH,directoryD,revision1,revision2,inventory,record,publish,adapter,selectedProviderHash}});
  }catch(error){await env.close();throw error;}
}
