import { Contract, id, keccak256 } from 'ethers';
import type { JsonRpcProvider } from 'ethers';
import { hash } from './codec.ts';
import type { Registration } from './codec.ts';
import { Equip } from '../generated/Equip.ts';

/** Known compiled artifact + constructor binding trust, NOT arbitrary-state introspection. */
export async function registerKnownRule<C extends Record<string,unknown>, L extends Record<string,unknown>>(
 provider:JsonRpcProvider,core:Contract,
 codec:{declaration:{rule:null|{artifact:string}};registration:(codeHash:string,config:C)=>Registration;localConfig:(local:L)=>string},
 artifact:{deployedBytecode:{object:string}},config:C,hook:string,local:L
) {
 if(!codec.declaration.rule||!artifact?.deployedBytecode?.object) throw Error('MISSING_RULE_ARTIFACT');
 const artifactCode=artifact.deployedBytecode.object.startsWith('0x')?artifact.deployedBytecode.object:'0x'+artifact.deployedBytecode.object;
 const deployedCode=await provider.getCode(hook);
 if(deployedCode==='0x'||keccak256(deployedCode)!==keccak256(artifactCode)) throw Error('ARTIFACT_CODE_MISMATCH');
 const registration=codec.registration(keccak256(artifactCode),config),coreAddress=await core.getAddress();
 const bound=new Contract(hook,['function binding() view returns(address core,bytes32 semanticConfig,bytes32 localConfig)'],provider);
 const binding=await bound.binding();
 if(binding.core.toLowerCase()!==coreAddress.toLowerCase()||binding.semanticConfig!==registration.rule.semanticConfig) throw Error('RULE_BINDING_MISMATCH');
 if(binding.localConfig!==codec.localConfig(local)) throw Error('LOCAL_BINDING_MISMATCH');
 const registrationReceipt=await (await core.registerType(registration.descriptor,registration.kinds,registration.rule)).wait();
 const actual=await core.getType(registration.typeId);
 if(!actual.exists||actual.descriptor!==registration.descriptor||actual.kinds!==registration.kinds) throw Error('TYPE_REGISTRATION_MISMATCH');
 const chainId=(await provider.getNetwork()).chainId;
 const activationId=hash(['bytes32','uint256','address','bytes32','address','bytes32','bytes32','uint8','uint32'],[id('efs.acceptance.activation.v1'),chainId,coreAddress,registration.typeId,hook,registration.rule.codeHash,binding.localConfig,registration.rule.mode,registration.rule.gasLimit]);
 const activationReceipt=await (await core.activate(registration.typeId,hook,binding.localConfig)).wait();
 const activation=await core.getActivation(activationId);
 if(!activation.exists||activation.typeId!==registration.typeId||activation.hook.toLowerCase()!==hook.toLowerCase()||activation.localConfig!==binding.localConfig) throw Error('ACTIVATION_MISMATCH');
 return {registration,activationId,hook,localConfig:binding.localConfig,registrationReceipt,activationReceipt,trust:'KNOWN_CODE_AND_CONSTRUCTOR_CONFIG_NOT_ARBITRARY_STATE_PROOF'};
}

/** Application rule convention: zero means the immediately previous staged Outfit.
 * EquipRule checks the referenced Outfit's exact Type, author and prior index;
 * Core remains the authenticated guarded writer. This is NOT a literal receipt ID.
 */
export function equipPreviousOutfit(equip:{registration:Registration;activationId:string}) {
 return Equip.item(equip.registration,{outfitReceipt:'0x'+'00'.repeat(32)},equip.activationId);
}
