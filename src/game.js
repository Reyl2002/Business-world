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
scene.background = new THREE.Color(0x78cae6);
scene.fog = new THREE.FogExp2(0x8ed4e9, 0.0018);

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

const oceanMat = new THREE.MeshPhysicalMaterial({
  color:0x1598bc, roughness:.2, transparent:true, opacity:.9, clearcoat:.25
});
const ocean = new THREE.Mesh(new THREE.PlaneGeometry(1100, 900), oceanMat);
ocean.rotation.x = -Math.PI/2;
ocean.position.y = -14;
scene.add(ocean);

const mats = {
  grass:new THREE.MeshStandardMaterial({color:0x73b959, roughness:.95}),
  grass2:new THREE.MeshStandardMaterial({color:0x80c866, roughness:.95}),
  cliff:new THREE.MeshStandardMaterial({color:0x75685d, roughness:1}),
  road:new THREE.MeshStandardMaterial({color:0x40484f, roughness:.95}),
  sidewalk:new THREE.MeshStandardMaterial({color:0xd5d1c6, roughness:.95}),
  yellow:new THREE.MeshStandardMaterial({color:0xf1ca4d, roughness:.75}),
  white:new THREE.MeshStandardMaterial({color:0xf7f6ef, roughness:.8}),
  locked:new THREE.MeshStandardMaterial({color:0x80858a, roughness:1})
};

const clickable = [];
const workers = [];
const cars = [];
let revenue = 7500;
let profit = 2650;
let startRevenue = revenue;
let airportUnlocked = false;
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
const airportPoints = [[154,-98],[186,-112],[226,-106],[263,-84],[278,-48],[273,-10],[248,20],[209,31],[174,23],[148,2],[139,-41]];

island(mainPoints, mats.grass, 17);
const airportIsland = island(airportPoints, mats.locked, 18);
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
road(164,-58,226,-58,11);
road(190,-94,190,-10,11);

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

function building({name,x,z,w=22,d=18,h=22,color=0x7fadd3,accent=0x315c7b,description='',footprint=3,footprintZ=footprint}) {
  createLotBase(x,z,footprint,footprintZ);
  const g=new THREE.Group();
  g.position.set(x,.25,z);
  g.userData={name,description,gridLot:true,footprint,footprintZ};

  const pad=new THREE.Mesh(new THREE.BoxGeometry(w+3,.55,d+3),mats.sidewalk);
  pad.position.y=.3; g.add(pad);

  const body=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color,roughness:.72}));
  body.position.y=h/2+.6; body.castShadow=true; body.receiveShadow=true; g.add(body);

  const roof=new THREE.Mesh(new THREE.BoxGeometry(w+1,.9,d+1),new THREE.MeshStandardMaterial({color:accent,roughness:.7}));
  roof.position.y=h+1; g.add(roof);

  const windows=new THREE.MeshStandardMaterial({color:0x8edcf4,emissive:0x1e5b76,emissiveIntensity:.45,roughness:.3});
  const cols=Math.max(3,Math.floor(w/5));
  const rows=Math.max(3,Math.floor(h/5));
  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      const wx=-w/2+2+(c*(w-4)/(cols-1));
      const wy=3+r*((h-5)/Math.max(1,rows-1));
      const win=new THREE.Mesh(new THREE.BoxGeometry(1.6,1.5,.13),windows);
      win.position.set(wx,wy,d/2+.08); g.add(win);
    }
  }

  const sign=spriteLabel(name);
  sign.position.set(0,h*.7,d/2+.8);
  sign.scale.multiplyScalar(Math.min(1.15,Math.max(.72,w/24)));
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

const destinations = [
  building({name:'Marketing Studio',footprint:3,x:-105,z:-48,w:25,d:20,h:24,color:0xdb7168,accent:0x813856,description:'Marketing content, social campaigns and brand growth.'}),
  building({name:'Accounting Hub',footprint:3,x:-61,z:-48,w:24,d:20,h:28,color:0x609ed5,accent:0x2d5d93,description:'Invoices, bookkeeping, revenue, profit and forecasting.'}),
  building({name:'BW Headquarters',footprint:4,x:-4,z:-96,w:28,d:24,h:43,color:0x4f91cb,accent:0x2f5878,description:'Central headquarters for Business World operations.'}),
  createThinkHub(58,-48),
  building({name:'Apartments',footprint:3,x:-104,z:51,w:24,d:21,h:30,color:0xdf9974,accent:0x865a47,description:'Home base for workers and residents.'}),
  building({name:'Cafe',footprint:2,x:-61,z:51,w:25,d:21,h:15,color:0xd99661,accent:0x764b39,description:'Social space where agents can idle, meet and recharge.'}),
  building({name:'Market',footprint:2,x:0,z:51,w:25,d:21,h:16,color:0xe5ad65,accent:0x287b5f,description:'Supplies and local commerce.'}),
  building({name:'School',footprint:3,x:108,z:53,w:28,d:22,h:20,color:0xd98262,accent:0xa64f3b,description:'Community learning and worker development.'}),
];

const airportBuilding = building({name:'Airport',footprint:4,x:245,z:-27,w:26,d:19,h:14,color:0x93999d,accent:0x62676b,description:'Locked expansion island. Unlocks when total revenue reaches $10,000.'});
airportBuilding.traverse(o=>{ if(o.material && o.material.color) o.material.color.multiplyScalar(.72); });

const runway=new THREE.Mesh(new THREE.BoxGeometry(76,.45,17),mats.road);
runway.position.set(222,.3,-58);
scene.add(runway);
for(let x=190;x<258;x+=13){
  const stripe=new THREE.Mesh(new THREE.BoxGeometry(7,.1,1),mats.white);
  stripe.position.set(x,.6,-58); scene.add(stripe);
}

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
  'Airport':createParkingLot({name:'Airport',x:245,z:-43,entryX:226,entryZ:-58,spaces:6,airport:true})
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
  bridge.visible=true;
  bridge.scale.x=.02;
  islandStatus.textContent='Airport Island unlocked ✓';
  islandStatus.classList.add('unlocked');
  airportBuilding.userData.description='Airport expansion unlocked. This island can now support logistics, travel and future buildings.';
  airportBuilding.traverse(o=>{
    if(o.material && o.material.color && o!==airportBuilding){
      o.material.color.offsetHSL(0,0,.14);
    }
  });
}

function updateMetrics(dt){
  revenue += dt*19;
  profit += dt*7.2;
  const growth=((revenue-startRevenue)/startRevenue)*100;
  revenueEl.textContent='$'+Math.floor(revenue).toLocaleString();
  profitEl.textContent='$'+Math.floor(profit).toLocaleString();
  growthEl.textContent='+'+growth.toFixed(1)+'%';
  if(revenue>=10000) unlockAirport();
  if(airportUnlocked && bridge.scale.x<1) bridge.scale.x=Math.min(1,bridge.scale.x+dt*.75);
}

function updateLighting(t){
  let phase=timeMode;
  if(phase==='AUTO'){
    const c=(t*.015)%4;
    phase=c<1.5?'DAY':c<2.3?'DUSK':c<3.2?'NIGHT':'DUSK';
  }
  if(phase==='DAY'){scene.background.setHex(0x78cae6);hemi.intensity=2.25;sun.intensity=3.1;renderer.toneMappingExposure=1.05}
  else if(phase==='DUSK'){scene.background.setHex(0x789ab8);hemi.intensity=1.35;sun.intensity=1.7;renderer.toneMappingExposure=.88}
  else {scene.background.setHex(0x14243d);hemi.intensity=.55;sun.intensity=.65;renderer.toneMappingExposure=.68}
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
  controls.target.x = THREE.MathUtils.clamp(controls.target.x,-185,300);
  controls.target.z = THREE.MathUtils.clamp(controls.target.z,-175,165);
  controls.target.y = THREE.MathUtils.clamp(controls.target.y,0,45);
  workers.forEach(w=>moveRoute(w,dt));
  cars.forEach(c=>updateDestinationCar(c,dt));
  updateMetrics(dt);
  updateLighting(t);
  updateWeather(dt);
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