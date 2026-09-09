/** Disposable ASCII/root-directory adapter. No wallet, bytes or actions surface. */
export interface Limits {readonly maxRequests:number;readonly maxBytes:number;readonly responseBytes:number;readonly maxInFlight:number;readonly deadlineMs:number}
export const DEFAULT_LIMITS:Readonly<Limits>;
export interface ReaderSource {identity:string;epoch:string|number;request(method:string,params:readonly unknown[],options:{signal:AbortSignal;maxBytes:number}):Promise<unknown>}
export interface ReaderContext {expected:Readonly<Record<string,unknown>>;limits?:Partial<Limits>}
export interface Basis {readonly source:string;readonly epoch:string|number;readonly chainId:bigint;readonly core:string;readonly blockNumber:bigint;readonly blockHash:string;readonly stateRoot:string;readonly executionSetId:string;readonly revision:bigint;readonly admissionHigh:bigint}
export interface Evidence {readonly id:number;readonly sequence:number;readonly method:string;readonly params:readonly unknown[];readonly purpose:string;readonly bytes:number;readonly startedMs:number;readonly endedMs:number;readonly result?:unknown;readonly error?:Readonly<Record<string,unknown>>}
export interface Scope {
  readonly basis:Basis;
  call(name:'getRecord'|'getOccurrence'|'getOccurrenceByOrdinal'|'getBindingHead'|'getBindingAtBasis'|'readHistory'|'pagePostingsHydrated'|'resolve'|'validatePlan',args?:readonly unknown[]):Promise<{status:'OK';values:readonly unknown[];evidenceId:number}|{status:'UNAVAILABLE';reason:string;evidenceId:number|null}>;
  seal():Promise<{status:'SEALED';basis:Basis;evidence:readonly Evidence[]}|{status:'UNAVAILABLE';reason:string;evidence:readonly Evidence[]}>;
  close():void;stats():Readonly<LimitsStats>;evidence():readonly Evidence[];
}
export interface LimitsStats {requests:number;bytes:number;cacheHits:number;inFlight:number;maxInFlight:number;queued:number;elapsedMs:number;limits:Limits}
export function createFixtureReader(options:{source:ReaderSource;context:ReaderContext}):Readonly<{open(options?:{blockTag?:string;signal?:AbortSignal}):Promise<{status:'READY';scope:Scope}|{status:'UNAVAILABLE';reason:string;evidence:readonly Evidence[]}>}>;
export type Coverage='COMPLETE'|'PARTIAL'|'UNKNOWN';
export interface Qualification {readonly status:'QUALIFIED'|'UNAVAILABLE';readonly coverage:Coverage;readonly support:'FIXTURE_ASCII_ONLY'|'UNSUPPORTED';readonly validation:'FIXTURE_FILES_VALIDATED'|'UNRESOLVED'|'NO_SELECTED_NODE';readonly integrity:'SOURCE_PINNED_EXACT_ABI'|'UNAVAILABLE';readonly authority:'SYNTHETIC_OPERATOR_ONLY';readonly finality:'PROVISIONAL';readonly availability:'OBTAINED'|'PARTIAL'|'UNAVAILABLE';readonly effect:'NOT_APPLICABLE'}
export interface NodeValue {readonly nodeId:string;readonly kind:'FILE'|'DIRECTORY';readonly name:string;readonly publisher:string;readonly historicalCharter:'VALID';readonly maintenance:'MAINTAINED'|'NOT_MAINTAINED'|'WRONG_TARGET';readonly content:'NOT_READ';readonly mountId:string;readonly mountOverride:string|null}
export type FoundRow={readonly outcome:'FOUND';readonly fieldRole:string;readonly selectedId:string;readonly value:NodeValue};
export type UnresolvedRow={readonly outcome:'UNKNOWN';readonly fieldRole?:string;readonly reason:string;readonly detail?:string;readonly value?:never}|{readonly outcome:'CONFLICT';readonly fieldRole:string;readonly value?:never};
export type MaskedRow={readonly outcome:'MASKED';readonly fieldRole:string;readonly selectedId:string;readonly value?:never};
export type AbsentRow={readonly outcome:'ABSENT';readonly fieldRole:string;readonly value?:never};
export type Row=FoundRow|UnresolvedRow|MaskedRow|AbsentRow;
export interface Observation {readonly basis:Basis;readonly domain:'FIXTURE_ROOT_DIRECTORY_ONLY';readonly evidence:readonly Evidence[]}
export type PointResult=Observation&((FoundRow&{readonly qualification:Qualification&{readonly status:'QUALIFIED'}})|((UnresolvedRow|MaskedRow|AbsentRow)&{readonly qualification:Qualification}));
export function lookupName(scope:Scope,options:{mountId:string;name:string}):Promise<PointResult>;
export interface DirectorySnapshot extends Observation {
  readonly coverage:Coverage;readonly rows:readonly (FoundRow&{readonly qualification:Qualification})[];readonly unresolved:readonly (UnresolvedRow&{readonly qualification:Qualification})[];readonly masked:readonly (MaskedRow&{readonly qualification:Qualification})[];readonly absent:readonly (AbsentRow&{readonly qualification:Qualification})[];
  readonly progress:readonly {readonly principal:string;readonly cursor:bigint;readonly scanned:bigint;readonly complete:boolean}[];
  readonly continuation:boolean;readonly qualification:Qualification;readonly rowsEvidence:'CURRENT_SEALED'|'PRIOR_SEALED';readonly reason?:string;readonly detail?:string;readonly priorSealed?:DirectorySnapshot|null;
}
export function openDirectory(scope:Scope,options:{mountId:string;pageSize?:number}):Readonly<{loadMore():Promise<DirectorySnapshot>;snapshot():DirectorySnapshot|null;close():void}>;
export const TYPES:Readonly<Record<'ObjectGenesis/1'|'ResolutionPlan/1'|'BindingSet/1'|'BindingTombstone/1'|'DirectoryEntry/1'|'DirectoryWhiteout/1'|'PublicFilesMountConfig/1'|'MountDescriptor/1',string>>;
export const FIXTURE:Readonly<Record<'publicProfile'|'planScopeDomain'|'lensProfile'|'fileMeaning'|'directoryMeaning'|'charterPurpose'|'namePurpose'|'charterRole',string>>;
export type RecordAssessment={status:'ACCEPTED';type:keyof typeof TYPES;fields:Record<string,unknown>;raw:RawRecord}|{status:'MALFORMED'|'UNSUPPORTED';reason:string;raw:RawRecord};
export interface RawRecord {recordId:string;typeId:string;body:string;fields:string[]}
export function assessRecord(recordId:string,typeId:string,body:string):RecordAssessment;
export function nameAssessment(name:string):{status:'ACCEPTED'}|{status:'MALFORMED'|'UNSUPPORTED';reason:string};
export function nameRole(name:string):string;
export function positionKey(purpose:string,subject:string,fieldRole:string):string;
export function bindingKey(principal:string,purpose:string,subject:string,fieldRole:string):string;
export function bindingScopeKey(principal:string,purpose:string,subject:string):string;
export function purposeAndScope(kind:'namespace'|'content',root:string):string;
export function ordinaryRecord(type:string,body:string):string;
export interface Plan {code:0;combiner:number;k:number;entries:{principal:string;tier:number;flags:number;floor:bigint;reserved:number[];index:number}[];purposeAndScope:string;profile:string}
export function parsePlan(type:string,body:string):Plan|{code:1|2|3|4|5|6|7|8|9|10|11|12|13};
