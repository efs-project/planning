import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

const lab=fileURLToPath(new URL('./',import.meta.url));
const runtime=resolve(lab,'.workbench');
const readConfig=async()=>JSON.parse(await readFile(resolve(runtime,'config.json'),'utf8'));

export default ()=>({
  root:resolve(lab,'browser'),base:'./',publicDir:false,
  resolve:{alias:{
    '/vendor/ethers.mjs':resolve(lab,'node_modules/ethers/lib.esm/index.js'),
    './compact-read-transport.mjs':resolve(lab,'script/compact-read-transport.mjs')
  }},
  server:{host:'127.0.0.1',port:Number(process.env.EFS_UI_PORT??60627),strictPort:true,
    fs:{allow:[resolve(lab,'browser'),resolve(lab,'script/compact-read-transport.mjs'),resolve(lab,'node_modules')]},
    headers:{'Cache-Control':'no-store'}},
  build:{outDir:resolve(lab,'dist'),emptyOutDir:true,target:'es2022'},
  plugins:[{
    name:'efs-static-manifest',
    // Must run before Vite extracts the production module graph, not just dev HTML.
    transformIndexHtml:{order:'pre',handler(html){return html.replace('src="./app.mjs"','src="./carrier-entry.mjs"');}},
    configureServer(server){
      // Development fixtures only. Production emits an ordinary config.json;
      // no RPC proxy, filesystem API, server cache or signing service exists.
      server.middlewares.use(async(req,res,next)=>{
        if(!['/config.json','/demo-wallets.json'].includes(req.url?.split('?')[0]))return next();
        if(req.method!=='GET'||! /^(127\.0\.0\.1|localhost):\d+$/.test(req.headers.host??'')){res.statusCode=403;res.end();return;}
        try{
          const body=req.url.startsWith('/config.json')?JSON.stringify(await readConfig()):await readFile(resolve(runtime,'demo-wallets.json'),'utf8');
          res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.end(body);
        }catch{res.statusCode=503;res.end('Run npm run chain first to generate the local deployment configuration.');}
      });
      server.watcher.add(resolve(runtime,'config.json'));
      server.watcher.on('change',path=>{if(path===resolve(runtime,'config.json'))server.ws.send({type:'full-reload'});});
    },
    async generateBundle(){
      const config=await readConfig();
      // Test keys, faucet and temporary raw storage are not a production dependency.
      delete config.carrierOrigin;config.demoSigners=false;config.localFaucet=false;
      this.emitFile({type:'asset',fileName:'config.json',source:JSON.stringify(config,null,2)});
    }
  }]
});
