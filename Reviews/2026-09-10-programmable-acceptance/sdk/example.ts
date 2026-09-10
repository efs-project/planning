import { Outfit } from '../generated/Outfit.ts';
import type { OutfitFields } from '../generated/Outfit.ts';
import { equipPreviousOutfit } from './applications.ts';
import { planWrite } from './adapter.ts';
import type { Context } from './adapter.ts';
import type { Registration } from './codec.ts';

/** Ordinary application code: named fields, exact chosen activations, no ABI/ID ceremony.
 * Setup supplies trusted deployed bindings. Planning itself is deterministic and wallet-free.
 */
export function planOutfitAndEquip(input:{
 context:Context;author:string;executor:string;nonce:bigint;deadline:bigint;
 outfit:{registration:Registration;activationId:string};
 equip:{registration:Registration;activationId:string};
 fields:OutfitFields;sourceReads:unknown[];
}) {
 return planWrite(input.context,{
  author:input.author,executor:input.executor,nonce:input.nonce,deadline:input.deadline,
  items:[
   Outfit.item(input.outfit.registration,input.fields,input.outfit.activationId),
   equipPreviousOutfit(input.equip)
  ]
 },input.sourceReads);
}
