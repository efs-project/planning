// Prototype ASCII grammar. No normalization, percent aliases, . or .. traversal.
export function encodePath(segments) {
  if(!Array.isArray(segments)||segments.length>256||segments.some(s=>typeof s!=='string'||s.length>255
    ||!(/^[a-z0-9._-]+$/).test(s)||s==='.'||s==='..'))throw Error('COMPACT_PATH_GRAMMAR');
  return '/'+segments.map(s=>encodeURIComponent(s)).join('/');
}
export function decodePath(path) {
  if(typeof path!=='string'||!path.startsWith('/'))throw Error('COMPACT_PATH_GRAMMAR');
  const segments=path==='/'?[]:path.slice(1).split('/').map(s=>decodeURIComponent(s));
  if(encodePath(segments)!==path)throw Error('COMPACT_PATH_GRAMMAR');return segments;
}
/// The budget bounds root/edge operations, not RPC calls. Each SDK operation is
/// independently bounded. Repeated IDs are checked only along this route; aliases
/// and mixed-author cycles elsewhere remain possible. No global tree promise.
export async function resolvePath({sdk,root,segments,principals,authors,context,budget=64}) {
  encodePath(segments);
  const lens=principals??authors;
  if(!!principals===!!authors||!Array.isArray(lens)||lens.length===0||lens.length>255)throw Error('COMPACT_PATH_LENS');
  if(!Number.isInteger(budget)||budget<1||budget>256)throw Error('COMPACT_PATH_BUDGET');
  const selectedLens=principals?{principals:[...principals]}:{authors:authors?[...authors]:undefined};
  const trail=[],seen=new Set([root.toLowerCase()]);let target=root,kind='directory',work=1;
  const finish=(status,detail)=>({status,knowledge:status==='PARTIAL'?'UNKNOWN':status,coverage:['UNKNOWN','PARTIAL','INVALID'].includes(status)?'PARTIAL':'COMPLETE',
    basis:context,root,segments:[...segments],...selectedLens,target,kind,trail,work,...(detail?{detail}:{})});
  const initial=await sdk.readDirectory({directory:root,context});
  if(initial.knowledge!=='PRESENT')return finish(initial.knowledge,initial);
  if(initial.coverage!=='COMPLETE')return finish('PARTIAL',initial);
  for(const name of segments){
    if(kind!=='directory')return finish('NON_DIRECTORY');
    if(work>=budget)return finish('PARTIAL');
    const edge=await sdk.readPlacement({folder:target,name,...selectedLens,context});work++;
    trail.push({from:target,name,...edge.value,knowledge:edge.knowledge,coverage:edge.coverage});
    if(edge.knowledge!=='PRESENT')return finish(edge.knowledge,edge);
    if(edge.coverage!=='COMPLETE')return finish('PARTIAL',edge);
    target=edge.value.target;kind=edge.value.kind;
    if(kind==='directory'){
      if(seen.has(target.toLowerCase()))return finish('CYCLE');seen.add(target.toLowerCase());
    }
  }
  return finish('PRESENT');
}
