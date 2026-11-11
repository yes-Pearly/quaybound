const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url'),root=path.resolve(__dirname,'..'),library={exports:{}};
new Function('module','exports',fs.readFileSync(path.join(root,'vendor/matter.min.js'),'utf8'))(library,library.exports);globalThis.Matter=library.exports;
const {Body}=library.exports;
(async()=>{
 const {createWorld,step,visualOrigin}=await import(pathToFileURL(path.join(root,'physics.js')));
 const {LEVELS,VEHICLES,THEMES}=await import(pathToFileURL(path.join(root,'levels.js')));
 const {COPY}=await import(pathToFileURL(path.join(root,'i18n.js')));
 let checks=0;const check=(name,fn)=>{fn();checks++;console.log('✓ '+name)};
 const settled=(i,car)=>{const s=createWorld(i,car);for(let f=0;f<90;f++)step(s,{});return s};
 const flat=car=>{const original=LEVELS[0];LEVELS[0]={...original,road:[[-10000,0,100000,0]],finish:90000,props:[],stamps:[]};const s=settled(0,car);LEVELS[0]=original;return s};
 const options=[.28,.45,.6,.9].flatMap(lean=>[{speed:99,d:12,delay:0,lean},{speed:7,d:12,delay:0,lean},{speed:9,d:18,delay:0,lean},{speed:6,d:16,delay:0,lean},{speed:99,d:12,delay:60,lean},{speed:7,d:12,delay:90,lean},{speed:8,d:20,delay:120,lean},{speed:5,d:12,delay:0,lean}]);
 function run(i,opt=options[0],fullGas=false){const s=settled(i),events=new Set();let bridge=0,dropped=0;
  for(let f=0;f<2400;f++){
   const v=s.body.velocity.x,a=Math.atan2(Math.sin(s.body.angle),Math.cos(s.body.angle));let right=v<opt.speed-.2,left=v>opt.speed+.6;
   if(s.level.goal==='park'){const desired=Math.max(-2,Math.min(6,(s.level.finish+85-s.body.position.x)*.009));right=v<desired-.3;left=v>desired+.3;}
   if(s.airTime>.035){const demand=a+s.body.angularVelocity*opt.d;right=demand>.08;left=demand<-.08;}
   if(s.grounded&&s.level.goal!=='park'){const road=s.level.road.find(r=>s.body.position.x>=r[0]&&s.body.position.x<=r[2]),slope=road?Math.atan2(road[3]-road[1],road[2]-road[0]):0,load=a-slope+s.body.angularVelocity*8;if(load<-opt.lean){right=false;left=true;}else if(load>.7){right=true;left=false;}}
   if(f>0&&f<opt.delay)right=left=false;
   step(s,fullGas?{right:true}:{right,left});for(const e of s.events)events.add(e.type);for(const p of s.props){if(p.label==='seesaw')bridge=Math.max(bridge,Math.abs(p.angle));if(p.dropped)dropped++;}
   assert.ok([s.body,...s.wheels].every(b=>Number.isFinite(b.position.x)&&Number.isFinite(b.position.y)));
   if(['won','crashed'].includes(s.status))break;
  }return{s,events,bridge,dropped};
 }
 check('25 unique tracks, five vehicles, five palettes and varied obstacles',()=>{assert.equal(LEVELS.length,25);assert.equal(new Set(LEVELS.map(l=>l.name[0])).size,25);assert.equal(VEHICLES.length,5);assert.equal(THEMES.length,5);assert.ok(new Set(LEVELS.flatMap(l=>l.props.map(p=>p.type))).size>=12)});
 const results=LEVELS.map((level,i)=>{let result;for(const opt of options){result=run(i,opt);if(result.s.status==='won'&&result.s.stamps===3&&result.s.time<=level.par)break;}
  check(`Track ${String(i+1).padStart(2,'0')}: all stamps and time target reachable (${result.s.time.toFixed(2)}s)`,()=>{assert.equal(result.s.status,'won',level.name[0]);assert.equal(result.s.stamps,3);assert.ok(result.s.time<=level.par,`${result.s.time} > ${level.par}`)});return result;});
 check('Ready state stays still with no timer',()=>{const s=flat(0),x=s.body.position.x;for(let f=0;f<180;f++)step(s,{});assert.equal(s.status,'ready');assert.equal(s.time,0);assert.ok(Math.abs(s.body.position.x-x)<6)});
 check('Braking preserves momentum, then stops and reverses',()=>{const s=flat(0);for(let f=0;f<60;f++)step(s,{right:true});const speed=s.body.velocity.x;step(s,{left:true});assert.ok(s.body.velocity.x>speed*.85);assert.ok(s.body.velocity.x>5);for(let f=0;f<35;f++)step(s,{left:true});assert.ok(s.body.velocity.x<speed*.6);for(let f=0;f<100;f++)step(s,{left:true});assert.ok(s.body.velocity.x<-.5)});
 check('Throttle and brake pressure rise progressively',()=>{const s=flat(0);step(s,{right:true});assert.ok(s.driveInput>0&&s.driveInput<.2);for(let f=0;f<60;f++)step(s,{right:true});step(s,{left:true});assert.ok(s.brakeInput>0&&s.brakeInput<.3)});
 check('Both pedals brake without accelerating or reversing',()=>{const s=flat(0);for(let f=0;f<65;f++)step(s,{right:true});const speed=s.body.velocity.x;for(let f=0;f<90;f++)step(s,{right:true,left:true});assert.ok(Math.abs(s.body.velocity.x)<speed*.15);assert.ok(Math.abs(s.driveInput)<.001)});
 check('Acceleration compresses rear suspension; braking loads the front',()=>{const s=flat(0);for(let f=0;f<25;f++)step(s,{right:true});assert.ok(s.body.angle<-.08);assert.ok(s.suspension[0].compression>s.suspension[1].compression+6);for(let f=0;f<30;f++)step(s,{right:true});for(let f=0;f<22;f++)step(s,{left:true});assert.ok(s.body.angle>.02);assert.ok(s.suspension[1].compression>s.suspension[0].compression+4)});
 check('Vehicle mass, weight distribution, drivetrain and suspension differ',()=>{const cars=VEHICLES.map((v,i)=>flat(i));assert.ok(cars[1].body.mass>cars[3].body.mass*4);assert.equal(VEHICLES[0].rearDrive,1);assert.equal(VEHICLES[1].rearDrive,0);assert.ok(VEHICLES[2].travel>VEHICLES[3].travel*2);for(const s of cars){const o=visualOrigin(s),v=s.vehicle;assert.ok(Math.abs(s.body.position.x-o.x-v.comX*Math.cos(s.body.angle)+v.comY*Math.sin(s.body.angle))<.01)}for(let f=0;f<80;f++)for(const s of cars)step(s,{right:true});assert.ok(cars[3].body.velocity.x>cars[1].body.velocity.x*1.3);assert.ok(Math.abs(cars[0].body.angle-cars[3].body.angle)>.015)});
 check('Opposite air controls rotate in opposite directions',()=>{const a=flat(0),b=flat(0);for(const s of [a,b])for(const p of [s.body,...s.wheels])Body.translate(p,{x:0,y:-600});for(let f=0;f<22;f++){step(a,{right:true});step(b,{left:true})}assert.ok(a.body.angle<b.body.angle-.1)});
 check('Overturned roof contact triggers a crash, while an airborne flip is allowed',()=>{const s=flat(0),pivot={...s.body.position};for(const b of [s.body,...s.wheels])Body.rotate(b,Math.PI,pivot);const dy=-s.body.bounds.max.y-5;for(const b of [s.body,...s.wheels])Body.translate(b,{x:0,y:dy});for(let f=0;f<60&&s.status!=='crashed';f++)step(s,{});assert.equal(s.status,'crashed');assert.ok(s.events.some(e=>e.reason==='flipped'));const air=flat(0);for(const b of [air.body,...air.wheels]){Body.rotate(b,Math.PI,air.body.position);Body.translate(b,{x:0,y:-800})}step(air,{});assert.notEqual(air.status,'crashed')});
 check('Each garage vehicle can finish the opening track',()=>{for(let car=0;car<5;car++){const s=settled(0,car);for(let f=0;f<1200&&!['won','crashed'].includes(s.status);f++)step(s,{right:true});assert.equal(s.status,'won',VEHICLES[car].id)}});
 check('Holding the accelerator alone fails at least six later tracks',()=>{let failed=0;for(let i=6;i<25;i++)if(run(i,options[0],true).s.status!=='won')failed++;assert.ok(failed>=6,`${failed} failed`)});
 check('Moving bridges, fragile roads, boosts and springs work',()=>{assert.ok(results[5].bridge>.08);assert.ok(results[16].dropped>0);assert.ok(results[4].events.has('boost'));assert.ok(results[4].s.topSpeed>12);assert.ok(results[6].events.has('spring'))});
 check('Parking requires a slow stop inside the marked area',()=>{assert.ok(results[7].s.parking>.3);assert.ok(Math.abs(results[7].s.body.velocity.x)<1.35);assert.notEqual(run(7,options[0],true).s.status,'won')});
 check('Closing presses crush cars',()=>{const s=settled(21),press=s.props[0],dx=press.visual.x-s.body.position.x;for(const b of [s.body,...s.wheels])Body.translate(b,{x:dx,y:0});s.started=true;s.status='playing';s.time=press.visual.period/4;step(s,{});assert.equal(s.status,'crashed');assert.ok(s.events.some(e=>e.reason==='crushed'))});
 check('A missed deadline fails the timed track',()=>{const s=settled(20);s.started=true;s.status='playing';for(let f=0;f<1300&&s.status!=='crashed';f++)step(s,{});assert.ok(s.events.some(e=>e.reason==='late'))});
 check('Water falls fail; restart builds a fresh world',()=>{const s=settled(16);for(const b of [s.body,...s.wheels])Body.translate(b,{x:0,y:500});step(s,{right:true});assert.equal(s.status,'crashed');const clean=settled(16);assert.equal(clean.time,0);assert.equal(clean.stamps,0);assert.ok(clean.props.every(p=>!p.dropped))});
 check('English and French have matching interface keys',()=>assert.deepEqual(Object.keys(COPY.en).sort(),Object.keys(COPY.fr).sort()));
 console.log(`\n${checks} physics checks passed.`);
})().catch(error=>{console.error(error);process.exitCode=1});
