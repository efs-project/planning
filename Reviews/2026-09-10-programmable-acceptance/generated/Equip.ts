// Generated; edit declarations, then npm run generate.
import { makeCodec } from '../sdk/codec.ts';
export type EquipFields = { outfitReceipt:string };
export const Equip = makeCodec<EquipFields,{ outfitType:string },{ core:string; admin:string }>({"name":"Equip","version":"1","fields":[{"name":"outfitReceipt","kind":"bytes32"}],"rule":{"artifact":"EquipRule","label":"equip.current.v1","config":[{"name":"outfitType","kind":"bytes32"}],"local":[{"name":"core","kind":"address"},{"name":"admin","kind":"address"}],"mode":1,"gasLimit":250000}}, '0xbaad5e6a086cad87e6e86132060258fefed2b218c9ca71382e96f28aa0b19c92');
