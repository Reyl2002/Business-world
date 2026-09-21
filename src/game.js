import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const canvas = document.getElementById('game');
const loading = document.getElementById('loading');
const revenueEl = document.getElementById('revenue');
const profitEl = document.getElementById('profit');
const growthEl = document.getElementById('growth');
const islandStatus = document.getElementById('islandStatus');
const infoCard = document.getElementById('infoCard');
const infoTitle = document.getElementById('infoTitle');
const infoText = document.getElementById('infoText');

const renderer = new THREE.WebGLRenderer({canvas, antialias:true, powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
renderer.setSize(innerWidth, innerHeight, false);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x92d9ef);
scene.fog = new THREE.FogExp2(0xa6deef, 0.00145);

const camera = new THREE.PerspectiveCamera(42, innerWidth/innerHeight, 0.1, 1800);
camera.position.set(170, 145, 205);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 5, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.075;
controls.minDistance = 55;
controls.maxDistance = 440;
controls.minPolarAngle = Math.PI * 0.17;
controls.maxPolarAngle = Math.PI * 0.49;
controls.screenSpacePanning = true;
controls.enablePan = true;
controls.panSpeed = 1.15;
// Free-map navigation: one finger / left mouse moves across the city.
// Rotation stays available with the on-screen rotate buttons, right mouse,
// or a two-finger gesture.
controls.mouseButtons.LEFT = THREE.MOUSE.PAN;
controls.mouseButtons.MIDDLE = THREE.MOUSE.DOLLY;
controls.mouseButtons.RIGHT = THREE.MOUSE.ROTATE;
controls.touches.ONE = THREE.TOUCH.PAN;
controls.touches.TWO = THREE.TOUCH.DOLLY_ROTATE;

const hemi = new THREE.HemisphereLight(0xcdf4ff, 0x4a653a, 2.25);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff0ca, 3.1);
sun.position.set(-110, 190, 85);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -310;
sun.shadow.camera.right = 310;
sun.shadow.camera.top = 310;
sun.shadow.camera.bottom = -310;
scene.add(sun);

// Strong dark-blue animated ocean with clearly visible rolling wave crests.
const oceanGeo = new THREE.PlaneGeometry(1100, 900, 110, 90);
oceanGeo.rotateX(-Math.PI/2);
const oceanBase = Float32Array.from(oceanGeo.attributes.position.array);

const oceanMat = new THREE.MeshPhysicalMaterial({
  color:0x044c7b,
  roughness:.28,
  metalness:.03,
  transparent:true,
  opacity:.985,
  clearcoat:.82,
  clearcoatRoughness:.14
});
const ocean = new THREE.Mesh(oceanGeo, oceanMat);
ocean.position.y = -14;
ocean.receiveShadow = true;
scene.add(ocean);

// Dark depth underneath the moving surface.
const oceanDepth = new THREE.Mesh(
  new THREE.PlaneGeometry(1100,900),
  new THREE.MeshBasicMaterial({color:0x022f55})
);
oceanDepth.rotation.x = -Math.PI/2;
oceanDepth.position.y = -19.2;
scene.add(oceanDepth);

// Visible rolling white/cyan wave crests spread across the whole ocean.
// The land sits above them, so the crests are naturally hidden underneath islands.
const waveCrests=[];
const crestMat = new THREE.LineBasicMaterial({
  color:0x9fe9ff,
  transparent:true,
  opacity:.72,
  depthWrite:false,
  blending:THREE.AdditiveBlending
});
const foamMat = new THREE.LineBasicMaterial({
  color:0xe6fbff,
  transparent:true,
  opacity:.9,
  depthWrite:false
});

function makeWaveBand(zBase,phase,amplitude=4.2,width=980,points=90){
  const pts=[];
  for(let i=0;i<points;i++){
    const x=-width/2 + (width*i/(points-1));
    const z=zBase + Math.sin(x*.025+phase)*amplitude + Math.sin(x*.011-phase*.7)*1.8;
    pts.push(new THREE.Vector3(x,-12.85,z));
  }
  const geo=new THREE.BufferGeometry().setFromPoints(pts);
  const line=new THREE.Line(geo,crestMat.clone());
  line.userData={zBase,phase,amplitude,width,points,speed:8+Math.random()*6};
  scene.add(line);
  waveCrests.push(line);
  return line;
}

for(let z=-390,idx=0;z<=390;z+=34,idx++){
  makeWaveBand(z,idx*.72,3.4+(idx%3)*.8,1000,96);
}

// A second angled family makes the water look active from every camera angle.
const diagonalWaves=[];
function makeDiagonalWave(offset,phase){
  const pts=[];
  const count=78;
  for(let i=0;i<count;i++){
    const x=-500 + 1000*i/(count-1);
    const z=offset + x*.18 + Math.sin(x*.02+phase)*3.1;
    pts.push(new THREE.Vector3(x,-12.92,z));
  }
  const geo=new THREE.BufferGeometry().setFromPoints(pts);
  const line=new THREE.Line(geo,new THREE.LineBasicMaterial({
    color:0x5dcff5,
    transparent:true,
    opacity:.34,
    depthWrite:false,
    blending:THREE.AdditiveBlending
  }));
  line.userData={offset,phase,speed:5+Math.random()*4};
  scene.add(line);
  diagonalWaves.push(line);
}
for(let z=-420,i=0;z<=420;z+=62,i++) makeDiagonalWave(z,i*.63);

// Shoreline foam rings: these sit just above the ocean and pulse around each island.
const shoreFoam=[];
function createShoreFoam(points,scale=1.035){
  const cx=points.reduce((s,p)=>s+p[0],0)/points.length;
  const cz=points.reduce((s,p)=>s+p[1],0)/points.length;
  const expanded=points.map(([x,z])=>new THREE.Vector3(
    cx+(x-cx)*scale,
    -12.62,
    cz+(z-cz)*scale
  ));
  expanded.push(expanded[0].clone());
  const line=new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(expanded),
    foamMat.clone()
  );
  line.userData={phase:Math.random()*Math.PI*2};
  scene.add(line);
  shoreFoam.push(line);
  return line;
}

let oceanNormalTick=0;
function updateOcean(t){
  // Fully automatic ocean: the swell continuously changes on its own.
  // Calm periods roll into stronger sets, and rain automatically makes the sea rougher.
  const autoSwell = 1.0 + 0.34*Math.sin(t*.11) + 0.18*Math.sin(t*.037+1.4);
  const weatherBoost = weatherMode==='RAIN' ? 1.35 : 1.0;
  const strength = Math.max(.82, autoSwell) * weatherBoost;
  const speedBoost = weatherMode==='RAIN' ? 1.22 : 1.0;

  const pos=oceanGeo.attributes.position;
  const a=pos.array;
  for(let i=0;i<pos.count;i++){
    const x=oceanBase[i*3];
    const z=oceanBase[i*3+2];
    const wave1=Math.sin(x*.021+t*1.45*speedBoost)*1.55*strength;
    const wave2=Math.sin(z*.029-t*1.08*speedBoost)*1.10*strength;
    const wave3=Math.sin((x+z)*.015+t*.78*speedBoost)*.72*strength;
    const smallChop=Math.sin((x-z)*.045+t*2.05)*.22*strength;
    a[i*3+1]=oceanBase[i*3+1]+wave1+wave2+wave3+smallChop;
  }
  pos.needsUpdate=true;

  oceanNormalTick++;
  if(oceanNormalTick%5===0) oceanGeo.computeVertexNormals();

  // Slight automatic color/depth shift gives the water a living ocean feel.
  const bluePulse=.5+.5*Math.sin(t*.08);
  oceanMat.color.setRGB(
    .012 + bluePulse*.008,
    .24 + bluePulse*.035,
    .43 + bluePulse*.055
  );

  // Bright crest bands travel continuously across the whole ocean.
  for(const line of waveCrests){
    const d=line.userData;
    const p=line.geometry.attributes.position.array;
    const drift=(t*d.speed*speedBoost)%820;
    let z=d.zBase+drift;
    while(z>410) z-=820;

    for(let i=0;i<d.points;i++){
      const x=-d.width/2 + d.width*i/(d.points-1);
      p[i*3]=x;
      p[i*3+1]=-12.55 + Math.sin(x*.019+t*1.7*speedBoost+d.phase)*.36*strength;
      p[i*3+2]=z
        + Math.sin(x*.025+t*.95*speedBoost+d.phase)*d.amplitude*strength
        + Math.sin(x*.011-t*.55*speedBoost)*2.15*strength;
    }
    line.geometry.attributes.position.needsUpdate=true;
    line.material.opacity=Math.min(.96,.63 + .24*(.5+.5*Math.sin(t*1.2+d.phase)) + (strength-1)*.16);
  }

  // Crossing wave sets make the surface feel less like parallel lines.
  for(const line of diagonalWaves){
    const d=line.userData;
    const p=line.geometry.attributes.position.array;
    const drift=(t*d.speed*speedBoost)%900;
    let off=d.offset+drift;
    while(off>450) off-=900;
    const count=p.length/3;
    for(let i=0;i<count;i++){
      const x=-500+1000*i/(count-1);
      p[i*3]=x;
      p[i*3+1]=-12.65 + Math.sin(t*1.3+i*.14)*.13*strength;
      p[i*3+2]=off+x*.18+Math.sin(x*.02+t*.8*speedBoost+d.phase)*3.55*strength;
    }
    line.geometry.attributes.position.needsUpdate=true;
    line.material.opacity=Math.min(.62,.34+(strength-1)*.18);
  }

  // Shore foam breathes and pulses automatically as waves reach the islands.
  shoreFoam.forEach((line,i)=>{
    const pulse=.5+.5*Math.sin(t*2.25*speedBoost+i);
    line.material.opacity=Math.min(1,.68+.25*pulse+(strength-1)*.12);
    line.scale.setScalar(1+.010*Math.sin(t*1.65*speedBoost+i)*strength);
  });
}

const mats = {
  grass:new THREE.MeshStandardMaterial({color:0x73b959, roughness:.95}),
  grass2:new THREE.MeshStandardMaterial({color:0x80c866, roughness:.95}),
  cliff:new THREE.MeshStandardMaterial({color:0x75685d, roughness:1}),
  road:new THREE.MeshStandardMaterial({color:0x40484f, roughness:.95}),
  sidewalk:new THREE.MeshStandardMaterial({color:0xd5d1c6, roughness:.95}),
  yellow:new THREE.MeshStandardMaterial({color:0xf1ca4d, roughness:.75}),
  white:new THREE.MeshStandardMaterial({color:0xf7f6ef, roughness:.8}),
  locked:new THREE.MeshStandardMaterial({color:0x80858a, roughness:1}),
  sand:new THREE.MeshStandardMaterial({color:0xe8c77f, roughness:1})
};

const clickable = [];
const workers = [];
const cars = [];
let revenue = 7500;
let profit = 2650;
let startRevenue = revenue;
let airportUnlocked = false;
let transitUnlocked = false;
let cruiseUnlocked = false;
let timeMode = 'AUTO';
let weatherMode = 'CLEAR';
const GRID_TILE = 13;

// True city-builder floor grid. Squares are drawn only where their center is
// inside an island, so the grid follows the island instead of covering water.
function pointInPolygon(x,z,points){
  let inside=false;
  for(let i=0,j=points.length-1;i<points.length;j=i++){
    const xi=points[i][0], zi=points[i][1];
    const xj=points[j][0], zj=points[j][1];
    const hit=((zi>z)!==(zj>z)) && (x < (xj-xi)*(z-zi)/(zj-zi)+xi);
    if(hit) inside=!inside;
  }
  return inside;
}

function createIslandGrid(points,{color=0x5f9f4d,opacity=.55,y=.16}={}){
  const xs=points.map(p=>p[0]), zs=points.map(p=>p[1]);
  const minX=Math.floor(Math.min(...xs)/GRID_TILE)*GRID_TILE;
  const maxX=Math.ceil(Math.max(...xs)/GRID_TILE)*GRID_TILE;
  const minZ=Math.floor(Math.min(...zs)/GRID_TILE)*GRID_TILE;
  const maxZ=Math.ceil(Math.max(...zs)/GRID_TILE)*GRID_TILE;
  const positions=[];

  for(let x=minX;x<maxX;x+=GRID_TILE){
    for(let z=minZ;z<maxZ;z+=GRID_TILE){
      const cx=x+GRID_TILE/2, cz=z+GRID_TILE/2;
      if(!pointInPolygon(cx,cz,points)) continue;
      // four sides of the tile; duplicates are intentional so every square is crisp
      positions.push(
        x,y,z, x+GRID_TILE,y,z,
        x+GRID_TILE,y,z, x+GRID_TILE,y,z+GRID_TILE,
        x+GRID_TILE,y,z+GRID_TILE, x,y,z+GRID_TILE,
        x,y,z+GRID_TILE, x,y,z
      );
    }
  }

  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  const mat=new THREE.LineBasicMaterial({color,transparent:true,opacity,depthWrite:false});
  const lines=new THREE.LineSegments(geo,mat);
  scene.add(lines);
  return {lines,material:mat};
}


function island(points, material, depth=16){
  const group=new THREE.Group();
  const topTiles=[];
  const xs=points.map(p=>p[0]), zs=points.map(p=>p[1]);
  const minX=Math.floor(Math.min(...xs)/GRID_TILE)*GRID_TILE;
  const maxX=Math.ceil(Math.max(...xs)/GRID_TILE)*GRID_TILE;
  const minZ=Math.floor(Math.min(...zs)/GRID_TILE)*GRID_TILE;
  const maxZ=Math.ceil(Math.max(...zs)/GRID_TILE)*GRID_TILE;

  const seamMaterial=new THREE.MeshStandardMaterial({color:0x5f934d,roughness:1});
  const cliffMaterials=[
    mats.cliff,mats.cliff,seamMaterial,mats.cliff,mats.cliff,mats.cliff
  ];

  for(let x=minX;x<maxX;x+=GRID_TILE){
    for(let z=minZ;z<maxZ;z+=GRID_TILE){
      const cx=x+GRID_TILE/2;
      const cz=z+GRID_TILE/2;
      if(!pointInPolygon(cx,cz,points)) continue;

      // The island itself is made from complete square blocks.
      const block=new THREE.Mesh(
        new THREE.BoxGeometry(GRID_TILE,depth,GRID_TILE),
        cliffMaterials
      );
      block.position.set(cx,-depth/2,cz);
      block.receiveShadow=true;
      block.castShadow=true;
      group.add(block);

      // Slightly inset grass/locked cap creates the visible tile seams,
      // while every land cell remains a complete square.
      const cap=new THREE.Mesh(
        new THREE.BoxGeometry(GRID_TILE-.34,.20,GRID_TILE-.34),
        material
      );
      cap.position.set(cx,.10,cz);
      cap.receiveShadow=true;
      group.add(cap);
      topTiles.push(cap);
    }
  }

  scene.add(group);
  return {
    group,
    topTiles,
    setTopMaterial(nextMaterial){
      topTiles.forEach(tile=>tile.material=nextMaterial);
    }
  };
}

const mainPoints = [
  [-142,-83],[-118,-119],[-68,-139],[-12,-144],[50,-140],[105,-121],[137,-82],[151,-30],
  [145,25],[127,76],[91,113],[39,134],[-24,137],[-81,127],[-124,100],[-147,55],[-154,3],[-150,-46]
];
const airportPoints = [
  [154,-168],[205,-196],[278,-205],[350,-192],[400,-158],[418,-105],
  [416,-42],[394,20],[362,72],[314,106],[252,119],[190,112],
  [145,90],[132,52],[138,16],[154,-10],[160,-55],[152,-112]
];
const transitPoints = [
  [-120,-420],[-52,-452],[45,-466],[145,-454],[226,-420],[268,-368],[277,-308],
  [258,-250],[214,-211],[136,-190],[45,-192],[-45,-214],[-108,-254],[-137,-310],[-136,-365]
];
const cruisePoints = [
  // Huge $50k resort island shaped to fill the large western water gap.
  // The north-east shoulder reaches toward the Transit District, while the
  // south-west beach lobe fills the large open water beside the starter city.
  [-548,-220],[-532,-292],[-486,-340],[-410,-368],[-326,-360],[-252,-330],
  [-188,-304],[-146,-274],[-132,-236],[-145,-202],[-174,-168],[-188,-112],
  [-190,-46],[-184,22],[-191,88],[-214,138],[-252,166],[-300,178],
  [-348,184],[-392,192],[-428,252],[-474,316],[-520,326],[-548,286],
  [-565,218],[-565,136],[-558,52],[-562,-38],[-558,-126]
];

createShoreFoam(mainPoints,1.055);
createShoreFoam(mainPoints,1.09);
createShoreFoam(airportPoints,1.06);
createShoreFoam(transitPoints,1.06);
createShoreFoam(cruisePoints,1.035);
createShoreFoam(cruisePoints,1.07);

island(mainPoints, mats.grass, 17);
const airportIsland = island(airportPoints, mats.locked, 18);
const transitIsland = island(transitPoints, mats.locked, 18);
const cruiseIsland = island(cruisePoints, mats.locked, 19);
// No separate line-grid overlay: each complete land block is one visible tile.

function road(ax,az,bx,bz,width=10,bridge=false){
  const dx=bx-ax, dz=bz-az, len=Math.hypot(dx,dz), angle=Math.atan2(dz,dx);
  const group = new THREE.Group();
  group.position.set((ax+bx)/2, bridge?1.8:.24, (az+bz)/2);
  group.rotation.y = -angle;

  const base = new THREE.Mesh(new THREE.BoxGeometry(len,.35,width), mats.road);
  base.receiveShadow = true;
  base.castShadow = bridge;
  group.add(base);

  if(!bridge){
    for(const side of [-1,1]){
      const sw = new THREE.Mesh(new THREE.BoxGeometry(len,.22,2), mats.sidewalk);
      sw.position.set(0,.2,side*(width/2+1));
      group.add(sw);
    }
  }

  for(let x=-len/2+7; x<len/2-3; x+=12){
    const dash = new THREE.Mesh(new THREE.BoxGeometry(6,.08,.45), mats.yellow);
    dash.position.set(x,.26,0);
    group.add(dash);
  }
  scene.add(group);
  return group;
}

[
  [-112,-72,112,-72],[-122,-26,120,-26],[-120,25,120,25],[-105,76,105,76],
  [-86,-98,-86,98],[-36,-116,-36,111],[35,-116,35,112],[86,-90,86,92]
].forEach(r=>road(...r));

const bridge = road(108,-72,164,-58,11,true);
bridge.visible = false;

// Narrow bridge approach: the city and airport remain visibly separate islands.
road(164,-58,224,-58,11);
road(224,-58,390,-58,11);

// Airport circulation stays mostly on the terminal / airfield side,
// preserving the western build zone.
road(258,-120,258,48,11);
road(330,-130,330,55,11);
road(390,-105,390,48,11);

// $25k Transit District — a major expansion zone above the original city.
// Roads loop around the rail terminal and leave large square areas open for future buildings.
road(-92,-232,226,-232,12);
road(-108,-402,236,-402,12);
road(-111,-276,218,-276,10);
road(-108,-370,235,-370,10);
road(-72,-425,-72,-214,11);
road(72,-445,72,-205,12);
road(205,-420,205,-224,11);

// Two short boulevard spurs frame the civic station plaza without crossing the tracks.
road(-72,-320,-18,-320,10);
road(158,-320,205,-320,10);

// Road approaches for the two $25k bridge connections.
// These intentionally meet existing streets on both sides of the water gap.
road(-36,-116,-36,-145,11);
road(-72,-232,-36,-232,11);
road(-36,-232,-36,-191,11);

road(190,-120,205,-120,11);
road(205,-120,205,-158,11);
road(205,-224,205,-208,11);

// $50k Cruise Island — the largest expansion on the map.
road(-530,-145,-225,-145,12);
road(-540,-65,-210,-65,11);
road(-535,20,-210,20,11);
road(-510,100,-245,100,11);
road(-500,-210,-500,125,11);
road(-400,-245,-400,145,12);
road(-300,-235,-300,145,11);
road(-225,-180,-225,110,11);

// This bridge appears when the $50k resort unlocks.
const cruiseAccessBridge=road(-190,25,-150,25,12,true);
cruiseAccessBridge.visible=false;

function spriteLabel(text,bg='#143e62'){
  const c=document.createElement('canvas'); c.width=512; c.height=160;
  const x=c.getContext('2d');
  x.fillStyle=bg; x.beginPath(); x.roundRect(8,8,496,144,24); x.fill();
  x.strokeStyle='rgba(255,255,255,.38)'; x.lineWidth=5; x.stroke();
  x.fillStyle='#fff'; x.textAlign='center'; x.textBaseline='middle'; x.font='900 42px system-ui';
  x.fillText(text,256,80);
  const tex=new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace;
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:false}));
  s.scale.set(22,6.9,1);
  return s;
}

function createRevenueBubble(title,target,x,y,z){
  const canvas=document.createElement('canvas');
  canvas.width=900;
  canvas.height=330;
  const ctx=canvas.getContext('2d');
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;

  const material=new THREE.SpriteMaterial({
    map:texture,
    transparent:true,
    depthTest:false,
    depthWrite:false
  });

  const sprite=new THREE.Sprite(material);
  const baseScaleX=title==='CRUISE ISLAND'?76:(title==='AIRPORT ISLAND'?68:62);
  const baseScaleY=title==='CRUISE ISLAND'?28:(title==='AIRPORT ISLAND'?25:23);
  sprite.position.set(x,y,z);
  sprite.scale.set(baseScaleX,baseScaleY,1);
  sprite.renderOrder=1000;
  scene.add(sprite);

  return {
    ctx,texture,sprite,title,target,lastValue:-1,
    baseY:y,baseScaleX,baseScaleY,
    phase:Math.random()*Math.PI*2,
    nextSpin:5+Math.random()*5,
    spinStart:-1
  };
}

function drawAirportIcon(ctx,cx,cy){
  ctx.save();
  ctx.translate(cx,cy);
  ctx.rotate(-0.38);
  ctx.fillStyle='#ffffff';
  ctx.strokeStyle='#1956a8';
  ctx.lineWidth=8;
  ctx.lineJoin='round';

  ctx.beginPath();
  ctx.moveTo(-44,-5);
  ctx.lineTo(-8,-8);
  ctx.lineTo(20,-38);
  ctx.lineTo(31,-34);
  ctx.lineTo(16,-6);
  ctx.lineTo(50,4);
  ctx.lineTo(50,14);
  ctx.lineTo(16,12);
  ctx.lineTo(30,39);
  ctx.lineTo(19,44);
  ctx.lineTo(-8,14);
  ctx.lineTo(-44,17);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle='#87d5ff';
  ctx.fillRect(-18,-2,48,8);
  ctx.restore();
}

function drawTrainIcon(ctx,cx,cy){
  ctx.save();
  ctx.translate(cx,cy);
  ctx.fillStyle='#ffffff';
  ctx.strokeStyle='#5a3e9f';
  ctx.lineWidth=7;
  ctx.lineJoin='round';

  ctx.beginPath();
  ctx.roundRect(-34,-38,68,64,16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle='#8dd6ff';
  ctx.beginPath(); ctx.roundRect(-23,-27,46,24,8); ctx.fill();

  ctx.fillStyle='#5a3e9f';
  ctx.beginPath(); ctx.arc(-20,27,8,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(20,27,8,0,Math.PI*2); ctx.fill();

  ctx.lineWidth=6;
  ctx.beginPath(); ctx.moveTo(-24,42); ctx.lineTo(-8,25); ctx.moveTo(24,42); ctx.lineTo(8,25); ctx.stroke();
  ctx.restore();
}

function drawCruiseIcon(ctx,cx,cy){
  ctx.save();
  ctx.translate(cx,cy);
  ctx.fillStyle='#ffffff';
  ctx.strokeStyle='#176f9f';
  ctx.lineWidth=7;
  ctx.lineJoin='round';

  ctx.beginPath();
  ctx.moveTo(-45,8);
  ctx.lineTo(42,8);
  ctx.lineTo(28,34);
  ctx.lineTo(-30,34);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.roundRect(-26,-22,51,30,8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle='#7dd7ef';
  ctx.fillRect(-17,-14,10,8);
  ctx.fillRect(-2,-14,10,8);
  ctx.fillRect(13,-14,10,8);

  ctx.fillStyle='#ffb62f';
  ctx.fillRect(-8,-36,14,14);

  ctx.strokeStyle='#176f9f';
  ctx.lineWidth=5;
  ctx.beginPath();
  ctx.moveTo(-42,42); ctx.quadraticCurveTo(-22,33,-2,42);
  ctx.quadraticCurveTo(18,51,42,40);
  ctx.stroke();
  ctx.restore();
}

function drawRevenueBubble(bubble,currentRevenue){
  if(!bubble || !bubble.sprite.visible) return;

  const value=Math.floor(currentRevenue);
  if(value===bubble.lastValue) return;
  bubble.lastValue=value;

  const ctx=bubble.ctx;
  const progress=THREE.MathUtils.clamp(currentRevenue/bubble.target,0,1);
  const isAirport=bubble.title==='AIRPORT ISLAND';
  const isCruise=bubble.title==='CRUISE ISLAND';

  ctx.clearRect(0,0,900,330);

  // Big white playful game bubble.
  ctx.save();
  ctx.shadowColor='rgba(31,70,115,.28)';
  ctx.shadowBlur=28;
  ctx.shadowOffsetY=14;
  ctx.fillStyle='#ffffff';
  ctx.beginPath();
  ctx.roundRect(28,22,844,258,52);
  ctx.fill();
  ctx.restore();

  // Soft blue outline.
  ctx.strokeStyle='#b8d9f5';
  ctx.lineWidth=6;
  ctx.beginPath();
  ctx.roundRect(28,22,844,258,52);
  ctx.stroke();

  // Colored icon badge.
  const iconX=112,iconY=102;
  const badgeGrad=ctx.createLinearGradient(70,58,154,146);
  if(isAirport){
    badgeGrad.addColorStop(0,'#ffd95c');
    badgeGrad.addColorStop(1,'#ffad22');
  }else if(isCruise){
    badgeGrad.addColorStop(0,'#61dfc6');
    badgeGrad.addColorStop(1,'#23a4cf');
  }else{
    badgeGrad.addColorStop(0,'#bba8ff');
    badgeGrad.addColorStop(1,'#7f63e7');
  }
  ctx.fillStyle=badgeGrad;
  ctx.beginPath(); ctx.arc(iconX,iconY,58,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='#ffffff'; ctx.lineWidth=6; ctx.stroke();

  if(isAirport) drawAirportIcon(ctx,iconX,iconY);
  else if(isCruise) drawCruiseIcon(ctx,iconX,iconY);
  else drawTrainIcon(ctx,iconX,iconY);

  // Friendly two-tone title with dark outline.
  const titleY=90;
  ctx.textAlign='left';
  ctx.textBaseline='middle';
  ctx.font='1000 54px system-ui';
  ctx.lineJoin='round';
  ctx.lineWidth=12;
  ctx.strokeStyle='#152b73';

  if(isAirport){
    ctx.strokeText('AIRPORT',190,titleY);
    ctx.fillStyle='#42bdf5';
    ctx.fillText('AIRPORT',190,titleY);
    const w=ctx.measureText('AIRPORT').width;
    ctx.strokeText('ISLAND',190+w+12,titleY);
    ctx.fillStyle='#ffb52c';
    ctx.fillText('ISLAND',190+w+12,titleY);
  }else if(isCruise){
    ctx.strokeText('CRUISE',190,titleY);
    ctx.fillStyle='#35cdb1';
    ctx.fillText('CRUISE',190,titleY);
    const w=ctx.measureText('CRUISE').width;
    ctx.strokeText('ISLAND',190+w+12,titleY);
    ctx.fillStyle='#ff9f45';
    ctx.fillText('ISLAND',190+w+12,titleY);
  }else{
    ctx.strokeText('TRANSIT',190,titleY);
    ctx.fillStyle='#8f73ef';
    ctx.fillText('TRANSIT',190,titleY);
    const w=ctx.measureText('TRANSIT').width;
    ctx.strokeText('DISTRICT',190+w+12,titleY);
    ctx.fillStyle='#47c879';
    ctx.fillText('DISTRICT',190+w+12,titleY);
  }

  // Requirement line.
  ctx.lineWidth=1;
  ctx.strokeStyle='transparent';
  ctx.fillStyle='#35415f';
  ctx.font='800 32px system-ui';
  ctx.fillText('Requires $'+Math.round(bubble.target/1000)+'k Revenue',190,144);

  // Numeric progress.
  ctx.textAlign='right';
  ctx.fillStyle='#283969';
  ctx.font='900 28px system-ui';
  ctx.fillText('$'+value.toLocaleString()+' / $'+bubble.target.toLocaleString(),820,201);

  // Chunky bright progress bar.
  const bx=72,by=214,bw=756,bh=48;
  ctx.fillStyle='#d7e2ee';
  ctx.beginPath(); ctx.roundRect(bx,by,bw,bh,24); ctx.fill();

  const fillW=Math.max(48,bw*progress);
  const grad=ctx.createLinearGradient(bx,by,bx+bw,by);
  grad.addColorStop(0,'#2fe463');
  grad.addColorStop(.65,'#a8ef3d');
  grad.addColorStop(1,'#ffd738');
  ctx.fillStyle=grad;
  ctx.beginPath(); ctx.roundRect(bx,by,fillW,bh,24); ctx.fill();

  // Diagonal glossy stripes in fill.
  ctx.save();
  ctx.beginPath(); ctx.roundRect(bx,by,fillW,bh,24); ctx.clip();
  ctx.strokeStyle='rgba(255,255,255,.18)';
  ctx.lineWidth=12;
  for(let sx=bx-50;sx<bx+fillW+50;sx+=34){
    ctx.beginPath();
    ctx.moveTo(sx,by+bh);
    ctx.lineTo(sx+32,by);
    ctx.stroke();
  }
  ctx.restore();

  // Percentage pill.
  const pct=Math.floor(progress*100)+'%';
  const pctX=Math.max(bx+72,Math.min(bx+fillW-58,bx+bw-70));
  ctx.fillStyle='#ffffff';
  ctx.strokeStyle='rgba(30,60,105,.18)';
  ctx.lineWidth=3;
  ctx.beginPath(); ctx.roundRect(pctX-48,by+5,96,bh-10,18); ctx.fill(); ctx.stroke();
  ctx.textAlign='center';
  ctx.fillStyle='#24345d';
  ctx.font='1000 24px system-ui';
  ctx.fillText(pct,pctX,by+bh/2+1);

  // Pointer.
  ctx.fillStyle='#ffffff';
  ctx.strokeStyle='#b8d9f5';
  ctx.lineWidth=5;
  ctx.beginPath();
  ctx.moveTo(402,280);
  ctx.lineTo(498,280);
  ctx.lineTo(450,326);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Friendly sparkles / motion marks built into the card art.
  const sparkle=(x,y,r,color)=>{
    ctx.save();
    ctx.translate(x,y);
    ctx.fillStyle=color;
    ctx.beginPath();
    ctx.moveTo(0,-r);
    ctx.lineTo(r*.3,-r*.3);
    ctx.lineTo(r,0);
    ctx.lineTo(r*.3,r*.3);
    ctx.lineTo(0,r);
    ctx.lineTo(-r*.3,r*.3);
    ctx.lineTo(-r,0);
    ctx.lineTo(-r*.3,-r*.3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };
  sparkle(850,76,15,'#ffd23d');
  sparkle(52,94,12,isAirport?'#4fc9ff':(isCruise?'#43d9b8':'#9e86ff'));
  sparkle(834,150,9,'#ffb32c');

  ctx.strokeStyle='#ffbf2f';
  ctx.lineWidth=9;
  ctx.lineCap='round';
  for(const [x1,y1,x2,y2] of [[50,40,35,25],[70,30,68,10],[830,35,848,20],[848,47,869,44]]){
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
  }

  bubble.texture.needsUpdate=true;
}

function updateRevenueBubbleMotion(t){
  const bubbles=[airportRevenueBubble,transitRevenueBubble,cruiseRevenueBubble];
  bubbles.forEach((bubble,index)=>{
    if(!bubble || !bubble.sprite.visible) return;

    // Constant friendly floating/bobbing.
    const bob=Math.sin(t*1.8+bubble.phase)*1.8;
    const breathe=1+Math.sin(t*2.2+bubble.phase)*.025;
    bubble.sprite.position.y=bubble.baseY+bob;
    bubble.sprite.scale.set(
      bubble.baseScaleX*breathe,
      bubble.baseScaleY*breathe,
      1
    );

    // Every few seconds, do a quick playful spin/wiggle and bounce.
    if(t>=bubble.nextSpin && bubble.spinStart<0){
      bubble.spinStart=t;
      bubble.nextSpin=t+7+Math.random()*6;
    }

    if(bubble.spinStart>=0){
      const elapsed=t-bubble.spinStart;
      if(elapsed<1.05){
        const p=elapsed/1.05;
        const wave=Math.sin(p*Math.PI);
        bubble.sprite.material.rotation=Math.sin(p*Math.PI*4)*.11*wave*(index?-.85:1);
        const pop=1+wave*.16;
        bubble.sprite.scale.set(
          bubble.baseScaleX*pop,
          bubble.baseScaleY*pop,
          1
        );
        bubble.sprite.position.y=bubble.baseY+bob+wave*5.5;
      }else{
        bubble.sprite.material.rotation=0;
        bubble.spinStart=-1;
      }
    }
  });
}


// $25K EXPANSION BRIDGES
// Two full road bridges connect the street grids, but they look visibly unfinished
// and stay blocked until the Transit District unlocks at $25k revenue.
const transitBrokenBridgeGroups=[];
const transitCompleteBridges=[];
const transitBridgeLabels=[];

const bridgeConcreteMat=new THREE.MeshStandardMaterial({color:0x8b9398,roughness:.82});
const bridgeConcreteDark=new THREE.MeshStandardMaterial({color:0x667078,roughness:.9});
const bridgeBarrierRed=new THREE.MeshStandardMaterial({color:0xd84536,roughness:.55});
const bridgeBarrierWhite=new THREE.MeshStandardMaterial({color:0xf7f3e9,roughness:.55});
const bridgeSteelMat=new THREE.MeshStandardMaterial({color:0x56636d,roughness:.38,metalness:.42});
const bridgeYellowMat=new THREE.MeshStandardMaterial({color:0xf0b529,roughness:.48});
const bridgeTireMat=new THREE.MeshStandardMaterial({color:0x202327,roughness:.9});
const bridgeGlassMat=new THREE.MeshStandardMaterial({color:0x6fb6d3,roughness:.22,metalness:.06});
const bridgeWarningMat=new THREE.MeshStandardMaterial({
  color:0xffa31a,emissive:0xff6a00,emissiveIntensity:1.8,roughness:.3
});

function addBridgeBarricade(group,x,z,rotation=0){
  const barGroup=new THREE.Group();
  barGroup.position.set(x,3.7,z);
  barGroup.rotation.y=rotation;

  const postL=new THREE.Mesh(new THREE.BoxGeometry(.45,3.5,.45),bridgeConcreteMat);
  postL.position.set(-4.4,-1.0,0);
  barGroup.add(postL);
  const postR=postL.clone();
  postR.position.x=4.4;
  barGroup.add(postR);

  for(let i=0;i<7;i++){
    const stripe=new THREE.Mesh(
      new THREE.BoxGeometry(1.55,1.0,.55),
      i%2===0?bridgeBarrierRed:bridgeBarrierWhite
    );
    stripe.position.set(-4.65+i*1.55,.15,0);
    stripe.rotation.z=-.28;
    barGroup.add(stripe);
  }

  for(const sx of [-4.4,4.4]){
    const lamp=new THREE.Mesh(new THREE.SphereGeometry(.42,10,8),bridgeWarningMat);
    lamp.position.set(sx,1.55,0);
    barGroup.add(lamp);
  }

  group.add(barGroup);
}

function addConstructionCone(group,x,z){
  const cone=new THREE.Mesh(
    new THREE.ConeGeometry(.55,1.5,10),
    new THREE.MeshStandardMaterial({color:0xf57c20,roughness:.6})
  );
  cone.position.set(x,3.0,z);
  group.add(cone);
  const base=new THREE.Mesh(new THREE.BoxGeometry(1.15,.16,1.15),bridgeTireMat);
  base.position.set(x,2.28,z);
  group.add(base);
}

function addBridgeTractor(group,x,z,rotation=0){
  const t=new THREE.Group();
  t.position.set(x,3.2,z);
  t.rotation.y=rotation;

  // Heavy yellow tracked construction tractor / excavator.
  const chassis=new THREE.Mesh(new THREE.BoxGeometry(5.8,1.4,3.4),bridgeYellowMat);
  chassis.position.y=1.35;
  chassis.castShadow=true;
  t.add(chassis);

  for(const side of [-1,1]){
    const track=new THREE.Mesh(new THREE.BoxGeometry(5.4,1.05,.8),bridgeTireMat);
    track.position.set(0,.55,side*1.75);
    t.add(track);

    for(const wx of [-1.8,0,1.8]){
      const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.58,.58,.9,14),bridgeConcreteDark);
      wheel.rotation.x=Math.PI/2;
      wheel.position.set(wx,.55,side*1.76);
      t.add(wheel);
    }
  }

  const cab=new THREE.Mesh(new THREE.BoxGeometry(2.8,2.7,2.7),bridgeYellowMat);
  cab.position.set(-.8,3.15,0);
  cab.castShadow=true;
  t.add(cab);

  const windshield=new THREE.Mesh(new THREE.BoxGeometry(.12,1.55,1.95),bridgeGlassMat);
  windshield.position.set(.66,3.4,0);
  t.add(windshield);

  const boom=new THREE.Mesh(new THREE.BoxGeometry(5.8,.65,.7),bridgeYellowMat);
  boom.position.set(2.6,3.55,0);
  boom.rotation.z=-.33;
  t.add(boom);

  const arm=new THREE.Mesh(new THREE.BoxGeometry(3.3,.58,.62),bridgeYellowMat);
  arm.position.set(5.0,2.45,0);
  arm.rotation.z=.62;
  t.add(arm);

  const bucket=new THREE.Mesh(new THREE.BoxGeometry(1.5,.8,2.0),bridgeConcreteDark);
  bucket.position.set(6.05,1.25,0);
  bucket.rotation.z=.25;
  t.add(bucket);

  group.add(t);
  return t;
}

function addBridgePillars(group,x,aZ,bZ){
  // Pillars descend from the bridge deck all the way to the ocean floor.
  const low=Math.min(aZ,bZ);
  const high=Math.max(aZ,bZ);
  const span=high-low;
  const count=Math.max(3,Math.floor(span/15));

  for(let i=1;i<count;i++){
    const z=low+(span*i/count);
    const pierHeight=18.2;
    const pier=new THREE.Mesh(
      new THREE.BoxGeometry(8.5,pierHeight,4.8),
      bridgeConcreteMat
    );
    pier.position.set(x,-6.7,z);
    pier.castShadow=true;
    pier.receiveShadow=true;
    group.add(pier);

    const footing=new THREE.Mesh(
      new THREE.BoxGeometry(11.2,2.2,7.2),
      bridgeConcreteDark
    );
    footing.position.set(x,-14.7,z);
    group.add(footing);

    const cap=new THREE.Mesh(
      new THREE.BoxGeometry(11.5,1.1,6.2),
      bridgeConcreteDark
    );
    cap.position.set(x,1.45,z);
    group.add(cap);
  }
}

function addUnfinishedBridgeDetails(group,x,cityZ,transitZ,variant=0){
  const mid=(cityZ+transitZ)/2;
  const length=Math.abs(cityZ-transitZ);

  // Exposed side steel / partial railings.
  for(const side of [-1,1]){
    const rail=new THREE.Mesh(
      new THREE.BoxGeometry(.45,1.2,length*.72),
      bridgeSteelMat
    );
    rail.position.set(x+side*5.0,3.15,mid+(variant?2:-2));
    group.add(rail);
  }

  // Concrete slab stacks and exposed beams make the deck look under construction.
  for(const [dx,dz] of [[-3.5,-6],[3.2,5],[0,11]]){
    const slab=new THREE.Mesh(new THREE.BoxGeometry(3.8,.7,2.4),bridgeConcreteMat);
    slab.position.set(x+dx,3.0,mid+dz);
    slab.rotation.y=(dx+dz)*.03;
    group.add(slab);
  }

  for(const offset of [-8,8]){
    const beam=new THREE.Mesh(new THREE.BoxGeometry(8,.55,.7),bridgeSteelMat);
    beam.position.set(x,3.5,mid+offset);
    beam.rotation.y=.16*(offset>0?1:-1);
    group.add(beam);
  }

  // Work-zone cones and hazard barricades clearly block traffic.
  for(const dz of [-10,-5,5,10]){
    addConstructionCone(group,x-3.6,mid+dz);
    addConstructionCone(group,x+3.6,mid+dz+1.5);
  }

  addBridgeBarricade(group,x,mid-2.8,0);
  addBridgeBarricade(group,x,mid+2.8,Math.PI);

  // Construction machine sits visibly on top of each bridge.
  addBridgeTractor(group,x+(variant?2.0:-1.5),mid+(variant?-12:12),variant?Math.PI:0);

  // Hanging work lights.
  for(const z of [mid-15,mid+15]){
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(.12,.16,5.5,8),bridgeSteelMat);
    pole.position.set(x+4.6,5.0,z);
    group.add(pole);
    const lamp=new THREE.Mesh(new THREE.SphereGeometry(.45,10,8),bridgeWarningMat);
    lamp.position.set(x+4.6,7.8,z);
    group.add(lamp);
  }
}

function makeUnfinishedTransitBridge({x,cityZ,transitZ,labelZ,variant=0}){
  const group=new THREE.Group();
  scene.add(group);

  // Overlap the bridge into each street by several units so there is no visible water seam.
  // cityZ is closer to the original city/airport side; transitZ is on the $25k island side.
  const direction=Math.sign(transitZ-cityZ)||-1;
  const overlap=7;
  const deckCityZ=cityZ-direction*overlap;
  const deckTransitZ=transitZ+direction*overlap;

  // Build the ACTUAL full bridge now so it clearly connects flush to both roads.
  const unfinishedDeck=road(x,deckCityZ,x,deckTransitZ,11,true);
  group.add(unfinishedDeck);

  // Add low transition slabs at both ends to hide the height change from street to bridge.
  for(const z of [cityZ,transitZ]){
    const transition=new THREE.Mesh(
      new THREE.BoxGeometry(11.4,.7,7.5),
      mats.road
    );
    transition.position.set(x,1.1,z);
    transition.receiveShadow=true;
    transition.castShadow=true;
    group.add(transition);

    const edgeL=new THREE.Mesh(new THREE.BoxGeometry(.5,.85,7.5),bridgeConcreteDark);
    edgeL.position.set(x-5.45,1.3,z);
    group.add(edgeL);
    const edgeR=edgeL.clone();
    edgeR.position.x=x+5.45;
    group.add(edgeR);
  }

  addBridgePillars(group,x,deckCityZ,deckTransitZ);
  addUnfinishedBridgeDetails(group,x,cityZ,transitZ,variant);

  const mid=(cityZ+transitZ)/2;
  const label=spriteLabel('UNLOCKED AT $25K REVENUE','#5a3c22');
  label.position.set(x,14,labelZ ?? mid);
  label.scale.multiplyScalar(.72);
  scene.add(label);
  transitBridgeLabels.push(label);

  transitBrokenBridgeGroups.push(group);

  // Clean finished bridge swaps in at unlock and uses the same overlap so it stays flush.
  const completed=road(x,deckCityZ,x,deckTransitZ,11,true);
  completed.visible=false;
  transitCompleteBridges.push(completed);
}

// Both bridges line up directly with existing street approaches.
makeUnfinishedTransitBridge({x:-36,cityZ:-145,transitZ:-191,labelZ:-168,variant:0});
makeUnfinishedTransitBridge({x:205,cityZ:-158,transitZ:-208,labelZ:-183,variant:1});

function unlockTransitBridges(){
  transitBrokenBridgeGroups.forEach(g=>g.visible=false);
  transitBridgeLabels.forEach(l=>l.visible=false);
  transitCompleteBridges.forEach(b=>{
    b.visible=true;
    b.scale.z=.04;
  });
}

function updateTransitBridgeBuild(dt){
  if(!transitUnlocked) return;
  transitCompleteBridges.forEach(b=>{
    if(b.scale.z<1) b.scale.z=Math.min(1,b.scale.z+dt*1.8);
  });
}


// BUILDABLE SQUARE LOTS
// These restore the older "one building per square" city-builder layout.
// Every building sits on a visible square plot, which also gives us a clean
// snap grid for future placement/move tools.
const lotMaterial = new THREE.MeshStandardMaterial({color:0x8fd46e,roughness:1});
const lotBorderMaterial = new THREE.MeshStandardMaterial({color:0xe9e5d8,roughness:1});

function createLotBase(x,z,cols=3,rows=cols){
  const sizeX=cols*GRID_TILE;
  const sizeZ=rows*GRID_TILE;
  const lot = new THREE.Group();
  lot.position.set(x,.11,z);

  const tile = new THREE.Mesh(
    new THREE.BoxGeometry(sizeX-.5,.18,sizeZ-.5),
    lotMaterial
  );
  tile.receiveShadow = true;
  lot.add(tile);

  // Draw the footprint as actual 1x1 build squares.
  const lineMat=lotBorderMaterial;
  for(let i=0;i<=cols;i++){
    const lx=-sizeX/2+i*GRID_TILE;
    const line=new THREE.Mesh(new THREE.BoxGeometry(.38,.22,sizeZ),lineMat);
    line.position.set(lx,.2,0);
    lot.add(line);
  }
  for(let j=0;j<=rows;j++){
    const lz=-sizeZ/2+j*GRID_TILE;
    const line=new THREE.Mesh(new THREE.BoxGeometry(sizeX,.22,.38),lineMat);
    line.position.set(0,.2,lz);
    lot.add(line);
  }

  scene.add(lot);
  return lot;
}

function building({name,x,z,w=22,d=18,h=22,color=0x7fadd3,accent=0x315c7b,description='',footprint=3,footprintZ=footprint,style='office'}) {
  createLotBase(x,z,footprint,footprintZ);
  const g=new THREE.Group();
  g.position.set(x,.25,z);
  g.userData={name,description,gridLot:true,footprint,footprintZ,style};

  const bodyMat=new THREE.MeshStandardMaterial({color,roughness:.58});
  const accentMat=new THREE.MeshStandardMaterial({color:accent,roughness:.48,metalness:.05});
  const trimMat=new THREE.MeshStandardMaterial({color:0xf2efe6,roughness:.55});
  const darkMat=new THREE.MeshStandardMaterial({color:0x26333c,roughness:.5});
  const glassMat=new THREE.MeshPhysicalMaterial({
    color:0x80d8f1,roughness:.15,transparent:true,opacity:.84,transmission:.1,clearcoat:.4
  });
  const warmMat=new THREE.MeshStandardMaterial({
    color:0xffd76c,emissive:0xb06b00,emissiveIntensity:.55,roughness:.35
  });
  const greenMat=new THREE.MeshStandardMaterial({color:0x4f9c52,roughness:1});

  const pad=new THREE.Mesh(new THREE.BoxGeometry(w+5,.7,d+5),trimMat);
  pad.position.y=.35;
  pad.receiveShadow=true;
  g.add(pad);

  // Lower podium makes every building read as a premium game asset instead of a plain box.
  const podium=new THREE.Mesh(new THREE.BoxGeometry(w+1.4,2.3,d+1.4),accentMat);
  podium.position.y=1.5;
  podium.castShadow=true;
  g.add(podium);

  const body=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),bodyMat);
  body.position.y=h/2+2.5;
  body.castShadow=true;
  body.receiveShadow=true;
  g.add(body);

  // Front glass entrance and canopy.
  const entranceW=Math.min(8,w*.38);
  const entrance=new THREE.Mesh(new THREE.BoxGeometry(entranceW,6,.38),glassMat);
  entrance.position.set(0,5.2,d/2+.22);
  g.add(entrance);

  const canopy=new THREE.Mesh(new THREE.BoxGeometry(entranceW+2,.8,3.3),accentMat);
  canopy.position.set(0,8.1,d/2+1.4);
  canopy.castShadow=true;
  g.add(canopy);

  // Corner fins make silhouettes more interesting from isometric angles.
  for(const sx of [-1,1]){
    const fin=new THREE.Mesh(new THREE.BoxGeometry(.75,h+1,1.1),accentMat);
    fin.position.set(sx*(w/2-.65),h/2+2.6,d/2+.35);
    g.add(fin);
  }

  // Windows on front and side faces.
  const windowMat=new THREE.MeshStandardMaterial({
    color:0x86ddf6,emissive:0x174f68,emissiveIntensity:.52,roughness:.24
  });
  const cols=Math.max(3,Math.floor(w/4.7));
  const rows=Math.max(2,Math.floor(h/5));
  for(let r=0;r<rows;r++){
    const wy=5+r*((h-7)/Math.max(1,rows-1));
    for(let cc=0;cc<cols;cc++){
      const wx=-w/2+2.1+(cc*(w-4.2)/Math.max(1,cols-1));
      if(Math.abs(wx)<entranceW*.52 && wy<10) continue;
      const win=new THREE.Mesh(new THREE.BoxGeometry(1.8,1.65,.18),windowMat);
      win.position.set(wx,wy,d/2+.11);
      g.add(win);
    }
    const sideCols=Math.max(2,Math.floor(d/5.5));
    for(let cc=0;cc<sideCols;cc++){
      const wz=-d/2+2.1+(cc*(d-4.2)/Math.max(1,sideCols-1));
      const win=new THREE.Mesh(new THREE.BoxGeometry(.18,1.65,1.8),windowMat);
      win.position.set(w/2+.11,wy,wz);
      g.add(win);
    }
  }

  // Roof slab + rooftop crown.
  const roof=new THREE.Mesh(new THREE.BoxGeometry(w+1.5,.9,d+1.5),accentMat);
  roof.position.y=h+3.0;
  roof.castShadow=true;
  g.add(roof);

  const crown=new THREE.Mesh(new THREE.BoxGeometry(Math.max(7,w*.42),2.2,Math.max(6,d*.42)),darkMat);
  crown.position.y=h+4.4;
  g.add(crown);

  // Landscaping at the entrance.
  for(const sx of [-1,1]){
    const planter=new THREE.Mesh(new THREE.BoxGeometry(2.2,1.1,2.2),trimMat);
    planter.position.set(sx*(entranceW/2+2.2),1.1,d/2+2.3);
    g.add(planter);
    const shrub=new THREE.Mesh(new THREE.IcosahedronGeometry(1.45,1),greenMat);
    shrub.position.set(sx*(entranceW/2+2.2),2.5,d/2+2.3);
    shrub.castShadow=true;
    g.add(shrub);
  }

  // Building-specific architecture.
  if(style==='marketing'){
    const billboard=new THREE.Mesh(new THREE.BoxGeometry(w*.62,6,.7),darkMat);
    billboard.position.set(0,h+7,-1.5);
    g.add(billboard);
    const glowA=new THREE.Mesh(new THREE.BoxGeometry(w*.5,.55,.78),warmMat);
    glowA.position.set(0,h+7,-1.08);
    g.add(glowA);
    for(const sx of [-1,1]){
      const banner=new THREE.Mesh(new THREE.BoxGeometry(2.0,h*.55,.55),new THREE.MeshStandardMaterial({color:sx<0?0xf07b67:0xf2c34f,roughness:.45}));
      banner.position.set(sx*(w/2+.45),h*.58+2.5,d*.15);
      g.add(banner);
    }
  } else if(style==='accounting'){
    const atrium=new THREE.Mesh(new THREE.CylinderGeometry(5.2,5.2,h*.56,20),glassMat);
    atrium.position.set(0,h*.44+2.4,d/2+1.4);
    g.add(atrium);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(4.7,.45,10,28),warmMat);
    ring.rotation.x=Math.PI/2;
    ring.position.set(0,h+5,0);
    g.add(ring);
  } else if(style==='hq'){
    const upper=new THREE.Mesh(new THREE.BoxGeometry(w*.72,h*.38,d*.72),accentMat);
    upper.position.set(0,h+2+h*.19,0);
    upper.castShadow=true;
    g.add(upper);
    const glassTop=new THREE.Mesh(new THREE.BoxGeometry(w*.54,h*.22,d*.54),glassMat);
    glassTop.position.set(0,h+4+h*.49,0);
    g.add(glassTop);
    const beacon=new THREE.PointLight(0x8cdcff,2.4,50,2);
    beacon.position.set(0,h+13,0);
    g.add(beacon);
  } else if(style==='apartments'){
    for(let floor=0;floor<Math.max(3,Math.floor(h/6));floor++){
      const y=5.5+floor*5.2;
      for(const sx of [-1,1]){
        const balcony=new THREE.Mesh(new THREE.BoxGeometry(w*.36,.45,2.1),trimMat);
        balcony.position.set(sx*w*.25,y,d/2+1.15);
        g.add(balcony);
      }
    }
    const pergola=new THREE.Mesh(new THREE.BoxGeometry(w*.6,.55,d*.45),trimMat);
    pergola.position.y=h+5.1;
    g.add(pergola);
  } else if(style==='cafe'){
    const awning=new THREE.Mesh(new THREE.BoxGeometry(w*.72,.7,4.2),new THREE.MeshStandardMaterial({color:0x8a4f3e,roughness:.5}));
    awning.position.set(0,7.1,d/2+1.8);
    g.add(awning);
    for(const sx of [-5,0,5]){
      const table=new THREE.Mesh(new THREE.CylinderGeometry(1.2,1.2,.35,16),trimMat);
      table.position.set(sx,1.2,d/2+5.2);
      g.add(table);
    }
    const cup=new THREE.Mesh(new THREE.TorusGeometry(2.1,.45,12,24,Math.PI*1.55),warmMat);
    cup.rotation.z=Math.PI*.18;
    cup.position.set(0,h+6,0);
    g.add(cup);
  } else if(style==='market'){
    const canopy2=new THREE.Mesh(new THREE.BoxGeometry(w*.84,1.1,d*.72),new THREE.MeshStandardMaterial({color:0x3b8a67,roughness:.5}));
    canopy2.position.y=h+4.7;
    g.add(canopy2);
    for(const sx of [-1,1]){
      const skylight=new THREE.Mesh(new THREE.BoxGeometry(w*.26,.5,d*.42),glassMat);
      skylight.rotation.z=sx*.12;
      skylight.position.set(sx*w*.22,h+5.7,0);
      g.add(skylight);
    }
  } else if(style==='school'){
    const wingL=new THREE.Mesh(new THREE.BoxGeometry(w*.35,h*.58,d*.8),bodyMat);
    wingL.position.set(-w*.48,h*.29+2.4,0);
    wingL.castShadow=true;
    g.add(wingL);
    const wingR=wingL.clone();
    wingR.position.x=w*.48;
    g.add(wingR);
    const tower=new THREE.Mesh(new THREE.BoxGeometry(7,h*.65,7),accentMat);
    tower.position.set(0,h*.6+2.3,-1);
    g.add(tower);
    const clock=new THREE.Mesh(new THREE.CylinderGeometry(1.6,1.6,.25,24),trimMat);
    clock.rotation.x=Math.PI/2;
    clock.position.set(0,h*.74+2.3,d/2+.2);
    g.add(clock);
  }

  const sign=spriteLabel(name);
  sign.position.set(0,h*.67+2,d/2+1.15);
  sign.scale.multiplyScalar(Math.min(1.12,Math.max(.7,w/25)));
  g.add(sign);

  scene.add(g);
  clickable.push(g);
  return g;
}

function createAirportTerminal(x,z){
  createLotBase(x,z,8,6);
  const g=new THREE.Group();
  g.position.set(x,.25,z);
  g.userData={
    name:'Airport',
    description:'Business World International Airport. A full passenger terminal with departures, arrivals, drop-off lanes, gates and control tower.',
    gridLot:true,footprint:8,footprintZ:6,style:'airport'
  };

  const white=new THREE.MeshStandardMaterial({color:0xeeeae1,roughness:.55});
  const dark=new THREE.MeshStandardMaterial({color:0x26343f,roughness:.48});
  const blue=new THREE.MeshStandardMaterial({color:0x3b78a5,roughness:.45});
  const navy=new THREE.MeshStandardMaterial({color:0x244f72,roughness:.42});
  const glass=new THREE.MeshPhysicalMaterial({color:0x7ed7f0,roughness:.12,transparent:true,opacity:.82,transmission:.12,clearcoat:.5});
  const silver=new THREE.MeshStandardMaterial({color:0xbfc8cc,roughness:.3,metalness:.28});
  const green=new THREE.MeshStandardMaterial({color:0x4f9d55,roughness:1});
  const asphalt=new THREE.MeshStandardMaterial({color:0x3f474d,roughness:.95});
  const curb=new THREE.MeshStandardMaterial({color:0xd7d4cb,roughness:.9});
  const yellow=new THREE.MeshStandardMaterial({color:0xf0c64a,roughness:.7});
  const red=new THREE.MeshStandardMaterial({color:0xd55b4e,roughness:.65});

  // Larger terminal campus.
  const pad=new THREE.Mesh(new THREE.BoxGeometry(104,.7,76),white);
  pad.position.y=.35; pad.receiveShadow=true; g.add(pad);

  // Main terminal.
  const terminal=new THREE.Mesh(new THREE.BoxGeometry(72,17,34),white);
  terminal.position.set(5,9.4,-2);
  terminal.castShadow=true; g.add(terminal);

  // Two terminal side wings make it feel like a real multi-gate airport.
  const wingL=new THREE.Mesh(new THREE.BoxGeometry(30,12,25),white);
  wingL.position.set(-42,6.8,-8);
  wingL.castShadow=true; g.add(wingL);

  const wingR=new THREE.Mesh(new THREE.BoxGeometry(29,12,25),white);
  wingR.position.set(48,6.8,-8);
  wingR.castShadow=true; g.add(wingR);

  // Front glass curtain wall.
  const frontGlass=new THREE.Mesh(new THREE.BoxGeometry(60,10,.55),glass);
  frontGlass.position.set(5,9.1,15.3); g.add(frontGlass);

  for(const sx of [-22,-10,2,14,26]){
    const mullion=new THREE.Mesh(new THREE.BoxGeometry(.55,10,.72),silver);
    mullion.position.set(sx,9.1,15.65);
    g.add(mullion);
  }

  // Large entrance lobby / departures frontage.
  const entranceBox=new THREE.Mesh(new THREE.BoxGeometry(34,8,8),glass);
  entranceBox.position.set(5,5.1,22);
  entranceBox.castShadow=true;
  g.add(entranceBox);

  // Automatic terminal doors.
  for(const dx of [-10,-3.3,3.3,10]){
    const door=new THREE.Mesh(new THREE.BoxGeometry(4.8,5,.34),dark);
    door.position.set(5+dx,4.5,26.2);
    g.add(door);
  }

  // Curved-looking layered entrance canopy.
  const canopy=new THREE.Mesh(new THREE.BoxGeometry(52,1.2,8.5),blue);
  canopy.position.set(5,9.0,25.5); g.add(canopy);
  const canopyLip=new THREE.Mesh(new THREE.BoxGeometry(57,.55,2.2),navy);
  canopyLip.position.set(5,8.55,29); g.add(canopyLip);

  // Departures and arrivals signs.
  const departures=spriteLabel('DEPARTURES','#214f75');
  departures.scale.multiplyScalar(.58);
  departures.position.set(-9,11.5,26.8);
  g.add(departures);

  const arrivals=spriteLabel('ARRIVALS','#2f7a62');
  arrivals.scale.multiplyScalar(.52);
  arrivals.position.set(20,11.5,26.8);
  g.add(arrivals);

  // Rooftop structure and ribs.
  const roof=new THREE.Mesh(new THREE.BoxGeometry(77,1.1,37),dark);
  roof.position.set(5,18.2,-2); g.add(roof);

  for(const sx of [-24,-12,0,12,24,36]){
    const rib=new THREE.Mesh(new THREE.TorusGeometry(8.5,.42,10,28,Math.PI),silver);
    rib.rotation.z=Math.PI/2;
    rib.rotation.y=Math.PI/2;
    rib.position.set(sx+1,19.7,-2);
    g.add(rib);
  }

  // Passenger drop-off road in front of terminal.
  const dropRoad=new THREE.Mesh(new THREE.BoxGeometry(95,.32,11),asphalt);
  dropRoad.position.set(4,.45,37);
  dropRoad.receiveShadow=true;
  g.add(dropRoad);

  for(const laneZ of [34.5,39.5]){
    for(let dx=-38;dx<43;dx+=13){
      const dash=new THREE.Mesh(new THREE.BoxGeometry(6,.08,.42),yellow);
      dash.position.set(dx,.66,laneZ);
      g.add(dash);
    }
  }

  // Arrival/departure curb and pedestrian forecourt.
  const terminalCurb=new THREE.Mesh(new THREE.BoxGeometry(90,.35,3.1),curb);
  terminalCurb.position.set(4,.7,30.8);
  g.add(terminalCurb);

  const forecourt=new THREE.Mesh(new THREE.BoxGeometry(90,.3,10),curb);
  forecourt.position.set(4,.5,47);
  g.add(forecourt);

  // Covered pedestrian canopy supports.
  for(const sx of [-32,-20,-8,4,16,28,40]){
    const post=new THREE.Mesh(new THREE.CylinderGeometry(.25,.3,6.5,8),silver);
    post.position.set(sx,3.6,31.8);
    g.add(post);
  }

  // Small decorative entrance planters.
  for(const sx of [-39,-27,35,47]){
    const planter=new THREE.Mesh(new THREE.BoxGeometry(5,1.2,5),curb);
    planter.position.set(sx,1.1,48);
    g.add(planter);
    const shrub=new THREE.Mesh(new THREE.IcosahedronGeometry(1.8,1),green);
    shrub.position.set(sx,3.0,48);
    g.add(shrub);
  }

  // Control tower moved beside terminal apron.
  const towerBase=new THREE.Mesh(new THREE.CylinderGeometry(3.4,4.5,23,16),silver);
  towerBase.position.set(50,25,-17); g.add(towerBase);
  const towerCab=new THREE.Mesh(new THREE.CylinderGeometry(7,6.1,6.2,16),glass);
  towerCab.position.set(50,39.5,-17); g.add(towerCab);
  const towerRoof=new THREE.Mesh(new THREE.CylinderGeometry(7.5,7.5,.9,16),dark);
  towerRoof.position.set(50,43,-17); g.add(towerRoof);

  // Multiple jet bridges / gates on the apron side.
  for(const sx of [-48,-28,-8,12,32]){
    const gateRoot=new THREE.Mesh(new THREE.BoxGeometry(8,4.4,6.2),silver);
    gateRoot.position.set(sx,5.8,-22.5);
    g.add(gateRoot);

    const bridgeArm=new THREE.Mesh(new THREE.BoxGeometry(10,3.4,4.2),silver);
    bridgeArm.position.set(sx,5.5,-29.5);
    g.add(bridgeArm);

    const gateDoor=new THREE.Mesh(new THREE.BoxGeometry(5.4,3.1,.4),dark);
    gateDoor.position.set(sx,5.5,-31.8);
    g.add(gateDoor);
  }

  // Roof lights.
  for(const sx of [-30,-15,0,15,30]){
    const light=new THREE.PointLight(0x8edfff,1.2,24,2);
    light.position.set(sx,22,5);
    g.add(light);
  }

  // Main terminal signage.
  const sign=spriteLabel('BW INTERNATIONAL AIRPORT','#173d59');
  sign.scale.multiplyScalar(.92);
  sign.position.set(5,14.8,17.2);
  g.add(sign);

  scene.add(g);
  clickable.push(g);
  return g;
}

function createThinkHub(x,z){
  createLotBase(x,z,5,5);
  const g=new THREE.Group();
  g.position.set(x,.25,z);
  g.userData={
    name:'Think Hub',
    description:'The city’s idea and brainstorming center, where agents develop strategy, automation and new business concepts.',
    gridLot:true,
    footprint:5,
    footprintZ:5
  };

  const stone=new THREE.MeshStandardMaterial({color:0xe9eceb,roughness:.7});
  const white=new THREE.MeshStandardMaterial({color:0xf8f7f3,roughness:.62});
  const wood=new THREE.MeshStandardMaterial({color:0x9b6747,roughness:.72});
  const dark=new THREE.MeshStandardMaterial({color:0x23323b,roughness:.55,metalness:.08});
  const glass=new THREE.MeshPhysicalMaterial({color:0x75cde8,roughness:.18,transparent:true,opacity:.78,transmission:.12,clearcoat:.35});
  const gold=new THREE.MeshStandardMaterial({color:0xe9b83f,roughness:.35,metalness:.25,emissive:0x8d5b00,emissiveIntensity:.22});
  const glow=new THREE.MeshStandardMaterial({color:0xffe06a,emissive:0xffb000,emissiveIntensity:2.1,roughness:.28});

  const pad=new THREE.Mesh(new THREE.BoxGeometry(34,.7,29),stone);
  pad.position.y=.35; pad.receiveShadow=true; g.add(pad);

  const leftWing=new THREE.Mesh(new THREE.BoxGeometry(10,18,20),white);
  leftWing.position.set(-11,9.6,0); leftWing.castShadow=true; g.add(leftWing);

  const rightWing=new THREE.Mesh(new THREE.BoxGeometry(10,18,20),white);
  rightWing.position.set(11,9.6,0); rightWing.castShadow=true; g.add(rightWing);

  const woodPanel=new THREE.Mesh(new THREE.BoxGeometry(7,14,.5),wood);
  woodPanel.position.set(-11,9.5,10.25); g.add(woodPanel);

  const atrium=new THREE.Mesh(new THREE.CylinderGeometry(8.6,8.6,20,28,1,false,Math.PI*.5,Math.PI),glass);
  atrium.rotation.y=Math.PI/2;
  atrium.position.set(0,10.5,8.7);
  atrium.castShadow=true; g.add(atrium);

  const atriumCore=new THREE.Mesh(new THREE.CylinderGeometry(8.05,8.05,19.2,28),dark);
  atriumCore.material.transparent=true; atriumCore.material.opacity=.12;
  atriumCore.position.set(0,10.4,6.8); g.add(atriumCore);

  const roof=new THREE.Mesh(new THREE.CylinderGeometry(13.4,13.4,1.1,40),dark);
  roof.position.y=19.7; g.add(roof);

  const goldRing=new THREE.Mesh(new THREE.TorusGeometry(9.4,.7,14,48),gold);
  goldRing.rotation.x=Math.PI/2;
  goldRing.position.y=20.6; g.add(goldRing);

  const terraceL=new THREE.Mesh(new THREE.BoxGeometry(9,.55,7),stone);
  terraceL.position.set(-10.5,18.8,-5); g.add(terraceL);
  const terraceR=terraceL.clone(); terraceR.position.x=10.5; g.add(terraceR);

  for(const [tx,tz] of [[-13,-7],[-9,-8],[10,-8],[14,-6],[-14,7],[14,7]]){
    const pot=new THREE.Mesh(new THREE.BoxGeometry(1.8,1.3,1.8),stone);
    pot.position.set(tx,19.4,tz); g.add(pot);
    const bush=new THREE.Mesh(new THREE.IcosahedronGeometry(1.5,1),new THREE.MeshStandardMaterial({color:0x4a9a4d,roughness:1}));
    bush.position.set(tx,21,tz); bush.castShadow=true; g.add(bush);
  }

  const bulbBase=new THREE.Mesh(new THREE.CylinderGeometry(4.2,5,4.5,24),gold);
  bulbBase.position.y=23.3; bulbBase.castShadow=true; g.add(bulbBase);

  const bulbGlass=new THREE.Mesh(
    new THREE.SphereGeometry(7.3,32,22),
    new THREE.MeshPhysicalMaterial({color:0xfff2b5,transparent:true,opacity:.32,roughness:.08,transmission:.55,clearcoat:.5})
  );
  bulbGlass.scale.y=1.12;
  bulbGlass.position.y=31.2;
  g.add(bulbGlass);

  const filamentStem=new THREE.Mesh(new THREE.CylinderGeometry(.32,.32,6.5,12),glow);
  filamentStem.position.y=28.8; g.add(filamentStem);

  const loop=new THREE.Mesh(new THREE.TorusGeometry(2.7,.34,12,32,Math.PI*1.45),glow);
  loop.rotation.z=Math.PI*.78;
  loop.position.set(0,31.6,.3); g.add(loop);

  const bulbLight=new THREE.PointLight(0xffc93f,4.2,85,2);
  bulbLight.position.set(0,31,0); g.add(bulbLight);

  const canopy=new THREE.Mesh(new THREE.BoxGeometry(10,1.0,4.8),gold);
  canopy.position.set(0,8.5,12); g.add(canopy);

  const entrance=new THREE.Mesh(new THREE.BoxGeometry(7.2,7.2,.45),glass);
  entrance.position.set(0,4.6,14.3); g.add(entrance);

  const sign=spriteLabel('THINK HUB','#1c2b34');
  sign.position.set(0,11.2,13.4);
  sign.scale.multiplyScalar(.82);
  g.add(sign);

  const ideaPlaque=spriteLabel('IDEAS  •  PEOPLE  •  PROGRESS','#6f503d');
  ideaPlaque.position.set(-11,13,10.7);
  ideaPlaque.scale.multiplyScalar(.48);
  g.add(ideaPlaque);

  for(const sx of [-14,-10,-6,6,10,14]){
    const lampPost=new THREE.Mesh(new THREE.CylinderGeometry(.12,.16,3.3,8),dark);
    lampPost.position.set(sx,1.9,14.2); g.add(lampPost);
    const lamp=new THREE.Mesh(new THREE.SphereGeometry(.35,10,8),glow);
    lamp.position.set(sx,3.8,14.2); g.add(lamp);
  }

  scene.add(g);
  clickable.push(g);
  return g;
}


function createTransitStation(x,z){
  const g=new THREE.Group();
  g.position.set(x,.25,z);
  g.userData={
    name:'Underground Central Station',
    description:'Locked Transit District. Unlocks when city revenue reaches $25,000.',
    gridLot:true,
    footprint:7,
    footprintZ:6,
    style:'transit'
  };

  const stone=new THREE.MeshStandardMaterial({color:0xe7e3da,roughness:.62});
  const dark=new THREE.MeshStandardMaterial({color:0x202d38,roughness:.45});
  const blue=new THREE.MeshStandardMaterial({color:0x2b7898,roughness:.4});
  const silver=new THREE.MeshStandardMaterial({color:0xaebbc2,roughness:.3,metalness:.25});
  const glass=new THREE.MeshPhysicalMaterial({color:0x6dcde9,roughness:.12,transparent:true,opacity:.82,transmission:.12,clearcoat:.55});
  const railMat=new THREE.MeshStandardMaterial({color:0x33383c,roughness:.42,metalness:.48});
  const sleeperMat=new THREE.MeshStandardMaterial({color:0x73513c,roughness:.8});
  const yellowMat=new THREE.MeshStandardMaterial({color:0xf2c74d,roughness:.48});
  const green=new THREE.MeshStandardMaterial({color:0x4b9851,roughness:1});

  // Large civic plaza and station hall.
  const plaza=new THREE.Mesh(new THREE.BoxGeometry(94,.65,73),stone);
  plaza.position.set(0,.32,12);
  plaza.receiveShadow=true;
  g.add(plaza);

  const hall=new THREE.Mesh(new THREE.BoxGeometry(58,18,31),stone);
  hall.position.set(0,9.5,27);
  hall.castShadow=true;
  hall.receiveShadow=true;
  g.add(hall);

  const glassFront=new THREE.Mesh(new THREE.BoxGeometry(44,11,.45),glass);
  glassFront.position.set(0,10.2,42.7);
  g.add(glassFront);

  // Curved premium roof, inspired by a modern metro/rail terminal.
  for(const sx of [-23,-15,-7,1,9,17,25]){
    const rib=new THREE.Mesh(new THREE.TorusGeometry(10.5,.45,10,30,Math.PI),silver);
    rib.rotation.z=Math.PI/2;
    rib.rotation.y=Math.PI/2;
    rib.position.set(sx,20.3,27);
    g.add(rib);
  }
  const roofSpine=new THREE.Mesh(new THREE.BoxGeometry(58,1.1,6),dark);
  roofSpine.position.set(0,22.1,27);
  g.add(roofSpine);

  // Main underground entrance with stairs/escalator canopy.
  const entranceBox=new THREE.Mesh(new THREE.BoxGeometry(22,7,15),dark);
  entranceBox.position.set(-24,4.0,49);
  g.add(entranceBox);
  const entranceGlass=new THREE.Mesh(new THREE.BoxGeometry(17,5,.4),glass);
  entranceGlass.position.set(-24,4.2,56.7);
  g.add(entranceGlass);
  const entranceCanopy=new THREE.Mesh(new THREE.BoxGeometry(25,.85,18),blue);
  entranceCanopy.position.set(-24,8.0,49);
  g.add(entranceCanopy);
  for(let i=0;i<6;i++){
    const step=new THREE.Mesh(new THREE.BoxGeometry(14,.36,1.7),stone);
    step.position.set(-24,.45+i*.34,56-i*1.15);
    g.add(step);
  }

  // Surface platform and visible rail segment before the train drops underground.
  const platform=new THREE.Mesh(new THREE.BoxGeometry(138,.7,11),stone);
  platform.position.set(0,.4,-4);
  g.add(platform);
  const safety=new THREE.Mesh(new THREE.BoxGeometry(136,.14,.65),yellowMat);
  safety.position.set(0,.82,-9.0);
  g.add(safety);

  for(const rz of [-2.05,2.05]){
    const rail=new THREE.Mesh(new THREE.BoxGeometry(164,.32,.34),railMat);
    rail.position.set(0,.44,rz-17);
    g.add(rail);
  }
  for(let xx=-80;xx<=80;xx+=4.6){
    const tie=new THREE.Mesh(new THREE.BoxGeometry(.42,.22,6.2),sleeperMat);
    tie.position.set(xx,.25,-17);
    g.add(tie);
  }

  // Two tunnel mouths make it clear the rail line dives underground in both directions.
  for(const sx of [-82,82]){
    const portal=new THREE.Mesh(new THREE.BoxGeometry(12,9,11),dark);
    portal.position.set(sx,4.2,-17);
    g.add(portal);
    const portalGlass=new THREE.Mesh(new THREE.PlaneGeometry(8.6,6.1),new THREE.MeshBasicMaterial({color:0x07131d}));
    portalGlass.rotation.y=sx<0?Math.PI/2:-Math.PI/2;
    portalGlass.position.set(sx+(sx<0?6.05:-6.05),4.2,-17);
    g.add(portalGlass);
    const cap=new THREE.Mesh(new THREE.BoxGeometry(13.5,1.0,12.5),silver);
    cap.position.set(sx,9.1,-17);
    g.add(cap);
  }

  // Small parking/service court, sidewalks and landscaping.
  const parking=new THREE.Mesh(new THREE.BoxGeometry(47,.32,23),new THREE.MeshStandardMaterial({color:0x3d4449,roughness:.93}));
  parking.position.set(49,.22,37);
  g.add(parking);
  for(let px=31;px<=67;px+=9){
    const stripe=new THREE.Mesh(new THREE.BoxGeometry(.22,.08,18),new THREE.MeshStandardMaterial({color:0xf4f1e7,roughness:.8}));
    stripe.position.set(px,.43,37);
    g.add(stripe);
  }
  for(const [tx,tz] of [[-42,30],[-42,47],[39,17],[65,18],[70,50],[-5,52]]){
    const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.32,.48,3.2,8),new THREE.MeshStandardMaterial({color:0x77513b,roughness:1}));
    trunk.position.set(tx,1.8,tz);
    g.add(trunk);
    const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(2.2,1),green);
    crown.position.set(tx,5,tz);
    crown.castShadow=true;
    g.add(crown);
  }

  // Animated metro train.
  const train=new THREE.Group();
  train.position.set(-88,-4,-17);
  const trainBody=new THREE.MeshStandardMaterial({color:0xd8e0e4,roughness:.35,metalness:.18});
  const trainBlue=new THREE.MeshStandardMaterial({color:0x176d9a,roughness:.38});
  const trainWindow=new THREE.MeshStandardMaterial({color:0x17394b,emissive:0x0d3447,emissiveIntensity:.55,roughness:.22});
  for(let carIndex=0;carIndex<4;carIndex++){
    const carX=-18+carIndex*12;
    const body=new THREE.Mesh(new THREE.BoxGeometry(10.7,4.6,5.2),trainBody);
    body.position.set(carX,2.8,0);
    body.castShadow=true;
    train.add(body);
    const stripe=new THREE.Mesh(new THREE.BoxGeometry(10.9,.75,5.35),trainBlue);
    stripe.position.set(carX,2.25,0);
    train.add(stripe);
    for(const wz of [-2.68,2.68]){
      for(const wx of [-3.4,0,3.4]){
        const win=new THREE.Mesh(new THREE.BoxGeometry(2.25,1.35,.12),trainWindow);
        win.position.set(carX+wx,3.45,wz);
        train.add(win);
      }
    }
  }
  const head=new THREE.Mesh(new THREE.BoxGeometry(2.2,3.2,4.7),trainBlue);
  head.position.set(25,2.8,0);
  train.add(head);
  train.visible=false;
  g.add(train);

  const sign=spriteLabel('UNDERGROUND CENTRAL','#173b55');
  sign.position.set(0,14.2,43.3);
  sign.scale.multiplyScalar(.86);
  g.add(sign);

  const subwaySign=spriteLabel('TRAIN  •  METRO  •  $25K DISTRICT','#225f7d');
  subwaySign.position.set(-24,10.5,50);
  subwaySign.scale.multiplyScalar(.53);
  g.add(subwaySign);

  // Save the station's normal colors so the whole district can appear grey while locked.
  g.traverse(o=>{
    if(o.isSprite) return;
    const materials=Array.isArray(o.material)?o.material:[o.material];
    materials.filter(Boolean).forEach(m=>{
      if(m.color && m.userData.transitOriginalColor===undefined){
        m.userData.transitOriginalColor=m.color.getHex();
      }
    });
  });

  g.userData.train=train;
  scene.add(g);
  clickable.push(g);
  return g;
}

function setTransitStationLockedAppearance(station,locked){
  station.traverse(o=>{
    if(o.isSprite) return;
    const materials=Array.isArray(o.material)?o.material:[o.material];
    materials.filter(Boolean).forEach(m=>{
      if(!m.color) return;
      if(locked){
        if(m.userData.transitOriginalColor===undefined) m.userData.transitOriginalColor=m.color.getHex();
        m.color.setHex(0x747a7e);
      }else if(m.userData.transitOriginalColor!==undefined){
        m.color.setHex(m.userData.transitOriginalColor);
      }
    });
  });
}

let transitTrainPhase=0;
function updateTransitTrain(dt){
  if(!transitUnlocked || !transitStation?.userData?.train) return;
  const train=transitStation.userData.train;
  transitTrainPhase=(transitTrainPhase+dt)%22;

  // Wait underground briefly, then emerge, pass the station, and descend again.
  if(transitTrainPhase<2 || transitTrainPhase>20){
    train.visible=false;
    return;
  }

  train.visible=true;
  const u=(transitTrainPhase-2)/18;
  const x=-92 + 184*u;
  let y=1.5;
  if(u<.13) y=-5+(u/.13)*6.5;
  else if(u>.87) y=1.5-((u-.87)/.13)*6.5;

  train.position.x=x;
  train.position.y=y;
  train.rotation.y=0;
}


function createCruiseResort(cx,cz){
  const g=new THREE.Group();
  g.position.set(cx,0,cz);
  g.userData={
    name:'Cruise Island Resort',
    description:'The largest Business World expansion. Luxury beaches, hotels, marina, cruise terminal and a flagship cruise liner. Unlocks at $50,000 revenue.',
    style:'cruise'
  };

  const sand=new THREE.MeshStandardMaterial({color:0xe8c77f,roughness:1});
  const white=new THREE.MeshStandardMaterial({color:0xf3f1e9,roughness:.55});
  const navy=new THREE.MeshStandardMaterial({color:0x234d76,roughness:.48});
  const blue=new THREE.MeshStandardMaterial({color:0x3d9ed0,roughness:.42});
  const teal=new THREE.MeshStandardMaterial({color:0x48b8b0,roughness:.5});
  const green=new THREE.MeshStandardMaterial({color:0x54a852,roughness:1});
  const trunkMat=new THREE.MeshStandardMaterial({color:0x8b603f,roughness:1});
  const glass=new THREE.MeshPhysicalMaterial({color:0x78d8ef,roughness:.14,transparent:true,opacity:.84,transmission:.08,clearcoat:.45});
  const darkGlass=new THREE.MeshStandardMaterial({color:0x17384f,emissive:0x0c2b3d,emissiveIntensity:.5,roughness:.2});
  const poolMat=new THREE.MeshPhysicalMaterial({color:0x30bde0,roughness:.15,transparent:true,opacity:.9,clearcoat:.55});
  const dockMat=new THREE.MeshStandardMaterial({color:0xa88a67,roughness:.8});
  const red=new THREE.MeshStandardMaterial({color:0xd95745,roughness:.55});
  const yellow=new THREE.MeshStandardMaterial({color:0xf4c748,roughness:.55});
  const gray=new THREE.MeshStandardMaterial({color:0x9ba5aa,roughness:.7});
  const shipDark=new THREE.MeshStandardMaterial({color:0x1f405a,roughness:.42});

  function palm(x,z,s=1){
    const t=new THREE.Mesh(new THREE.CylinderGeometry(.28*s,.55*s,5.6*s,8),trunkMat);
    t.position.set(x,2.8*s,z);
    t.rotation.z=(Math.sin((x+z)*.1))*0.08;
    g.add(t);
    for(let i=0;i<6;i++){
      const leaf=new THREE.Mesh(new THREE.ConeGeometry(1.35*s,4.2*s,5),green);
      leaf.position.set(x,6.1*s,z);
      leaf.rotation.z=Math.PI/2;
      leaf.rotation.y=(Math.PI*2/6)*i;
      leaf.scale.set(1,.45,1);
      g.add(leaf);
    }
  }

  function umbrella(x,z,colorMat){
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(.08,.1,2.2,8),white);
    pole.position.set(x,1.2,z);
    g.add(pole);
    const shade=new THREE.Mesh(new THREE.ConeGeometry(1.7,.8,14),colorMat);
    shade.position.set(x,2.55,z);
    shade.rotation.x=Math.PI;
    g.add(shade);
  }

  function hotel(x,z,w=24,d=20,h=34,accent=blue){
    const base=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),white);
    base.position.set(x,h/2+.6,z);
    base.castShadow=true;
    g.add(base);

    const roof=new THREE.Mesh(new THREE.BoxGeometry(w+1.5,1.2,d+1.5),accent);
    roof.position.set(x,h+1.3,z);
    g.add(roof);

    for(let yy=6;yy<h-2;yy+=5.2){
      for(let xx=x-w/2+3;xx<x+w/2-2;xx+=4.2){
        const win=new THREE.Mesh(new THREE.BoxGeometry(2,1.7,.18),darkGlass);
        win.position.set(xx,yy,z+d/2+.11);
        g.add(win);
      }
    }

    const awning=new THREE.Mesh(new THREE.BoxGeometry(w*.5,.8,3.0),accent);
    awning.position.set(x,5,z+d/2+1.3);
    g.add(awning);
  }

  // Huge beach promenade along the western/southern shoreline.
  const beachPromenade=new THREE.Mesh(new THREE.BoxGeometry(300,.35,22),sand);
  beachPromenade.position.set(-10,.22,150);
  g.add(beachPromenade);

  // Main cruise terminal with a glass barrel roof.
  const terminal=new THREE.Mesh(new THREE.BoxGeometry(78,16,34),white);
  terminal.position.set(0,8.5,108);
  terminal.castShadow=true;
  g.add(terminal);

  const terminalGlass=new THREE.Mesh(new THREE.BoxGeometry(62,8,.55),glass);
  terminalGlass.position.set(0,10,125.2);
  g.add(terminalGlass);

  for(let x=-30;x<=30;x+=10){
    const rib=new THREE.Mesh(new THREE.TorusGeometry(11,.42,10,24,Math.PI),navy);
    rib.rotation.z=Math.PI/2;
    rib.rotation.y=Math.PI/2;
    rib.position.set(x,18.2,108);
    g.add(rib);
  }

  const terminalSign=spriteLabel('CRUISE TERMINAL','#2b6f93');
  terminalSign.position.set(0,13.4,126);
  terminalSign.scale.multiplyScalar(.72);
  g.add(terminalSign);

  // Resort hotels / towers.
  hotel(-105,-20,27,22,44,blue);
  hotel(-62,-30,25,21,36,teal);
  hotel(70,-25,28,22,48,navy);
  hotel(112,4,24,20,34,blue);

  // Large central resort pool / plaza.
  const poolDeck=new THREE.Mesh(new THREE.BoxGeometry(104,.45,67),white);
  poolDeck.position.set(5,.28,26);
  g.add(poolDeck);
  const pool=new THREE.Mesh(new THREE.BoxGeometry(78,.32,43),poolMat);
  pool.position.set(5,.55,26);
  g.add(pool);

  const poolIsland=new THREE.Mesh(new THREE.CylinderGeometry(8,8,.6,28),green);
  poolIsland.position.set(5,.8,26);
  g.add(poolIsland);
  palm(5,26,1.15);

  // Large south-west beach club fills the new lower beach lobe.
  const southBeach=new THREE.Mesh(new THREE.BoxGeometry(138,.42,82),sand);
  southBeach.position.set(-116,.26,274);
  g.add(southBeach);

  const beachClubDeck=new THREE.Mesh(new THREE.BoxGeometry(58,.5,42),white);
  beachClubDeck.position.set(-112,.52,270);
  g.add(beachClubDeck);

  const beachClubPool=new THREE.Mesh(new THREE.BoxGeometry(42,.32,27),poolMat);
  beachClubPool.position.set(-112,.82,270);
  g.add(beachClubPool);

  const beachPavilion=new THREE.Mesh(new THREE.BoxGeometry(34,10,24),white);
  beachPavilion.position.set(-55,5.3,255);
  g.add(beachPavilion);
  const beachPavilionRoof=new THREE.Mesh(new THREE.BoxGeometry(38,1.2,28),teal);
  beachPavilionRoof.position.set(-55,10.9,255);
  g.add(beachPavilionRoof);

  for(const [px,pz] of [[-168,245],[-150,282],[-132,315],[-90,316],[-52,302],[-32,270],[-72,232]]){
    palm(px,pz,1.02);
  }

  const southUmbColors=[red,yellow,blue,teal];
  let southUmbrellaIndex=0;
  for(const [ux,uz] of [[-166,292],[-145,306],[-124,300],[-102,315],[-78,300],[-45,289]]){
    umbrella(ux,uz,southUmbColors[southUmbrellaIndex%southUmbColors.length]);
    southUmbrellaIndex++;
  }

  // Boardwalk / marina docks.
  for(const dx of [-42,0,42]){
    const pier=new THREE.Mesh(new THREE.BoxGeometry(10,.8,72),dockMat);
    pier.position.set(dx,.15,182);
    g.add(pier);
    for(const zz of [156,176,198,218]){
      const postL=new THREE.Mesh(new THREE.CylinderGeometry(.25,.3,15,8),dockMat);
      postL.position.set(dx-4.2,-7,zz);
      g.add(postL);
      const postR=postL.clone();
      postR.position.x=dx+4.2;
      g.add(postR);
    }
  }

  // Huge flagship cruise liner docked just offshore.
  const ship=new THREE.Group();
  ship.position.set(0,0,252);

  const hull=new THREE.Mesh(new THREE.BoxGeometry(142,12,30),shipDark);
  hull.position.y=-7.2;
  hull.castShadow=true;
  ship.add(hull);

  const hullWhite=new THREE.Mesh(new THREE.BoxGeometry(138,12.5,27),white);
  hullWhite.position.y=.3;
  ship.add(hullWhite);

  const bow=new THREE.Mesh(new THREE.ConeGeometry(15,24,18),white);
  bow.rotation.z=-Math.PI/2;
  bow.position.set(80,.5,0);
  ship.add(bow);

  for(let deck=0;deck<4;deck++){
    const deckMesh=new THREE.Mesh(
      new THREE.BoxGeometry(112-deck*12,5.2,23-deck*2.5),
      white
    );
    deckMesh.position.set(-8,9+deck*4.3,0);
    ship.add(deckMesh);
  }

  const windowBand=new THREE.Mesh(new THREE.BoxGeometry(110,2.2,24.2),darkGlass);
  windowBand.position.set(-8,12.6,0);
  ship.add(windowBand);

  const funnel=new THREE.Mesh(new THREE.CylinderGeometry(4.5,5.5,12,14),navy);
  funnel.position.set(-26,30,0);
  ship.add(funnel);
  const funnelCap=new THREE.Mesh(new THREE.CylinderGeometry(5.6,5.6,1.6,14),yellow);
  funnelCap.position.set(-26,36,0);
  ship.add(funnelCap);

  for(const sx of [-43,-28,-13,2,17,32]){
    const lifeboat=new THREE.Mesh(new THREE.BoxGeometry(9,2.1,2.3),red);
    lifeboat.position.set(sx,9.5,14.3);
    ship.add(lifeboat);
  }

  const shipSign=spriteLabel('BUSINESS WORLD CRUISES','#204b75');
  shipSign.position.set(-5,22,15.6);
  shipSign.scale.multiplyScalar(.58);
  ship.add(shipSign);

  g.add(ship);

  // Lighthouse on far eastern beach.
  const lighthouse=new THREE.Mesh(new THREE.CylinderGeometry(3.4,4.2,20,16),white);
  lighthouse.position.set(155,10,104);
  g.add(lighthouse);
  for(const yy of [5,11,17]){
    const ring=new THREE.Mesh(new THREE.CylinderGeometry(4.35,4.35,2,16),red);
    ring.position.set(155,yy,104);
    g.add(ring);
  }
  const lightTop=new THREE.Mesh(new THREE.CylinderGeometry(5,4.2,5,16),glass);
  lightTop.position.set(155,22.5,104);
  g.add(lightTop);
  const lightRoof=new THREE.Mesh(new THREE.ConeGeometry(5.6,4,16),red);
  lightRoof.position.set(155,27,104);
  g.add(lightRoof);

  // Palm-lined beach and resort perimeter.
  const palmSpots=[
    [-155,-120],[-150,-70],[-154,-18],[-150,45],[-140,95],
    [-105,135],[-60,145],[20,146],[78,140],[132,122],
    [145,62],[148,18],[145,-40],[130,-92],
    [-110,68],[-72,72],[72,70],[108,58],
    [-130,-165],[-78,-185],[-15,-194],[58,-190],[112,-165]
  ];
  palmSpots.forEach(([x,z],i)=>palm(x,z,0.9+(i%3)*.08));

  // Beach umbrellas / cabanas.
  const umbColors=[red,yellow,blue,teal];
  let ui=0;
  for(const x of [-140,-110,-80,-50,-20,20,55,90,125]){
    umbrella(x,148+(ui%2)*8,umbColors[ui%umbColors.length]);
    ui++;
  }

  // Small retail / boardwalk pavilions.
  for(const [x,z,mat] of [[-128,92,red],[-92,95,blue],[88,96,teal],[124,92,yellow]]){
    const shop=new THREE.Mesh(new THREE.BoxGeometry(20,8,16),white);
    shop.position.set(x,4.3,z);
    g.add(shop);
    const roof=new THREE.Mesh(new THREE.BoxGeometry(22,1.2,18),mat);
    roof.position.set(x,8.8,z);
    g.add(roof);
  }

  // Make the whole resort click/tap readable.
  scene.add(g);
  clickable.push(g);
  return g;
}

function setCruiseLockedAppearance(group,locked){
  group.traverse(o=>{
    if(o.isSprite) return;
    const materials=Array.isArray(o.material)?o.material:[o.material];
    materials.filter(Boolean).forEach(m=>{
      if(!m.color) return;
      if(m.userData.cruiseOriginalColor===undefined){
        m.userData.cruiseOriginalColor=m.color.getHex();
      }
      if(locked){
        const original=new THREE.Color(m.userData.cruiseOriginalColor);
        const gray=(original.r+original.g+original.b)/3;
        m.color.setRGB(gray*.72,gray*.76,gray*.79);
      }else{
        m.color.setHex(m.userData.cruiseOriginalColor);
      }
    });
  });
}

const destinations = [
  building({name:'Marketing Studio',style:'marketing',footprint:3,x:-105,z:-48,w:25,d:20,h:24,color:0xdb7168,accent:0x813856,description:'Marketing content, social campaigns and brand growth.'}),
  building({name:'Accounting Hub',style:'accounting',footprint:3,x:-61,z:-48,w:24,d:20,h:28,color:0x609ed5,accent:0x2d5d93,description:'Invoices, bookkeeping, revenue, profit and forecasting.'}),
  building({name:'BW Headquarters',style:'hq',footprint:4,x:-4,z:-96,w:28,d:24,h:43,color:0x4f91cb,accent:0x2f5878,description:'Central headquarters for Business World operations.'}),
  createThinkHub(58,-48),
  building({name:'Apartments',style:'apartments',footprint:3,x:-104,z:51,w:24,d:21,h:30,color:0xdf9974,accent:0x865a47,description:'Home base for workers and residents.'}),
  building({name:'Cafe',style:'cafe',footprint:2,x:-61,z:51,w:25,d:21,h:15,color:0xd99661,accent:0x764b39,description:'Social space where agents can idle, meet and recharge.'}),
  building({name:'Market',style:'market',footprint:2,x:0,z:51,w:25,d:21,h:16,color:0xe5ad65,accent:0x287b5f,description:'Supplies and local commerce.'}),
  building({name:'School',style:'school',footprint:3,x:108,z:53,w:28,d:22,h:20,color:0xd98262,accent:0xa64f3b,description:'Community learning and worker development.'}),
];

const airportBuilding = createAirportTerminal(303,-24);
airportBuilding.traverse(o=>{ if(o.material && o.material.color) o.material.color.multiplyScalar(.72); });

const airportSurfaceMat=new THREE.MeshStandardMaterial({color:0x4a5258,roughness:.93});

// RIGHT-SIDE AVIATION ZONE
// Planes and runway activity live on the far east/right side as visual progression.
// This is decorative airport activity, not a player-controlled system.
const runway=new THREE.Mesh(new THREE.BoxGeometry(22,.45,230),mats.road);
runway.position.set(384,.3,-43);
scene.add(runway);

// Runway centerline.
for(let z=-145;z<62;z+=18){
  const stripe=new THREE.Mesh(new THREE.BoxGeometry(1.1,.1,9),mats.white);
  stripe.position.set(384,.6,z);
  scene.add(stripe);
}

// Runway threshold bars.
for(const z of [-155,72]){
  for(const xx of [376,380,384,388,392]){
    const threshold=new THREE.Mesh(new THREE.BoxGeometry(1.3,.08,10),mats.white);
    threshold.position.set(xx,.62,z);
    scene.add(threshold);
  }
}

// Parallel taxiway stays beside the runway on the right side.
const taxiway=new THREE.Mesh(new THREE.BoxGeometry(10,.36,205),mats.road);
taxiway.position.set(352,.28,-43);
scene.add(taxiway);

// Taxiway-to-runway connectors.
for(const z of [-120,-65,-10,45]){
  const connector=new THREE.Mesh(new THREE.BoxGeometry(34,.34,9),mats.road);
  connector.position.set(368,.28,z);
  scene.add(connector);
}

// Apron is concentrated behind/right of the terminal.
const apron=new THREE.Mesh(new THREE.BoxGeometry(92,.32,82),airportSurfaceMat);
apron.position.set(314,.27,-74);
scene.add(apron);

for(const [sx,sz] of [[292,-78],[316,-78],[340,-78],[316,-52]]){
  const gateMark=new THREE.Mesh(new THREE.BoxGeometry(16,.08,.8),mats.yellow);
  gateMark.position.set(sx,.47,sz);
  scene.add(gateMark);

  const noseMark=new THREE.Mesh(new THREE.BoxGeometry(.7,.08,15),mats.yellow);
  noseMark.position.set(sx,.47,sz-10);
  scene.add(noseMark);
}

// Stylized aircraft are decorative only.
const airportDecorPlanes=[];

function createAirportPlane(x,z,rotation=0){
  const g=new THREE.Group();
  g.position.set(x,1.2,z);
  g.rotation.y=rotation;

  const planeWhite=new THREE.MeshStandardMaterial({color:0xf4f4f0,roughness:.55});
  const planeBlue=new THREE.MeshStandardMaterial({color:0x347db3,roughness:.45});
  const planeDark=new THREE.MeshStandardMaterial({color:0x263744,roughness:.45});

  const fuselage=new THREE.Mesh(new THREE.CylinderGeometry(1.7,2.2,21,14),planeWhite);
  fuselage.rotation.z=Math.PI/2;
  g.add(fuselage);

  const nose=new THREE.Mesh(new THREE.ConeGeometry(1.75,5.5,14),planeWhite);
  nose.rotation.z=-Math.PI/2;
  nose.position.x=12.8;
  g.add(nose);

  const wing=new THREE.Mesh(new THREE.BoxGeometry(7,.55,18),planeWhite);
  g.add(wing);

  const tailWing=new THREE.Mesh(new THREE.BoxGeometry(3.3,.4,8),planeWhite);
  tailWing.position.set(-8.5,1,0);
  g.add(tailWing);

  const tailFin=new THREE.Mesh(new THREE.BoxGeometry(3.2,5,.55),planeBlue);
  tailFin.position.set(-9.2,3.2,0);
  tailFin.rotation.z=-.15;
  g.add(tailFin);

  for(const ez of [-5.5,5.5]){
    const engine=new THREE.Mesh(new THREE.CylinderGeometry(1.1,1.35,3.4,12),planeDark);
    engine.rotation.z=Math.PI/2;
    engine.position.set(1,-1.0,ez);
    g.add(engine);
  }

  scene.add(g);
  return g;
}

// Parked gate aircraft stay on the right-side apron.
createAirportPlane(300,-78,0);
createAirportPlane(330,-78,0);

// One decorative aircraft taxis to the runway, accelerates and takes off.
// It only starts moving after Airport Island unlocks.
const takeoffPlane=createAirportPlane(316,-52,-Math.PI/2);
airportDecorPlanes.push({
  obj:takeoffPlane,
  route:[
    [316,-52,1.2],
    [352,-52,1.2],
    [352,-120,1.2],
    [384,-120,1.2],
    [384,-155,1.2],
    [384,50,1.2],
    [384,92,7],
    [384,135,21]
  ],
  index:0,
  speed:18,
  wait:2.5
});

function updateDecorativeAirportPlanes(dt){
  airportDecorPlanes.forEach(p=>{
    if(!airportUnlocked) return;
    if(p.wait>0){ p.wait-=dt; return; }

    const a=p.route[p.index];
    const b=p.route[(p.index+1)%p.route.length];
    const dx=b[0]-p.obj.position.x;
    const dy=b[2]-p.obj.position.y;
    const dz=b[1]-p.obj.position.z;
    const dist=Math.hypot(dx,dy,dz);

    if(dist<0.8){
      p.index++;
      if(p.index>=p.route.length-1){
        p.index=0;
        p.obj.position.set(p.route[0][0],p.route[0][2],p.route[0][1]);
        p.wait=5;
        return;
      }
    }else{
      const step=Math.min(dist,p.speed*dt);
      p.obj.position.x+=dx/dist*step;
      p.obj.position.y+=dy/dist*step;
      p.obj.position.z+=dz/dist*step;
      p.obj.rotation.y=Math.atan2(dx,dz);
    }
  });
}

// Terminal/service road is kept away from the player build zone.
road(250,-38,405,-38,10);
road(405,-38,405,48,10);

// Dedicated open build zone on the LEFT side of Airport Island.
// This stays clear of planes, taxiways and runway activity.
const airportBuildZone=new THREE.Group();
const buildZoneBase=new THREE.Mesh(
  new THREE.BoxGeometry(82,.24,72),
  new THREE.MeshStandardMaterial({color:0x8d9394,roughness:.98})
);
buildZoneBase.position.set(183,.24,42);
buildZoneBase.receiveShadow=true;
airportBuildZone.add(buildZoneBase);

const buildZoneLineMat=new THREE.MeshStandardMaterial({color:0xc7ccca,roughness:.9});
for(let gx=-30;gx<=30;gx+=15){
  const line=new THREE.Mesh(new THREE.BoxGeometry(.28,.08,68),buildZoneLineMat);
  line.position.set(183+gx,.42,42);
  airportBuildZone.add(line);
}
for(let gz=-24;gz<=24;gz+=12){
  const line=new THREE.Mesh(new THREE.BoxGeometry(78,.08,.28),buildZoneLineMat);
  line.position.set(183,.42,42+gz);
  airportBuildZone.add(line);
}
const buildZoneLabel=spriteLabel('PLAYER BUILD ZONE','#52636b');
buildZoneLabel.position.set(183,8.5,42);
buildZoneLabel.scale.multiplyScalar(.7);
airportBuildZone.add(buildZoneLabel);
scene.add(airportBuildZone);

const transitStation=createTransitStation(72,-322);
setTransitStationLockedAppearance(transitStation,true);

const airportRevenueBubble=createRevenueBubble('AIRPORT ISLAND',10000,258,56,-24);
drawRevenueBubble(airportRevenueBubble,revenue);

const transitRevenueBubble=createRevenueBubble('TRANSIT DISTRICT',25000,72,62,-322);
drawRevenueBubble(transitRevenueBubble,revenue);

const cruiseResort=createCruiseResort(-380,-40);
setCruiseLockedAppearance(cruiseResort,true);

const cruiseRevenueBubble=createRevenueBubble('CRUISE ISLAND',50000,-405,82,-55);
drawRevenueBubble(cruiseRevenueBubble,revenue);

// Major expansion landscaping: a formal arrival park and future-development pads.
const transitDistrictGroup=new THREE.Group();
const transitParkMat=new THREE.MeshStandardMaterial({color:0x6cab62,roughness:1});
const transitStoneMat=new THREE.MeshStandardMaterial({color:0xd9d4c9,roughness:.9});
const transitLockedPadMat=new THREE.MeshStandardMaterial({color:0x858a8d,roughness:.95});

const transitPark=new THREE.Mesh(new THREE.CylinderGeometry(27,28,.6,40),transitParkMat);
transitPark.position.set(-16,.38,-324);
transitPark.receiveShadow=true;
transitDistrictGroup.add(transitPark);

const transitParkRing=new THREE.Mesh(new THREE.RingGeometry(29,34,40),transitStoneMat);
transitParkRing.rotation.x=-Math.PI/2;
transitParkRing.position.set(-16,.72,-324);
transitDistrictGroup.add(transitParkRing);

for(const [tx,tz] of [[-34,-324],[-25,-307],[-7,-307],[2,-324],[-7,-341],[-25,-341]]){
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.34,.46,3.2,8),new THREE.MeshStandardMaterial({color:0x75513a,roughness:1}));
  trunk.position.set(tx,1.7,tz);
  transitDistrictGroup.add(trunk);
  const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(2.4,1),new THREE.MeshStandardMaterial({color:0x4b9651,roughness:1}));
  crown.position.set(tx,5,tz);
  crown.castShadow=true;
  transitDistrictGroup.add(crown);
}

// Grey development pads make it obvious this $25k district has room for future towers and businesses.
for(const [px,pz,sx,sz] of [
  [-52,-252,48,34],
  [160,-252,54,34],
  [-48,-386,52,28],
  [162,-386,58,28]
]){
  const pad=new THREE.Mesh(new THREE.BoxGeometry(sx,.32,sz),transitLockedPadMat);
  pad.position.set(px,.28,pz);
  pad.receiveShadow=true;
  transitDistrictGroup.add(pad);
}
scene.add(transitDistrictGroup);
transitPark.material.color.setHex(0x777d79);

// DESTINATION PARKING
// Every building gets a real parking lot. Cars remain visible when parked,
// leave a lot, drive the road network to another building, then pull into
// an available parking space instead of disappearing.
const parkingLots=[];
const parkingAsphalt=new THREE.MeshStandardMaterial({color:0x343b40,roughness:.96});
const parkingStripeMat=new THREE.MeshStandardMaterial({color:0xf2f0e8,roughness:.8});
const parkingCurbMat=new THREE.MeshStandardMaterial({color:0xc9c5bb,roughness:1});

function driveway(ax,az,bx,bz,width=3.4){
  const dx=bx-ax,dz=bz-az,len=Math.hypot(dx,dz),angle=Math.atan2(dz,dx);
  const m=new THREE.Mesh(new THREE.BoxGeometry(len,.16,width),parkingAsphalt);
  m.position.set((ax+bx)/2,.25,(az+bz)/2);
  m.rotation.y=-angle;
  m.receiveShadow=true;
  scene.add(m);
  return m;
}

function createParkingLot({name,x,z,entryX,entryZ,spaces=4,airport=false}){
  const g=new THREE.Group();
  g.position.set(x,.22,z);

  const width=Math.max(17,spaces*4.4+2.2);
  const depth=8.2;
  const base=new THREE.Mesh(new THREE.BoxGeometry(width,.24,depth),parkingAsphalt);
  base.receiveShadow=true;
  g.add(base);

  // curb
  for(const zz of [-depth/2,depth/2]){
    const curb=new THREE.Mesh(new THREE.BoxGeometry(width+.8,.28,.42),parkingCurbMat);
    curb.position.set(0,.2,zz);
    g.add(curb);
  }
  for(const xx of [-width/2,width/2]){
    const curb=new THREE.Mesh(new THREE.BoxGeometry(.42,.28,depth+.8),parkingCurbMat);
    curb.position.set(xx,.2,0);
    g.add(curb);
  }

  const spotPositions=[];
  const spacing=width/spaces;
  for(let i=0;i<spaces;i++){
    const sx=-width/2+spacing*(i+.5);
    spotPositions.push([x+sx,z]);
    if(i>0){
      const line=new THREE.Mesh(new THREE.BoxGeometry(.18,.08,depth-1.0),parkingStripeMat);
      line.position.set(-width/2+spacing*i,.2,0);
      g.add(line);
    }
  }

  // small P sign
  const signPole=new THREE.Mesh(new THREE.CylinderGeometry(.11,.14,2.6,8),new THREE.MeshStandardMaterial({color:0x454b50,roughness:.8}));
  signPole.position.set(-width/2+1.2,1.5,-depth/2+.7);
  g.add(signPole);
  const sign=spriteLabel('P','#184f78');
  sign.scale.multiplyScalar(.23);
  sign.position.set(-width/2+1.2,3.2,-depth/2+.7);
  g.add(sign);

  scene.add(g);
  driveway(x,z,entryX,entryZ,3.2);

  const lot={
    name,
    group:g,
    entry:[entryX,entryZ],
    spots:spotPositions.map((p,i)=>({position:p,index:i,occupied:false,reserved:false})),
    airport
  };
  parkingLots.push(lot);
  return lot;
}

// Parking is deliberately placed on the road-facing side of each building.
const parkingByName={
  'Marketing Studio':createParkingLot({name:'Marketing Studio',x:-105,z:-62,entryX:-105,entryZ:-72,spaces:4}),
  'Accounting Hub':createParkingLot({name:'Accounting Hub',x:-61,z:-62,entryX:-61,entryZ:-72,spaces:4}),
  'BW Headquarters':createParkingLot({name:'BW Headquarters',x:-4,z:-80,entryX:-4,entryZ:-72,spaces:5}),
  'Think Hub':createParkingLot({name:'Think Hub',x:58,z:-64,entryX:58,entryZ:-72,spaces:5}),
  'Apartments':createParkingLot({name:'Apartments',x:-104,z:34,entryX:-104,entryZ:25,spaces:4}),
  'Cafe':createParkingLot({name:'Cafe',x:-61,z:34,entryX:-61,entryZ:25,spaces:4}),
  'Market':createParkingLot({name:'Market',x:0,z:34,entryX:0,entryZ:25,spaces:4}),
  'School':createParkingLot({name:'School',x:108,z:35,entryX:108,entryZ:25,spaces:5}),
  'Airport':createParkingLot({name:'Airport',x:344,z:55,entryX:405,entryZ:48,spaces:10,airport:true})
};

destinations.forEach(b=>{
  const lot=parkingByName[b.userData.name];
  if(lot) b.userData.parkingLot=lot;
});
airportBuilding.userData.parkingLot=parkingByName['Airport'];

function tree(x,z,scale=1){
  const g=new THREE.Group(); g.position.set(x,0,z);
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.4,.6,4.2,8),new THREE.MeshStandardMaterial({color:0x7a5132}));
  trunk.position.y=2.1; g.add(trunk);
  const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(3.2*scale,1),new THREE.MeshStandardMaterial({color:0x46994e,roughness:1}));
  crown.position.y=6; crown.castShadow=true; g.add(crown);
  scene.add(g);
}
for(let x=-128;x<=125;x+=19){
  for(let z=-110;z<=116;z+=20){
    if(Math.abs(x)<30&&Math.abs(z)<34) continue;
    if(Math.random()<.3) tree(x+(Math.random()*7-3.5),z+(Math.random()*7-3.5),.8+Math.random()*.35);
  }
}

createLotBase(0,0,6,6);
const plaza=new THREE.Mesh(new THREE.CylinderGeometry(31,33,1,48),new THREE.MeshStandardMaterial({color:0xd8d0bf,roughness:1}));
plaza.position.y=.5; scene.add(plaza);
const park=new THREE.Mesh(new THREE.CylinderGeometry(22,23,.45,48),new THREE.MeshStandardMaterial({color:0x79bd62,roughness:1}));
park.position.y=1.05; scene.add(park);

const boardCanvas=document.createElement('canvas'); boardCanvas.width=1024; boardCanvas.height=520;
const bctx=boardCanvas.getContext('2d');
const boardTex=new THREE.CanvasTexture(boardCanvas); boardTex.colorSpace=THREE.SRGBColorSpace;
function drawBoard(){
  bctx.fillStyle='#f8fbff'; bctx.fillRect(0,0,1024,520);
  bctx.strokeStyle='#0f4c72'; bctx.lineWidth=14; bctx.strokeRect(14,14,996,492);
  bctx.fillStyle='#123c5a'; bctx.font='900 66px system-ui'; bctx.fillText('BUSINESS GROWTH',48,94);
  bctx.font='800 42px system-ui';
  bctx.fillText('REVENUE',55,205); bctx.fillText('PROFIT',55,295); bctx.fillText('NEXT ISLAND',55,385);
  bctx.textAlign='right'; bctx.fillStyle='#0b9c61'; bctx.font='900 58px system-ui';
  bctx.fillText('$'+Math.floor(revenue).toLocaleString(),955,208);
  bctx.fillText('$'+Math.floor(profit).toLocaleString(),955,298);
  bctx.fillStyle=airportUnlocked?'#0b9c61':'#d08a12';
  bctx.fillText(airportUnlocked?'UNLOCKED':'$10,000',955,388);
  bctx.textAlign='left'; bctx.fillStyle='#4c6d80'; bctx.font='700 26px system-ui'; bctx.fillText('Business World · live city metrics',55,470);
  boardTex.needsUpdate=true;
}
drawBoard();

const monument=new THREE.Group();
const pole=new THREE.Mesh(new THREE.CylinderGeometry(1.6,2,22,16),new THREE.MeshStandardMaterial({color:0x858b8f,metalness:.2,roughness:.55}));
pole.position.y=12; monument.add(pole);
const frame=new THREE.Mesh(new THREE.BoxGeometry(38,20,1.5),new THREE.MeshStandardMaterial({color:0x14202a,roughness:.55}));
frame.position.y=30; monument.add(frame);
const screen=new THREE.Mesh(new THREE.PlaneGeometry(35.8,17.8),new THREE.MeshBasicMaterial({map:boardTex}));
screen.position.set(0,30,.8); monument.add(screen);
monument.userData={name:'Business Growth Monument',description:'The center of Business World. Live city revenue and profit are displayed here.'};
scene.add(monument); clickable.push(monument);

function worker(name,color,x,z){
  const g=new THREE.Group();
  const body=new THREE.Mesh(new THREE.CylinderGeometry(.65,.78,2.5,10),new THREE.MeshStandardMaterial({color}));
  body.position.y=1.55; g.add(body);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.65,12,8),new THREE.MeshStandardMaterial({color:0xf0c4a0}));
  head.position.y=3.25; g.add(head);
  const tag=spriteLabel(name,'#111a24'); tag.scale.multiplyScalar(.58); tag.position.y=6; g.add(tag);
  g.position.set(x,.2,z); scene.add(g);
  return g;
}

const agentRoutes = {
  Reynaldo:[[-98,52],[-86,25],[-36,25],[0,15],[35,25],[86,25],[78,57],[35,76],[0,25]],
  Moshe:[[-104,50],[-86,25],[-86,-26],[-61,-48],[-36,-26],[0,14]],
  Victor:[[-95,46],[-86,25],[-86,-26],[-105,-48],[-36,-26],[0,12]]
};
[
  ['Reynaldo',0x2e73d4,-98,52,4.2],
  ['Moshe',0x8b52bd,-104,50,3.8],
  ['Victor',0xd17833,-95,46,4.0]
].forEach(([name,color,x,z,speed],idx)=>{
  workers.push({name,obj:worker(name,color,x,z),route:agentRoutes[name],t:idx*1.4,speed});
});

function moveRoute(item,dt){
  item.t += dt*item.speed/27;
  const r=item.route, i=Math.floor(item.t)%r.length, j=(i+1)%r.length, f=item.t-Math.floor(item.t);
  const a=r[i], b=r[j];
  item.obj.position.x=THREE.MathUtils.lerp(a[0],b[0],f);
  item.obj.position.z=THREE.MathUtils.lerp(a[1],b[1],f);
  item.obj.rotation.y=Math.atan2(b[0]-a[0],b[1]-a[1]);
}

function car(color){
  const g=new THREE.Group();
  const body=new THREE.Mesh(new THREE.BoxGeometry(4.2,1.25,2.2),new THREE.MeshStandardMaterial({color,metalness:.12,roughness:.5}));
  body.position.y=.8;
  body.castShadow=true;
  g.add(body);
  const roof=new THREE.Mesh(new THREE.BoxGeometry(2.3,.85,1.75),new THREE.MeshStandardMaterial({color:0xb8d9e7,roughness:.3}));
  roof.position.y=1.65;
  g.add(roof);
  scene.add(g);
  return g;
}

const mainRoadX=[-86,-36,35,86];
const mainRoadZ=[-72,-26,25,76];

function nearestRoadNode([x,z]){
  let best=[mainRoadX[0],mainRoadZ[0]],bestD=Infinity;
  for(const rx of mainRoadX){
    for(const rz of mainRoadZ){
      const d=(rx-x)*(rx-x)+(rz-z)*(rz-z);
      if(d<bestD){bestD=d;best=[rx,rz]}
    }
  }
  return best;
}

function mainRoadPath(startEntry,endEntry){
  const s=nearestRoadNode(startEntry);
  const e=nearestRoadNode(endEntry);
  const path=[startEntry,s];
  if(s[0]!==e[0]) path.push([e[0],s[1]]);
  if(s[1]!==e[1]) path.push([e[0],e[1]]);
  path.push(endEntry);
  return path;
}

function routeBetweenLots(startLot,endLot,startSpot,endSpot){
  const start=[startSpot.position[0],startSpot.position[1]];
  const finish=[endSpot.position[0],endSpot.position[1]];
  const startAirport=startLot.airport;
  const endAirport=endLot.airport;

  if(!startAirport && !endAirport){
    return [start,...mainRoadPath(startLot.entry,endLot.entry),finish];
  }

  const bridgeMain=[86,-72];
  const bridgeChain=[[108,-72],[164,-58],[226,-58]];

  if(!startAirport && endAirport){
    const path=[start,...mainRoadPath(startLot.entry,bridgeMain),...bridgeChain,endLot.entry,finish];
    return path;
  }

  if(startAirport && !endAirport){
    const reverseBridge=[...bridgeChain].reverse();
    return [start,startLot.entry,...reverseBridge,bridgeMain,...mainRoadPath(bridgeMain,endLot.entry),finish];
  }

  return [start,startLot.entry,endLot.entry,finish];
}

function freeSpot(lot){
  return lot.spots.find(s=>!s.occupied&&!s.reserved) || null;
}

function availableDestination(currentLot){
  const options=parkingLots.filter(lot=>{
    if(lot===currentLot) return false;
    if(lot.airport && !airportUnlocked) return false;
    return !!freeSpot(lot);
  });
  if(!options.length) return null;
  return options[Math.floor(Math.random()*options.length)];
}

function beginTrip(vehicle){
  const destination=availableDestination(vehicle.currentLot);
  if(!destination){
    vehicle.wait=2;
    return;
  }
  const targetSpot=freeSpot(destination);
  if(!targetSpot){
    vehicle.wait=2;
    return;
  }

  // Reserve destination before leaving so two cars never choose the same space.
  targetSpot.reserved=true;
  vehicle.currentSpot.occupied=false;
  vehicle.destination=destination;
  vehicle.targetSpot=targetSpot;
  vehicle.path=routeBetweenLots(vehicle.currentLot,destination,vehicle.currentSpot,targetSpot);
  vehicle.pathIndex=0;
  vehicle.state='driving';
}

function updateDestinationCar(vehicle,dt){
  if(vehicle.state==='parked'){
    vehicle.wait-=dt;
    if(vehicle.wait<=0) beginTrip(vehicle);
    return;
  }

  if(vehicle.state!=='driving' || vehicle.path.length<2) return;

  let remaining=vehicle.speed*dt;
  while(remaining>0 && vehicle.pathIndex<vehicle.path.length-1){
    const a=vehicle.path[vehicle.pathIndex];
    const b=vehicle.path[vehicle.pathIndex+1];
    const px=vehicle.obj.position.x,pz=vehicle.obj.position.z;
    const dx=b[0]-px,dz=b[1]-pz;
    const dist=Math.hypot(dx,dz);

    if(dist<=remaining+.001){
      vehicle.obj.position.set(b[0],.35,b[1]);
      vehicle.pathIndex++;
      remaining-=dist;
    }else{
      const ux=dx/dist,uz=dz/dist;
      vehicle.obj.position.x+=ux*remaining;
      vehicle.obj.position.z+=uz*remaining;
      vehicle.obj.rotation.y=Math.atan2(ux,uz);
      remaining=0;
    }
  }

  if(vehicle.pathIndex>=vehicle.path.length-1){
    vehicle.obj.position.set(vehicle.targetSpot.position[0],.35,vehicle.targetSpot.position[1]);
    vehicle.currentLot=vehicle.destination;
    vehicle.currentSpot=vehicle.targetSpot;
    vehicle.currentSpot.reserved=false;
    vehicle.currentSpot.occupied=true;
    vehicle.destination=null;
    vehicle.targetSpot=null;
    vehicle.path=[];
    vehicle.state='parked';
    vehicle.wait=3+Math.random()*7;
  }
}

const startingLots=parkingLots.filter(l=>!l.airport);
const carColors=[0xe45a45,0x3486d9,0xe0b638,0xf4f4f4,0x555b67,0x47a36f,0x9458a9,0xe67b35];

for(let i=0;i<Math.min(12,startingLots.length*2);i++){
  const lot=startingLots[i%startingLots.length];
  const spot=freeSpot(lot);
  if(!spot) continue;
  spot.occupied=true;
  const obj=car(carColors[i%carColors.length]);
  obj.position.set(spot.position[0],.35,spot.position[1]);
  obj.rotation.y=Math.PI/2;
  cars.push({
    obj,
    currentLot:lot,
    currentSpot:spot,
    destination:null,
    targetSpot:null,
    path:[],
    pathIndex:0,
    state:'parked',
    wait:1.5+Math.random()*8,
    speed:13+Math.random()*3
  });
}

function unlockAirport(){
  if(airportUnlocked) return;
  airportUnlocked=true;
  airportIsland.setTopMaterial(mats.grass2);
  airportRevenueBubble.sprite.visible=false;
  bridge.visible=true;
  bridge.scale.x=.02;
  islandStatus.textContent='Next expansion: Train District · $25,000 revenue';
  islandStatus.classList.remove('unlocked');
  airportBuilding.userData.description='Airport expansion unlocked. This island can now support logistics, travel and future buildings.';
  airportBuilding.traverse(o=>{
    if(o.material && o.material.color && o!==airportBuilding){
      o.material.color.offsetHSL(0,0,.14);
    }
  });
}


function unlockTransitDistrict(){
  if(transitUnlocked) return;
  transitUnlocked=true;
  transitIsland.setTopMaterial(mats.grass2);
  transitRevenueBubble.sprite.visible=false;
  setTransitStationLockedAppearance(transitStation,false);
  transitPark.material.color.setHex(0x6cab62);
  transitLockedPadMat.color.setHex(0x98c879);
  transitStation.userData.description='Underground Central Station is open. Trains now enter and exit through the underground tunnels automatically.';
  transitStation.userData.train.visible=true;
  unlockTransitBridges();
  islandStatus.textContent='Next expansion: Cruise Island · $50,000 revenue';
  islandStatus.classList.remove('unlocked');
}

function unlockCruiseIsland(){
  if(cruiseUnlocked) return;
  cruiseUnlocked=true;
  cruiseIsland.setTopMaterial(mats.sand);
  cruiseRevenueBubble.sprite.visible=false;
  setCruiseLockedAppearance(cruiseResort,false);
  cruiseAccessBridge.visible=true;
  cruiseAccessBridge.scale.x=.02;
  cruiseResort.userData.description='Cruise Island Resort is open: beaches, hotels, marina, cruise terminal and the Business World flagship cruise liner.';
  islandStatus.textContent='Cruise Island unlocked ✓';
  islandStatus.classList.add('unlocked');
}

let revenueBubbleTimer=0;
function updateMetrics(dt){
  revenue += dt*19;
  profit += dt*7.2;
  revenueBubbleTimer+=dt;
  if(revenueBubbleTimer>=.2){
    revenueBubbleTimer=0;
    if(!airportUnlocked) drawRevenueBubble(airportRevenueBubble,revenue);
    if(!transitUnlocked) drawRevenueBubble(transitRevenueBubble,revenue);
    if(!cruiseUnlocked) drawRevenueBubble(cruiseRevenueBubble,revenue);
  }
  const growth=((revenue-startRevenue)/startRevenue)*100;
  revenueEl.textContent='$'+Math.floor(revenue).toLocaleString();
  profitEl.textContent='$'+Math.floor(profit).toLocaleString();
  growthEl.textContent='+'+growth.toFixed(1)+'%';
  if(revenue>=10000) unlockAirport();
  if(revenue>=25000) unlockTransitDistrict();
  if(revenue>=50000) unlockCruiseIsland();
  if(airportUnlocked && bridge.scale.x<1) bridge.scale.x=Math.min(1,bridge.scale.x+dt*.75);
  if(cruiseUnlocked && cruiseAccessBridge.scale.x<1) cruiseAccessBridge.scale.x=Math.min(1,cruiseAccessBridge.scale.x+dt*.75);
}

function updateLighting(t){
  let phase=timeMode;
  if(phase==='AUTO'){
    const c=(t*.015)%4;
    phase=c<1.5?'DAY':c<2.3?'DUSK':c<3.2?'NIGHT':'DUSK';
  }
  if(phase==='DAY'){scene.background.setHex(0x92d9ef);hemi.intensity=2.25;sun.intensity=3.1;renderer.toneMappingExposure=1.05}
  else if(phase==='DUSK'){scene.background.setHex(0x829eb9);hemi.intensity=1.35;sun.intensity=1.7;renderer.toneMappingExposure=.88}
  else {scene.background.setHex(0x1b2e4a);hemi.intensity=.55;sun.intensity=.65;renderer.toneMappingExposure=.68}
}

const rainCount=550;
const rainArr=new Float32Array(rainCount*3);
for(let i=0;i<rainCount;i++){rainArr[i*3]=(Math.random()-.5)*360;rainArr[i*3+1]=Math.random()*100+10;rainArr[i*3+2]=(Math.random()-.5)*320}
const rainGeo=new THREE.BufferGeometry(); rainGeo.setAttribute('position',new THREE.BufferAttribute(rainArr,3));
const rainMat=new THREE.PointsMaterial({color:0xccefff,size:.55,transparent:true,opacity:0});
const rain=new THREE.Points(rainGeo,rainMat); scene.add(rain);
function updateWeather(dt){
  rainMat.opacity=weatherMode==='RAIN'?.65:0;
  if(weatherMode==='RAIN'){
    const p=rainGeo.attributes.position.array;
    for(let i=0;i<rainCount;i++){p[i*3+1]-=dt*38;if(p[i*3+1]<-5)p[i*3+1]=110}
    rainGeo.attributes.position.needsUpdate=true;
  }
}

const raycaster=new THREE.Raycaster();
const pointer=new THREE.Vector2();
let pointerDown={x:0,y:0};
renderer.domElement.addEventListener('pointerdown',e=>pointerDown={x:e.clientX,y:e.clientY});
renderer.domElement.addEventListener('pointerup',e=>{
  if(Math.hypot(e.clientX-pointerDown.x,e.clientY-pointerDown.y)>8) return;
  const r=renderer.domElement.getBoundingClientRect();
  pointer.x=((e.clientX-r.left)/r.width)*2-1;
  pointer.y=-((e.clientY-r.top)/r.height)*2+1;
  raycaster.setFromCamera(pointer,camera);
  const hit=raycaster.intersectObjects(clickable,true)[0];
  if(!hit) return;
  let obj=hit.object;
  while(obj.parent && !obj.userData?.name) obj=obj.parent;
  if(obj.userData?.name){
    infoTitle.textContent=obj.userData.name;
    infoText.textContent=obj.userData.description || 'Business World location.';
    infoCard.classList.add('show');
  }
});
document.getElementById('closeInfo').onclick=()=>infoCard.classList.remove('show');

function cameraTween(position,target){
  const a=camera.position.clone(), b=controls.target.clone(), start=performance.now(), duration=650;
  function frame(now){
    const k=Math.min(1,(now-start)/duration), e=1-Math.pow(1-k,3);
    camera.position.lerpVectors(a,position,e);
    controls.target.lerpVectors(b,target,e);
    if(k<1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
document.getElementById('homeBtn').onclick=()=>cameraTween(new THREE.Vector3(170,145,205),new THREE.Vector3(0,5,0));
document.getElementById('rotateLeftBtn').onclick=()=>{
  const v=camera.position.clone().sub(controls.target).applyAxisAngle(new THREE.Vector3(0,1,0),Math.PI/6);
  camera.position.copy(controls.target).add(v);
};
document.getElementById('rotateRightBtn').onclick=()=>{
  const v=camera.position.clone().sub(controls.target).applyAxisAngle(new THREE.Vector3(0,1,0),-Math.PI/6);
  camera.position.copy(controls.target).add(v);
};
document.getElementById('weatherBtn').onclick=e=>{
  weatherMode=weatherMode==='CLEAR'?'RAIN':'CLEAR';
  e.currentTarget.textContent=weatherMode==='CLEAR'?'☀ Clear':'☂ Rain';
};
document.getElementById('timeBtn').onclick=e=>{
  const modes=['AUTO','DAY','DUSK','NIGHT'];
  timeMode=modes[(modes.indexOf(timeMode)+1)%modes.length];
  e.currentTarget.textContent='◐ '+(timeMode[0]+timeMode.slice(1).toLowerCase());
};

const clock=new THREE.Clock();
let boardTick=0;
function animate(){
  const dt=Math.min(.035,clock.getDelta());
  const t=clock.elapsedTime;
  controls.update();
  // Keep free panning usable without letting the camera get permanently lost.
  controls.target.x = THREE.MathUtils.clamp(controls.target.x,-710,430);
  controls.target.z = THREE.MathUtils.clamp(controls.target.z,-490,260);
  controls.target.y = THREE.MathUtils.clamp(controls.target.y,0,45);
  workers.forEach(w=>moveRoute(w,dt));
  cars.forEach(c=>updateDestinationCar(c,dt));
  updateDecorativeAirportPlanes(dt);
  updateTransitTrain(dt);
  updateTransitBridgeBuild(dt);
  updateMetrics(dt);
  updateLighting(t);
  updateWeather(dt);
  updateOcean(t);
  updateRevenueBubbleMotion(t);
  boardTick+=dt;
  if(boardTick>.8){boardTick=0;drawBoard()}
  renderer.render(scene,camera);
  requestAnimationFrame(animate);
}

addEventListener('resize',()=>{
  camera.aspect=innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight,false);
});

loading.style.display='none';
animate();