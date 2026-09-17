// Bounded orchestration over exact SDK reads and ordinary guarded publications.
// A preview is capability-bound to its SDK and can execute only once.
const previews=new WeakMap();
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
export async function previewOwnPlacementRelease({sdk,author,folder,name,maxPlacements=64,scanBudget=128}) {
  if(!Number.isInteger(maxPlacements)||maxPlacements<1||maxPlacements>128)throw Error('RELEASE_BUDGET');
  const context=await sdk.pin(),rows=[],directories=[],seen=new Set(),positions=new Set();
  let reason=null;
  const walk=async row=>{
    if(positions.has(row.position))return;
    positions.add(row.position);
    if(positions.size>maxPlacements){reason='PLACEMENT_LIMIT';return;}
    if(row.name.knowledge!=='PRESENT'||!['PRESENT','MASKED'].includes(row.knowledge)){reason='UNKNOWN_PLACEMENT';rows.push(row);return;}
    if(row.kind==='directory'&&!seen.has(row.file)){
      seen.add(row.file);
      const page=await sdk.readOwnPlacements({author,folder:row.file,context,budget:scanBudget});
      if(page.coverage!=='COMPLETE'||page.knowledge==='UNKNOWN')reason='PARTIAL_DIRECTORY';
      directories.push({folder:row.file,rows:page.value});
      for(const child of page.value)await walk(child);
    }
    rows.push(row);
  };
  const root=await sdk.readPlacement({folder,name,authors:[author],context});
  if(!['PRESENT','MASKED'].includes(root.knowledge))reason='ROOT_NOT_RELEASABLE';
  else await walk({...root.value,file:root.value.target,knowledge:root.knowledge,name:{knowledge:'PRESENT',value:name},kind:root.knowledge==='MASKED'?'mask':root.value.kind});
  const preview=freeze({author,folder,name,basis:context,rows:rows.map(r=>({...r,name:r.name.value})),directories,scanBudget,
    coverage:reason?'PARTIAL':'COMPLETE',reason,
    scope:'OWN_REACHABLE_PLACEMENTS_AND_MASKS',
    retained:'All Records, File HEADs, tags and other authors remain. Outside aliases remain. Descendants behind masks or other authors’ directory links are not traversed. New or unseen concurrent descendants are not globally erased.'});
  previews.set(preview,{sdk,used:false});return preview;
}

export async function executeOwnPlacementRelease({sdk,preview,signDigest,sendTransaction,onProgress=()=>{}}) {
  const state=previews.get(preview);
  if(!state||state.sdk!==sdk||state.used||preview.coverage!=='COMPLETE')throw Error('RELEASE_PREVIEW_REQUIRED');
  state.used=true;
  const completed=[],pending=[...preview.rows];let currentPlan=null;
  try {
    while(pending.length){
      // A new pinned read before EACH signature catches changes between steps.
      const context=await sdk.pin();
      for(const row of pending){
        const now=await sdk.readPlacement({folder:row.folder,name:row.name,authors:[preview.author],context});
        if(!['PRESENT','MASKED'].includes(now.knowledge)||!same(now.value.selection,row.selection))throw Error('RELEASE_STALE_PREVIEW');
      }
      for(const directory of preview.directories){
        const now=await sdk.readOwnPlacements({author:preview.author,folder:directory.folder,context,budget:preview.scanBudget});
        const expected=directory.rows.filter(r=>!completed.some(c=>c.row.position===r.position));
        if(now.coverage!=='COMPLETE'||now.knowledge==='UNKNOWN'||!same(now.value.map(r=>[r.position,r.selection]),expected.map(r=>[r.position,r.selection])))throw Error('RELEASE_DIRECTORY_CHANGED');
      }
      const row=pending[0];
      currentPlan=await sdk.prepare({operation:'releasePlacement',author:preview.author,authors:[preview.author],folder:row.folder,name:row.name,context});
      const signed=await sdk.authorize(currentPlan,signDigest);
      const submission=await sdk.submit(signed,sendTransaction),outcome=await sdk.reconcile(submission.id);
      if(outcome.status!=='EFFECTS_VERIFIED')return {status:'PARTIAL',reason:outcome.status,completed,pending,currentPlan:currentPlan.id,outcome};
      completed.push({row,id:currentPlan.id,outcome});pending.shift();currentPlan=null;
      await onProgress({completed:[...completed],pending:[...pending]});
    }
    return {status:'COMPLETE',completed,pending,atomic:false,retained:preview.retained};
  }catch(error){return {status:'PARTIAL',reason:error.message,completed,pending,currentPlan:currentPlan?.id??null,atomic:false,retained:preview.retained};}
}
