// DISPOSABLE LAB. This callable runner has no CLI, provider, node launcher,
// compiler, installer or file writer. The root-owned gate supplies recorded RPC,
// pinned artifacts, full compiler build, and a pure independent storage planner.
import assert from 'node:assert/strict';

const ACTION = 'tuple(uint8 kind,bytes32 typeId,bytes32 bodyHashOrRecordId,bytes32 purpose,bytes32 subject,bytes32 role,bytes32 target,uint32 expectedRevision,bytes32 salt)';
const INTENT = 'tuple(bytes32 realmId,bytes32 coreCodeCommitment,address author,uint64 nonce,uint64 deadline,bytes32 acceptanceProfile,bytes32 indexObligations)';
const TYPE = 'PublicationIntent(bytes32 realmId,bytes32 coreCodeCommitment,address author,uint64 nonce,uint64 deadline,bytes32 acceptanceProfile,bytes32 indexObligations,bytes32 actionsHash)';
const MNEMONIC = 'test test test test test test test test test test test junk';
const NAMES = ['registry','ledger','rootRule','childRule','index','lens','bob','consumer','wrapper'];
const DEPLOY_NONCES = { registry:0,ledger:1,rootRule:2,childRule:4,index:6,lens:8,bob:9,consumer:10,wrapper:11 };
const quantity = value => '0x' + BigInt(value).toString(16);
const lower = value => value === null ? null : value.toLowerCase();
const clean = value => JSON.parse(JSON.stringify(value, (_, v) => typeof v === 'bigint' ? v.toString() : v));
const wait = ms => new Promise(done => setTimeout(done, ms));

function verifyReceipt(e, tx) {
    const parsed = e.Transaction.from(tx.rawTransaction), r = tx.receipt, b = tx.block, observed = tx.transaction;
    assert.equal(parsed.hash, tx.hash); assert.equal(e.keccak256(tx.rawTransaction), tx.hash);
    assert.equal(observed.hash, tx.hash); assert.equal(r.transactionHash, tx.hash);
    assert.equal(lower(parsed.from), lower(tx.from)); assert.equal(lower(observed.from), lower(tx.from));
    assert.equal(lower(r.from), lower(tx.from));
    assert.equal(lower(parsed.to), lower(tx.to)); assert.equal(lower(observed.to), lower(tx.to));
    assert.equal(lower(r.to), lower(tx.to));
    for (const key of ['nonce','value','chainId']) {
        assert.equal(BigInt(parsed[key]), BigInt(tx[key]));
        assert.equal(BigInt(observed[key]), BigInt(tx[key]));
    }
    assert.equal(parsed.data, tx.data); assert.equal(observed.input, tx.data);
    assert.equal(BigInt(r.status), 1n, `failed receipt ${tx.label}`);
    assert(BigInt(r.gasUsed) > 0n);
    assert.equal(r.blockHash, b.hash); assert.equal(observed.blockHash, b.hash);
    assert.equal(r.blockNumber, b.number); assert.equal(observed.blockNumber, b.number);
    assert.equal(observed.transactionIndex, r.transactionIndex);
    assert.equal(b.transactions[Number(BigInt(r.transactionIndex))], tx.hash);
    for (const log of r.logs) {
        assert.equal(log.transactionHash, tx.hash); assert.equal(log.blockHash, b.hash);
        assert.equal(log.blockNumber, b.number); assert.equal(log.transactionIndex, r.transactionIndex);
        assert.notEqual(log.removed, true);
    }
}

function verifyRuntime(e, artifact, actual) {
    const template = e.getBytes(artifact.deployedBytecode.object), observed = e.getBytes(actual);
    assert.equal(observed.length, template.length, 'runtime length differs from pinned compiler output');
    assert(observed.length > 0 && observed.length <= 24_576, 'normal EIP-170 runtime bound');
    const immutable = new Set();
    for (const refs of Object.values(artifact.deployedBytecode.immutableReferences ?? {})) for (const ref of refs) {
        assert.equal(ref.length, 32, 'unexpected immutable reference width');
        for (let i = ref.start; i < ref.start + ref.length; ++i) {
            assert(i < template.length); immutable.add(i);
        }
    }
    for (let i = 0; i < template.length; ++i) if (!immutable.has(i)) {
        assert.equal(observed[i], template[i], `non-immutable runtime byte differs at ${i}`);
    }
    // This comparison deliberately does not certify immutable VALUES. The root's
    // independent AST/constructor checker must patch and compare the entire code.
}

export async function runFiles({ rpc, artifacts, ethers: e, build, prepare, timeoutMs = 30_000,
    onProgress = async () => {} }) {
    assert.equal(typeof rpc, 'function'); assert.equal(typeof prepare, 'function');
    assert(Number.isSafeInteger(timeoutMs) && timeoutMs > 0 && timeoutMs <= 30_000);
    assert(e.version.startsWith('6.'));
    assert.deepEqual(Object.keys(artifacts).sort(), [...NAMES].sort(), 'exact nine artifact keys required');
    for (const name of NAMES) {
        assert(/^0x[0-9a-f]+$/i.test(artifacts[name].bytecode.object), `unlinked creation ${name}`);
        assert(Array.isArray(artifacts[name].abi));
    }
    const coder = e.AbiCoder.defaultAbiCoder(), Z = e.ZeroHash;
    const deployer = e.HDNodeWallet.fromPhrase(MNEMONIC, undefined, "m/44'/60'/0'/0/0");
    const alice = new e.Wallet(e.toBeHex(0xA11CE, 32));
    const iface = Object.fromEntries(NAMES.map(name => [name, new e.Interface(artifacts[name].abi)]));
    const addresses = Object.fromEntries(NAMES.map(name => [name, e.getCreateAddress({from:deployer.address,nonce:DEPLOY_NONCES[name]})]));
    const packet = { schema:'efs-lab-b/files-paid/1', status:'UNMEASURED', evidenceLevel:'OWNED_LOCAL_RPC_OBSERVATION',
        startedAt:new Date().toISOString(), transactions:[], deployments:{}, reads:[], snapshots:{}, rows:[],
        constants:{chainId:31337,gasPriceWei:'2000000000',scanBudget:1,deadline:1800003600,
            deployer:deployer.address,alice:alice.address,deployNonces:DEPLOY_NONCES},
        addresses, storageGrowth:'UNKNOWN', caveats:[
            'Receipt economics for one tiny checked Files fixture, not a complete filesystem or lifetime-cost claim.',
            'Names and folder coordinates are hashes; no cold filename recovery or nested-directory profile.',
            'Six paid reads are alternative operations, not a compulsory six-read bill.',
            'Native Bob evidence is not a portable historical authority proof.',
            'Runtime immutable values require independent full compiler AST/constructor verification.',
            'No USD estimate, storage-growth estimate, or repricing claim.' ] };
    const progress = () => onProgress(clean(packet));
    let nonce = 0;
    const send = async (label, category, to, data, gasLimit = 8_000_000n) => {
        assert.equal(BigInt(await rpc('eth_getTransactionCount',[deployer.address,'latest'])), BigInt(nonce), 'unexpected external transaction');
        const tx = { label, category, from:deployer.address, to, nonce, value:'0', chainId:'31337', data,
            gasLimit:String(gasLimit), gasPriceWei:'2000000000', status:'PENDING' };
        tx.rawTransaction = await deployer.signTransaction({to,nonce,data,value:0,chainId:31337,type:0,
            gasPrice:2_000_000_000n,gasLimit});
        tx.hash = e.keccak256(tx.rawTransaction);
        packet.transactions.push(tx); await progress();
        assert.equal(await rpc('eth_sendRawTransaction',[tx.rawTransaction]), tx.hash);
        const until = Date.now() + timeoutMs;
        do {
            tx.receipt = await rpc('eth_getTransactionReceipt',[tx.hash]);
            if (tx.receipt) break;
            await wait(50);
        } while (Date.now() < until);
        assert(tx.receipt, `receipt timeout ${label}`);
        tx.transaction = await rpc('eth_getTransactionByHash',[tx.hash]);
        tx.block = await rpc('eth_getBlockByHash',[tx.receipt.blockHash,false]);
        assert(tx.transaction && tx.block, 'transaction or header unavailable');
        verifyReceipt(e, tx);
        tx.status = 'SUCCESS';
        const bytes = e.getBytes(data), zeros = bytes.filter(byte => byte === 0).length;
        packet.rows.push({label,category,transactionHash:tx.hash,gasUsed:BigInt(tx.receipt.gasUsed).toString(),
            effectiveGasPriceWei:BigInt(tx.receipt.effectiveGasPrice).toString(),calldataBytes:bytes.length,
            zeroBytes:zeros,nonzeroBytes:bytes.length-zeros,status:'MEASURED'});
        ++nonce; await progress();
        return tx;
    };
    const read = async (label, name, fn, args, block) => {
        const data = iface[name].encodeFunctionData(fn,args), basis = {blockHash:block.hash,requireCanonical:true};
        const returnData = await rpc('eth_call',[{to:addresses[name],data},basis]);
        packet.reads.push({label,name,fn,args:clean(args),address:addresses[name],calldata:data,returnData,
            blockHash:block.hash,blockNumber:block.number});
        return iface[name].decodeFunctionResult(fn,returnData);
    };
    const deploy = async (name, args) => {
        assert.equal(nonce, DEPLOY_NONCES[name]);
        const constructorData = iface[name].encodeDeploy(args);
        const creation = artifacts[name].bytecode.object + constructorData.slice(2);
        assert(e.getBytes(creation).length <= 49_152, 'normal EIP-3860 initcode bound');
        const tx = await send(`deploy/${name}`,'deployment',null,creation,15_000_000n);
        assert.equal(lower(tx.receipt.contractAddress),lower(addresses[name]));
        const code = await rpc('eth_getCode',[addresses[name],{blockHash:tx.block.hash,requireCanonical:true}]);
        verifyRuntime(e,artifacts[name],code);
        packet.deployments[name] = {address:addresses[name],constructorArgs:clean(args),constructorData,
            transactionHash:tx.hash,runtime:{code,codehash:e.keccak256(code),blockHash:tx.block.hash,
                blockNumber:tx.block.number,bytes:e.getBytes(code).length}};
        await progress(); return tx;
    };
    const snap = async (label, block, requests) => {
        assert(Array.isArray(requests) && requests.length > 0 && requests.length <= 4096, 'bounded independent storage requests required');
        const cells = [];
        for (const request of requests) {
            assert(e.isAddress(request.address) && /^0x[0-9a-f]{64}$/i.test(request.slot), 'invalid independent storage request');
            const value = await rpc('eth_getStorageAt',[request.address,request.slot,{blockHash:block.hash,requireCanonical:true}]);
            assert(/^0x[0-9a-f]{64}$/i.test(value), 'storage response must be one complete word');
            cells.push({...request,value});
        }
        packet.snapshots[label] = {blockHash:block.hash,blockNumber:block.number,cells}; await progress();
    };
    try {
        assert.equal(BigInt(await rpc('eth_chainId',[])),31337n);
        packet.initial = await rpc('eth_getBlockByNumber',['latest',false]);
        assert(BigInt(packet.initial.gasLimit) >= 30_000_000n && BigInt(packet.initial.timestamp) < 1_800_003_600n);
        const realm = e.id('lab/realm/1');
        await deploy('registry',[]);
        await deploy('ledger',[addresses.registry,realm]);
        await deploy('rootRule',[]);
        const rootHash = packet.deployments.rootRule.runtime.codehash;
        const typeId = (shape, refs, hash) => e.keccak256(coder.encode(['bytes32','bytes32','bytes32','bytes32'],
            [e.id('efs2/type/1'),shape,e.keccak256(coder.encode(['bytes32[]'],[refs])),hash]));
        const rootShape = e.id('lab/type/files-joined-root/1'), childShape = e.id('lab/type/files-joined-child/1');
        const rootType = typeId(rootShape,[],rootHash);
        await send('registerRoot','configuration',addresses.registry,iface.registry.encodeFunctionData('register',[rootShape,addresses.rootRule,[]]));
        await deploy('childRule',[rootType]);
        const childHash = packet.deployments.childRule.runtime.codehash;
        const childType = typeId(childShape,[Z],childHash);
        await send('registerChild','configuration',addresses.registry,iface.registry.encodeFunctionData('register',[childShape,addresses.childRule,[Z]]));
        await deploy('index',[addresses.ledger,rootType,childType,rootHash,childHash]);
        await send('setIndex','configuration',addresses.ledger,iface.ledger.encodeFunctionData('setIndexModule',[addresses.index]));
        await deploy('lens',[addresses.ledger,addresses.index]);
        await deploy('bob',[addresses.ledger]);
        await deploy('consumer',[addresses.ledger,addresses.lens,addresses.index,rootType,childType,rootHash,childHash]);
        const setup = (await deploy('wrapper',[addresses.consumer])).block;
        assert.equal(nonce,12);
        packet.setup = {blockHash:setup.hash,blockNumber:setup.number};
        const core = packet.deployments.ledger.runtime.codehash;
        const indexObligations = e.keccak256(coder.encode(['address','bytes32'],[addresses.index,packet.deployments.index.runtime.codehash]));
        const principal = e.zeroPadValue(alice.address,32), salt = e.toBeHex(401,32);
        const file = e.keccak256(coder.encode(['bytes32','bytes32','bytes32'],[e.id('efs2/subject/1'),principal,salt]));
        const body0 = e.concat([file,e.toUtf8Bytes('Meeting at 10:00.\n')]);
        const recordId = (type,body) => e.keccak256(coder.encode(['bytes32','bytes32','bytes32'],[e.id('efs2/record/1'),type,e.keccak256(body)]));
        const r0 = recordId(rootType,body0);
        const bodyA = e.concat([r0,file,e.toUtf8Bytes('Meeting at 11:00.\n')]);
        const bodyB = e.concat([r0,file,e.toUtf8Bytes('Meeting at 09:00.\n')]);
        const ra = recordId(childType,bodyA), rb = recordId(childType,bodyB);
        const purposes = {head:e.id('efs2/purpose/head/1'),folder:e.id('efs2/purpose/folder/1'),tag:e.id('efs2/purpose/tag/1')};
        const concepts = {project:e.id('project_efs'),draft:e.id('draft'),approved:e.id('approved')};
        const folder = e.id('/drafts'), role = e.id('note.txt');
        const action = extra => ({kind:0,typeId:Z,bodyHashOrRecordId:Z,purpose:Z,subject:Z,role:Z,target:Z,expectedRevision:0,salt:Z,...extra});
        const publish = (type,body) => action({kind:1,typeId:type,bodyHashOrRecordId:e.keccak256(body)});
        const bind = (purpose,subject,key,target,revision=0) => action({kind:3,purpose,subject,role:key,target,expectedRevision:revision});
        const workloads = [
            {label:'W1',author:alice.address,actions:[action({kind:5,salt}),publish(rootType,body0),bind(purposes.head,file,Z,r0),bind(purposes.folder,folder,role,file)],bodies:['0x',body0,'0x','0x']},
            {label:'W2',author:alice.address,actions:[bind(purposes.tag,file,concepts.project,file)],bodies:['0x']},
            {label:'W3',author:alice.address,actions:[bind(purposes.tag,r0,concepts.draft,file)],bodies:['0x']},
            {label:'W4',author:alice.address,actions:[publish(childType,bodyA),bind(purposes.head,file,Z,ra,1)],bodies:[bodyA,'0x']},
            {label:'W5',author:addresses.bob,actions:[publish(childType,bodyB),bind(purposes.head,file,Z,rb)],bodies:[bodyB,'0x']},
            {label:'W6',author:alice.address,actions:[bind(purposes.tag,ra,concepts.approved,file)],bodies:['0x']},
        ];
        const domain = e.keccak256(coder.encode(['bytes32','bytes32','bytes32'],[e.id('EIP712Domain(string name,string version)'),e.id('EFS2-RoadB-Lab'),e.id('1')]));
        let authorNonce = 0;
        for (const w of workloads) {
            w.actionsHash = e.keccak256(coder.encode([ACTION+'[]'],[w.actions]));
            if (w.label === 'W5') continue;
            let profile = Z;
            for (const a of w.actions) if (a.kind === 1) profile = e.keccak256(coder.encode(['bytes32','bytes32','bytes32','bytes32','uint64'],
                [profile,a.typeId,a.typeId === rootType ? rootHash : childHash,Z,2]));
            w.intent = {realmId:realm,coreCodeCommitment:core,author:alice.address,nonce:authorNonce++,deadline:1800003600,acceptanceProfile:profile,indexObligations};
            const structHash = e.keccak256(coder.encode(['bytes32',INTENT,'bytes32'],[e.id(TYPE),w.intent,w.actionsHash]));
            w.digest = e.keccak256(e.concat(['0x1901',domain,structHash]));
            w.signature = alice.signingKey.sign(w.digest).serialized;
            assert.equal(e.recoverAddress(w.digest,w.signature),alice.address);
        }
        const basis = {admission:11,generation:0,epoch:2,core};
        const la = [alice.address,addresses.bob], lb = [addresses.bob,alice.address];
        const queries = [
            {label:'P-A',fn:'point',args:[file,la,concepts.approved,basis]},
            {label:'P-B',fn:'point',args:[file,lb,concepts.approved,basis]},
            {label:'F-A',fn:'folder',args:[folder,la,concepts.project,0,1,basis]},
            {label:'F-B',fn:'folder',args:[folder,lb,concepts.project,0,1,basis]},
            {label:'R-A',fn:'folder',args:[folder,la,concepts.approved,1,1,basis]},
            {label:'R-B',fn:'folder',args:[folder,lb,concepts.approved,1,1,basis]},
        ];
        packet.fixture = {realm,principal,salt,file,r0,ra,rb,rootType,childType,rootHash,childHash,
            folder,role,purposes,concepts,body0,bodyA,bodyB,workloads,queries,basis};
        packet.manifest = {addresses,deployments:packet.deployments,fixture:packet.fixture,constants:packet.constants};
        const independent = await prepare(clean(packet.manifest),build);
        assert(Array.isArray(independent.storageRequests), 'independent storage request inventory required');
        packet.storageRequests = independent.storageRequests;
        // Independent expected answers are intentionally neither copied into the
        // packet nor passed to the wrapper. The checker computes them separately.
        for (const [label,name,fn,args] of [
            ['setup/counts','ledger','counts',[]],['setup/indexObligations','ledger','indexObligations',[]],
            ['setup/rootDescriptor','registry','descriptor',[rootType]],['setup/childDescriptor','registry','descriptor',[childType]],
            ['setup/rootRefs','registry','refTypes',[rootType]],['setup/childRefs','registry','refTypes',[childType]],
            ['setup/indexGeneration','index','generation',[]],['setup/rulesEpoch','registry','epoch',[]],
        ]) await read(label,name,fn,args,setup);
        await progress();
        for (const w of workloads) {
            const data = w.label === 'W5' ? iface.bob.encodeFunctionData('execute',[w.actions,w.bodies])
                : iface.ledger.encodeFunctionData('executeSigned',[w.intent,w.actions,w.bodies,w.signature]);
            const tx = await send(w.label,'write',w.label === 'W5' ? addresses.bob : addresses.ledger,data);
            w.transactionHash = tx.hash;
            await read(`${w.label}/counts`,'ledger','counts',[],tx.block);
            if (w.label === 'W6') packet.sealed = {blockHash:tx.block.hash,blockNumber:tx.block.number,header:tx.block};
        }
        const sealed = packet.sealed.header;
        assert.deepEqual(Array.from(await read('sealed/counts','ledger','counts',[],sealed)).map(String),['11','3','6','6']);
        for (const [key,value] of [['r0',r0],['ra',ra],['rb',rb]]) await read(`sealed/${key}`,'ledger','record',[value],sealed);
        await read('sealed/file','ledger','subjectCreatedAt',[file],sealed);
        await read('sealed/aliceNonce','ledger','nonces',[alice.address],sealed);
        await read('sealed/bobNonce','ledger','nonces',[addresses.bob],sealed);
        await snap('w6',sealed,independent.storageRequests);
        for (const name of NAMES) {
            const code = await rpc('eth_getCode',[addresses[name],{blockHash:sealed.hash,requireCanonical:true}]);
            assert.equal(code,packet.deployments[name].runtime.code, 'deployed runtime changed before sealed reads');
        }
        for (const query of queries) {
            const data = iface.wrapper.encodeFunctionData(query.fn,query.args);
            const tx = await send(query.label,'paid-read',addresses.wrapper,data);
            query.transactionHash = tx.hash;
            const logs = tx.receipt.logs.filter(log => lower(log.address) === lower(addresses.wrapper));
            assert.equal(logs.length,1,'one actual wrapper event required');
            assert.equal(iface.wrapper.parseLog(logs[0]).name,'FilesRead');
            await read(`${query.label}/counts`,'ledger','counts',[],tx.block);
        }
        const final = packet.transactions.at(-1).block;
        packet.final = {blockHash:final.hash,blockNumber:final.number,header:final};
        await snap('final',final,independent.storageRequests);
        for (const name of NAMES) {
            const code = await rpc('eth_getCode',[addresses[name],{blockHash:final.hash,requireCanonical:true}]);
            assert.equal(code,packet.deployments[name].runtime.code, 'deployed runtime changed during workload');
        }
        assert.equal(nonce,24); assert.equal(packet.transactions.length,24);
        packet.status = 'MEASURED_AWAITING_INDEPENDENT_AUDIT';
        packet.finishedAt = new Date().toISOString(); await progress();
        return clean(packet);
    } catch (error) {
        packet.status = 'FAILED'; packet.failure = {name:error.name,message:error.message};
        packet.finishedAt = new Date().toISOString(); await progress(); throw error;
    }
}
