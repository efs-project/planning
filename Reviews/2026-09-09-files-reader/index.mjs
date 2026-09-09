// Executable, browser-portable fixture entrypoint; not a public C0 SDK.
export {createFixtureReader,DEFAULT_LIMITS} from './reader-scope.mjs';
export {lookupName,openDirectory} from './files-reader.mjs';
export {TYPES,FIXTURE,assessRecord,nameAssessment,nameRole,positionKey,bindingKey,bindingScopeKey,purposeAndScope,ordinaryRecord,parsePlan} from './files-profile.mjs';
