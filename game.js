import {LEVELS,VEHICLES,THEMES} from './levels.js';
import {COPY} from './i18n.js';
import {createWorld,step,SCALE} from './physics.js';
import {CoastRenderer} from './render.js';
import {Sound} from './audio.js';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],sound=new Sound(),SAVE='pigeon.quaybound.arcade.v2';
let saved={},storageOK=true;try{saved=JSON.parse(localStorage.getItem(SAVE)||'{}')||{}}catch{storageOK=false}
let lang=saved.lang==='fr'?'fr':'en',muted=saved.muted===true;
const records=Array.from({length:LEVELS.length},(_,i)=>{const r=saved.records?.[i];return r&&Number.isFinite(r.time)&&r.time>0&&r.time<3600?{time:r.time,stamps:Math.min(3,Math.max(0,Math.floor(Number(r.stamps)||0))),stars:Math.min(3,Math.max(1,Math.floor(Number(r.stars)||1)))}:null});
let world,view,index=0,mode='intro',modalType=null,previousModal=null,returnMode='intro',clock=0,acc=0,last=0,transitionAt=0,crashReason='splash',newBest=false,resultStars=0,activeFocus=null;
const keys=new Set(),pointers={left:false,right:false},input={left:false,right:false};
const t=k=>COPY[lang][k]||k,ln=level=>level.name[lang==='en'?0:1],fmt=seconds=>`${Math.floor(seconds/60).toString().padStart(2,'0')}:${(seconds%60).toFixed(1).padStart(4,'0')}`;
function save(){try{localStorage.setItem(SAVE,JSON.stringify({lang,muted,records}))}catch{storageOK=false}}
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toast.id);toast.id=setTimeout(()=>$('#toast').classList.remove('show'),2600)}
function translate(){document.documentElement.lang=lang;$$('[data-i18n]').forEach(el=>{el.innerHTML=t(el.dataset.i18n)});$('#language').innerHTML=lang==='en'?'EN <span class="dim">/ FR</span>':'<span class="dim">EN /</span> FR';$('#language').setAttribute('aria-label',lang==='en'?'Passer en français':'Switch to English');$('#sound').setAttribute('aria-label',t(muted?'unmute':'mute'));$('#fullscreen').setAttribute('aria-label',t('fullscreen'));$('#routes').setAttribute('aria-label',t('menu'));$('#pause').setAttribute('aria-label',t('pauseLabel'));$('#restart').setAttribute('aria-label',t('restart'));$('#brake').setAttribute('aria-label',t('brake'));$('#throttle').setAttribute('aria-label',t('gas'));if(records.some(Boolean))$('#play [data-i18n]').textContent=t('continue');if(world)refreshHUD();if(modalType)renderModal(modalType)}
function resetInput(){keys.clear();pointers.left=pointers.right=false;input.left=input.right=false;$('#brake').classList.remove('active');$('#throttle').classList.remove('active')}
function readInput(){input.left=pointers.left||['ArrowLeft','KeyA','KeyS','ArrowDown'].some(k=>keys.has(k));input.right=pointers.right||['ArrowRight','KeyD','KeyW','ArrowUp'].some(k=>keys.has(k));if(input.left&&input.right)input.left=input.right=false;$('#brake').classList.toggle('active',input.left);$('#throttle').classList.toggle('active',input.right)}
function loadLevel(i,intro=false,car=LEVELS[i].car){
 previousModal=null;
 resetInput();index=i;world=createWorld(index,car);for(let j=0;j<42;j++)step(world,{left:false,right:false});world.events=[];view.load(world,intro);mode=intro?'intro':'playing';modalType=null;$('#overlay').classList.add('hidden');$('#hud').classList.toggle('hidden',intro);$('#intro').inert=!intro;$('#intro').setAttribute('aria-hidden',String(!intro));document.body.classList.toggle('playing',!intro);$('#ready').classList.remove('hidden');$('#tip').style.opacity=1;$('#progress').style.width='0%';acc=0;transitionAt=0;refreshHUD();if(!intro){sound.start();sound.effect('click');$('#restart').focus({preventScroll:true})}
}
function start(i=null,car=null){
 sound.start();if(i===null){const first=records.findIndex(r=>!r);i=first>=0?first:0;}loadLevel(i,false,car??LEVELS[i].car);
}
function goHome(){resetInput();loadLevel(0,true);$('#play').focus({preventScroll:true})}
function refreshHUD(){
 $('#level-counter').textContent=`${t('route')} ${String(index+1).padStart(2,'0')} / ${LEVELS.length}`;$('#level-name').textContent=ln(world.level);$('#tip').textContent=world.level.hint[lang==='en'?0:1];$('#tip').classList.toggle('hidden',!$('#tip').textContent);$('#car-label').textContent=world.vehicle.name[lang==='en'?0:1]+' ↗';$('#scene-note span:last-child').textContent=world.vehicle.name[lang==='en'?0:1];$('#biome').textContent=THEMES[world.level.theme].name[lang==='en'?0:1];document.body.classList.toggle('night',world.level.theme===3);$('#timer').textContent=world.level.limit?Math.max(0,world.level.limit-world.time).toFixed(1)+'s':fmt(world.time);$('#speed').textContent=Math.round(Math.abs(world.body.velocity.x)*6);$('#speed-bar').style.width=Math.min(100,Math.abs(world.body.velocity.x)/15*100)+'%';$('#app').classList.toggle('boosting',world.time-world.lastBoost<.6);$('#stamps').textContent=world.collected.map(c=>c?'◆':'◇').join(' ');$('#stamps').setAttribute('aria-label',`${world.stamps}/3 ${t('stamp')}`);
}
function openModal(type){
 resetInput();activeFocus=document.activeElement;returnMode=mode;if(mode==='playing')mode='paused';modalType=type;renderModal(type);$('#overlay').classList.remove('hidden');setTimeout(()=>$('#modal button')?.focus({preventScroll:true}),0);
}
function closeModal(){
 if(['map','garage'].includes(modalType)&&previousModal){modalType=previousModal;previousModal=null;renderModal(modalType);$('#modal button')?.focus();return}
 modalType=null;$('#overlay').classList.add('hidden');if(mode==='paused')mode=returnMode==='intro'?'intro':'playing';resetInput();last=performance.now();activeFocus?.focus?.({preventScroll:true});
}
function renderModal(type){
 const el=$('#modal');el.className='modal';$('#overlay').setAttribute('aria-label',type==='map'?t('map'):type==='pause'?t('pauseTitle'):type==='win'?t('win'):type==='complete'?t('completeTitle'):t('crashTitle'));
 if(type==='map'){
  el.innerHTML=`<div class="modal-top"><div><div class="eyebrow">PIGEON STUDIO · QUAYBOUND</div><h2>${t('map')}</h2></div><button class="icon-button" data-action="close" aria-label="${t('close')}">×</button></div><p>${t('mapSub')}</p><div class="route-grid">${LEVELS.map((l,i)=>`<button style="--card:#${THEMES[l.theme].sky.toString(16)}" class="route-card ${i===index?'current':''}" data-level="${i}"><span class="num">${String(i+1).padStart(2,'0')}</span><span class="name">${ln(l)}</span><span class="rating">${records[i]?'★'.repeat(records[i].stars)+'☆'.repeat(3-records[i].stars):'☆☆☆'}</span><span class="best">${records[i]?t('bestLabel')+' '+fmt(records[i].time):VEHICLES[l.car].name[lang==='en'?0:1]}</span></button>`).join('')}</div><div class="route-foot"><p>${t('mapFoot')}</p><button class="secondary" data-action="home">${t('back')} ↗</button></div>`;
 }else if(type==='garage'){
  el.innerHTML=`<div class="modal-top"><div><div class="eyebrow">PIGEON STUDIO</div><h2>${t('garage')}</h2></div><button class="icon-button" data-action="close" aria-label="${t('close')}">×</button></div><div class="garage-grid">${VEHICLES.map((v,i)=>`<button class="garage-card" data-car="${i}" style="--ride:#${v.color.toString(16)}"><svg class="car-picture" viewBox="0 0 120 85"><path d="M17 55H104V39H17Z" fill="#${v.color.toString(16)}"/>${v.id==='van'?'<path d="M22 40V13H95V40Z" fill="#bb83ff"/><path d="M70 17H91V35H70Z" fill="#75dfff"/>':v.id==='rocket'?'<path d="m13 48-13 8 13 7" fill="#ffcf32"/><path d="M35 40V23H77L92 40Z" fill="#ff8549"/>':v.id==='monster'?'<path d="M33 40V19H75L89 40Z" fill="#ff557e"/><path d="M42 23H70V36H42Z" fill="#75dfff"/>':v.id==='buggy'?'<path d="M30 40V17H78L90 40" stroke="#25243e" stroke-width="5" fill="none"/>':''}<circle cx="33" cy="60" r="${v.id==='monster'?19:13}" fill="#25243e"/><circle cx="88" cy="60" r="${v.id==='monster'?19:13}" fill="#25243e"/><circle cx="33" cy="60" r="7" fill="#fff7df"/><circle cx="88" cy="60" r="7" fill="#fff7df"/><circle cx="56" cy="30" r="9" fill="#fff7df"/><path d="m64 28 9 4-9 3" fill="#ff9a35"/></svg><b>${v.name[lang==='en'?0:1]}</b><small>${v.tag[lang==='en'?0:1]}</small><span class="stat-label">${t('speed')}</span><i class="car-stat"><i style="width:${v.drive/11*100}%"></i></i><span class="stat-label">${t('chunky')}</span><i class="car-stat"><i style="width:${v.wheel/42*100}%"></i></i></button>`).join('')}</div>`;
 }else if(type==='pause'){
  el.classList.add('result');el.innerHTML=`<div class="eyebrow">${t('pause')}</div><h2>${t('pauseTitle')}</h2><p>${ln(world.level)}</p><div class="pause-instructions"><div><kbd>←</kbd><kbd>→</kbd> / <kbd>A</kbd><kbd>D</kbd><br>${t('controls1')}</div><div><kbd>R</kbd> / <kbd>Esc</kbd><br>${t('controls2')}</div></div><button class="primary" data-action="close">${t('resume')} →</button><div class="actions"><button class="secondary" data-action="restart">${t('again')}</button><button class="secondary" data-action="map">${t('choose')}</button></div>`;
 }else if(type==='crash'){
  el.classList.add('result');el.innerHTML=`<div class="result-stamp">${crashReason==='splash'?'≈':'↻'}</div><div class="eyebrow">${t('crash')}</div><h2>${t(crashReason==='splash'?'splashTitle':'crashTitle')}</h2><p>${t(crashReason)}</p><button class="primary" data-action="restart">${t('retryButton')} ↗</button><div class="actions"><button class="secondary" data-action="map">${t('choose')}</button><span class="secondary corner-note">R / SPACE ↵</span></div>`;
 }else if(type==='win'){
  el.classList.add('result');const all=records.every(Boolean);el.innerHTML=`<div class="result-stamp">✓</div><div class="eyebrow">${newBest?t('newBest'):t('delivered')}</div><h2>${t('win')}</h2><p>${t('winSub')}</p><div class="result-stars" aria-label="${resultStars}/3">${'★'.repeat(resultStars)}${'☆'.repeat(3-resultStars)}</div><div class="result-stats"><div><span>${t('time')}</span><b>${fmt(world.time)}</b></div><div><span>${t('stamp')}</span><b>${world.stamps} / 3</b></div><div><span>${t('target')}</span><b>${fmt(world.level.par)}</b></div></div><button class="primary" data-action="${all?'complete':index<LEVELS.length-1?'next':'map'}">${all?t('complete'):index<LEVELS.length-1?t('next'):t('allRoutes')} ↗</button><div class="actions"><button class="secondary" data-action="restart">${t('again')}</button><button class="secondary" data-action="map">${t('choose')}</button></div>`;
 }else if(type==='complete'){
  el.classList.add('result');el.innerHTML=`<img src="./assets/pigeon.svg" alt="" width="70" height="70"><div class="eyebrow" style="margin-top:25px">${t('complete')}</div><h2>${t('completeTitle')}</h2><p>${t('completeSub')}</p><div class="result-stats"><div><span>${t('completed')}</span><b>${records.filter(Boolean).length} / ${LEVELS.length}</b></div><div><span>★</span><b>${records.reduce((a,r)=>a+(r?.stars||0),0)} / ${LEVELS.length*3}</b></div></div><button class="primary" data-action="map">${t('allRoutes')} ↗</button><p class="corner-note">${t('madeBy')}</p>`;
 }
 el.onclick=e=>{const car=e.target.closest('[data-car]');if(car){start(index,Number(car.dataset.car));return}const level=e.target.closest('[data-level]');if(level){previousModal=null;start(Number(level.dataset.level));return}const a=e.target.closest('[data-action]')?.dataset.action;if(!a)return;sound.start();sound.effect('click');if(a==='close')closeModal();if(a==='restart')start(index,world.carIndex);if(a==='home')goHome();if(a==='next')start(index+1);if(a==='map'){previousModal=modalType;modalType='map';renderModal('map');$('#modal button')?.focus()}if(a==='complete'){modalType='complete';renderModal('complete');$('#modal button')?.focus()}};
}
function event(ev){
 if(ev.type==='land'){view.shake=.13*ev.power;sound.effect('land',ev.power);view.burst(world.body.position.x/SCALE,-world.body.position.y/SCALE-.65,0xfff7df,12,.55)}
 if(ev.type==='stamp'){sound.effect('stamp');view.burst(ev.x/SCALE,-ev.y/SCALE,0xffcf32,18,.9)}
 if(ev.type==='spring'){sound.effect('spring');view.shake=.07;view.burst(ev.x/SCALE,-ev.y/SCALE,0xddee8b,18,.8);toast(t('spring'))}
 if(ev.type==='boost'){sound.effect('boost');view.shake=.1;view.burst(ev.x/SCALE,-ev.y/SCALE,0xffcf32,24,1.4);toast(t('boost'))}
 if(ev.type==='crumble'){sound.effect('crumble');view.burst(ev.x/SCALE,-ev.y/SCALE,0xffa356,9,.5)}
 if(ev.type==='crash'){
  resetInput();crashReason=ev.reason;mode='finishing';transitionAt=clock+.4;sound.effect('crash');view.shake=.12;
  if(ev.reason==='splash')view.burst(world.body.position.x/SCALE,-3.8,0x78c9ff,55,1.8);
 }
 if(ev.type==='win'){
  mode='finishing';transitionAt=clock+.5;resetInput();sound.effect('win');resultStars=1+(world.stamps===3?1:0)+(world.time<=world.level.par?1:0);newBest=!records[index]||world.time<records[index].time;
  const old=records[index];records[index]={time:Math.min(old?.time??Infinity,world.time),stamps:Math.max(old?.stamps??0,world.stamps),stars:Math.max(old?.stars??0,resultStars)};save();view.burst(world.level.finish/SCALE,2.9,0xff6887,45,1.8);view.burst(world.level.finish/SCALE,2.9,0xd5f461,38,1.7);if(!storageOK)toast(t('noSave'));
 }
}
function frame(now){
 const dt=Math.min((now-last)/1000||0,.1);last=now;clock+=dt;
 if(mode==='playing'){
  readInput();acc+=dt;let n=0;while(acc>=1/60&&n++<6){step(world,input);world.events.forEach(event);acc-=1/60;if(mode!=='playing')break;}
  $('#ready').classList.toggle('hidden',world.started);$('#tip').style.opacity=world.time>3.5?'0':'1';if(world.level.goal==='park'&&world.body.position.x>world.level.finish-700){$('#tip').classList.remove('hidden');$('#tip').textContent=t('park');$('#tip').style.opacity=1;}$('#timer').textContent=world.level.limit?Math.max(0,world.level.limit-world.time).toFixed(1)+'s':fmt(world.time);$('#speed').textContent=Math.round(Math.abs(world.body.velocity.x)*6);$('#speed-bar').style.width=Math.min(100,Math.abs(world.body.velocity.x)/15*100)+'%';$('#app').classList.toggle('boosting',world.time-world.lastBoost<.6);$('#stamps').textContent=world.collected.map(c=>c?'◆':'◇').join(' ');$('#stamps').setAttribute('aria-label',`${world.stamps}/3 ${t('stamp')}`);$('#progress').style.width=`${Math.min(100,Math.max(0,(world.body.position.x-world.level.start)/(world.level.finish-world.level.start)*100))}%`;$('#air-note').classList.toggle('hidden',world.airTime<.3||world.status!=='playing');
 }
 if(mode==='finishing'&&clock>=transitionAt){mode='result';openModal(world.status==='won'?'win':'crash')}
 sound.update(world,mode==='playing');view.update(world,dt,clock);requestAnimationFrame(frame);
}
function honk(){sound.start();sound.effect('horn');toast(lang==='fr'?'POUÊT.':'HONK.');view.shake=.045}
function pause(){if(mode==='playing')openModal('pause');else if(mode==='paused'&&modalType==='pause')closeModal()}
async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else if($('#app').requestFullscreen)await $('#app').requestFullscreen();else if($('#app').webkitRequestFullscreen)$('#app').webkitRequestFullscreen();else toast(t('fullscreenFail'))}catch{toast(t('fullscreenFail'))}}
document.addEventListener('fullscreenchange',()=>{const full=!!document.fullscreenElement;$('#fullscreen').setAttribute('aria-label',t(full?'exitFullscreen':'fullscreen'));$('#fullscreen').dataset.active=String(full);view?.resize()});
function toggleSound(){muted=!muted;sound.start();sound.mute(muted);save();$('#sound').style.opacity=muted?'.45':'1';$('#sound').setAttribute('aria-label',t(muted?'unmute':'mute'));toast(t(muted?'soundOff':'soundOn'))}
$('#honk').onclick=honk;$('#play').onclick=()=>start();$('#choose').onclick=()=>{sound.start();openModal('map')};$('#home').onclick=e=>{e.preventDefault();goHome()};$('#language').onclick=()=>{lang=lang==='en'?'fr':'en';save();translate()};$('#sound').onclick=toggleSound;$('#fullscreen').onclick=fullscreen;$('#restart').onclick=()=>start(index,world.carIndex);$('#pause').onclick=pause;$('#routes').onclick=()=>openModal('map');$('#garage').onclick=()=>openModal('garage');$('#car-label').onclick=()=>openModal('garage');
for(const [selector,side] of [['#brake','left'],['#throttle','right']]){
 const button=$(selector);button.addEventListener('pointerdown',e=>{if(mode!=='playing')return;e.preventDefault();sound.start();pointers[side]=true;button.setPointerCapture(e.pointerId);readInput()});
 const release=e=>{e.preventDefault();pointers[side]=false;readInput()};for(const kind of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(kind,release);button.addEventListener('contextmenu',e=>e.preventDefault());
}
document.addEventListener('keydown',e=>{
 if(['ArrowRight','ArrowLeft','ArrowUp','ArrowDown','Space'].includes(e.code))e.preventDefault();
 if(e.code==='Tab'&&modalType){const all=$$('#modal button:not(:disabled)');if(!all.length)return;const first=all[0],last=all.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}return}
 if(e.repeat&&['KeyF','Escape','KeyP','KeyR','KeyM','Space'].includes(e.code))return;
 if(e.code==='KeyH'){honk();return}if(e.code==='KeyF'){fullscreen();return}if(e.code==='KeyM'){toggleSound();return}
 if(e.code==='Escape'){if(modalType==='map'||modalType==='pause'||modalType==='garage')closeModal();else pause();return}
 if(e.code==='KeyP'){pause();return}
 if(e.code==='KeyR'&&mode!=='intro'){start(index,world.carIndex);return}
 if(e.code==='Space'){
  if(mode==='intro'&&!modalType)start();else if(modalType==='crash')start(index);else if(modalType==='win'){if(records.every(Boolean)){modalType='complete';renderModal('complete')}else index<LEVELS.length-1?start(index+1):openModal('map')}else if(modalType==='pause')closeModal();return;
 }
 if(mode==='playing'&&['ArrowRight','ArrowLeft','ArrowUp','ArrowDown','KeyA','KeyD','KeyW','KeyS'].includes(e.code)){sound.start();keys.add(e.code)}
});
document.addEventListener('keyup',e=>keys.delete(e.code));
window.addEventListener('blur',()=>{resetInput();if(mode==='playing'&&world.started)openModal('pause')});
document.addEventListener('visibilitychange',()=>{if(document.hidden){resetInput();if(mode==='playing')openModal('pause')}last=performance.now()});
window.addEventListener('contextmenu',e=>{if(e.target.closest('.pedals'))e.preventDefault()});
try{
 view=new CoastRenderer($('#scene'));sound.mute(muted);$('#sound').style.opacity=muted?'.45':'1';loadLevel(0,true);translate();$('#loading').style.opacity='0';$('#loading').setAttribute('aria-hidden','true');setTimeout(()=>$('#loading').classList.add('hidden'),500);last=performance.now();requestAnimationFrame(frame);
}catch(error){console.error(error);$('#loading').innerHTML=`<img src="./assets/pigeon.svg" alt="Pigeon Studio" width="58"><p class="error">${t('webgl')}</p>`}
