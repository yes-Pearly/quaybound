import {LEVELS,VEHICLES} from './levels.js';
const {Engine,Bodies,Body,Composite,Constraint,Vector,Query}=globalThis.Matter;
export const SCALE=50;
export function createWorld(index,carIndex=LEVELS[index].car){
 const level=LEVELS[index],vehicle=VEHICLES[carIndex],engine=Engine.create({positionIterations:10,velocityIterations:10,constraintIterations:6});engine.gravity.scale=.00125;
 const ground=[],props=[],group=Body.nextGroup(true);
 for(const [x1,y1,x2,y2,material] of level.road){const angle=Math.atan2(y2-y1,x2-x1),depth=110;const b=Bodies.rectangle((x1+x2)/2-Math.sin(angle)*depth/2,(y1+y2)/2+Math.cos(angle)*depth/2,Math.hypot(x2-x1,y2-y1)+2,depth,{isStatic:true,angle,friction:material==='ice'?.095:1.3,label:'road'});b.visual={type:'road',x1,y1,x2,y2,material};ground.push(b)}
 for(const def of level.props){let b;const d={...def};
  if(['ball','tyre'].includes(d.type))b=Bodies.circle(d.x,d.y,d.r,{density:d.type==='tyre'?.0003:.00015,friction:.45,restitution:d.type==='ball'?.65:.3,label:d.type});
  else if(d.type==='swing')b=Bodies.circle(d.x,d.y+d.length,d.r,{isStatic:true,label:d.type,restitution:.25});
  else if(d.type==='crate')b=Bodies.rectangle(d.x,d.y,44,44,{density:.00026,friction:.3,restitution:.08,chamfer:{radius:4},label:d.type});
  else if(['ceiling','rotor','press'].includes(d.type))b=Bodies.rectangle(d.x,d.y,d.w,d.h||20,{isStatic:true,friction:.4,label:d.type});
  else b=Bodies.rectangle(d.x,d.y+10,d.w,20,{isStatic:d.type!=='seesaw',density:.0014,friction:1.3,label:d.type});
  b.visual=d;props.push(b);
  if(d.type==='seesaw'){b.frictionAir=.07;Composite.add(engine.world,Constraint.create({pointA:{x:d.x,y:d.y+10},bodyB:b,length:0,stiffness:1}))}
 }
 const sx=level.start,r=vehicle.wheel,origin={x:sx,y:-r-vehicle.anchor-vehicle.ride+8};
 const options={collisionFilter:{group},density:vehicle.density,chamfer:{radius:6}};
 const parts=[Bodies.rectangle(sx,origin.y,vehicle.length,vehicle.h,options)];
 if(vehicle.roof)parts.push(Bodies.rectangle(sx+23,origin.y-vehicle.h/2-vehicle.roof/2,vehicle.id==='van'?vehicle.length-12:64,vehicle.roof,{...options,density:vehicle.density*.65}));
 const body=Body.create({parts,collisionFilter:{group},friction:.4,frictionAir:.0012,label:'truck'});
 Body.setMass(body,vehicle.mass);
 Body.setCentre(body,{x:origin.x+vehicle.comX,y:origin.y+vehicle.comY});
 Body.setInertia(body,body.inertia*.4*vehicle.inertia+body.mass*(vehicle.comX**2+vehicle.comY**2));
 const offset={x:sx-body.position.x,y:origin.y-body.position.y};
 const wheels=[-vehicle.base/2,vehicle.base/2].map(dx=>{
  const wheel=Bodies.circle(sx+dx,-r-1,r,{collisionFilter:{group},density:.001,friction:vehicle.grip,frictionStatic:4.5,frictionAir:.0007,restitution:0,label:'wheel'});
  Body.setMass(wheel,vehicle.wheelMass);Body.setInertia(wheel,.5*wheel.mass*r*r);return wheel;
 });
 // Axles slide along the chassis' local vertical axis. Forces are equal and opposite.
 // Unlike a rigid joint, the spring can compress, extend and pitch the sprung mass.
 const suspension=wheels.map(()=>({length:vehicle.ride,compression:0,load:0,anchor:{x:0,y:0}}));
 Composite.add(engine.world,[...ground,...props,body,...wheels]);
 return {index,level,vehicle,carIndex,engine,ground,props,body,wheels,offset,suspension,time:0,started:false,status:'ready',collected:[false,false,false],stamps:0,grounded:true,airTime:0,roofTime:0,lastSpring:-5,lastBoost:-5,contacts:[],events:[],previousVy:0,parking:0,topSpeed:0,driveInput:0,brakeInput:0,reverseHold:0};
}
function chassisForces(s,throttle,dt,both=false){
 const {body,wheels,vehicle:v}=s,axis={x:Math.cos(body.angle),y:Math.sin(body.angle)},down={x:-axis.y,y:axis.x};
 const reversing=throttle<0&&body.velocity.x<.6;
 s.reverseHold=reversing?s.reverseHold+dt/1000:0;
 const braking=both||throttle*body.velocity.x<-.35;
 const targetDrive=braking?0:throttle<0?(s.reverseHold>.14?-.7:0):throttle;
 const ease=1-Math.exp(-dt/1000*(braking?12:8));
 s.driveInput+=(targetDrive-s.driveInput)*ease;s.brakeInput+=((braking?1:0)-s.brakeInput)*ease;
 for(let i=0;i<2;i++){
  const w=wheels[i],mount=Vector.add(body.position,Vector.rotate({x:(i?1:-1)*v.base/2+s.offset.x,y:v.anchor+s.offset.y},body.angle));
  const delta=Vector.sub(w.position,mount),rel=Vector.sub(w.velocity,Body.getVelocity(body));
  // Velocity of the rotating attachment, in the same normalized units as Body.velocity.
  const arm=Vector.sub(mount,body.position);rel.x+=body.angularVelocity*arm.y;rel.y-=body.angularVelocity*arm.x;
  const length=Vector.dot(delta,down),side=Vector.dot(delta,axis),speed=Vector.dot(rel,down),sideSpeed=Vector.dot(rel,axis);
  const compression=v.ride-length;
  let spring=compression*v.spring*v.mass-speed*v.damper*v.mass;
  if(length<v.ride-v.travel*.65)spring+=(v.ride-v.travel*.65-length)*v.spring*v.mass*5;
  if(length>v.ride+v.travel*.55)spring-=(length-v.ride-v.travel*.55)*v.spring*v.mass*5;
  spring=Math.max(-v.mass*.009,Math.min(v.mass*.012,spring));
  const guide=Math.max(-w.mass*.008,Math.min(w.mass*.008,-side*w.mass*.0011-sideSpeed*w.mass*.0036));
  const force={x:down.x*spring+axis.x*guide,y:down.y*spring+axis.y*guide};
  Body.applyForce(w,w.position,force);Body.applyForce(body,mount,{x:-force.x,y:-force.y});
  s.suspension[i]={length,compression,load:Math.max(0,spring),anchor:mount};
  const ratio=i===0?v.rearDrive:1-v.rearDrive;
  const maxOmega=(s.driveInput<0?4:v.drive)/v.wheel;
  const speedRatio=Math.abs(w.angularVelocity)/maxOmega;
  const motor=v.mass*v.engine*ratio*s.driveInput*Math.max(0,1-speedRatio*speedRatio);
  const brake=-Math.sign(w.angularVelocity)*Math.min(v.mass*v.braking*(i===0?.35:.65)*s.brakeInput,Math.abs(w.angularVelocity)*w.inertia/(dt*dt));
  const bearing=-w.angularVelocity*v.mass*(Math.abs(s.driveInput)<.05?.0038:.0007);
  const torque=motor+brake+bearing;
  w.torque+=torque;body.torque-=torque;
 }
 if(!s.grounded&&s.airTime>.06)body.torque-=throttle*body.inertia*v.airTorque;
}

export function visualOrigin(s){return Vector.add(s.body.position,Vector.rotate(s.offset,s.body.angle))}
export function step(s,input={},dt=1000/60){
 s.events=[];if(s.status==='won'||s.status==='crashed')return;
 const {body,wheels,props,engine,level,vehicle:v}=s,both=!!(input.left&&input.right),throttle=both?0:input.right?1:input.left?-1:0;
 if(throttle&&!s.started){s.started=true;s.status='playing'}if(s.started)s.time+=dt/1000;
 for(const p of props){const d=p.visual,t=s.time;
  if(d.type==='lift')Body.setPosition(p,{x:d.x,y:d.y+10+Math.sin(t*2*Math.PI/d.period+(d.phase||0))*d.amplitude},true);
  if(d.type==='rotor')Body.setAngle(p,t*d.speed+(d.phase||0),true);
  if(d.type==='press')Body.setPosition(p,{x:d.x,y:d.y+Math.sin(t*2*Math.PI/d.period+(d.phase||0))*d.amplitude},true);
  if(d.type==='swing'){const dx=Math.sin(t*2*Math.PI/d.period+(d.phase||0))*d.amplitude;Body.setPosition(p,{x:d.x+dx,y:d.y+Math.sqrt(d.length*d.length-dx*dx)},true)}
  if(d.type==='seesaw'&&Math.abs(p.angle)>d.limit){Body.setAngle(p,Math.sign(p.angle)*d.limit);Body.setAngularVelocity(p,-p.angularVelocity*.1)}
 }
 const surfaces=[...s.ground,...props],collisions=wheels.map(w=>Query.collides(w,surfaces));s.grounded=collisions.some(c=>c.length);s.contacts=collisions;
 if(s.grounded){
  if(s.airTime>.14&&s.previousVy>2)s.events.push({type:'land',power:Math.min(s.previousVy/13,1)});
  s.airTime=0;
 }else s.airTime+=dt/1000;
 for(const p of props){const d=p.visual;
  const near=wheels.some(w=>Math.abs(w.position.x-d.x)<(d.w||0)/2+5&&Math.abs(w.position.y-(p.position.y-10))<v.wheel+18);
  if(d.type==='fragile'&&!p.dropped){if(near)p.triggered??=s.time;if(p.triggered!==undefined&&s.time-p.triggered>(d.delay||.8)){Body.setStatic(p,false);p.dropped=true;s.events.push({type:'crumble',x:p.position.x,y:p.position.y})}}
  if(d.type==='spring'&&s.time-s.lastSpring>1.6&&body.position.x>=d.x-5&&body.position.x<d.x+d.w/2&&near&&body.velocity.x>1){for(const b of [body,...wheels])Body.setVelocity(b,{x:Math.max(b.velocity.x,d.push||9),y:-(d.kick||14)});for(const w of wheels)Body.setAngularVelocity(w,Math.max(body.velocity.x,d.push||9)/v.wheel);s.lastSpring=s.time;s.events.push({type:'spring',x:d.x,y:d.y})}
  if(d.type==='boost'&&near&&s.time-s.lastBoost>1.2){for(const b of [body,...wheels])Body.setVelocity(b,{x:Math.max(b.velocity.x,d.power||13),y:b.velocity.y});for(const w of wheels)Body.setAngularVelocity(w,Math.max(body.velocity.x,d.power||13)/v.wheel);s.lastBoost=s.time;s.events.push({type:'boost',x:d.x,y:d.y})}
  if(d.type==='conveyor'&&near)for(const w of wheels)Body.applyForce(w,{x:w.position.x,y:w.position.y+v.wheel},{x:d.speed*body.mass*.00016,y:0});
 }
 const pressContact=props.some(p=>p.label==='press'&&p.position.y>-170&&Query.collides(body,[p]).length);
 s.previousVy=body.velocity.y;
 for(let sub=0;sub<2;sub++){chassisForces(s,throttle,dt/2,both);Engine.update(engine,dt/2);}
 s.topSpeed=Math.max(s.topSpeed,body.velocity.x);
 for(let i=0;i<level.stamps.length;i++){const [x,y]=level.stamps[i];if(!s.collected[i]&&Math.hypot(body.position.x-x,(body.position.y-y)*.8)<72){s.collected[i]=true;s.stamps++;s.events.push({type:'stamp',x,y,index:i})}}
 const angle=Math.atan2(Math.sin(body.angle),Math.cos(body.angle));
 if(Math.abs(angle)>1.95&&Query.collides(body,surfaces).length)s.roofTime+=dt/1000;else s.roofTime=0;
 const crushed=pressContact||props.some(p=>p.label==='press'&&p.position.y>-170&&Query.collides(body,[p]).length);
 const floor=Math.max(...level.road.map(r=>Math.max(r[1],r[3]))),reason=crushed?'crushed':body.position.y>floor+240?'splash':body.position.x<-330||s.roofTime>.065?'flipped':level.limit&&s.time>level.limit?'late':null;
 if(reason){s.status='crashed';s.events.push({type:'crash',reason});return}
 const valid=body.position.x>level.finish&&Math.abs(angle)<1.25&&s.grounded;
 if(level.goal==='park'){if(valid&&body.position.x<level.finish+210&&Math.abs(body.velocity.x)<1.35)s.parking+=dt/1000;else s.parking=0;if(s.parking>.3){s.status='won';s.events.push({type:'win'})}}
 else if(valid){s.status='won';s.events.push({type:'win'})}
}
