import * as T from './vendor/three.module.js';
import {SCALE as S,visualOrigin} from './physics.js';
import {VEHICLES,THEMES} from './levels.js';
const C={ink:0x25243e,tyre:0x25243e,cream:0xfff7df,edge:0xd5f461,rock:0x7563ac,orange:0xff6887,lime:0xd5f461,teal:0x61f0cb,water:0x477aec,sky:0xb7a5f5,glass:0x78dffc,white:0xfff8ed};
const matCache=new Map(),cube=new T.BoxGeometry(1,1,1),cylinder=new T.CylinderGeometry(1,1,1,16);
function mat(color,roughness=.83){const key=color+':'+roughness;if(!matCache.has(key))matCache.set(key,new T.MeshStandardMaterial({color,roughness,flatShading:true}));return matCache.get(key)}
function box(g,w,h,d,color,x=0,y=0,z=0){const m=new T.Mesh(cube,mat(color));m.scale.set(w,h,d);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m}
function cyl(g,r,h,color,x,y,z){const m=new T.Mesh(cylinder,mat(color));m.scale.set(r,h,r);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m}
function rounded(w,h,d,r=.08){const shape=new T.Shape();const x=-w/2,y=-h/2;shape.moveTo(x+r,y);shape.lineTo(x+w-r,y);shape.quadraticCurveTo(x+w,y,x+w,y+r);shape.lineTo(x+w,y+h-r);shape.quadraticCurveTo(x+w,y+h,x+w-r,y+h);shape.lineTo(x+r,y+h);shape.quadraticCurveTo(x,y+h,x,y+h-r);shape.lineTo(x,y+r);shape.quadraticCurveTo(x,y,x+r,y);const geo=new T.ExtrudeGeometry(shape,{depth:d-r*2,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:r*.4,bevelThickness:r,curveSegments:3});geo.translate(0,0,-d/2+r);return geo}
function roundedBox(g,w,h,d,color,x,y,z,r=.08){const m=new T.Mesh(rounded(w,h,d,r),mat(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m}
function label(text,{fg='#213b3d',bg='#f1edda',size=128,w=256}={}){const c=document.createElement('canvas');c.width=w;c.height=size;const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,w,size);ctx.fillStyle=fg;ctx.font=`900 ${size*.4}px Arial`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,w/2,size/2);const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;return new T.MeshBasicMaterial({map:texture,side:T.DoubleSide,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2})}
const seeded=n=>{let s=n;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296}};
function planeLabel(g,text,w,h,x,y,z,opts={}){const m=new T.Mesh(new T.PlaneGeometry(w,h),label(text,opts));m.position.set(x,y,z);g.add(m);return m}
export class CoastRenderer{
 constructor(container){
  this.container=container;this.scene=new T.Scene();this.scene.background=new T.Color(C.sky);this.scene.fog=new T.Fog(C.sky,65,160);
  this.renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.NeutralToneMapping;this.renderer.toneMappingExposure=.95;container.append(this.renderer.domElement);
  this.camera=new T.OrthographicCamera(-20,20,12,-12,.5,180);this.camera.position.set(10,13,22);this.camera.lookAt(0,0,0);
  this.scene.add(new T.HemisphereLight(0xffffff,0x8b75c9,2));
  this.sun=new T.DirectionalLight(0xffedcc,3.7);this.sun.position.set(-10,20,15);this.sun.castShadow=true;this.sun.shadow.mapSize.set(1024,1024);this.sun.shadow.camera.left=-24;this.sun.shadow.camera.right=24;this.sun.shadow.camera.top=22;this.sun.shadow.camera.bottom=-22;this.sun.shadow.normalBias=.055;this.sun.shadow.bias=-.00015;this.scene.add(this.sun);this.scene.add(this.sun.target);
  this.water=new T.Group();this.scene.add(this.water);this.sea=box(this.water,600,.2,230,C.water,70,-5.25,-20);
  this.glints=[];const random=seeded(131);this.glintMesh=new T.InstancedMesh(cube,mat(0xffffff),200);this.glintMesh.instanceMatrix.setUsage(T.DynamicDrawUsage);this.water.add(this.glintMesh);this.dummy=new T.Object3D();
  for(let i=0;i<200;i++){this.glints.push({w:.15+random()*.8,d:.035+random()*.045,x:(random()-.5)*220,z:(random()-.5)*160,phase:random()*7});this.glintMesh.setColorAt(i,new T.Color(i%3?0x73a8ff:0xcbdcff));}
  this.backdrop=new T.Group();this.scene.add(this.backdrop);this.birds=[];
  for(let i=0;i<17;i++){
   const island=new T.Group(),x=-50+i*14+random()*8,z=-16-random()*18;island.position.set(x,-3.9,z);island.scale.setScalar(.22);
   const r=3+random()*7;const rock=cyl(island,r,1.5+random()*2,C.rock,0,.3,0);rock.rotation.y=random();cyl(island,r*.9,.2,0xa9bca0,0,1.2,0);
   for(let j=0;j<3;j++){const r1=.6+random()*1.1;const geo=new T.ConeGeometry(r1,1.8+random()*2,5);const m=new T.Mesh(geo,mat(j%2?0x839f89:0x9bb29b));m.position.set((random()-.5)*r,2,(random()-.5)*r);island.add(m)}
   this.backdrop.add(island);
  }
  for(let i=0;i<9;i++){const g=new T.Group();const a=box(g,.34,.025,.07,C.cream,-.13,0,0),b=box(g,.34,.025,.07,C.cream,.13,0,0);a.rotation.z=.3;b.rotation.z=-.3;g.position.set(random()*100-20,5+random()*5,-7-random()*25);g.userData={x:g.position.x,y:g.position.y,phase:random()*6};this.scene.add(g);this.birds.push(g)}
  this.root=new T.Group();this.scene.add(this.root);this.particles=[];this.time=0;this.camX=0;this.camY=0;this.shake=0;this.world=null;this.intro=true;
  this.onResize=()=>this.resize();window.addEventListener('resize',this.onResize);this.resize();
 }
 resize(){this.width=this.container.clientWidth;this.height=this.container.clientHeight;this.aspect=this.width/this.height;this.renderer.setSize(this.width,this.height);this.setFrustum(this.intro?19.5:17.2)}
 setFrustum(height){if(this.aspect<.8)height=this.intro?31:25;this.camera.left=-height*this.aspect/2;this.camera.right=height*this.aspect/2;this.camera.top=height/2;this.camera.bottom=-height/2;this.camera.updateProjectionMatrix()}
 clear(){
  const dispose=new Set(),materials=new Set(),shared=new Set(matCache.values());
  this.root.traverse(m=>{if(m.isInstancedMesh)m.dispose();if(m.geometry&&m.geometry!==cube&&m.geometry!==cylinder)dispose.add(m.geometry);for(const material of (Array.isArray(m.material)?m.material:[m.material]))if(material&&!shared.has(material))materials.add(material)});
  for(const geo of dispose)geo.dispose();for(const material of materials){material.map?.dispose();material.dispose()}
  this.root.clear();this.bindings=[];this.stampMeshes=[];this.particles=[];this.suspensionMeshes=[];this.explosionLight=null;

 }
 load(world,intro=false){
  this.clear();this.world=world;this.intro=intro;this.setFrustum(intro?19.5:17.2);const level=world.level;const theme=THEMES[level.theme];this.theme=theme;this.scene.background.setHex(theme.sky);this.scene.fog.color.setHex(theme.sky);this.sea.material=mat(theme.water);const rand=seeded(world.index+789);this.belts=[];this.effectClock=0;
  this.truck=this.makeTruck(world.vehicle);this.root.add(this.truck);this.wheelMeshes=[];
  for(let i=0;i<2;i++){
   const group=new T.Group();this.root.add(group);
   for(const z of [-.9,.9]){
    const tyre=cyl(group,.58,.46,C.tyre,0,0,z);tyre.rotation.x=Math.PI/2;
    const rim=cyl(group,.31,.475,C.cream,0,0,z);rim.rotation.x=Math.PI/2;
    const hub=cyl(group,.145,.49,world.vehicle.color,0,0,z);hub.rotation.x=Math.PI/2;
    for(let j=0;j<14;j++){const a=j*Math.PI/7;const tread=box(group,.11,.13,.49,0x304645,Math.sin(a)*.55,Math.cos(a)*.55,z);tread.rotation.z=-a}
    for(let j=0;j<5;j++){const a=j*Math.PI/2.5;const bolt=cyl(group,.035,.5,C.ink,Math.sin(a)*.22,Math.cos(a)*.22,z);bolt.rotation.x=Math.PI/2}
   }group.scale.setScalar(world.vehicle.wheel/29);this.wheelMeshes.push(group);
  }
  // Visible spring/damper assemblies follow the actual simulated axle travel.
  for(let axle=0;axle<2;axle++)for(const z of [-.73,.73]){
   const g=new T.Group();this.root.add(g);cyl(g,.035,1,C.ink,0,0,0);
   const points=Array.from({length:49},(_,j)=>{const a=j/48*Math.PI*12;return new T.Vector3(Math.cos(a)*.085,j/48-.5,Math.sin(a)*.085)});
   const coil=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),48,.022,4,false),mat(C.lime));g.add(coil);this.suspensionMeshes.push({group:g,axle,z});
  }
  for(const body of world.ground){
   const d=body.visual,dx=(d.x2-d.x1)/S,dy=(d.y1-d.y2)/S,len=Math.hypot(dx,dy);const g=new T.Group();g.position.set((d.x1+d.x2)/2/S,-(d.y1+d.y2)/2/S,0);g.rotation.z=Math.atan2(dy,dx);this.root.add(g);
   box(g,len,.25,4.3,d.material==='ice'?0x96d9f3:theme.road,0,-.125,0);box(g,len,.15,.15,theme.edge,0,-.18,2.09);box(g,len,.15,.15,theme.edge,0,-.18,-2.09);
   // A repeating inset lane line is a signature of the postal quays.
   for(let x=-len/2+.28;x<len/2;x+=1.15){box(g,.46,.012,.055,C.white,x,.028,1.65);box(g,.46,.012,.055,C.white,x,.028,-1.65);if(d.material==='ice'){const crack=box(g,.015,.015,.95,0xd8f8ff,x,.04,.5);crack.rotation.y=.5}}
   if(len>2){
    const cliff=new T.Shape(),left=d.x1/S,right=d.x2/S,topLeft=-d.y1/S-.3,topRight=-d.y2/S-.3,bottom=Math.min(topLeft,topRight)-4;
    cliff.moveTo(left,topLeft);cliff.lineTo(right,topRight);cliff.lineTo(right,bottom);cliff.lineTo(left,bottom);cliff.closePath();
    const wall=new T.Mesh(new T.ExtrudeGeometry(cliff,{depth:3.7,bevelEnabled:false,steps:1}),mat(theme.rock));wall.position.z=-1.93;wall.castShadow=true;wall.receiveShadow=true;this.root.add(wall);box(g,len,.16,4.15,theme.edge,0,-.38,0);
    for(let x=-len/2+.3;x<len/2-.2;x+=1.5){box(g,1.3,.36,3.85,theme.rock,x,-3.2-rand()*.5,-.12)}
    for(let x=-len/2+1.2;x<len/2-1;x+=3.6){box(g,.11,.34,.11,C.ink,x,.15,-1.94);box(g,.22,.06,.22,C.lime,x,.34,-1.94)}
   }
   if(len>4){const plantX=d.x1/S+1+rand()*(len-2);this.plant(plantX,-d.y1/S,-2.35,rand);}
  }
  for(const body of world.props){
   const d=body.visual,g=new T.Group();this.root.add(g);this.bindings.push({body,group:g});
   if(d.type==='crate'){
    roundedBox(g,.88,.88,1.04,C.orange,0,0,0,.04);box(g,.15,.9,1.06,C.ink,0,0,0);box(g,.9,.14,1.06,C.ink,0,0,0);planeLabel(g,'!',.3,.36,.22,.18,.54,{bg:'#ff6887',fg:'#25243e'});
   }else if(['ball','tyre','swing'].includes(d.type)){
    const r=d.r/S;
    if(d.type==='tyre'){const m=cyl(g,r,1.1,C.tyre,0,0,0);m.rotation.x=Math.PI/2;for(const z of [-.56,.56]){const rim=cyl(g,r*.6,.08,C.orange,0,0,z);rim.rotation.x=Math.PI/2;}for(let j=0;j<8;j++){const a=j*Math.PI/4;const tread=box(g,.12,.22,1.12,C.ink,Math.sin(a)*r,Math.cos(a)*r,0);tread.rotation.z=-a;}}

    else{const m=new T.Mesh(new T.SphereGeometry(r,16,12),mat(d.type==='swing'?C.orange:[0xffcc38,0x6be3e8,0xc58aff][body.id%3]));m.castShadow=true;m.receiveShadow=true;g.add(m);const ring=new T.Mesh(new T.TorusGeometry(r*.99,.045,5,24),mat(C.white));g.add(ring);if(d.type==='swing'){const binding=this.bindings.at(-1);binding.rope=box(this.root,.05,1,.05,C.ink,0,0,0);}}
   }else if(['ceiling','rotor','press'].includes(d.type)){
    const w=d.w/S,h=(d.h||20)/S;box(g,w,h,4.1,d.type==='ceiling'?theme.road:C.orange);box(g,w,.13,4.22,C.ink,0,-h/2,0);
    for(let x=-w/2+.15;x<w/2;x+=.42){const stripe=box(g,.2,.12,4.24,C.lime,x,-h/2-.04,0);stripe.rotation.z=.25;}
    if(d.type==='rotor'){for(const z of [-2.5,2.5])box(this.root,.2,3.3,.2,C.ink,d.x/S,-d.y/S-1.5,z);const bolt=cyl(g,.19,4.4,C.lime,0,0,0);bolt.rotation.x=Math.PI/2;}
    if(d.type==='press')for(const z of [-2.6,2.6]){box(this.root,.18,5.2,.18,C.ink,d.x/S,2,z);box(this.root,1,.17,.5,C.orange,d.x/S,4.6,z)}
    if(d.type==='ceiling')for(const x of [-w/2+.25,w/2-.25])for(const z of [-2.5,2.5])box(g,.2,2.8,.2,C.ink,x,-1.4,z);
   }else{
    const w=d.w/S,color=d.type==='spring'?C.teal:d.type==='boost'?0xffce38:d.type==='conveyor'?0x67d8f3:d.type==='fragile'?0xffa356:C.orange;
    box(g,w,.4,4.25,color);box(g,w,.12,3.9,C.ink,0,-.25,0);
    for(let x=-w/2+.18;x<w/2;x+=.5){const m=box(g,.19,.015,.42,C.ink,x,.21,1.7);m.rotation.y=.5;const m2=box(g,.19,.015,.42,C.ink,x,.21,-1.7);m2.rotation.y=.5;}
    if(d.type==='seesaw'){const pivot=new T.Group();this.root.add(pivot);pivot.position.set(d.x/S,-d.y/S-.6,0);const m=new T.Mesh(new T.CylinderGeometry(.16,.7,.9,3),mat(C.lime));m.rotation.y=Math.PI/6;pivot.add(m);box(pivot,.14,2.8,2.7,C.ink,0,-1.8,0);}
    if(d.type==='lift')for(const z of [-2.4,2.4]){box(this.root,.17,5.1,.17,C.ink,d.x/S,-1.8,z);box(this.root,.34,.16,.34,C.lime,d.x/S,.8,z)}
    if(['spring','boost','conveyor'].includes(d.type)){
     for(let x=-w/2+.4;x<w/2-.1;x+=.85){const arrow=planeLabel(g,d.type==='spring'?'↑':d.type==='conveyor'&&d.speed<0?'«':'»',.52,.68,x,.215,0,{bg:'#'+color.toString(16).padStart(6,'0'),fg:'#25243e',size:128,w:128});arrow.rotation.x=-Math.PI/2;arrow.rotation.z=-Math.PI/2;if(d.type==='conveyor')this.belts.push({arrow,base:x,w,direction:d.speed});}
    }
   }
  }
  for(let i=0;i<3;i++){
   const [x,y]=level.stamps[i],g=new T.Group();g.position.set(x/S,-y/S,.12);g.rotation.y=-.2;this.root.add(g);box(g,.57,.72,.1,C.white);box(g,.43,.56,.116,C.orange);planeLabel(g,'P',.34,.44,0,0,.078,{bg:'#ef8a61',fg:'#f9f5e8',size:128,w:128});
   for(let j=0;j<5;j++)for(const side of [-1,1]){const m=cyl(g,.04,.12,C.white,side*.295,-.28+j*.14,0);m.rotation.x=Math.PI/2;}
   g.userData.baseY=-y/S;this.stampMeshes.push(g);
  }
  this.finishFlag(level.finish/S,-level.road.at(-1)[3]/S,level.goal==='park');this.sign(4.8,0,-2.8,String(world.index+1).padStart(2,'0'));
  // The diorama gets two buoys and a little moored mail boat.
  for(let x=0;x<level.finish/S+8;x+=9){const z=4.6+rand()*3;const buoy=new T.Group();buoy.position.set(x,-3.9,z);cyl(buoy,.21,.2,C.orange,0,0,0);cyl(buoy,.08,.6,C.cream,0,.35,0);this.root.add(buoy)}
  this.batchStatic();this.camX=intro?(this.aspect<.8?4.5:-1.7):level.start/S+4;this.camY=intro?(this.aspect<.8?4.9:.6):1.2;this.shake=0;this.update(world,0,0);
 }
 batchStatic(){
  const excluded=new Set([this.truck,...this.wheelMeshes,...this.suspensionMeshes.map(p=>p.group),...this.stampMeshes,...this.bindings.map(b=>b.group),...this.bindings.map(b=>b.rope).filter(Boolean)]),batches=new Map();this.root.updateMatrixWorld(true);
  const visit=node=>{if(excluded.has(node))return;if(node.isMesh&&node.geometry===cube){const key=node.material.uuid;if(!batches.has(key))batches.set(key,[]);batches.get(key).push(node)}for(const child of node.children)visit(child)};visit(this.root);
  for(const objects of batches.values()){const m=new T.InstancedMesh(cube,objects[0].material,objects.length);objects.forEach((o,i)=>{m.setMatrixAt(i,o.matrixWorld);o.removeFromParent()});m.castShadow=true;m.receiveShadow=true;this.root.add(m)}
 }
 makeTruck(v){
  const g=new T.Group(),color=v.color,length=v.length/S;this.flames=[];
  roundedBox(g,length,v.h/S,1.5,color,0,0,0,.07);box(g,length*.82,.16,1.32,C.ink,0,-.28,0);
  if(v.id==='van'){
   roundedBox(g,2.8,1.1,1.55,color,0,.7,0,.12);roundedBox(g,2.95,.12,1.66,C.white,0,1.29,0,.04);
   for(const z of [-.815,.815]){roundedBox(g,.73,.51,.025,C.glass,.85,.85,z,.025);box(g,.08,.57,.035,C.ink,.53,.85,z);planeLabel(g,'P',.5,.55,-.4,.72,z,{bg:'#bb83ff',fg:'#fff7df',w:128});}
   box(g,.025,.5,1.2,C.glass,1.42,.86,0);
   const cone=new T.Mesh(new T.ConeGeometry(.22,.55,8),mat(0xffcf32));cone.rotation.z=Math.PI;cone.position.set(-.45,1.64,0);g.add(cone);const scoop=new T.Mesh(new T.SphereGeometry(.29,12,8),mat(0xff83b3));scoop.position.set(-.45,1.99,0);g.add(scoop);
  }else if(v.id==='monster'){
   roundedBox(g,1.26,.68,1.5,color,-.1,.64,0,.08);roundedBox(g,1.38,.13,1.61,C.lime,-.1,1.02,0,.04);
   for(const z of [-.79,.79])roundedBox(g,.87,.43,.025,C.glass,-.02,.73,z,.03);
   roundedBox(g,.9,.28,1.5,color,1.02,.32,0,.05);for(const z of [-.6,.6])cyl(g,.09,1.25,C.ink,-1.05,.65,z);
  }else if(v.id==='rocket'){
   roundedBox(g,1.22,.58,1.4,color,.2,.58,0,.09);for(const z of [-.74,.74])roundedBox(g,.82,.35,.025,C.glass,.25,.67,z,.035);
   box(g,.09,.66,1.3,C.ink,-1.2,.45,0);box(g,.56,.12,2.08,C.lime,-1.22,.81,0);
   for(const z of [-.48,.48]){const jet=cyl(g,.24,.85,C.ink,-1.52,.13,z);jet.rotation.z=Math.PI/2;const flame=new T.Mesh(new T.ConeGeometry(.20,.85,6),new T.MeshBasicMaterial({color:0xffcf32}));flame.rotation.z=Math.PI/2;flame.position.set(-2.2,.13,z);g.add(flame);this.flames.push(flame);}
  }else{
   roundedBox(g,.72,.38,1.35,color,.85,.29,0,.06);roundedBox(g,.52,.2,1.32,C.white,-.79,.27,0,.035);
   if(v.id==='buggy'){for(const z of [-.66,.66]){box(g,.08,.83,.08,C.ink,-.42,.57,z);const bar=box(g,1.2,.07,.08,C.ink,.11,.96,z);bar.rotation.z=-.15;box(g,.08,.65,.08,C.ink,.67,.56,z)}}
   else{box(g,.36,.5,.42,C.ink,-.23,.37,0);const steer=new T.Mesh(new T.TorusGeometry(.17,.035,5,12),mat(C.ink));steer.position.set(.46,.45,0);steer.rotation.y=Math.PI/2;g.add(steer);}
  }
  // Tiny, perpetually unqualified pigeon driver.
  const bird=new T.Group();this.driver=bird;bird.position.set(v.id==='van'?.87:0,v.id==='monster'?.48:.44,0);if(['van','rocket'].includes(v.id))bird.scale.setScalar(.73);
  const torso=new T.Mesh(new T.SphereGeometry(.23,12,8),mat(C.white));torso.scale.set(.8,1,1);bird.add(torso);
  const head=new T.Mesh(new T.SphereGeometry(.2,12,8),mat(C.white));head.position.set(.06,.3,0);bird.add(head);
  const beak=new T.Mesh(new T.ConeGeometry(.085,.21,4),mat(0xffa030));beak.rotation.z=-Math.PI/2;beak.position.set(.29,.29,0);bird.add(beak);
  for(const z of [-.16,.16]){const eye=new T.Mesh(new T.SphereGeometry(.037,8,6),mat(C.ink));eye.position.set(.16,.36,z);bird.add(eye)}
  roundedBox(bird,.37,.14,.36,v.id==='kart'?C.orange:C.lime,.04,.49,0,.04);g.add(bird);
  box(g,.13,.18,1.7,C.white,length/2+.04,-.07,0);box(g,.13,.16,1.7,C.ink,-length/2-.03,-.12,0);
  for(const z of [-.5,.5]){const light=cyl(g,.11,.09,C.white,length/2+.06,.16,z);light.rotation.z=Math.PI/2;box(g,.08,.12,.19,0xff315c,-length/2,.06,z)}
  return g;
 }
 plant(x,y,z,rand){const g=new T.Group();g.position.set(x,y,z);this.root.add(g);box(g,.55,.18,.55,C.edge,0,.02,0);for(let i=0;i<4;i++){const m=box(g,.1,.35+rand()*.3,.1,i%2?this.theme.green:this.theme.green,(rand()-.5)*.3,.2,(rand()-.5)*.3);m.rotation.z=(rand()-.5)*.6}}
 sign(x,y,z,num){const g=new T.Group();g.position.set(x,y,z);this.root.add(g);box(g,.08,1.3,.08,C.ink,0,.65,0);roundedBox(g,.8,.66,.1,C.cream,0,1.4,0,.05);planeLabel(g,num,.63,.5,0,1.4,.058,{size:128,w:128});}
 finishFlag(x,y=0,parking=false){
  const g=new T.Group();g.position.set(x,y,0);this.root.add(g);
  for(const z of [-2.25,2.25]){cyl(g,.055,3.2,C.ink,0,1.6,z);cyl(g,.1,.16,C.lime,0,3.25,z)}
  box(g,.12,.14,4.6,C.ink,0,3.04,0);
  for(let i=0;i<12;i++){const flag=new T.Mesh(new T.ConeGeometry(.17,.35,3),mat(i%2?C.lime:C.orange));flag.rotation.x=Math.PI;flag.position.set(0,2.82,-2.05+i*.37);g.add(flag)}
  if(parking){box(g,4.2,.02,4.15,0xffcf32,2.1,.015,0);const p=planeLabel(g,'P',1.7,1.8,2.1,.035,0,{bg:'#ffcf32',w:128});p.rotation.x=-Math.PI/2;}
  for(let j=0;j<7;j++)for(let k=0;k<2;k++)box(g,.15,.018,.48,(j+k)%2?C.ink:C.cream,-.1+k*.16,.045,-1.5+j*.49);
  const postbox=new T.Group();postbox.position.set(1.65,0,-2.7);g.add(postbox);box(postbox,.14,1.3,.14,C.ink,0,.65,0);roundedBox(postbox,.65,.72,.55,C.orange,0,1.5,0,.09);box(postbox,.4,.07,.015,C.ink,0,1.68,.29);planeLabel(postbox,'P',.28,.28,0,1.4,.285,{bg:'#ef8a61',size:128,w:128});
 }
 burst(x,y,color,count=14,power=1){
  for(let i=0;i<count;i++){
   const g=box(this.root,.06+Math.random()*.06,.06,.08,color,x,y,Math.random()*.5);g.castShadow=false;
   this.particles.push({mesh:g,v:new T.Vector3((Math.random()-.5)*4*power,Math.random()*4*power,(Math.random()-.5)*3*power),life:.65+Math.random()*.55,total:1});
  }
 }
 explode(s){
  const origin=visualOrigin(s),x=origin.x/S,y=-origin.y/S;
  this.truck.visible=false;this.wheelMeshes.forEach(g=>g.visible=false);this.suspensionMeshes.forEach(p=>p.group.visible=false);this.shake=.3;
  for(let i=0;i<22;i++){const mesh=box(this.root,.15+Math.random()*.45,.1+Math.random()*.25,.2+Math.random()*.4,i%3?s.vehicle.color:C.ink,x+(Math.random()-.5)*2,y+(Math.random()-.5), (Math.random()-.5)*1.7);this.particles.push({mesh,v:new T.Vector3((Math.random()-.5)*10+s.body.velocity.x*.3,3+Math.random()*6,(Math.random()-.5)*6),life:1.4+Math.random(),decay:.997,gravity:10,spin:(Math.random()-.5)*13});}
  for(let i=0;i<2;i++){const mesh=this.wheelMeshes[i].clone(true);mesh.visible=true;this.root.add(mesh);this.particles.push({mesh,v:new T.Vector3(i?5:-5,7+i*2,i?2:-2),life:2.2,decay:1,gravity:10,spin:i?8:-9});}
  const flash=new T.Mesh(new T.IcosahedronGeometry(1,1),new T.MeshBasicMaterial({color:0xffee91,transparent:true,depthWrite:false}));flash.position.set(x,y,.2);flash.scale.setScalar(.1);this.root.add(flash);this.particles.push({mesh:flash,v:new T.Vector3(),life:.42,total:.42,mode:'flash',ownGeometry:true,ownMaterial:true});
  for(let i=0;i<10;i++){const mesh=new T.Mesh(new T.IcosahedronGeometry(.25+Math.random()*.25,1),new T.MeshBasicMaterial({color:i<4?0xff9e39:0x4b405a,transparent:true,opacity:.8,depthWrite:false}));mesh.position.set(x+(Math.random()-.5)*1.4,y+(Math.random()-.5),Math.random()*.8);this.root.add(mesh);this.particles.push({mesh,v:new T.Vector3((Math.random()-.5)*3,1+Math.random()*2,(Math.random()-.5)*2),life:1.1+Math.random()*.6,total:1.7,mode:'smoke',ownGeometry:true,ownMaterial:true});}
  const ring=new T.Mesh(new T.RingGeometry(.8,1.06,40),new T.MeshBasicMaterial({color:0xffdf68,transparent:true,opacity:.8,depthWrite:false,side:T.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.set(x,y-.5,0);this.root.add(ring);this.particles.push({mesh:ring,v:new T.Vector3(),life:.55,total:.55,mode:'ring',ownGeometry:true,ownMaterial:true});
  this.explosionLight=new T.PointLight(0xffa147,15,12,2);this.explosionLight.position.set(x,y+1,2);this.root.add(this.explosionLight);
 }
 update(s,dt,wallTime){
  this.time=wallTime;const origin=visualOrigin(s),x=origin.x/S,y=-origin.y/S;
  this.truck.position.set(x,y,0);this.truck.rotation.z=-s.body.angle;
  if(this.intro){this.truck.position.y+=Math.sin(wallTime*2)*.045;this.truck.rotation.z+=Math.sin(wallTime*1.8)*.006}
  this.wheelMeshes.forEach((g,i)=>{g.position.set(s.wheels[i].position.x/S,-s.wheels[i].position.y/S,0);g.rotation.z=-s.wheels[i].angle});
  for(const strut of this.suspensionMeshes){const dx=(strut.axle?1:-1)*s.vehicle.base/2,dy=s.vehicle.anchor,a=s.body.angle;const ax=x+(Math.cos(a)*dx-Math.sin(a)*dy)/S,ay=y-(Math.sin(a)*dx+Math.cos(a)*dy)/S;const wheel=s.wheels[strut.axle],wx=wheel.position.x/S,wy=-wheel.position.y/S;strut.group.position.set((ax+wx)/2,(ay+wy)/2,strut.z);strut.group.scale.y=Math.max(.1,Math.hypot(wx-ax,wy-ay));strut.group.rotation.z=Math.atan2(wy-ay,wx-ax)-Math.PI/2;}

  for(const {body,group,rope} of this.bindings){group.position.set(body.position.x/S,-body.position.y/S,0);group.rotation.z=-body.angle;if(body.triggered!==undefined&&!body.dropped)group.rotation.z+=Math.sin(wallTime*65)*.025;if(rope){const ax=body.visual.x/S,ay=-body.visual.y/S,dx=body.position.x/S-ax,dy=-body.position.y/S-ay;rope.position.set(ax+dx/2,ay+dy/2,0);rope.scale.y=Math.hypot(dx,dy);rope.rotation.z=-Math.atan2(dx,dy);}}
  for(let i=0;i<3;i++){const g=this.stampMeshes[i];g.visible=!s.collected[i]&&!this.intro;g.position.y=g.userData.baseY+Math.sin(wallTime*2.6+i)*.10;g.rotation.y=Math.sin(wallTime*1.5+i)*.35;}
  for(const b of this.birds){b.position.x=b.userData.x+Math.sin(wallTime*.08+b.userData.phase)*8;b.position.y=b.userData.y+Math.sin(wallTime*1.6+b.userData.phase)*.15;b.children[0].rotation.z=.2+Math.sin(wallTime*4+b.userData.phase)*.3;b.children[1].rotation.z=-b.children[0].rotation.z;}
  for(let i=0;i<this.glints.length;i++){const m=this.glints[i];this.dummy.position.set(m.x,-5.13,m.z);this.dummy.scale.set(m.w*(.45+(.5+.5*Math.sin(wallTime*.9+m.phase))*.7),.007,m.d);this.dummy.updateMatrix();this.glintMesh.setMatrixAt(i,this.dummy.matrix)}this.glintMesh.instanceMatrix.needsUpdate=true;
  for(let i=this.particles.length-1;i>=0;i--){const p=this.particles[i];p.life-=dt;
   if(p.mode==='flash'){const progress=1-p.life/p.total;p.mesh.scale.setScalar(.1+Math.sin(Math.min(1,progress)*Math.PI)*2.2);p.mesh.material.opacity=Math.max(0,p.life/p.total);p.mesh.material.color.setHex(progress<.35?0xffef94:0xff7638);}
   else if(p.mode==='ring'){p.mesh.scale.addScalar(dt*7);p.mesh.material.opacity=Math.max(0,p.life/p.total)*.8;}
   else if(p.mode==='smoke'){p.mesh.position.addScaledVector(p.v,dt);p.mesh.scale.addScalar(dt*.8);p.mesh.material.opacity=Math.max(0,p.life/p.total)*.75;}
   else{p.v.y-=dt*(p.gravity??6);p.mesh.position.addScaledVector(p.v,dt);p.mesh.rotation.z+=dt*(p.spin??3);p.mesh.scale.multiplyScalar(Math.pow(p.decay??.98,dt*60));}
   if(p.life<=0){this.root.remove(p.mesh);if(p.ownGeometry)p.mesh.geometry.dispose();if(p.ownMaterial)p.mesh.material.dispose();this.particles.splice(i,1)}
  }
  if(this.explosionLight)this.explosionLight.intensity*=Math.pow(.82,dt*60);

  this.effectClock+=dt;
  if(s.started&&s.status==='playing'&&this.effectClock>.075&&Math.abs(s.body.velocity.x)>2){this.effectClock=0;this.burst(x-1.3,y-.3,C.white,1,.23);if(s.time-s.lastBoost<.75)this.burst(x-1.8,y,0xffd238,2,.4);}
  if(this.driver)this.driver.rotation.z=Math.sin(wallTime*(s.started?17:3))*(s.started?.05:.025);
  for(const flame of this.flames){flame.visible=s.started&&s.status==='playing';flame.scale.y=.65+Math.random()*.5;}
  for(const belt of this.belts)belt.arrow.position.x=((belt.base+belt.w/2+wallTime*belt.direction*.9)%belt.w+belt.w)%belt.w-belt.w/2;
  const smooth=1-Math.exp(-dt*6.5);
  if(!this.intro){const lookahead=Math.min(4.7+Math.max(0,s.body.velocity.x)*.2,Math.max(2.5,this.aspect*(this.aspect<.8?25:17.2)*.24));const target=Math.min(x+lookahead,s.level.finish/S+1.5);this.camX+=(target-this.camX)*smooth;this.camY+=(Math.max(-3,y*.55+.2)-this.camY)*smooth;}
  const shake=(window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:this.shake);this.shake*=Math.pow(.84,dt*60);
  const zOffset=this.intro?19:23,xOffset=this.intro?9.5:8.3,yOffset=this.intro?12:11.5;
  this.camera.position.set(this.camX+xOffset,this.camY+yOffset+Math.sin(wallTime*90)*shake,zOffset);
  this.camera.lookAt(this.camX,this.camY,0);
  const shadowX=Math.round(this.camX/(48/1024))*(48/1024);this.sun.position.set(shadowX-10,20,15);this.sun.target.position.set(shadowX,0,0);this.sun.target.updateMatrixWorld();
  this.renderer.render(this.scene,this.camera);
 }
}
