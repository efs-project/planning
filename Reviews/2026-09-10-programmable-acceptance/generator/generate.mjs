import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { id } from 'ethers';
const root=new URL('../',import.meta.url);
const kinds=['uint256','address','bytes32','bool'];
const reserved=new Set('constructor prototype __proto__ contract library struct function mapping address bool uint256 bytes32 memory calldata storage return returns type enum event error modifier assembly unchecked receive fallback payable external internal private public immutable constant interface import pragma abstract delete new this super msg block tx abi true false'.split(' '));
const ident=s=>typeof s==='string'&&/^[A-Za-z][A-Za-z0-9_]*$/.test(s)&&!reserved.has(s);
function exact(value,keys) { if(!value||typeof value!=='object'||Object.keys(value).sort().join()!==keys.sort().join()) throw Error('ambiguous declaration keys'); }
function fields(fs,empty=false) {
  if(!Array.isArray(fs)||fs.length>8||(!empty&&!fs.length)) throw Error('field count');
  const seen=new Set();
  for(const f of fs) { exact(f,['name','kind']); if(!ident(f.name)||!kinds.includes(f.kind)||seen.has(f.name)) throw Error('invalid or duplicate field'); seen.add(f.name); }
}
export function validate(ds) {
  const names=new Set();
  for(const d of ds) {
    exact(d,['name','version','fields','rule']);
    if(!ident(d.name)||d.name==='makeCodec'||names.has(d.name.toLowerCase())||typeof d.version!=='string'||!d.version.trim()) throw Error('invalid or duplicate declaration');
    names.add(d.name.toLowerCase()); fields(d.fields);
    if(d.rule!==null) { exact(d.rule,['artifact','label','config','local','mode','gasLimit']); fields(d.rule.config,true);fields(d.rule.local); if(d.rule.config.some(f=>f.name==='codeHash')||!ident(d.rule.artifact)||typeof d.rule.label!=='string'||!d.rule.label||![1,2].includes(d.rule.mode)||!Number.isInteger(d.rule.gasLimit)||d.rule.gasLimit<25000||d.rule.gasLimit>500000) throw Error('invalid rule'); }
  }
}
const canonical=d=>({name:d.name,version:d.version,fields:d.fields.map(f=>({name:f.name,kind:f.kind})),rule:d.rule&&{artifact:d.rule.artifact,label:d.rule.label,config:d.rule.config.map(f=>({name:f.name,kind:f.kind})),local:d.rule.local.map(f=>({name:f.name,kind:f.kind})),mode:d.rule.mode,gasLimit:d.rule.gasLimit}});
const tsType=k=>k==='uint256'?'bigint':k==='bool'?'boolean':'string';
function solidity(d,descriptor) {
 const rule=d.rule;
 const args=rule?['bytes32 codeHash',...rule.config.map(f=>`${f.kind} ${f.name}`)].join(', '):'';
 const sem=rule?(rule.config.length?`keccak256(abi.encode(bytes32(${id(rule.label)}), ${rule.config.map(f=>f.name).join(', ')}))`:`bytes32(${id(rule.label)})`):'bytes32(0)';
 const assignments=d.fields.map((f,i)=>`v.${f.name} = ${f.kind==='bool'?`words[${i}] != 0`:f.kind==='address'?`address(uint160(uint256(words[${i}])))`:f.kind==='uint256'?`uint256(words[${i}])`:`words[${i}]`};`).join('\n        ');
 const checks=d.fields.map((f,i)=>f.kind==='bool'?`require(uint256(words[${i}]) <= 1, "canonical bool");`:f.kind==='address'?`require(uint256(words[${i}]) >> 160 == 0, "canonical address");`:'').filter(Boolean).join('\n        ');
 return `// Generated; edit declarations, then npm run generate.\n// SPDX-License-Identifier: MIT\npragma solidity 0.8.30;\nimport {AT} from "../contracts/src/AcceptanceTypes.sol";\nimport {AcceptanceCore} from "../contracts/src/AcceptanceCore.sol";\nlibrary ${d.name}Codec {\n    struct Fields { ${d.fields.map(f=>`${f.kind} ${f.name};`).join(' ')} }\n    function descriptor() internal pure returns(bytes32) { return ${descriptor}; }\n    function kinds() internal pure returns(bytes memory) { return hex"${d.fields.map(f=>kinds.indexOf(f.kind).toString().padStart(2,'0')).join('')}"; }\n    function encode(Fields memory v) internal pure returns(bytes memory) { return abi.encode(${d.fields.map(f=>`v.${f.name}`).join(', ')}); }\n    function decode(bytes memory body) internal pure returns(Fields memory v) {\n        require(body.length == ${d.fields.length*32}, "canonical length");\n        bytes32[${d.fields.length}] memory words = abi.decode(body,(bytes32[${d.fields.length}]));\n        ${checks}\n        ${assignments}\n    }\n    function rule(${args}) internal pure returns(AT.Rule memory) { return AT.Rule(${rule?'codeHash':'bytes32(0)'}, ${sem}, ${rule?.mode??0}, ${rule?.gasLimit??0}); }\n    function typeId(AT.Rule memory r) internal pure returns(bytes32) {\n        bytes32 rid = r.mode == 0 ? bytes32(0) : keccak256(abi.encode(keccak256("efs.acceptance.rule.v1"),r.codeHash,r.semanticConfig,r.mode,r.gasLimit));\n        bytes32 shape = keccak256(abi.encode(keccak256("efs.acceptance.shape.v1"),kinds()));\n        return keccak256(abi.encode(keccak256("efs.acceptance.type.v1"),descriptor(),shape,rid));\n    }\n    function register(AcceptanceCore core, AT.Rule memory r) internal returns(bytes32) { return core.registerType(descriptor(),kinds(),r); }\n}\n`;
}
export function generate(check=false) {
 const ds=readdirSync(new URL('declarations/',root)).filter(n=>n.endsWith('.json')).sort().map(n=>parseDeclaration(readFileSync(new URL('declarations/'+n,root),'utf8')));
 validate(ds); const descriptions=[]; const outputs=new Map();
 for(const raw of ds) {
   const d=canonical(raw),descriptor=id(JSON.stringify(d)); descriptions.push({...d,descriptor});
   const type=`{ ${d.fields.map(f=>`${f.name}:${tsType(f.kind)}`).join('; ')} }`;
   const config=`{ ${(d.rule?.config??[]).map(f=>`${f.name}:${tsType(f.kind)}`).join('; ')} }`;
   const local=`{ ${(d.rule?.local??[]).map(f=>`${f.name}:${tsType(f.kind)}`).join('; ')} }`;
   outputs.set(d.name+'.ts',`// Generated; edit declarations, then npm run generate.\nimport { makeCodec } from '../sdk/codec.ts';\nexport type ${d.name}Fields = ${type};\nexport const ${d.name} = makeCodec<${d.name}Fields,${config},${local}>(${JSON.stringify(d)}, '${descriptor}');\n`);
   outputs.set(d.name+'Codec.sol',solidity(d,descriptor).replace(/[ \t]+\n/g,'\n'));
 }
 outputs.set('descriptors.json',JSON.stringify(descriptions,null,2)+'\n');
 if(!check) mkdirSync(new URL('generated/',root),{recursive:true});
 for(const [name,body] of outputs) { const path=new URL('generated/'+name,root); if(check) {if(readFileSync(path,'utf8')!==body) throw Error('stale generated '+name);} else writeFileSync(path,body); }
 const existing=readdirSync(new URL('generated/',root));
 if(existing.some(n=>!outputs.has(n))) throw Error('unexpected generated artifact');
}
export function parseDeclaration(source) {
 const parsed=JSON.parse(source),tokens=source.match(/"(?:\\.|[^"\\])*"|[{}\[\]:,]|[^\s{}\[\]:,]+/g)??[],stack=[];
 for(let i=0;i<tokens.length;i++) {
  const token=tokens[i];
  if(token==='{') stack.push(new Set());
  else if(token==='[') stack.push(null);
  else if(token==='}'||token===']') stack.pop();
  else if(token.startsWith('"')&&tokens[i+1]===':') {const keys=stack.at(-1),key=JSON.parse(token);if(keys.has(key)) throw Error('duplicate JSON key');keys.add(key);}
 }
 return parsed;
}
if(process.argv[1]===fileURLToPath(import.meta.url)) generate(process.argv.includes('--check'));
