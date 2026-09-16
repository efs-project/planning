/** Bounded Node-only measurement transport. Diagnostics never retain params,
 * request bodies, signatures, provider URLs, or response bodies. */
export const READ_TRANSPORT_LIMITS=Object.freeze({batchItems:16,requestBytes:256*1024,responseBytes:4*1024*1024,
  concurrency:4,maxPending:64,timeoutMs:20_000,diagnosticKeys:2048});
export function createReadTransport({url,batch=false,limits={},fetchImpl=fetch}={}) {
  const bound={...READ_TRANSPORT_LIMITS,...limits};
  for(const n of Object.values(bound))if(!Number.isSafeInteger(n)||n<1)throw Error('COMPACT_TRANSPORT_LIMIT');
  const metrics={calls:0,wireCalls:0,httpRequests:0,httpBatches:0,requestBytes:0,responseBytes:0,fallbacks:0,
    byMethod:{},byRequest:{},phases:{},droppedDiagnosticKeys:0};
  const queue=[];let id=0,active=0,pending=0,scheduled=false,phase='unscoped',batchSupported=true;
  const error=code=>Error(`COMPACT_TRANSPORT_${code}`);
  const inc=(key,value=1,p=phase)=>{metrics[key]+=value;const row=metrics.phases[p]??={calls:0,wireCalls:0,httpRequests:0,httpBatches:0,requestBytes:0,responseBytes:0,fallbacks:0};row[key]+=value;};
  function envelope(value,expected) {
    if(!value||value.jsonrpc!=='2.0'||value.id!==expected||('result' in value)===('error' in value))throw error('ENVELOPE');
    if('error' in value&&(!value.error||!Number.isInteger(value.error.code)||typeof value.error.message!=='string'))throw error('ENVELOPE');
    return value;
  }
  async function post(request,deadline,p) {
    const body=JSON.stringify(request),bytes=Buffer.byteLength(body);
    if(bytes>bound.requestBytes)throw error('REQUEST_LIMIT');
    const remaining=deadline-Date.now();if(remaining<=0)throw error('TIMEOUT');
    const controller=new AbortController();let timer;
    const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(error('TIMEOUT'));},remaining);});
    inc('httpRequests',1,p);inc('requestBytes',bytes,p);inc('wireCalls',Array.isArray(request)?request.length:1,p);
    if(Array.isArray(request))inc('httpBatches',1,p);
    try{return await Promise.race([timeout,(async()=>{
      const response=await fetchImpl(url,{method:'POST',headers:{'content-type':'application/json'},body,signal:controller.signal});
      if(!response.ok)throw error(`HTTP_${response.status}`);
      const reader=response.body?.getReader();if(!reader)throw error('RESPONSE_BODY');
      const chunks=[];let length=0;
      try {while(true){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;inc('responseBytes',value.byteLength,p);
        if(length>bound.responseBytes){controller.abort();throw error('RESPONSE_LIMIT');}chunks.push(value);}}
      catch(cause){await reader.cancel().catch(()=>{});throw cause;}
      return JSON.parse(Buffer.concat(chunks,length).toString('utf8'));
    })()]);}finally{clearTimeout(timer);}
  }
  function settle(item,value,cause) {
    if(item.done)return;item.done=true;clearTimeout(item.timer);pending--;
    if(cause)item.reject(cause);
    else if(value.error)item.reject(Object.assign(Error(`RPC ${item.request.method} failed (${value.error.code})`),{rpcError:value.error}));
    else item.resolve(value.result);
  }
  async function execute(items) {
    const p=items[0].phase,deadline=Math.min(...items.map(i=>i.deadline));
    try {
      const requests=items.map(i=>i.request),isBatch=items.length>1;
      const reply=await post(isBatch?requests:requests[0],deadline,p);
      if(isBatch&&!Array.isArray(reply)&&reply?.jsonrpc==='2.0'&&reply.id===null&&[-32600,-32601].includes(reply.error?.code)){
        batchSupported=false;inc('fallbacks',1,p);
        // Only explicitly selected pinned reads reach here. IDs/params survive.
        for(const item of items){try{settle(item,envelope(await post(item.request,deadline,p),item.request.id));}catch(cause){settle(item,null,cause);}}
        return;
      }
      const rows=isBatch?reply:[reply];if(!Array.isArray(rows)||rows.length!==items.length)throw error('BATCH_IDS');
      const expected=new Set(requests.map(r=>r.id)),mapped=new Map();
      for(const row of rows){if(!expected.has(row?.id)||mapped.has(row.id))throw error('BATCH_IDS');mapped.set(row.id,envelope(row,row.id));}
      // Validate the entire response before releasing even one successful item.
      for(const item of items)settle(item,mapped.get(item.request.id));
    }catch(cause){for(const item of items)settle(item,null,cause);}
  }
  function pump() {
    scheduled=false;
    while(active<bound.concurrency&&queue.length){
      const first=queue.shift();if(first.done)continue;const items=[first];
      if(batch&&batchSupported&&first.read)while(items.length<bound.batchItems&&queue.length){
        const next=queue[0];if(next.done){queue.shift();continue;}
        if(!next.read||next.phase!==first.phase||next.blockHash!==first.blockHash)break;
        if(Buffer.byteLength(JSON.stringify([...items.map(i=>i.request),next.request]))>bound.requestBytes)break;
        items.push(queue.shift());
      }
      active++;execute(items).finally(()=>{active--;pump();});
    }
  }
  function request(method,params=[],read=false) {
    if(read&&(!['eth_call','eth_getCode'].includes(method)||!/^0x[0-9a-f]{64}$/i.test(params[1]?.blockHash)||params[1]?.requireCanonical!==true))return Promise.reject(error('READ_ONLY_PIN_REQUIRED'));
    if(pending>=bound.maxPending)return Promise.reject(error('QUEUE_LIMIT'));
    const req={jsonrpc:'2.0',id:++id,method,params};if(Buffer.byteLength(JSON.stringify(req))>bound.requestBytes)return Promise.reject(error('REQUEST_LIMIT'));
    const p=phase;inc('calls',1,p);metrics.byMethod[method]=(metrics.byMethod[method]??0)+1;
    const key=JSON.stringify({phase:p,method,target:method==='eth_call'?params[0]?.to:method==='eth_getCode'?params[0]:null,
      selector:method==='eth_call'?params[0]?.data?.slice(0,10):null,blockHash:params[1]?.blockHash??null});
    if(key in metrics.byRequest||Object.keys(metrics.byRequest).length<bound.diagnosticKeys)metrics.byRequest[key]=(metrics.byRequest[key]??0)+1;
    else metrics.droppedDiagnosticKeys++;
    pending++;
    return new Promise((resolve,reject)=>{
      const item={request:req,read,blockHash:params[1]?.blockHash,phase:p,deadline:Date.now()+bound.timeoutMs,resolve,reject,done:false};
      item.timer=setTimeout(()=>{settle(item,null,error('TIMEOUT'));const at=queue.indexOf(item);if(at>=0)queue.splice(at,1);},bound.timeoutMs);
      queue.push(item);if(!scheduled){scheduled=true;queueMicrotask(pump);}
    });
  }
  const rpc=(method,params)=>request(method,params);
  rpc.read=(method,params)=>request(method,params,true);
  rpc.phase=value=>{if(!/^[a-z0-9-]{1,64}$/.test(value)||(!(value in metrics.phases)&&Object.keys(metrics.phases).length>=64))throw error('PHASE_LIMIT');phase=value;};
  rpc.snapshot=()=>structuredClone(metrics);rpc.metrics=metrics;rpc.limits=Object.freeze(bound);
  return rpc;
}
