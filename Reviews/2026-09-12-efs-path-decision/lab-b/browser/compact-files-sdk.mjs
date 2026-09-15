import {createGuardedCompactSdk} from './compact-sdk-v2.mjs';
import * as contentCodec from './compact-content.mjs';
export function createFilesCompactSdk(options){return createGuardedCompactSdk({...options,contentCodec});}
