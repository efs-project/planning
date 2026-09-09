// Executable, browser-portable fixture entrypoint; not a public C0 SDK.
export {createFixtureReader,DEFAULT_LIMITS} from './reader-scope.mjs';
export {lookupName,openDirectory,openFile,openHistory,openRevisions} from './files-reader.mjs';
export {TYPES,FIXTURE,assessRecord,nameAssessment,nameRole,positionKey,bindingKey,bindingScopeKey,purposeAndScope,ordinaryRecord,parsePlan,tagId,contentDigest,byteLength} from './files-profile.mjs';
