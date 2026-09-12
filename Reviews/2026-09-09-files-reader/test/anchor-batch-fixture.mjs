// Comparison-only frozen consumer. Both consumers use the SAME scope singleton.
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createFixtureReader} from '../reader-scope.mjs';
export const scalarRevision='8f101f1f94fe46a6ac90b6287443929427fa9b23';
export const scalarPath='Reviews/2026-09-09-files-reader/files-reader.mjs';
const frozen=execFileSync('git',['show',scalarRevision+':'+scalarPath],{cwd:fileURLToPath(new URL('../../..',import.meta.url)),encoding:'utf8'});
export const scalarSha256=createHash('sha256').update(frozen).digest('hex');
const wired=frozen.replaceAll("'./files-profile.mjs'",JSON.stringify(new URL('../files-profile.mjs',import.meta.url).href)).replaceAll("'./reader-scope.mjs'",JSON.stringify(new URL('../reader-scope.mjs',import.meta.url).href));
export const scalar=await import('data:text/javascript;base64,'+Buffer.from(wired).toString('base64'));
export function capabilityManifest(lab,capability='v1') {
  const expected=structuredClone(lab.expected);
  for(const [name,c] of Object.entries(expected.components))if(name==='UpgradeableReadFixtureCore'||name==='UpgradeableReadFixtureCoreU2') {
    if(capability===undefined)delete expected.implementations[c.address].readCapabilities;
    else expected.implementations[c.address].readCapabilities={checkedRecords:capability};
  }
  return expected;
}
export async function ready(lab,{expected=lab.expected,request=lab.rpc,limits,blockTag='latest',signal,source}={}) {
  const result=await createFixtureReader({source:source??{identity:expected.source,epoch:1,request},context:{expected,limits}}).open({blockTag,signal});
  if(result.status!=='READY')throw Error(result.reason);
  return result.scope;
}
export const project=s=>Object.fromEntries(['basis','domain','coverage','rows','unresolved','masked','absent','progress','continuation','qualification','rowsEvidence','reason'].filter(k=>k in s).map(k=>[k,s[k]]));
export function selectors(lab,evidence) {
  const counts={};
  for(const e of evidence){let name=e.method;if(name==='eth_call')try{name=lab.readIface.parseTransaction({data:e.params[0].data})?.name??e.params[0].data.slice(0,10);}catch{name=e.params[0].data.slice(0,10);}counts[name]=(counts[name]??0)+1;}
  return counts;
}
