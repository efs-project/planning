// Generated; edit declarations, then npm run generate.
import { makeCodec } from '../sdk/codec.ts';
export type PaidClaimFields = { claimKey:string };
export const PaidClaim = makeCodec<PaidClaimFields,{ fee:bigint },{ core:string; treasury:string }>({"name":"PaidClaim","version":"1","fields":[{"name":"claimKey","kind":"bytes32"}],"rule":{"artifact":"PaidClaimRule","label":"paid.unique.v1","config":[{"name":"fee","kind":"uint256"}],"local":[{"name":"core","kind":"address"},{"name":"treasury","kind":"address"}],"mode":2,"gasLimit":250000}}, '0xc3c71076e3c67bc2eec33750fea8fe1bda5c43e1cad3eaf19b5b8db4d4e8c9af');
