import {createFilesCompactSdk} from './compact-files-sdk.mjs';
import {resolvePath,encodePath,decodePath} from './compact-paths.mjs';
import * as codec from './compact-content.mjs';
import * as host from './compact-carrier-host.mjs';
globalThis.efsCompactDirectoryEntry=Object.freeze({createSdk:createFilesCompactSdk,resolvePath,encodePath,decodePath,content:{...codec,...host}});
await import('./app.mjs');
