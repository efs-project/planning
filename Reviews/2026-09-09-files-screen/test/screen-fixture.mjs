// Fixture writes and full-state reconstruction exist only on the test side.
import { withUpgrade,mountedFixture,A,B } from '../../2026-09-09-files-reader/test/fixture.mjs';
import { oracle } from '../../2026-09-09-files-reader/test/oracle.mjs';
import { Interface } from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
import { startScreenServer } from '../scripts/server.mjs';
const controls=['bootstrap','configuration','currentRevision','revisionAt','fixtureReadContext','counts','preparationHelper','preparationCodehash','admissionLibrary','admissionCodehash','owner',
  'getRecord','getOccurrence','getOccurrenceByOrdinal','getBindingHead','getBindingAtBasis','readHistory','pagePostingsHydrated','resolve','validatePlan'];
export async function withFilesScreen(action){
  return withUpgrade(async lab=>{
    const f=await mountedFixture(lab),truths=new Map(),snapshots=[];
    async function capture(id,label,description){const truth=await oracle(lab);truths.set(id,truth);snapshots.push({id,label,description,blockTag:'0x'+truth.basis.blockNumber.toString(16)});}
    for(const [i,name] of ['note.txt',...Array.from({length:7},(_,i)=>'n'+i+'.txt')].entries()){
      const entry=i===0?f.entryA:await f.claim(A,name,i%2?f.fileB:f.fileA);await f.claim(B,name,f.fileA,{target:entry});
    }
    await capture('agreement','Shared names','A and B point each of eight names to the same Entry. Two File Objects are reused across the placements.');
    await f.claim(B,'note.txt',f.fileA,{tombstone:true});
    await capture('only-a','Only A names the note','B stopped asserting note.txt. Both agree requires a claim from both sources.');
    await f.claim(B,'note.txt',f.fileB);
    await capture('disagree','Two different claims','A and B name different File Objects at note.txt. A-first or B-first selects by priority; Both agree leaves a conflict.');
    await f.claim(A,'field-notes.txt',f.fileA);await f.claim(A,'note.txt',f.fileA,{whiteout:true});
    await capture('masked','New name + old-name mask','A names the same File Object field-notes.txt and masks note.txt. These were separate fixture publications, not an atomic rename.');
    await f.claim(A,'note.txt',f.fileA,{tombstone:true});
    await capture('retracted','A stops asserting the old name','A retracts its old-name claim. The lower-priority B claim can become visible again.');
    await f.claim(A,'note.txt',f.fileA,{encodedName:''});
    await capture('malformed','Malformed winning claim','A points the note position to an Entry with an invalid empty name. It cannot become a valid file by falling back.');
    await lab.upgrade();
    await capture('upgraded','Same claims, upgraded reader host','The host is now U2; the malformed claim is unchanged. Older observations remain explicitly pinned to U1.');
    const selectors=new Set();for(const iface of [lab.readIface,lab.iface,new Interface(['function owner() view returns(address)'])]){
      for(const fragment of iface.fragments)if(fragment.type==='function'&&controls.includes(fragment.name)&&['view','pure'].includes(fragment.stateMutability))selectors.add(fragment.selector);
    }
    const addresses=[...Object.values(lab.expected.components).map(c=>c.address),...Object.keys(lab.expected.implementations)];
    const config={kind:'DISPOSABLE_GUEST_FILES',expected:lab.expected,root:f.root,mounts:f.mounts,plans:f.plans,snapshots,defaultSnapshot:'disagree',authors:{A,B}};
    const server=await startScreenServer({config,addresses,selectors:[...selectors],rpc:lab.rpc});
    try{return await action({lab,f,truths,config,...server});}finally{await server.close();}
  },{profile:'reads'});
}
