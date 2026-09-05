export function legacyGameDocument() {
  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'"><meta name="viewport" content="width=device-width"><title>Signal Drift</title><style>*{box-sizing:border-box}body{margin:0;overflow:hidden;background:#080b10;color:#eff;font:14px system-ui}canvas{display:block;width:100vw;height:100vh}.hud{position:fixed;inset:12px auto auto 14px;pointer-events:none}.hud b{color:#b7ff5a;font-size:20px}.help{position:fixed;right:14px;top:12px;color:#93a0ae}.over{position:fixed;inset:0;display:none;place-items:center;background:#080b10dd;text-align:center}.over button{padding:10px 18px;border:0;border-radius:8px;background:#b7ff5a;font:700 14px system-ui}.over.show{display:grid}</style></head><body><canvas aria-label="Signal Drift play field"></canvas><div class="hud">SIGNAL <b id="score">0</b></div><div class="help">Arrows / WASD / pointer</div><div class="over" id="over"><div><h1>Signal lost</h1><p id="final"></p><button id="again">Try again</button></div></div><script>(()=>{'use strict';const c=document.querySelector('canvas'),x=c.getContext('2d'),score=document.querySelector('#score'),over=document.querySelector('#over');let w,h,s=1,raf,start,last,dead=false,p={x:80,y:100,vx:0,vy:0},haz=[];const keys=new Set,movement=new Set(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','w','a','s','d']);function size(){s=Math.min(2,devicePixelRatio||1);w=c.width=Math.max(320,innerWidth)*s;h=c.height=Math.max(220,innerHeight)*s;p.x=Math.min(p.x,w-20)}function reset(){cancelAnimationFrame(raf);start=performance.now();last=start;dead=false;p={x:w*.2,y:h*.5,vx:0,vy:0};haz=[];over.className='over';loop(last)}function loop(t){if(dead)return;const dt=Math.min(.03,(t-last)/1000);last=t;const m=280*s;p.vx=((keys.has('ArrowRight')||keys.has('d'))-(keys.has('ArrowLeft')||keys.has('a')))*m;p.vy=((keys.has('ArrowDown')||keys.has('s'))-(keys.has('ArrowUp')||keys.has('w')))*m;p.x=Math.max(12*s,Math.min(w-12*s,p.x+p.vx*dt));p.y=Math.max(12*s,Math.min(h-12*s,p.y+p.vy*dt));if(haz.length<24&&(!haz.length||haz[haz.length-1].x<w-150*s))haz.push({x:w+20*s,y:20*s+Math.random()*(h-40*s),r:(10+Math.random()*16)*s,v:(130+Math.random()*130)*s});x.fillStyle='#080b10';x.fillRect(0,0,w,h);x.strokeStyle='#17232b';for(let i=0;i<w;i+=32*s){x.beginPath();x.moveTo(i,0);x.lineTo(i,h);x.stroke()}for(const z of haz){z.x-=z.v*dt;x.strokeStyle='#68ddff';x.lineWidth=2*s;x.beginPath();x.arc(z.x,z.y,z.r,0,7);x.stroke();if(Math.hypot(z.x-p.x,z.y-p.y)<z.r+8*s)dead=true}haz=haz.filter(z=>z.x>-40*s);x.save();x.translate(p.x,p.y);x.rotate(Math.PI/4);x.fillStyle='#b7ff5a';x.fillRect(-7*s,-7*s,14*s,14*s);x.restore();const n=Math.floor((t-start)/100);score.textContent=n;if(dead){document.querySelector('#final').textContent='You carried the signal '+n+' ticks.';over.className='over show';return}raf=requestAnimationFrame(loop)}function move(e){const r=c.getBoundingClientRect();p.x=(e.clientX-r.left)*s;p.y=(e.clientY-r.top)*s}addEventListener('resize',size);addEventListener('keydown',e=>{if(movement.has(e.key))e.preventDefault();keys.add(e.key)});addEventListener('keyup',e=>keys.delete(e.key));addEventListener('blur',()=>keys.clear());c.addEventListener('pointermove',move);document.querySelector('#again').onclick=reset;addEventListener('pagehide',()=>{cancelAnimationFrame(raf);keys.clear()},{once:true});size();reset()})();</script></body></html>`;
}

export const legacyGameBytes = () => new TextEncoder().encode(legacyGameDocument());

// These integer-only helpers are serialized into the single-artifact release.
// The trace describes obstacle configuration, not a trusted score or fair-play proof.
export function deterministicObstacles(seed, count = 128) {
  if (typeof seed !== 'string' || !/^0x[0-9a-fA-F]{64}$/.test(seed)) throw new Error('Exact 32-byte seed required');
  if (!Number.isInteger(count) || count < 1 || count > 4096) throw new Error('Obstacle count must be 1..4096');
  let state = 2166136261;
  for (let offset = 2; offset < seed.length; offset += 2) state = Math.imul(state ^ Number.parseInt(seed.slice(offset, offset + 2), 16), 16777619) >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = Math.imul(state ^ (state >>> 15), state | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return (mixed ^ (mixed >>> 14)) >>> 0;
  };
  return Array.from({ length: count }, () => ({ y: 40 + next() % 921, r: 10 + next() % 16, v: 130 + next() % 130 }));
}

export function obstacleSequenceHash(sequence) {
  let hash = 2166136261;
  for (const obstacle of sequence) for (const key of ['y', 'r', 'v']) {
    const value = obstacle[key] >>> 0;
    for (let byte = 0; byte < 4; byte += 1) hash = Math.imul(hash ^ ((value >>> (byte * 8)) & 255), 16777619) >>> 0;
  }
  return `fnv1a32:${hash.toString(16).padStart(8, '0')}`;
}

export function gameDocument() {
  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'none'; form-action 'none'; base-uri 'none'"><meta name="viewport" content="width=device-width"><title>Signal Drift: Exact Challenge</title><style>*{box-sizing:border-box}body{margin:0;overflow:hidden;background:#080b10;color:#eff;font:14px system-ui}canvas{display:block;width:100vw;height:100vh;object-fit:contain}.hud{position:fixed;inset:12px auto auto 14px;pointer-events:none}.hud b{color:#b7ff5a;font-size:20px}.help{position:fixed;right:14px;top:12px;color:#93a0ae;text-align:right;font-size:12px}.trace{position:fixed;bottom:8px;left:14px;color:#93a0ae;font:10px monospace}.over{position:fixed;inset:0;display:none;place-items:center;background:#080b10dd;text-align:center}.over button{padding:10px 18px;border:0;border-radius:8px;background:#b7ff5a;font:700 14px system-ui}.over.show{display:grid}</style></head><body><canvas aria-label="Signal Drift play field" width="1000" height="600"></canvas><div class="hud">SIGNAL <b id="score">0</b></div><div class="help">Arrows / WASD / pointer<br>Local score · not verified fair play</div><div class="trace">128-obstacle trace <span id="sequence-hash">unavailable</span></div><div class="over" id="over"><div><h1>Signal lost</h1><p id="final"></p><button id="again">Replay exact challenge</button></div></div><script>(()=>{'use strict';
const deterministicObstacles=${deterministicObstacles.toString()};
const obstacleSequenceHash=${obstacleSequenceHash.toString()};
const match=/^#seed=(0x[0-9a-fA-F]{64})$/.exec(location.hash);
if(!match){document.body.replaceChildren(Object.assign(document.createElement('p'),{textContent:'Blocked: exact inert challenge seed unavailable.'}));return;}
const sequence=deterministicObstacles(match[1]),trace=obstacleSequenceHash(sequence);
document.querySelector('#sequence-hash').textContent=trace;document.body.dataset.sequenceHash=trace;
const c=document.querySelector('canvas'),x=c.getContext('2d'),score=document.querySelector('#score'),over=document.querySelector('#over'),w=1000,h=600;
let raf,start,last,dead=false,p={x:200,y:300},haz=[],index=0;const keys=new Set,movement=new Set(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','w','a','s','d']);
function reset(){cancelAnimationFrame(raf);start=performance.now();last=start;dead=false;p={x:200,y:300};haz=[];index=0;keys.clear();over.className='over';loop(last)}
function loop(t){if(dead)return;const dt=Math.min(.03,(t-last)/1000);last=t;const m=280;p.x=Math.max(12,Math.min(w-12,p.x+((keys.has('ArrowRight')||keys.has('d'))-(keys.has('ArrowLeft')||keys.has('a')))*m*dt));p.y=Math.max(12,Math.min(h-12,p.y+((keys.has('ArrowDown')||keys.has('s'))-(keys.has('ArrowUp')||keys.has('w')))*m*dt));
if(haz.length<24&&(!haz.length||haz[haz.length-1].x<w-150)){const next=sequence[index++%sequence.length];haz.push({x:w+20,y:next.y*h/1000,r:next.r,v:next.v})}
x.fillStyle='#080b10';x.fillRect(0,0,w,h);x.strokeStyle='#17232b';for(let i=0;i<w;i+=32){x.beginPath();x.moveTo(i,0);x.lineTo(i,h);x.stroke()}
for(const z of haz){z.x-=z.v*dt;x.strokeStyle='#68ddff';x.lineWidth=2;x.beginPath();x.arc(z.x,z.y,z.r,0,7);x.stroke();if(Math.hypot(z.x-p.x,z.y-p.y)<z.r+8)dead=true}haz=haz.filter(z=>z.x>-40);x.save();x.translate(p.x,p.y);x.rotate(Math.PI/4);x.fillStyle='#b7ff5a';x.fillRect(-7,-7,14,14);x.restore();const n=Math.floor((t-start)/100);score.textContent=n;if(dead){document.querySelector('#final').textContent='You carried the signal '+n+' ticks. Local, untrusted score.';over.className='over show';return}raf=requestAnimationFrame(loop)}
function move(e){const r=c.getBoundingClientRect(),scale=Math.min(r.width/w,r.height/h),left=(r.width-w*scale)/2,top=(r.height-h*scale)/2;p.x=Math.max(12,Math.min(w-12,(e.clientX-r.left-left)/scale));p.y=Math.max(12,Math.min(h-12,(e.clientY-r.top-top)/scale))}
addEventListener('keydown',e=>{if(movement.has(e.key))e.preventDefault();keys.add(e.key)});addEventListener('keyup',e=>keys.delete(e.key));addEventListener('blur',()=>keys.clear());c.addEventListener('pointermove',move);document.querySelector('#again').onclick=reset;addEventListener('pagehide',()=>{cancelAnimationFrame(raf);keys.clear()},{once:true});reset();})();</script></body></html>`;
}

export const gameBytes = () => new TextEncoder().encode(gameDocument());
