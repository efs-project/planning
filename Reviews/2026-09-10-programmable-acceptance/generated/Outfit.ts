// Generated; edit declarations, then npm run generate.
import { makeCodec } from '../sdk/codec.ts';
export type OutfitFields = { species:bigint; shirt:bigint; pants:bigint };
export const Outfit = makeCodec<OutfitFields,{  },{ core:string }>({"name":"Outfit","version":"1","fields":[{"name":"species","kind":"uint256"},{"name":"shirt","kind":"uint256"},{"name":"pants","kind":"uint256"}],"rule":{"artifact":"OutfitRule","label":"outfit.compatibility.v1","config":[],"local":[{"name":"core","kind":"address"}],"mode":1,"gasLimit":150000}}, '0xe21621f716a01fc2bc40959975ddc2a1f74a8131a3dc88a9232f14fa3efa1210');
