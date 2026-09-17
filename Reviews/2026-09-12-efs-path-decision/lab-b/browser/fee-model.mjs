/** Offline counterfactual fee scenarios. Never sends journal calldata to a public service. */
export const economicsSnapshot={
  version:2,asOf:'2026-09-17T20:05:13Z',ethUsd:2450.845,
  fxAsOf:'2026-09-17 (research capture; exact FX second not retained)',
  source:'https://api.coinbase.com/v2/prices/ETH-USD/spot',
  baseInputs:{l1BaseFee:'125407395',blobBaseFee:'7138751',baseFeeScalar:'2269',blobBaseFeeScalar:'1055762',operatorWei:'0'},
  arbitrumInputs:{l1BaseFeeEstimate:'2240062'},
  networks:[
    {id:'ethereum',label:'Ethereum L1',gasGwei:0.0972967,extraUsd:0,block:25999487,blockHash:'0x80dcd744396ecb659dcee5427aa5ab27c21b757d4d6d7c32deef50f03f379380',source:'https://ethereum-rpc.publicnode.com'},
    {id:'base',label:'Base',gasGwei:0.006,extraUsd:0,block:51443083,blockHash:'0xb4e268e560be68f58611f138ab06c51901a227a527ad28a0658c8908403dd74b',source:'https://mainnet.base.org'},
    {id:'arbitrum',label:'Arbitrum',gasGwei:0.020006,extraUsd:0,block:506203944,blockHash:'0x5342dd48c66456d313cee697132e883581db3ebe3ec8a21fd0757021ff8add41',source:'https://arb1.arbitrum.io/rpc'},
  ],
};
const legacyGas={ethereum:0.0953168,base:0.006,arbitrum:0.020146};
export function resolveEconomics(config){
  const defaults=structuredClone(economicsSnapshot);
  if(!config)return defaults;
  const legacy=config.asOf==='2026-09-14T19:45:15Z'&&config.version!==2;
  const result={...defaults,...structuredClone(config),version:2};
  if(legacy){result.asOf=defaults.asOf;result.fxAsOf=defaults.fxAsOf;
    if(config.ethUsd===2544.385)result.ethUsd=defaults.ethUsd;
  }
  result.networks=defaults.networks.map(network=>{
    const custom=config.networks?.find(n=>n.id===network.id);
    if(!custom)return network;
    const merged={...network,...custom};
    if(legacy&&custom.gasGwei===legacyGas[network.id])merged.gasGwei=network.gasGwei;
    if(legacy&&custom.kind?.startsWith('execution-only estimate'))delete merged.kind;
    return merged;
  });
  return result;
}
const integer=value=>{
  if(value===null||value===undefined||value==='')throw Error('Missing integer');
  const n=BigInt(value);if(n<0n)throw Error('Negative integer');return n;
};
export function baseDataFee(unsignedBytes,inputs=economicsSnapshot.baseInputs){
  const n=integer(unsignedBytes)+68n,upper=n+n/255n+16n;
  const scaled=836500n*upper-42585600n,size=scaled>100000000n?scaled:100000000n;
  const fee=integer(inputs.baseFeeScalar)*16n*integer(inputs.l1BaseFee)+integer(inputs.blobBaseFeeScalar)*integer(inputs.blobBaseFee);
  return {floorWei:100000000n*fee/1000000000000n,scenarioWei:size*fee/1000000000000n};
}
function gasPrice(network){
  // Scale decimal digits, not binary floats; cap input/exponent and uint256 size.
  const input=network?.gasGwei;
  if(!['string','number'].includes(typeof input))return null;
  const text=String(input);
  if(text.length>128)return null;
  const match=/^\+?(\d+(?:\.\d*)?|\.\d+)(?:e([+-]?\d{1,3}))?$/i.exec(text);
  if(!match)return null;
  const exponent=Number(match[2]??0);if(Math.abs(exponent)>128)return null;
  const [whole,fraction='']=match[1].split('.');
  let digits=(whole+fraction).replace(/^0+/,'')||'0';
  const shift=9+exponent-fraction.length;
  if(digits==='0')return 0n;
  if(shift<0){
    const discard=-shift;
    if(discard>=digits.length||!/^[0]*$/.test(digits.slice(-discard)))return null;
    digits=digits.slice(0,-discard);
  }else{
    if(digits.length+shift>78)return null;
    digits+='0'.repeat(shift);
  }
  if(digits.length>78)return null;
  const wei=BigInt(digits);return wei<(1n<<256n)?wei:null;
}
export function modelAction(entry,gas,economics,ethers){
  const result={};
  for(const id of ['ethereum','base','arbitrum']){
    const network=economics.networks.find(n=>n.id===id),price=gasPrice(network);
    const executionWei=gas!==null&&price!==null?gas*price:null;
    const model={executionWei,dataWei:null,operatorWei:null,scenarioWei:null,floorWei:executionWei};
    if(id==='ethereum'){model.dataWei=0n;model.operatorWei=0n;model.scenarioWei=executionWei;}
    else if(executionWei!==null){
      try{
        const tx=entry.transaction;
        if(!/^0x(?:[0-9a-f]{2})*$/i.test(tx?.data??''))throw Error('Calldata unavailable');
        if(id==='base'){
          const bytes=ethers.Transaction.from({type:2,chainId:8453,nonce:0,to:tx.to,data:tx.data,
            value:integer(tx.value),gasLimit:gas,maxFeePerGas:price,maxPriorityFeePerGas:1000000n,accessList:[]}).unsignedSerialized;
          model.unsignedBytes=(bytes.length-2)/2;
          const data=baseDataFee(model.unsignedBytes,economics.baseInputs);
          model.dataWei=data.scenarioWei;model.operatorWei=integer(economics.baseInputs.operatorWei);
          model.floorWei=executionWei+data.floorWei+model.operatorWei;
        }else{
          model.dataWei=(BigInt((tx.data.length-2)/2)+140n)*16n*integer(economics.arbitrumInputs.l1BaseFeeEstimate);
          model.operatorWei=0n;
        }
        model.scenarioWei=executionWei+model.dataWei+model.operatorWei;
      }catch{ /* Incomplete inputs leave the execution subtotal and unknown total. */ }
    }
    result[id]=model;
  }
  return result;
}
export function toUsd(wei,economics,network,transactions=1){
  if(wei===null||[economics.ethUsd,network?.extraUsd].some(v=>v===null||v===undefined||v===''))return null;
  const fx=Number(economics.ethUsd),extra=Number(network.extraUsd);
  const n=Number(wei)/1e18*fx+extra*transactions;
  return [fx,extra,n].every(v=>Number.isFinite(v)&&v>=0)?n:null;
}
