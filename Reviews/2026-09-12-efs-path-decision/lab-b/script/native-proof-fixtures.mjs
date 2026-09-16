/** Test-only malicious-state builder, never an export/consensus path. It creates
 * its own Patricia trie bottom-up to falsify trust in arbitrary supplied roots. */
import {positiveValue,canonicalRlp,positiveStorage,nativeKeys} from '../browser/native-proof.mjs';
import {INTENT,EXECUTION,archiveProfile} from '../browser/guarded-archive.mjs';
export function trieFixture(e,entries){
  const items=entries.map(([key,value])=>({key:e.keccak256(key).slice(2),value}));
  const compact=(path,leaf)=>'0x'+(path.length%2?(leaf?'3':'1')+path:(leaf?'20':'00')+path);
  const ref=n=>(n.raw.length-2)/2<32?n.rlp:e.keccak256(n.raw);
  const make=(rows,depth)=>{
    let rlp,children;
    if(rows.length===1)rlp=[compact(rows[0].key.slice(depth),true),rows[0].value];
    else{
      let common=0;while(depth+common<64&&rows.every(x=>x.key[depth+common]===rows[0].key[depth+common]))common++;
      if(common){const child=make(rows,depth+common);rlp=[compact(rows[0].key.slice(depth,depth+common),false),ref(child)];children=[child];}
      else{rlp=Array(17).fill('0x');children=[];for(let n=0;n<16;n++){const next=rows.filter(x=>x.key[depth]===n.toString(16));if(next.length){const child=make(next,depth+1);children[n]=child;rlp[n]=ref(child);}}}
    }
    return {rlp,raw:e.encodeRlp(rlp),children};
  };
  const tree=make(items,0),proof=key=>{
    const path=e.keccak256(key).slice(2),nodes=[];let n=tree,at=0;
    while(n){nodes.push(n.raw);if(n.rlp.length===17)n=n.children[Number.parseInt(path[at++],16)];
      else if(n.children){at+=n.rlp[0].slice(2).length-(Number.parseInt(n.rlp[0][2],16)%2?1:2);n=n.children[0];}else break;}
    return nodes;
  };
  return {root:e.keccak256(tree.raw),proof};
}
export function packetValues(e,packet){
  const root=canonicalRlp(e,packet.header)[3],account=canonicalRlp(e,positiveValue(e,root,packet.source.ledger,packet.witness.accountProof));
  return packet.witness.slots.map(s=>positiveStorage(e,account[2],s.key,s.nodes));
}
export function fabricatedRootPacket(e,packet,values=packetValues(e,packet)){
  const copy=structuredClone(packet),storage=trieFixture(e,copy.witness.slots.map((s,i)=>[s.key,e.encodeRlp(values[i]===0n?'0x':e.toBeHex(values[i]))]));
  const account=trieFixture(e,[[copy.source.ledger,e.encodeRlp(['0x01','0x',storage.root,copy.source.codeHash])]]);
  const header=e.decodeRlp(copy.header);header[3]=account.root;copy.header=e.encodeRlp(header);
  copy.witness.accountProof=account.proof(copy.source.ledger);copy.witness.slots=copy.witness.slots.map(s=>({key:s.key,nodes:storage.proof(s.key)}));return copy;
}
export function counterfeitRows(e,item,source,{implementation=source.ledger,implementationCodeHash=source.codeHash}={}){
  const packet=item.packet,v=packetValues(e,packet),c=e.AbiCoder.defaultAbiCoder(),hash=(t,x)=>e.keccak256(c.encode(t,x)),p=archiveProfile(e);
  const origin=hash(['bytes32','uint256','address'],[e.id('efs.lab.realm-origin/2'),source.chainId,source.ledger]);
  const principal=hash(['bytes32','uint256','bytes32','address'],[e.id('efs2/principal/1'),2,origin,item.verification.author]);
  const execution={...item.verification.execution,origin,shellCodeHash:source.codeHash,implementation,implementationCodeHash};
  const executionSet=hash(['bytes32','bytes32','bytes32','bytes32',EXECUTION],[e.id('efs.lab.execution-set/2'),p.layoutId,p.legacyDomain,p.guardedDomain,execution]);
  const intent={...item.verification.intent,realmOrigin:origin,executionSet};
  const digest=e.keccak256(e.concat(['0x1901',p.guardedDomain,hash(['bytes32',INTENT,'bytes32'],[e.id('IntentV2(bytes32 realmId,bytes32 realmOrigin,bytes32 executionSet,address author,uint64 nonce,uint64 deadline,bytes32 acceptanceProfile,bytes32 indexObligations,bytes32 readSetHash,bytes32 actionsHash)'),intent,e.toBeHex(v[4],32)])]));
  const publicationId=hash(['bytes32','bytes32','bytes32'],[e.id('efs.lab.publication/2'),principal,digest]);
  v[5]=BigInt(principal);v[6]=BigInt(executionSet);v[8]=BigInt(digest);v[10]=BigInt(origin);v[12]=BigInt(source.codeHash);v[13]=BigInt(implementation);v[14]=BigInt(implementationCodeHash);
  const keys=nativeKeys(e,packet.witness.publication,item.verification.firstAdmission,executionSet,publicationId,item.verification.recordId,item.verification.author);
  const add=(key,value)=>{keys.push(key);v.push(value);};
  const body=e.getBytes(packet.witness.body),bodyRoot=hash(['bytes32','uint256'],[item.verification.recordId,3]);
  for(let i=0;i<body.length;i+=32)add(hash(['uint256','bytes32'],[i/32,bodyRoot]),BigInt(e.hexlify(body.slice(i,i+32)).padEnd(66,'0')));
  // Old physical carrier intentionally used by this untrusted fixture. The
  // source runtime is current; its legacy-first getter must snapshot these bytes.
  const reads=e.getBytes(packet.witness.reads),readRoot=hash(['bytes32','uint256'],[e.toBeHex(v[7],32),15]);
  add(readRoot,BigInt(reads.length*2+1));const readBase=BigInt(e.keccak256(readRoot));
  for(let i=0;i<reads.length;i+=32)add(e.toBeHex(readBase+BigInt(i/32),32),BigInt(e.hexlify(reads.slice(i,i+32)).padEnd(66,'0')));
  return {keys,values:v};
}
