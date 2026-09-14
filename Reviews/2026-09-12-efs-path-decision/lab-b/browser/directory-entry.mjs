// Only the separately served guarded entrypoint loads these modules. The legacy
// app imports none of them and its already-running asset allowlist is unchanged.
import {createGuardedCompactSdk} from './compact-sdk-v2.mjs';
import {resolvePath,encodePath,decodePath} from './compact-paths.mjs';
globalThis.efsCompactDirectoryEntry=Object.freeze({createSdk:createGuardedCompactSdk,resolvePath,encodePath,decodePath});
await import('./app.mjs');
