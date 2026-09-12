import { createFixtureReader,lookupName,openDirectory,assessRecord,nameAssessment } from '../index.mjs';
import type { ReaderSource,ReaderContext,Evidence } from '../index.mjs';
async function guest(source:ReaderSource,context:ReaderContext,mountId:string){
  // @ts-expect-error Reader sources require a nonnegative safe-integer epoch.
  const invalidSourceEpoch:ReaderSource={...source,epoch:'not-a-number'};
  void invalidSourceEpoch;
  const opened=await createFixtureReader({source,context}).open();
  if(opened.status!=='READY')return opened.reason;
  const batch=await opened.scope.getRecords(['0x'+'00'.repeat(32)]);
  if(batch.status==='OK') {
    const block:bigint=batch.basis.blockNumber;
    const evidence:number=batch.evidenceId;
    const row=batch.records[0];
    const id:string=row.recordId, typeId:string=row.typeSchemaId, body:string=row.canonicalBody;
    const ordinal:bigint=row.firstAdmitOrdinal, index:number=row.evidenceIndex;
    // @ts-expect-error Acquired Records remain readonly and coupled to their basis/evidence.
    row.recordId='forged';
    // @ts-expect-error Callers cannot silently append an unacquired row.
    batch.records.push(row);
    void [block,evidence,id,typeId,body,ordinal,index];
  } else {
    const evidence:number|null=batch.evidenceId;
    // @ts-expect-error UNAVAILABLE never exposes a successful prefix.
    batch.records;
    // @ts-expect-error UNAVAILABLE never exposes a success basis.
    batch.basis;
    void evidence;
  }
  const basisEpoch:number=opened.scope.basis.epoch;
  void basisEpoch;
  for(const evidence of opened.scope.evidence()){
    const endedMs:number|null=evidence.endedMs;
    if(endedMs!==null){
      const completedAt:number=endedMs;
      void completedAt;
    }
  }
  const pendingEvidence:Evidence={id:0,sequence:0,method:'pending',params:[],purpose:'test',bytes:0,startedMs:0,endedMs:null};
  void pendingEvidence;
  const result=await lookupName(opened.scope,{mountId,name:'note.txt'});
  if(result.outcome==='FOUND'){
    const id:string=result.value.nodeId;
    const qualified:'QUALIFIED'=result.qualification.status;
    const bytes:'NOT_READ'=result.value.content;
    void [id,qualified,bytes];
  }else{
    // @ts-expect-error No usable child on UNKNOWN, CONFLICT, MASKED or ABSENT.
    result.value.nodeId;
  }
  const stream=openDirectory(opened.scope,{mountId,pageSize:4});
  const page=await stream.loadMore();
  if(page.qualification.status==='QUALIFIED'&&page.rowsEvidence==='CURRENT_SEALED')for(const r of page.rows)r.value.nodeId;
  for(const unresolved of page.unresolved){
    // @ts-expect-error Unresolved evidence cannot supply a child value.
    unresolved.value.nodeId;
  }
  // @ts-expect-error No wallet/mutation method exists on this reader.
  opened.scope.sendTransaction({});
  stream.close();opened.scope.close();return stream.snapshot();
}
const name=nameAssessment('Trip');if(name.status==='UNSUPPORTED')name.reason;
const record=assessRecord('0x','0x','0x');if(record.status!=='ACCEPTED')record.reason;
void guest;
const exportsAgree:{[K in keyof typeof import('../index.mjs')]:true}={DEFAULT_LIMITS:true,FIXTURE:true,TYPES:true,assessRecord:true,bindingKey:true,bindingScopeKey:true,byteLength:true,contentDigest:true,createFixtureReader:true,lookupName:true,nameAssessment:true,nameRole:true,openDirectory:true,openFile:true,openHistory:true,openRemoved:true,openRevisions:true,openTags:true,ordinaryRecord:true,parsePlan:true,positionKey:true,purposeAndScope:true,tagId:true};
void exportsAgree;
