// Independent reference: no Solidity helper calls, RPC proof claims, or admission claims.
import { AbiCoder, getBytes, hexlify, keccak256, toUtf8Bytes } from 'ethers';

const domain=keccak256(toUtf8Bytes('efs2/record/1'));
function check(ok,reason) { if(!ok) throw new Error(`ChunkTree: ${reason}`); }
function bytes(value) { return Buffer.from(getBytes(value)); }
function id(value) { check(typeof value==='string'&&/^0x[0-9a-fA-F]{64}$/.test(value),'bytes32'); return value.toLowerCase(); }

export function chunkTree(value,typeId,chunkSize=bytes(value).length?4096:262144) {
  const data=bytes(value); id(typeId);
  check(Number.isSafeInteger(chunkSize),'chunk size integer');
  check(data.length===0?chunkSize===262144:chunkSize>=4096&&chunkSize<=8388608&&chunkSize%4096===0,'chunk geometry');
  const chunkCount=Math.ceil(data.length/chunkSize);
  check(chunkCount<=16777216,'chunk count');
  let level=[];
  for(let start=0;start<data.length;start+=chunkSize)
    level.push(keccak256(Buffer.concat([Buffer.from([0]),data.subarray(start,start+chunkSize)])));
  while(level.length>1) {
    const next=[];
    for(let i=0;i<level.length;i+=2) next.push(i+1===level.length?level[i]:keccak256(Buffer.concat([Buffer.from([1]),bytes(level[i]),bytes(level[i+1])])));
    level=next;
  }
  const root=level[0]??keccak256('0x02');
  const packed=Buffer.alloc(48);
  packed.writeUInt32BE(chunkSize,0); packed.writeUInt32BE(chunkCount,4);
  packed.writeBigUInt64BE(BigInt(data.length),8); bytes(root).copy(packed,16);
  const body=hexlify(packed);
  const recordId=keccak256(AbiCoder.defaultAbiCoder().encode(['bytes32','bytes32','bytes32'],[domain,typeId,keccak256(body)]));
  return {chunkSize,chunkCount,totalSize:data.length,root,body,recordId};
}

export function verifyFile(typeId,recordId,body,value) {
  const packed=bytes(body); check(packed.length===48,'body width');
  const data=bytes(value);
  check(packed.readBigUInt64BE(8)===BigInt(data.length),'total size');
  const computed=chunkTree(data,typeId,packed.readUInt32BE(0));
  check(computed.body===hexlify(packed),'tree/body mismatch');
  check(computed.recordId===id(recordId),'RecordId mismatch');
  return true;
}

export function verifiedRange(typeId,recordId,body,value,offset,length) {
  verifyFile(typeId,recordId,body,value);
  const data=bytes(value);
  check(Number.isSafeInteger(offset)&&Number.isSafeInteger(length)&&offset>=0&&length>=0,'range integers');
  check(offset<=data.length&&length<=data.length-offset,'range bounds');
  return Buffer.from(data.subarray(offset,offset+length));
}

// Caller supplies the expected frozen Type and explicit local resource cap.
// All observations use one block number. This is RPC recovery, NOT a state proof.
export async function recoverFile(carrier,typeId,recordId,{blockTag,maxBytes}) {
  id(typeId); id(recordId);
  check(Number.isSafeInteger(blockTag)&&blockTag>=0,'explicit block number');
  check(Number.isSafeInteger(maxBytes)&&maxBytes>=0,'reader cap');
  const [exists,body]=await carrier.metadata(recordId,{blockTag});
  check(exists,'missing entry');
  const packed=bytes(body); check(packed.length===48,'body width');
  check(packed.readBigUInt64BE(8)<=BigInt(maxBytes),'reader cap exceeded');
  const data=bytes(await carrier.read(recordId,{blockTag}));
  check(data.length<=maxBytes,'reader cap exceeded');
  verifyFile(typeId,recordId,body,data);
  return {verified:true,body,data,blockTag};
}
