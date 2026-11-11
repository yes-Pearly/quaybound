const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..'),library={exports:{}};
new Function('module','exports',fs.readFileSync(path.join(root,'vendor/matter.min.js'),'utf8'))(library,library.exports);globalThis.Matter=library.exports;
const {Body}=library.exports;
(async()=>{
 const {createWorld,step}=await import(pathToFileURL(path.join(root,'physics.js')));
 const {LEVELS,VEHICLES,THEMES}=await import(pathToFileURL(path.join(root,'levels.js')));
 const {COPY}=await import(pathToFileURL(path.join(root,'i18n.js')));
 let checks=0;const check=(name,fn)=>{fn();checks++;console.log('✓ '+name)};
 const settled=(i,car)=>{const s=createWorld(i,car);for(let f=0;f<42;f++)step(s,{});return s};
 function run(i,custom,delay=i===11?60:0,balance=false){const s=settled(i);let bridge=0,dropped=0;const events=new Set();for(let f=0;f<2400;f++){
  let input={right:s.airTime<.025,left:false};
  if(s.level.goal==='park'){const dx=s.level.finish+85-s.body.position.x,target=Math.max(-3,Math.min(7,dx*.013));input={right:s.body.velocity.x<target-.3,left:s.body.velocity.x>target+.3}}
  // A short wait lets the two sweepers rotate past the approach.
  if(balance&&s.airTime>.025){const angle=Math.atan2(Math.sin(s.body.angle),Math.cos(s.body.angle))+s.body.angularVelocity*10;input={right:angle>.12,left:angle<-.12};}
  if(f>0&&f<delay)input={};
  if(custom)input=custom(s,f);
  step(s,input);for(const e of s.events)events.add(e.type);for(const p of s.props){if(p.label==='seesaw')bridge=Math.max(bridge,Math.abs(p.angle));if(p.dropped)dropped++;}
  assert.ok([s.body,...s.wheels].every(b=>Number.isFinite(b.position.x)&&Number.isFinite(b.position.y)));
  if(['won','crashed'].includes(s.status))break;
 }return{s,bridge,dropped,events}}
 check('25 unique tracks, five vehicles and five distinct palettes',()=>{assert.equal(LEVELS.length,25);assert.equal(new Set(LEVELS.map(l=>l.name[0])).size,25);assert.equal(VEHICLES.length,5);assert.equal(THEMES.length,5);assert.equal(new Set(VEHICLES.map(v=>v.wheel)).size,4);assert.ok(new Set(LEVELS.flatMap(l=>l.props.map(p=>p.type))).size>=12)});
 const results=LEVELS.map((l,i)=>{let result=run(i);const solved=r=>r.s.status==='won'&&r.s.stamps===3&&r.s.time<=l.par;
  // Dynamic balls and tyre piles are chaotic; validate a reachable run, not one exact input tape.
  if(!solved(result))for(const balance of [true,false]){for(const delay of [0,30,60,90,120]){result=run(i,null,delay,balance);if(solved(result))break;}if(solved(result))break;}
  const s=result.s;check(`Track ${String(i+1).padStart(2,'0')}: three stars reachable (${s.time.toFixed(2)}s)`,()=>{assert.equal(s.status,'won',`${l.name[0]} at ${s.body.position.x}`);assert.equal(s.stamps,3);assert.ok(s.time<=l.par)});return result});
 check('Ready state has no timer or accidental drive',()=>{const s=settled(0),x=s.body.position.x;for(let i=0;i<180;i++)step(s,{});assert.equal(s.time,0);assert.equal(s.status,'ready');assert.ok(Math.abs(s.body.position.x-x)<6)});
 check('Accelerates quickly, brakes and reverses',()=>{const s=settled(0);for(let i=0;i<55;i++)step(s,{right:true});const speed=s.body.velocity.x;assert.ok(speed>6);for(let i=0;i<25;i++)step(s,{left:true});assert.ok(s.body.velocity.x<speed-2);for(let i=0;i<60;i++)step(s,{left:true});assert.ok(s.body.velocity.x<-.5)});
 check('Air controls tilt in opposite directions',()=>{const a=settled(0),b=settled(0);for(const s of [a,b])for(const p of [s.body,...s.wheels])Body.translate(p,{x:0,y:-400});for(let i=0;i<22;i++){step(a,{right:true});step(b,{left:true})}assert.ok(a.body.angle<b.body.angle-.05)});
 check('All five garage vehicles drive the opening track',()=>{for(let car=0;car<5;car++){const s=settled(0,car);for(let f=0;f<1800;f++){step(s,{right:s.airTime<.025});if(['won','crashed'].includes(s.status))break}assert.equal(s.status,'won',VEHICLES[car].id)}});
 check('See-saws move under the vehicle; planks actually fall',()=>{assert.ok(results[5].bridge>.12);assert.ok(results[16].dropped>0)});
 check('Boosts and springs have observable physical effects',()=>{assert.ok(results[4].events.has('boost'));assert.ok(results[4].s.topSpeed>12);assert.ok(results[6].events.has('spring'))});
 check('Parking requires stopping, not just crossing the line',()=>{assert.ok(results[7].s.parking>.3);assert.ok(Math.abs(results[7].s.body.velocity.x)<1.35);assert.notEqual(run(7,()=>({right:true})).s.status,'won')});
 check('A closing press can crush the kart',()=>{const s=settled(21),press=s.props[0],dx=press.visual.x-s.body.position.x;for(const b of [s.body,...s.wheels])Body.translate(b,{x:dx,y:0});s.started=true;s.status='playing';s.time=press.visual.period/4;step(s,{});assert.equal(s.status,'crashed');assert.ok(s.events.some(e=>e.reason==='crushed'))});
 check('A missed deadline fails the hot-potato track',()=>{const s=settled(20);s.started=true;s.status='playing';for(let i=0;i<1300;i++){step(s,{});if(s.status==='crashed')break}assert.ok(s.events.some(e=>e.reason==='late'))});
 check('Water falls fail and restart creates a clean world',()=>{const s=settled(16);for(const b of [s.body,...s.wheels])Body.translate(b,{x:0,y:500});step(s,{right:true});assert.equal(s.status,'crashed');const clean=settled(16);assert.equal(clean.stamps,0);assert.equal(clean.time,0);assert.ok(clean.props.every(p=>!p.dropped))});
 check('English and French expose the same interface keys',()=>assert.deepEqual(Object.keys(COPY.en).sort(),Object.keys(COPY.fr).sort()));
 console.log(`\n${checks} checks passed. 25 complete tracks, all three-star targets reachable.`);
})().catch(error=>{console.error(error);process.exitCode=1});
