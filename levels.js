export const VEHICLES=[
 {id:'buggy',name:['Nugget','Nugget'],tag:['FAST & FLIMSY','VITE ET FRAGILE'],color:0xffcf32,wheel:29,base:96,length:136,h:26,roof:0,density:.0024,speed:.29,drive:7.7,torque:.00032,air:.0045},
 {id:'van',name:['Lunchbox','La Gamelle'],tag:['BUILT LIKE A FRIDGE','UN FRIGO À ROULETTES'],color:0xbb83ff,wheel:28,base:110,length:158,h:36,roof:43,density:.0033,speed:.26,drive:7.3,torque:.00044,air:.0038},
 {id:'monster',name:['Big Bird','Gros Pigeon'],tag:['SUBTLE AS A BRICK','FIN COMME UN PARPAING'],color:0xff557e,wheel:40,base:106,length:154,h:34,roof:30,density:.0035,speed:.25,drive:8.8,torque:.00044,air:.0038},
 {id:'kart',name:['Soapbox','Savonnette'],tag:['NO ROOF. NO PROBLEM.','PAS DE TOIT. PAS DE SOUCI.'],color:0x5be2ff,wheel:22,base:78,length:112,h:24,roof:0,density:.0022,speed:.37,drive:8.5,torque:.00032,air:.0055},
 {id:'rocket',name:['Bad Idea','Mauvaise Idée'],tag:['PROBABLY LEGAL','PRESQUE HOMOLOGUÉ'],color:0xff8549,wheel:28,base:112,length:160,h:30,roof:27,density:.0025,speed:.36,drive:10.2,torque:.0004,air:.0042}
];
export const THEMES=[
 {name:['THE DOCKS','LES QUAIS'],sky:0xb7a5f5,water:0x477aec,road:0x45465f,edge:0xd5f461,rock:0x7563ac,green:0x93d54e},
 {name:['JUNK FOOD','LA CASSE'],sky:0xffaf8e,water:0xea678d,road:0x4a365c,edge:0xffd24a,rock:0xad547b,green:0xffcd49},
 {name:['SNOW PROBLEM','MÊME PAS FROID'],sky:0x9edce9,water:0x408dcf,road:0xa6cfea,edge:0xf8f0ff,rock:0x6c92bd,green:0xc2eaf2},
 {name:['NIGHT SHIFT','SERVICE DE NUIT'],sky:0x292c57,water:0x393886,road:0x4a4675,edge:0x72f2cd,rock:0x38335d,green:0x8d79df},
 {name:['QUESTIONABLE IDEAS','MAUVAISES IDÉES'],sky:0xe5acf8,water:0x9564dc,road:0x534072,edge:0xe4f56b,rock:0x9757b6,green:0xff83af}
];
const L=(name,car,road,props=[],extra={})=>({name,car,road,props,start:110,finish:road.at(-1)[2]-220,par:18,stamps:[],hint:['',''],...extra});
const flat=(a,b,y=0,material)=>[a,y,b,y,material];
const bridge=(type,x,w,extra={})=>({type,x,y:0,w,...extra});
const crates=(x,n=3)=>Array.from({length:n},(_,i)=>({type:'crate',x:x+i*65,y:-25}));
const fragile=(x,n=4)=>Array.from({length:n},(_,i)=>bridge('fragile',x+i*160+80,162));
export const LEVELS=[
 L(['Floor it','Pied au plancher'],0,[flat(-240,650),[650,0,850,-45],[850,-45,1080,0],flat(1080,2360)],[],{par:7,hint:['→ GO · ← BRAKE','→ GAZ · ← FREIN'],stamps:[[520,-85],[940,-135],[1820,-85]]}),
 L(['Speed bumps','Dos-d’âne'],2,[flat(-240,440),[440,0,620,-80],[620,-80,800,0],[800,0,1020,-110],[1020,-110,1240,0],[1240,0,1480,-65],[1480,-65,1700,0],flat(1700,2750)],[],{par:9,stamps:[[630,-180],[1150,-165],[2230,-100]]}),
 L(['Hold my mail','Tiens mon courrier'],0,[flat(-240,650),[650,0,990,-115],[1250,-30,1580,0],flat(1580,2880)],[],{par:10,hint:['In the air: tap ← / →','En l’air : petites touches ← / →'],stamps:[[560,-85],[1130,-240],[2320,-90]]}),
 L(['Crate expectations','Caisse que tu fais ?'],1,[flat(-240,3030)],[...crates(650,3),...crates(1340,2),{type:'crate',x:1375,y:-73},...crates(2170,2)],{par:14,stamps:[[450,-100],[1670,-100],[2550,-100]]}),
 L(['Definitely legal','Presque homologué'],4,[flat(-240,1000),[1000,0,1270,-85],[1650,-10,1900,0],flat(1900,3550)],[bridge('boost',730,200,{power:13})],{par:11,hint:['Yellow arrows = bad decisions.','Flèches jaunes = bonnes bêtises.'],stamps:[[480,-85],[1470,-165],[2950,-90]]}),
 L(['Pigeon yoga','Yoga pigeon'],1,[flat(-240,680),flat(1170,1460),flat(1950,3000)],[bridge('seesaw',925,480,{limit:.23}),bridge('seesaw',1705,480,{limit:.25})],{par:14,stamps:[[500,-100],[1690,-120],[2460,-100]]}),
 L(['Boing!','Boïng !'],0,[flat(-240,1050),flat(1450,3220)],[bridge('spring',930,170,{kick:14,push:9})],{par:12,hint:['Let go after the bounce.','Relâche après le rebond.'],stamps:[[560,-85],[1240,-315],[2700,-90]]}),
 L(['Ice to meet you','Enchanté, glissé'],3,[flat(-240,650),[650,0,1050,90,'ice'],flat(1050,3300,90,'ice')],[],{goal:'park',par:16,hint:['Park inside the stripes. ← BRAKE','Gare-toi dans les rayures. ← FREIN'],stamps:[[480,-70],[1660,20],[2550,20]]}),
 L(['Wet socks','Chaussettes mouillées'],2,[flat(-240,600),flat(1060,1310),flat(1770,3180)],[bridge('lift',830,480,{amplitude:85,period:4}),bridge('lift',1540,480,{amplitude:85,period:4,phase:Math.PI})],{par:15,stamps:[[450,-100],[1190,-100],[2640,-100]]}),
 L(['Duck!','Baisse la tête !'],3,[flat(-240,3100)],[{type:'ceiling',x:1230,y:-130,w:730,h:38},...crates(2070,3)],{par:12,hint:['Good day to forget your roof.','Heureusement, pas de toit.'],stamps:[[450,-70],[1270,-55],[2610,-70]]}),
 L(['Wrong way','À contre-pigeon'],2,[flat(-240,3300)],[bridge('conveyor',1150,800,{speed:-1}),bridge('boost',2280,180,{power:12})],{par:13,stamps:[[460,-100],[1510,-100],[2770,-100]]}),
 L(['Spin cycle','Essorage'],3,[flat(-240,3350)],[{type:'rotor',x:1200,y:-130,w:250,speed:.9,phase:0},{type:'rotor',x:2090,y:-135,w:280,speed:-1.1,phase:1.6}],{par:17,hint:['Timing is a driving skill.','Le timing, ça compte aussi.'],stamps:[[540,-70],[1690,-70],[2810,-70]]}),
 L(['Ball pit','Piscine à balles'],2,[flat(-240,650),[650,0,1000,70],flat(1000,3250,70)],Array.from({length:7},(_,i)=>({type:'ball',x:1150+i*140,y:10-i%2*55,r:32+i%3*7})),{par:14,stamps:[[520,-100],[1730,-50],[2720,-30]]}),
 L(['Incoming!','Ça arrive !'],0,[flat(-240,3400)],[{type:'swing',x:1140,y:-290,r:34,length:180,amplitude:140,period:3.6},{type:'swing',x:2180,y:-290,r:40,length:180,amplitude:145,period:3.6,phase:Math.PI}],{par:18,stamps:[[500,-85],[1660,-85],[2870,-85]]}),
 L(['Going up?','Ça monte ?'],1,[flat(-240,650),flat(1230,2000,-155),[2000,-155,2470,0],flat(2470,3500)],[bridge('lift',940,600,{y:-78,amplitude:78,period:4.4})],{par:20,hint:['Ride the lift. Brake if needed.','Prends l’ascenseur. Freine au besoin.'],stamps:[[450,-100],[1580,-260],[2900,-100]]}),
 L(['Bouncy business','Affaires rebondissantes'],0,[flat(-240,900),flat(1210,1950),flat(2270,3550)],[bridge('spring',790,160,{kick:12.5,push:9}),bridge('spring',1830,160,{kick:12.5,push:9})],{par:16,stamps:[[520,-85],[1060,-270],[2120,-270]]}),
 L(['Road? What road?','Quelle route ?'],4,[flat(-240,680),flat(1320,1760),flat(2400,3760)],[...fragile(680),...fragile(1760)],{par:13,hint:['Stopping here is a lifestyle choice.','S’arrêter ici est un choix de vie.'],stamps:[[490,-85],[1510,-85],[3080,-85]]}),
 L(['Wheel deal','Pneus à volonté'],2,[flat(-240,640),[640,0,930,-70],[930,-70,1260,0],flat(1260,3600)],[{type:'tyre',x:1470,y:-65,r:60},{type:'tyre',x:2010,y:-65,r:60},{type:'tyre',x:2570,y:-65,r:60}],{par:18,stamps:[[510,-100],[1750,-110],[3050,-100]]}),
 L(['Valet panic','Créneau panique'],1,[flat(-240,500),[500,0,1200,180,'ice'],flat(1200,3700,180,'ice')],[],{goal:'park',par:18,hint:['Brake early. Then earlier.','Freine tôt. Encore plus tôt.'],stamps:[[440,-100],[1800,80],[2940,80]]}),
 L(['Low expectations','Profil bas'],3,[flat(-240,3600)],[{type:'ceiling',x:1050,y:-125,w:550,h:35},bridge('conveyor',2010,600,{speed:1}),{type:'ceiling',x:2380,y:-127,w:520,h:35}],{par:14,stamps:[[450,-65],[1820,-65],[3030,-65]]}),
 L(['Hot potato','Patate chaude'],4,[flat(-240,900),[900,0,1160,-80],[1430,-25,1700,0],flat(1700,2300),flat(2780,4600)],[bridge('boost',670,180,{power:13}),...fragile(2300,3),...crates(3350,3)],{limit:20,par:17,hint:['20 seconds. No pressure.','20 secondes. Aucune pression.'],stamps:[[490,-85],[1310,-210],[3770,-85]]}),
 L(['Squeeze please','Petit coup de presse'],3,[flat(-240,3700)],[{type:'press',x:1140,y:-185,w:160,h:110,amplitude:90,period:3.2},{type:'press',x:2180,y:-185,w:160,h:110,amplitude:90,period:3.2,phase:Math.PI}],{par:19,hint:['Tiny car. Excellent choice.','Petite voiture. Excellent choix.'],stamps:[[490,-65],[1650,-65],[3150,-65]]}),
 L(['Frequent flyer','Miles illimités'],4,[flat(-240,1070),[1070,0,1350,-135],[1880,-60,2210,0],flat(2210,4300)],[bridge('boost',800,200,{power:15}),bridge('spring',1240,170,{y:-90,kick:13,push:14})],{par:16,hint:['← / → in the air. Gently.','← / → en l’air. Doucement.'],stamps:[[530,-85],[1580,-300],[3580,-85]]}),
 L(['Oops, all bridges','Oups, que des ponts'],0,[flat(-240,550),flat(1030,1230),flat(1710,1940),flat(2420,2760),flat(3240,4200)],[bridge('seesaw',790,470,{limit:.20}),bridge('lift',1470,500,{amplitude:55,period:4}),bridge('seesaw',2180,470,{limit:.20}),...fragile(2760,3)],{par:23,stamps:[[430,-85],[1820,-85],[3590,-85]]}),
 L(['Pigeon express','Pigeon express'],4,[flat(-240,780),[780,0,1050,-90],[1330,-20,1590,0],flat(1590,1900),flat(2380,2800),flat(3280,3600),flat(4100,5700)],[bridge('boost',600,170,{power:13}),bridge('seesaw',2140,470,{limit:.21}),...fragile(2800,3),bridge('lift',3850,520,{amplitude:65,period:4}),...crates(4500,4)],{par:28,stamps:[[1180,-220],[2570,-90],[5050,-90]],hint:['You got this. Probably.','Tu gères. Probablement.']})
];
LEVELS.forEach((level,i)=>{level.theme=Math.floor(i/5);level.skill=level.hint;});
