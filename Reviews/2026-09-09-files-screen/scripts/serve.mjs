// Deliberately finite local demo. Setup and seven independent oracles precede URL.
import { withFilesScreen } from '../test/screen-fixture.mjs';
const delay=Number(process.env.EFS_FILES_SCREEN_DELAY??0);
if(delay!==0&&delay!==50)throw Error('EFS_FILES_SCREEN_DELAY must be 0 or 50');
await withFilesScreen(async screen=>{
  screen.setDelay(delay);
  console.log('Guest Files local fixture: '+screen.url);
  console.log('Read-only, synthetic operator. Expires in four minutes; no durable data.');
  await new Promise(resolve=>{
    const timer=setTimeout(finish,240000);
    function finish(){clearTimeout(timer);process.removeListener('SIGINT',finish);process.removeListener('SIGTERM',finish);resolve();}
    process.once('SIGINT',finish);process.once('SIGTERM',finish);
  });
});
