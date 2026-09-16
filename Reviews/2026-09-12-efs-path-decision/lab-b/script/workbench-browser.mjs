/** One clickable v2 workbench over the final compact profile. No v1 imports.
 * Fresh local genesis; owns only its new pruned chain and byte fixture. */
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createTagEnvironment} from '../core-closeout-tags-20260915/fixture.mjs';
import {createFilesCompactSdk} from '../browser/compact-files-sdk.mjs';
import {startBrowser,browserConfig} from './compact-browser.mjs';
import {startRawCarrier} from './raw-carrier-fixture.mjs';
import {samplePng} from './carrier-fixtures.mjs';
import {describe,encryptContent} from '../browser/compact-content.mjs';
import {externalGateways,publicExternalSamples,externalSampleDescriptor} from './external-content-fixtures.mjs';

export async function startWorkbench({serve=true,rpcPort=0,uiPort=60627}={}){
  const env=await createTagEnvironment({externalContent:true,rpcPort});let fixture;
  try{
    const e=env.ethers,c=env.contracts,t=env.manifest.types,h=env.manifest.ruleHashes;
    c.index=c.tagIndex;
    await env.deploy('lens','FilesLiveIndex.sol','FilesLiveLens',[c.ledger.address,c.index.address]);
    await env.deploy('files','FilesJoinedConsumer.sol','FilesJoinedConsumer',[c.ledger.address,c.lens.address,c.index.address,t.root,t.child,h.root,h.child]);
    await env.deploy('joined','LiveFilesReader.sol','LiveFilesPageReader',[c.ledger.address,c.lens.address,c.index.address]);
    Object.assign(env.manifest,{folder:env.tags.directoryD,folders:[env.tags.directoryD],filesProfile:'typed-directory-v1',
      contentProfile:'raw-sha256-aesgcm-v2',liveProfile:'quote-u128-bool-v1',liveOutputType:t.quote,liveProviderRuntimeHash:env.tags.selectedProviderHash,
      workbench:true,externalGateways});
    for(const key of ['index','lens','files','joined','liveAdapter','finalValidator'])env.manifest.contracts[key]=c[key];
    assert.equal((await env.call('ledger','indexModule'))[0].toLowerCase(),c.index.address.toLowerCase());
    fixture=await startRawCarrier([samplePng()]);
    const sdk=createFilesCompactSdk({ethers:e,manifest:env.manifest,rpc:env.rpc,journal:await env.createJournal('workbench')});
    const run=async(operation,args,who='alice')=>{
      const p=await sdk.prepare({operation,author:env.wallets[who].address,authors:Object.values(env.manifest.authors),...args});
      const signed=await sdk.authorize(p,d=>env.wallets[who].signingKey.sign(d).serialized);
      await sdk.submit(signed,tx=>env.send(`workbench/${operation}`,tx,who));
      assert.equal((await sdk.reconcile(p.id)).status,'EFFECTS_VERIFIED',operation);return p;
    };
    const docs=await run('createDirectory',{name:'docs',salt:e.id('workbench/docs')});
    const photos=await run('createDirectory',{name:'photos',salt:e.id('workbench/photos')});
    await run('createDirectory',{name:'archive',salt:e.id('workbench/archive')});
    await run('create',{name:'readme.txt',salt:e.id('workbench/readme'),document:
      'EFS v2 workbench\n\nGuest browsing reads contracts directly. Enable a disposable signer to create, upload, edit, tag, rename, move, remove and restore.\n\nTry docs/meeting.txt with Alice → Bob and Bob → Alice. Open photos/red.png. Upload a real file: small files can live onchain; larger files use this run-only byte store. Nothing here uses v1 contracts or code.\n\nLocal test data only. Names are lowercase ASCII. Removal hides your placement, not the underlying bytes.\n'});
    const meeting=await run('create',{folder:docs.file,name:'meeting.txt',salt:e.id('workbench/meeting'),document:'Alice: meeting at 10:00.\n'});
    await run('edit',{file:meeting.file,document:'Bob: meeting at 11:00.\n'},'bob');
    await run('create',{folder:docs.file,name:'alice-only.txt',salt:e.id('workbench/fallback'),document:'Bob has no entry here, so Bob → Alice falls back to Alice.\n'});
    const image=await run('create',{folder:photos.file,name:'red.png',salt:e.id('workbench/red'),content:{bytes:samplePng(),media:2}});
    await run('create',{folder:photos.file,name:'external.png',salt:e.id('workbench/external'),content:{descriptor:await describe(samplePng(),{carrier:1,media:2})}});
    const externalSamples=[];
    for(const sample of publicExternalSamples)externalSamples.push(await run('create',{folder:docs.file,name:sample.name,salt:e.id('workbench/'+sample.name),content:{descriptor:externalSampleDescriptor(sample)}}));
    const secret=await encryptContent(e.toUtf8Bytes('A real encrypted file. Wrong keys do not open it.'),new Uint8Array(32).fill(17),{media:1});
    await run('create',{folder:docs.file,name:'encrypted.txt',salt:e.id('workbench/encrypted'),content:secret});
    await run('addTag',{file:meeting.file,scope:'file',conceptLabel:'efs',conceptNamespace:env.manifest.folder});
    await run('addTag',{file:image.file,scope:'file',conceptLabel:'photos',conceptNamespace:env.manifest.folder});
    // A real virtual file: the descriptor is retained; its value comes from a
    // separately deployed contract rather than copying every update into EFS.
    const provider=await env.deploy('provider','LiveFilesAdapter.sol','LiveQuoteProvider');
    const abi=e.AbiCoder.defaultAbiCoder(),salt=e.id('workbench/live-quote');
    const file=e.keccak256(abi.encode(['bytes32','bytes32','bytes32'],[e.id('efs2/subject/1'),env.tags.principals.alice,salt]));
    await env.transact('ledger','create',[salt],'workbench/live-create','alice');
    const retain=async(type,body)=>{await env.transact('ledger','publish',[type,body],'workbench/live-retain','alice');return env.tags.record(type,body);};
    const recipe=[1,31337,e.id('evm/cancun/staticcall/1'),provider,c.provider.codeHash,e.id('quote(bytes32)').slice(0,10),e.toBeHex(7,32),t.quote,1,50000,64,c.liveAdapter.address];
    const descriptor=await retain(t.liveDescriptor,abi.encode(['tuple(uint256,uint256,bytes32,address,bytes32,bytes4,bytes32,bytes32,uint256,uint256,uint256,address)'],[recipe]));
    const revision=await retain(t.liveRoot,abi.encode(['bytes32','bytes32'],[descriptor,file]));
    await env.transact('ledger','bind',[e.id('efs2/purpose/head/1'),file,e.ZeroHash,revision,0],'workbench/live-head','alice');
    await retain(t.name,e.toUtf8Bytes('live-quote'));
    await env.transact('ledger','bind',[e.id('efs2/purpose/folder/1'),docs.file,e.id('live-quote'),file,0],'workbench/live-mount','alice');
    // The same public reader that the browser uses proves Lens precedence and fallback.
    const context=await sdk.pin(),authors=Object.values(env.manifest.authors);
    for(const [order,text] of [[authors,'Alice: meeting at 10:00.\n'],[[...authors].reverse(),'Bob: meeting at 11:00.\n']]){
      assert.equal(e.toUtf8String((await sdk.readContent({file:meeting.file,authors:order,context})).bytes),text);
    }
    assert.equal((await sdk.readContent({file,authors,context})).state,'LIVE_SHAPE_OBSERVED');
    console.log('Workbench seeded on final required index. Example decryption key: '+'11'.repeat(32));
    const browser=serve?await startBrowser(env,{seed:false,directory:true,carrierFixture:fixture}):{
      config:browserConfig(env,{directory:true,carrierFixture:fixture}),
      close:async()=>{await fixture.close();await env.close();}
    };
    if(!serve)fixture.allowUploadOrigin(`http://127.0.0.1:${uiPort}`);
    return {...browser,env,sdk,run,seed:{docs,photos,meeting,image,externalSamples}};
  }catch(error){await fixture?.close();await env.close();throw error;}
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
  const browser=await startWorkbench();let stopping=false;
  const stop=async()=>{if(stopping)return;stopping=true;await browser.close();};
  process.once('SIGINT',stop);process.once('SIGTERM',stop);
}
