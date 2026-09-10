import { id } from 'ethers';
import { decodeFields } from '../sdk/codec.ts';
import type { Declaration } from '../sdk/codec.ts';
export type Bundle={typeId:string;descriptor?:(Declaration&{descriptor:string});body:string;receipt:unknown;basis:unknown;effect:string};
const text=(value:unknown)=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const json=(value:unknown)=>JSON.stringify(value,(_,v)=>typeof v==='bigint'?v.toString():v,2);
export function inspect(bundle:Bundle):string {
 const d=bundle.descriptor;
 let metadata='UNKNOWN_EXACT_TYPE — editing refused; raw bytes retained',decoded:unknown='NOT_EVALUATED';
 if(d) {
  const canonical={name:d.name,version:d.version,fields:d.fields.map(f=>({name:f.name,kind:f.kind})),rule:d.rule&&{artifact:d.rule.artifact,label:d.rule.label,config:d.rule.config.map(f=>({name:f.name,kind:f.kind})),local:d.rule.local.map(f=>({name:f.name,kind:f.kind})),mode:d.rule.mode,gasLimit:d.rule.gasLimit}};
  metadata=id(JSON.stringify(canonical))===d.descriptor?'LOCAL_DISPLAY_METADATA — descriptor commitment matches supplied declaration, not a chain-bound label claim':'UNTRUSTED_DISPLAY_METADATA — descriptor commitment mismatch';
  if(!metadata.startsWith('UNTRUSTED')) try {decoded=decodeFields(d.fields,bundle.body);} catch {decoded='STRUCTURE_FAILED';}
 }
 return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Acceptance evidence inspector</title><style>body{font:16px system-ui;max-width:960px;margin:40px auto;padding:20px;background:#f6f5f0;color:#18222b}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:white;padding:16px}section{margin-block:24px}h1{font-size:28px}</style><h1>${text(d?.name??'Unknown Type')}</h1><p>Disposable standalone lab · no full C0 claim</p><p>${text(metadata)}</p><section><h2>Exact Type</h2><pre>${text(bundle.typeId)}</pre><h2>Named fields and mandatory rule</h2><pre>${text(json(d??'UNKNOWN'))}</pre><h2>Structurally decoded only</h2><pre>${text(json(decoded))}</pre></section><section><h2>Retained acceptance receipt</h2><pre>${text(json(bundle.receipt))}</pre><h2>Pinned source basis</h2><pre>${text(json(bundle.basis))}</pre><p>Effect: ${text(bundle.effect)} · Current policy: NOT_EVALUATED · Consumer pin match: NOT_EVALUATED</p><h2>Exact body bytes</h2><pre>${text(bundle.body)}</pre></section></html>`;
}
