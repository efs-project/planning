import { createFixtureReader,lookupName,openDirectory,assessRecord,nameAssessment } from '../index.mjs';
import type { ReaderSource,ReaderContext } from '../index.mjs';
async function guest(source:ReaderSource,context:ReaderContext,mountId:string){
  const opened=await createFixtureReader({source,context}).open();
  if(opened.status!=='READY')return opened.reason;
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
const exportsAgree:{[K in keyof typeof import('../index.mjs')]:true}={DEFAULT_LIMITS:true,FIXTURE:true,TYPES:true,assessRecord:true,bindingKey:true,bindingScopeKey:true,createFixtureReader:true,lookupName:true,nameAssessment:true,nameRole:true,openDirectory:true,ordinaryRecord:true,parsePlan:true,positionKey:true,purposeAndScope:true};
void exportsAgree;
