// Generated; edit declarations, then npm run generate.
import { makeCodec } from '../sdk/codec.ts';
export type OutfitV2Fields = { species:bigint; shirt:bigint; pants:bigint; badge:bigint };
export const OutfitV2 = makeCodec<OutfitV2Fields,{  },{ core:string }>({"name":"OutfitV2","version":"2-badge-structural-only","fields":[{"name":"species","kind":"uint256"},{"name":"shirt","kind":"uint256"},{"name":"pants","kind":"uint256"},{"name":"badge","kind":"uint256"}],"rule":{"artifact":"OutfitRule","label":"outfit.compatibility.v1","config":[],"local":[{"name":"core","kind":"address"}],"mode":1,"gasLimit":150000}}, '0xc75fc77827d97f74113e8a2f3461bf9d9077c7675ad11e0d07e33ca36f4c9259');
