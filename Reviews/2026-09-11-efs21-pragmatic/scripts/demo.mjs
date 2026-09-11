import {withWorld,E,artifact} from './world.mjs';
import {withServer} from './server.mjs';
import {seed} from './benchmark.mjs';
// No RPC/key CLI options. The node and static server belong to this invocation.
await withWorld(async w=>{
  await seed(w);
  await w.client.sendData('seed contract quote',new E.Interface(artifact('QuoteProducer').abi).encodeFunctionData('publish',[3000,0]),w.producer);
  return withServer(w.config,async url=>{
    console.log(`EFS 2.1 candidate Files: ${url}`);
    console.log('Disposable public development signer only. Ctrl-C closes server, node and owned cache.');
    await new Promise(resolve=>{
      const done=()=>{process.removeListener('SIGINT',done);process.removeListener('SIGTERM',done);resolve();};
      process.once('SIGINT',done);process.once('SIGTERM',done);w.node.child.once('exit',done);
    });
    return {url};
  });
},{watchdogMs:12*60*60*1000});
