// Deliberately finite local demo. Setup and seven independent oracles precede URL.
import { withFilesScreen } from '../test/screen-fixture.mjs';
const delay=Number(process.env.EFS_FILES_SCREEN_DELAY??0);
const delivery=process.env.EFS_FILES_SCREEN_DELIVERY??'identity';
if(delay!==0&&delay!==50)throw Error('EFS_FILES_SCREEN_DELAY must be 0 or 50');
if(!['identity','gzip'].includes(delivery))throw Error('EFS_FILES_SCREEN_DELIVERY must be identity or gzip');
await withFilesScreen(async screen=>{
  screen.setDelay(delay);
  screen.setDelivery(delivery);
  console.log('Guest Files local fixture: '+screen.url);
  console.log('Read-only, synthetic operator. Expires in four minutes; no durable data.');
  console.log('HTTP delivery: '+delivery+'; decoded payload and RPC responses unchanged.');
  await new Promise(resolve=>{
    const timer=setTimeout(finish,240000);
    function finish(){clearTimeout(timer);process.removeListener('SIGINT',finish);process.removeListener('SIGTERM',finish);resolve();}
    process.once('SIGINT',finish);process.once('SIGTERM',finish);
  });
});
