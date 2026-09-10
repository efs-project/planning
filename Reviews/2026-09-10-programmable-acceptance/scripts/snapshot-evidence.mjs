import { readFileSync, writeFileSync } from 'node:fs';
const evidence=JSON.parse(readFileSync(new URL('../evidence.local.json',import.meta.url),'utf8'));
writeFileSync(new URL('../sdk/observed-run.json',import.meta.url),JSON.stringify(evidence,null,2)+'\n');
writeFileSync(new URL('../web/example.html',import.meta.url),readFileSync(new URL('../web/example.local.html',import.meta.url)));
