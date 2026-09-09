import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { AbiCoder, Interface, ZeroHash, keccak256 } from "../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js";
import { withLinkedReadHost, bytes } from "./support/linked-read-host.mjs";
import { readState } from "../reference/state-reader.mjs";
import { publication, groupLeaf, word, domain, TX_GAS, ROOT } from "../scripts/local-stateful.mjs";
const abi=AbiCoder.defaultAbiCoder(), END=(1n<<256n)-1n;
const concat=(...xs)=>"0x"+xs.map(x=>x.replace(/^0x/,"")).join("");
const hash=(types,values)=>keccak256(abi.encode(types,values));
const scope=(principal,purpose,subject)=>hash(["bytes32","bytes32","bytes32","bytes32"],[domain("efs2/vk/binding-scope/1"),principal,purpose,subject]);
const pk=(kind,key)=>hash(["bytes32","bytes32","uint256","uint256","bytes32"],[domain("efs2/pk/1"),ZeroHash,kind,0,key]);
// Linear oracle: end is a filtered retained array length, never a Core getter or bisection.
function cursor(next,end,H,mode,key,kind,init) {
  const tag=BigInt(hash(["bytes32","bytes32","bytes32","uint256","uint256","bytes32","uint256","uint256","bytes32"],[domain("efs2/pk/1"),init.realmId,init.initialRevisionId,1,mode,ZeroHash,kind,0,key]))&((1n<<103n)-1n);
  return BigInt(next)|(BigInt(end)<<48n)|(H<<96n)|(1n<<144n)|(tag<<152n);
}
test("real audit inventories match independent retained-state linear pages, lifecycle and exact costs",{timeout:1200000},async t=>{
  const report=await withLinkedReadHost("AuditPageReadHarness",async v=>{
    const {lab,reader,call,raw,publish,host,iface,getters,components,report}=v;
    const principal=word((1n<<256n)-1n),second=word((1n<<255n)+((1n<<160n)-1n)),purpose=word(1);
    const groups=lab.inputs.candidates.groups;
    const type=name=>groups.flatMap(g=>g.members).find(m=>m.descriptor.name===name).temporaryTypeSchemaId;
    let nonce=4000;
    await publish(publication([groupLeaf(lab.inputs.meta,"0x"+groups[0].groupHex)],nonce++));
    await publish(publication([groupLeaf(lab.inputs.meta,"0x"+groups[1].groupHex)],nonce++));
    const object=publication([{typeId:type("ObjectGenesis/1"),body:concat(principal,word(99),"00")}],nonce++,{principal});
    await publish(object);
    const target=object.recordIds[0], key=scope(principal,purpose,target), secondKey=scope(second,purpose,target);
    const mutation=(role,author=principal,previous=null,revision=0,tombstone=false)=>publication([{typeId:type(tombstone?"BindingTombstone/1":"BindingSet/1"),body:concat(purpose,target,word(role),tombstone?"0x":concat("01",target,"00"),previous?concat("01",previous.envelopeId,"0000"):"00")}],nonce++,{principal:author,revisions:[[0,revision]]});
    const withdraw=p=>publication([{typeId:type("Withdrawal/1"),body:concat(p.envelopeId,"0000")}],nonce++,{principal:p.header.principalId});
    const verify=async label=>{
      const state=await readState(reader); assert.equal(state.outcome,"VERIFIED",label+": "+state.reason);
      report.sourceBlocks??={}; report.sourceBlocks[label]=state.basis;
      return {state,pin:{blockHash:state.basis.hash,requireCanonical:true}};
    };
    async function chain(state,pin,value,kind,H,limit,mode,{measure=false}={}) {
      const all=(state.fold.postings.get(pk(kind,value))?.ordinals??[]).filter(x=>x<=H);
      let token=0n,offset=0,calls=0;
      const name=mode===1?"pagePostings":"pagePostingsHydrated";
      do {
        const args=[ZeroHash,kind,0,value,[token,limit,H]], resultBytes=await raw(name,args,pin), result=iface.decodeFunctionResult(name,resultBytes), p=result[0];
        const cap=Math.min(Math.max(limit,1),mode===1?512:256),expected=all.slice(offset,offset+cap);
        assert.deepEqual([...p.items],expected.map(word));
        assert.equal(p.coverage,BigInt(expected.length));
        assert.equal(p.realmBasis,lab.inputs.init.initialRevisionId); assert.equal(p.highWaterOrdinal,H);
        offset+=expected.length;
        assert.equal(p.completeness,offset===all.length?1n:2n);
        const want=offset===all.length?END:cursor(offset,all.length,H,mode,value,kind,lab.inputs.init);
        assert.equal(p.cursor,want,"entire ordinary cursor word");
        assert.equal(bytes(resultBytes),(mode===1?256:320)+(mode===1?32:256)*expected.length);
        if(mode===2) {
          assert.equal(result[1].length,expected.length);
          expected.forEach((ordinal,i)=>{
            const entry=state.entries.find(e=>e.ordinal===ordinal), life=state.fold.lifecycle.get(entry.envelopeId+":"+entry.leaf);
            const withdrawn=life.status===2 && life.withdrawal<=H;
            assert.deepEqual([...result[1][i]],[ordinal,entry.envelopeId,BigInt(entry.leaf),entry.recordId,entry.principal,withdrawn?2n:1n,withdrawn?life.withdrawal:0n]);
          });
        }
        if(measure) {
          const data=iface.encodeFunctionData(name,args);
          const estimated=await lab.rpc("eth_estimateGas",[{to:host,data},pin]);
          const receipt=await lab.receipt(await lab.send(data,host));
          assert.equal(receipt.status,"0x1"); assert(BigInt(receipt.gasUsed)<=TX_GAS);
          report.measurements.push({density:all.length,mode,limit,items:expected.length,coverage:Number(p.coverage),returndataBytes:bytes(resultBytes),estimatedGas:BigInt(estimated).toString(),transactionGas:BigInt(receipt.gasUsed).toString(),sourceBlock:state.basis.hash});
        }
        token=p.cursor; calls++;
      }while(token!==END);
      return calls;
    }
    // Every ordered subset of four admission positions, all H cuts and limits
    // 1/2/3, in both modes; unselected positions are real Object admissions.
    for(let mask=0;mask<16;mask++) {
      const snapshot=await lab.rpc("evm_snapshot",[]);
      const leaves=Array.from({length:4},(_,i)=>mask&(1<<i)
        ? {typeId:type("BindingSet/1"),body:concat(purpose,target,word(100+i),"01",target,"0000")}
        : {typeId:type("ObjectGenesis/1"),body:concat(principal,word(100+i),"00")});
      await publish(publication(leaves,nonce++,{principal,revisions:leaves.flatMap((_,i)=>mask&(1<<i)?[[i,0]]:[])}));
      const checked=await verify("small-subset-"+mask);
      for(let H=1n;H<=7n;H++) for(const mode of [1,2]) for(const limit of [1,2,3]) await chain(checked.state,checked.pin,key,10,H,limit,mode);
      assert.equal(await lab.rpc("evm_revert",[snapshot]),true);
    }
    report.exhaustiveSmall={orderedSubsets:16,admissionPositions:4,Hcuts:7,limits:[1,2,3],modes:[1,2]};
    const first=mutation(0); await publish(first);
    const one=await verify("density1");
    for(const mode of [1,2]) for(const limit of [0,1,2,511,512,513,65535]) await chain(one.state,one.pin,key,10,4n,limit,mode,{measure:limit===1});
    // Same-position churn does not manufacture new discovery anchors.
    const rebind=mutation(0,principal,first,1); await publish(rebind);
    const tombstone=mutation(0,principal,rebind,2,true); await publish(tombstone);
    const otherFirst=mutation(0,second,null,0,true); await publish(otherFirst);
    const pinned=await verify("same-role-and-two-principals");
    assert.equal(pinned.state.fold.scopes.get(key).length,1); assert.equal(pinned.state.fold.scopes.get(secondKey).length,1);
    const failed=mutation(0,principal,tombstone,0);
    const failure=await lab.receipt(await lab.send(iface.encodeFunctionData("publishTrustedForTest",[lab.context(principal),failed]),host));
    assert.equal(failure.status,"0x0","failed CAS");
    await publish(withdraw(first)); // stale producer remains in both audit families
    await publish(withdraw(tombstone)); // current producer withdrawal also remains audit history
    const later=await verify("later-withdrawals");
    assert.equal(later.state.fold.scopes.get(key).length,1);
    for(const value of [key,secondKey,ZeroHash]) for(const H of [1n,3n,4n,5n,7n,BigInt(later.state.counts[4])]) for(const mode of [1,2]) for(const limit of [1,2,3]) await chain(later.state,later.pin,value,10,H,limit,mode);
    for(const value of later.state.fold.histories.keys()) for(let H=1n;H<=BigInt(later.state.counts[4]);H++) for(const mode of [1,2]) for(const limit of [1,2,3]) await chain(later.state,later.pin,value,8,H,limit,mode);
    let density=1;
    report.setupBatches=[];
    for(const goal of [8,64,256,513]) {
      const snapshot=goal===513?await lab.rpc("evm_snapshot",[]):null;
      while(density<goal) {
        const width=Math.min(8,goal-density);
        const leaves=Array.from({length:width},(_,i)=>({typeId:type("BindingSet/1"),body:concat(purpose,target,word(density+i),"01",target,"0000")}));
        const p=publication(leaves,nonce++,{principal,revisions:leaves.map((_,i)=>[i,0])});
        const receipt=await publish(p); report.setupBatches.push({width,transactionGas:BigInt(receipt.gasUsed).toString()}); density+=width;
      }
      if(goal===513) {
        const attempted=await readState(reader);
        assert.equal(attempted.outcome,"UNKNOWN");
        assert.equal(attempted.reason,"posting word/remaining-work budget");
        report.unverifiedDensity513={outcome:attempted.outcome,reason:attempted.reason,boundary:"Transactions admitted, but no complete independent retained-state verification; not a verified real density."};
        assert.equal(await lab.rpc("evm_revert",[snapshot]),true);
        break;
      }
      const checked=await verify("density"+goal),H=BigInt(checked.state.counts[4]);
      assert.equal(checked.state.fold.scopes.get(key).length,goal);
      const count=await call("counts(bytes32,uint8,uint8,bytes32)",[ZeroHash,10,0,key],checked.pin);
      const list=checked.state.fold.scopes.get(key);
      assert.deepEqual([...count],[BigInt(goal),BigInt(goal),list.at(-1),lab.inputs.init.initialRevisionId,H]);
      const countName="counts(bytes32,uint8,uint8,bytes32)",countArgs=[ZeroHash,10,0,key];
      const countData=iface.encodeFunctionData(countName,countArgs);
      const countBytes=await raw(countName,countArgs,checked.pin);
      const countEstimate=await lab.rpc("eth_estimateGas",[{to:host,data:countData},checked.pin]);
      const countReceipt=await lab.receipt(await lab.send(countData,host));
      assert.equal(countReceipt.status,"0x1");
      assert(BigInt(countReceipt.gasUsed)<=TX_GAS); assert.equal(bytes(countBytes),160);
      report.measurements.push({density:goal,method:"counts",estimatedGas:BigInt(countEstimate).toString(),transactionGas:BigInt(countReceipt.gasUsed).toString(),returndataBytes:bytes(countBytes),sourceBlock:checked.state.basis.hash});
      for(const mode of [1,2]) {
        const requests=await chain(checked.state,checked.pin,key,10,H,65535,mode,{measure:true});
        report.measurements.push({density:goal,mode,requests});
      }
      if(goal===256) {
        for(const limit of [0,1,2,511,512,513]) await chain(checked.state,checked.pin,key,10,H,limit,2);
        const clampSnapshot=await lab.rpc("evm_snapshot",[]);
        await publish(mutation(10000));
        const clamp=await verify("hydrated-clamp257");
        for(const limit of [511,512,513,65535]) await chain(clamp.state,clamp.pin,key,10,BigInt(clamp.state.counts[4]),limit,2);
        assert.equal(await lab.rpc("evm_revert",[clampSnapshot]),true);
      }
      if(goal===8) {
        // Continue a pre-write token on newer retained state at its original H.
        const old=await call("pagePostings",[ZeroHash,10,0,key,[0,1,H]],checked.pin);
        await publish(mutation(9999));
        const fresh=await verify("pinned-continuation-after-write");
        const tail=await call("pagePostings",[ZeroHash,10,0,key,[old[0].cursor,3,H]],fresh.pin);
        assert.deepEqual([...tail[0].items],list.slice(1,4).map(word));
        // This extra role is retained, counted, and reflected in later density goals.
        density++;
      }
    }
    const consumerArtifact=JSON.parse(readFileSync(join(ROOT,"out/AuditPages.t.sol/StaticAuditConsumer.json")));
    const consumerDeployment=await lab.receipt(await lab.send(consumerArtifact.bytecode.object));
    assert.equal(consumerDeployment.status,"0x1");
    const consumerInterface=new Interface(consumerArtifact.abi);
    const final=await verify("final");
    for(const name of ["pagePostings","pagePostingsHydrated"]) {
      const args=[ZeroHash,10,0,key,[0,1,4]],expected=await raw(name,args,final.pin);
      const staticBytes=await lab.rpc("eth_call",[{to:consumerDeployment.contractAddress,data:consumerInterface.encodeFunctionData("read",[host,iface.encodeFunctionData(name,args)])},final.pin]);
      assert.equal(consumerInterface.decodeFunctionResult("read",staticBytes)[0],expected,"normally deployed historical STATICCALL identical");
      for(const code of ["0x60006000fd","0x"]) {
        await lab.rpc("anvil_setCode",[getters.preparationHelper,code]);
        assert.equal(await raw(name,args,"latest"),expected,"reads do not call Preparation");
      }
      await lab.rpc("anvil_setCode",[getters.preparationHelper,components.helper.code]);
    }
    for(const replacement of ["0x60006000fd","0x"]) {
      await lab.rpc("anvil_setCode",[getters.queryReadLibrary,replacement]);
      for(const [name,args] of [["pagePostings",[ZeroHash,9,0,key,[END,1,0]]],["pagePostingsHydrated",[ZeroHash,9,0,key,[END,1,0]]],["counts(bytes32,uint8,uint8,bytes32)",[ZeroHash,9,0,key]]]) {
        await assert.rejects(()=>call(name,args,"latest"),error=>JSON.parse(error.message).data===iface.encodeErrorResult("ReadCodeMismatch",[2]));
      }
    }
    await lab.rpc("anvil_setCode",[getters.queryReadLibrary,components.queryRead.code]);
    report.boundary="Real trusted admissions with independent retained reconstruction; raw anchors are not current Files rows. Synthetic revision one, not authenticated C0 or upgrade evidence.";
  });
  t.diagnostic(JSON.stringify(report));
});
