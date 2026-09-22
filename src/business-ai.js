
const BW_STORAGE_KEY = "businessWorld.ai.v1";

const BW_DEPARTMENTS = [
  "Sales","Marketing","Accounting","Operations","Finance","Research","Customer","Production","Technology"
];

const BW_WORKER_DEFAULTS = {
  Reynaldo:{role:"Sales & Growth",department:"Sales",xp:0,level:1,understanding:8,patterns:[]},
  Moshe:{role:"Marketing & Research",department:"Marketing",xp:0,level:1,understanding:8,patterns:[]},
  Victor:{role:"Operations & Finance",department:"Operations",xp:0,level:1,understanding:8,patterns:[]}
};

const BW_BUILDINGS = {
  "BW Headquarters":{module:"HQ / AI Command Center",department:"Operations",unlock:0,why:"Company profile, Business IQ, goals, AI suggestions, learned patterns and team coordination."},
  "Marketing Studio":{module:"Marketing",department:"Marketing",unlock:0,why:"Creates campaigns, captions, content plans, promotions and learns the player's brand voice."},
  "Sales Office":{module:"Sales",department:"Sales",unlock:0,why:"Leads, quotes, follow-ups, deal stages, customer pricing and selling patterns."},
  "CRM Center":{module:"CRM / Customer Center",department:"Customer",unlock:6,why:"Keeps customer history, preferences, purchase patterns and follow-up opportunities together."},
  "Accounting Hub":{module:"Accounting",department:"Accounting",unlock:0,why:"Revenue, costs, margins, recurring expenses, bookkeeping patterns and business performance."},
  "Bank":{module:"Bank & Goals",department:"Finance",unlock:0,why:"Bills, cash flow, savings goals, free cash and progress toward personal or business targets."},
  "Invoice Center":{module:"Invoices",department:"Accounting",unlock:8,why:"Creates and tracks invoices, deposits, due balances and payment follow-ups."},
  "Warehouse":{module:"Inventory",department:"Production",unlock:10,why:"Tracks stock, materials, low-stock patterns and reorder needs adapted to the player's industry."},
  "Production Facility":{module:"Production",department:"Production",unlock:12,why:"Moves approved work through production, quality check and completion stages."},
  "Shipping & Logistics":{module:"Logistics",department:"Operations",unlock:14,why:"Tracks pickups, deliveries, freight, suppliers, shipment status and logistics costs."},
  "Marketplace":{module:"Marketplace / Store",department:"Sales",unlock:9,why:"Shows products or services, bundles and sales performance."},
  "E-Commerce Center":{module:"E-Commerce",department:"Sales",unlock:15,why:"Online orders, conversion, product performance and website sales tasks."},
  "Analytics Tower":{module:"Analytics",department:"Research",unlock:18,why:"Connects revenue, profit, sales, customers, inventory and productivity into business insights."},
  "HR Office":{module:"People / HR",department:"Operations",unlock:20,why:"Employees, contractors, roles, schedules, onboarding and commissions."},
  "Training Center":{module:"Business Academy",department:"Research",unlock:12,why:"Shows worker Knowledge XP, learning goals and department development."},
  "Research Lab":{module:"Research",department:"Research",unlock:10,why:"Market, competitor, pricing and opportunity research."},
  "Legal Office":{module:"Legal & Compliance",department:"Operations",unlock:22,why:"Contracts, licenses, warranties, registrations and document deadlines."},
  "Document Center":{module:"Documents",department:"Operations",unlock:8,why:"Organizes contracts, invoices, receipts, quotes, designs and company files."},
  "Operations Center":{module:"Operations",department:"Operations",unlock:0,why:"Tasks, deadlines, jobs, appointments and workflow coordination."},
  "Customer Support":{module:"Customer Support",department:"Customer",unlock:14,why:"Questions, complaints, returns, warranties and unresolved customer issues."},
  "Maintenance Garage":{module:"Maintenance",department:"Operations",unlock:18,why:"Equipment, repairs, service intervals and maintenance costs."},
  "Fleet Garage":{module:"Fleet",department:"Operations",unlock:20,why:"Business vehicles, mileage, charging or fuel, insurance and maintenance."},
  "Real Estate Office":{module:"Locations",department:"Finance",unlock:24,why:"Rent, leases, locations, utilities and expansion property costs."},
  "Tax Office":{module:"Tax Planning",department:"Accounting",unlock:18,why:"Tax reserves, deadlines, sales-tax awareness and deductible business expense organization."},
  "Finance & Lending":{module:"Finance / Lending",department:"Finance",unlock:22,why:"Loans, financing scenarios, equipment purchases and affordability planning."},
  "IT Center":{module:"IT",department:"Technology",unlock:16,why:"Domains, software subscriptions, accounts, integrations and technology tasks."},
  "Automation Lab":{module:"Automation",department:"Technology",unlock:30,why:"Creates rules that connect events across buildings and reduce repetitive work."},
  "Development Office":{module:"Development",department:"Research",unlock:26,why:"Expansion projects, new locations, equipment purchases, hiring plans and long-term initiatives."},
  "Think Hub":{module:"Think Tank",department:"Research",unlock:0,why:"Generates ideas, business strategies, experiments and improvement opportunities."},
  "Cafe":{module:"Social / Recharge",department:"Operations",unlock:0,why:"Agents meet, recharge and occasionally form spontaneous ideas."},
  "Restaurant":{module:"Food / Social",department:"Operations",unlock:10,why:"A social city building that can also represent food-service businesses."},
  "Apartments":{module:"Agent Homes",department:"Operations",unlock:0,why:"Workers return home and make the city day/night loop feel alive."},
  "Clinic":{module:"Wellness",department:"Operations",unlock:20,why:"Optional employee wellness and absence simulation."},
  "Business Growth Monument":{module:"Growth",department:"Finance",unlock:0,why:"Displays company progress, revenue, profit, Business IQ and major milestones."},
  "Airport":{module:"International Expansion",department:"Operations",unlock:25,why:"Represents international markets, suppliers, travel and larger opportunities."},
  "Boat Dock":{module:"Marina / Logistics",department:"Operations",unlock:8,why:"Waterfront activity, leisure boats and optional marine logistics."}
};

const BW_INDUSTRY_TEMPLATES = {
  "Apparel / Custom Decoration":{
    metrics:["Average order margin","Blank/material cost","Production turnaround","Repeat customer rate"],
    inventory:"garments, hats, thread, transfers and production supplies",
    suggestions:[
      "Track margin by decoration method so you can see which order types are actually most profitable.",
      "Watch repeat customers and suggest a follow-up when a business has not reordered on its normal cycle.",
      "Learn your normal garment markup and rush-order pricing before suggesting future quotes."
    ]
  },
  "Restaurant / Food Service":{
    metrics:["Food cost","Labor cost","Average ticket","Waste / spoilage"],
    inventory:"ingredients, packaging and spoilage-sensitive stock",
    suggestions:[
      "Track ingredient cost and spoilage so menu items can be compared by real margin.",
      "Learn your strongest days and times before suggesting promotions.",
      "Watch repeat customer and catering patterns separately from normal dine-in sales."
    ]
  },
  "Construction / Trades":{
    metrics:["Job margin","Material cost","Labor hours","Open estimates"],
    inventory:"materials, tools and job-site supplies",
    suggestions:[
      "Compare estimated job cost with final job cost so future quotes improve.",
      "Track deposits and outstanding balances separately from booked revenue.",
      "Learn which job types produce the strongest margin and shortest turnaround."
    ]
  },
  "Insurance / Financial Services":{
    metrics:["New leads","Conversion rate","Renewals","Policy mix"],
    inventory:"documents, lead records and compliance items",
    suggestions:[
      "Track lead source and conversion so the AI can learn where your best clients come from.",
      "Watch renewal dates and suggest outreach before clients lapse.",
      "Learn which products are usually cross-sold together."
    ]
  },
  "E-Commerce / Retail":{
    metrics:["Conversion rate","Average order value","Inventory turns","Return rate"],
    inventory:"sellable products, packaging and fulfillment stock",
    suggestions:[
      "Watch low-stock items against sales velocity instead of using a fixed reorder point.",
      "Compare products by margin, not only sales volume.",
      "Learn which promotions raise average order value without hurting margin."
    ]
  },
  "Professional Services":{
    metrics:["Lead conversion","Billable work","Project margin","Client retention"],
    inventory:"documents, time capacity and service deliverables",
    suggestions:[
      "Learn how you scope and price common services before preparing future quotes.",
      "Track client follow-up timing and unfinished proposals.",
      "Compare project revenue with time spent to identify the strongest services."
    ]
  },
  "Other":{
    metrics:["Revenue","Profit margin","Leads","Repeat customers"],
    inventory:"the materials, tools or capacity your business depends on",
    suggestions:[
      "I will learn which customers, products or services drive your strongest margin.",
      "I can watch for recurring expenses and repeated customer behavior as more data is added.",
      "Correct my suggestions when they are wrong; those corrections help me learn how you operate."
    ]
  }
};

function bwClone(v){return JSON.parse(JSON.stringify(v));}
function bwMoney(n){return "$"+Math.round(Number(n)||0).toLocaleString();}
function bwClamp(n,min,max){return Math.max(min,Math.min(max,n));}
function bwNow(){return new Date().toISOString();}
function bwUid(){return Math.random().toString(36).slice(2)+Date.now().toString(36);}

function bwDefaultState(){
  return {
    version:1,
    onboarded:false,
    profile:{
      businessName:"",
      primaryIndustry:"Other",
      secondaryCategories:"",
      offering:"Both",
      model:"B2B",
      customers:"",
      employees:"Just me",
      inventory:"No",
      acquisition:"",
      expenses:"",
      goal:""
    },
    businessIQ:5,
    workers:bwClone(BW_WORKER_DEFAULTS),
    departmentScores:{
      Sales:8,Marketing:8,Accounting:5,Operations:8,Finance:5,Research:5,Customer:4,Production:4,Technology:3
    },
    patterns:[],
    feed:[],
    suggestions:[],
    bills:[],
    goals:[],
    bank:{
      businessRevenue:0,businessExpenses:0,personalIncome:0,personalExpenses:0
    },
    lastMilestone:0
  };
}

function bwLoad(){
  try{
    const raw=localStorage.getItem(BW_STORAGE_KEY);
    if(!raw) return bwDefaultState();
    const parsed=JSON.parse(raw);
    const base=bwDefaultState();
    return Object.assign(base,parsed,{
      profile:Object.assign(base.profile,parsed.profile||{}),
      workers:Object.assign(base.workers,parsed.workers||{}),
      departmentScores:Object.assign(base.departmentScores,parsed.departmentScores||{}),
      bank:Object.assign(base.bank,parsed.bank||{})
    });
  }catch(e){
    return bwDefaultState();
  }
}

let bwState=bwLoad();
let bwToastTimer=null;
let bwSelectedFeed=null;

function bwSave(){
  try{localStorage.setItem(BW_STORAGE_KEY,JSON.stringify(bwState));}catch(e){}
}

function bwStage(iq){
  if(iq<=20) return "Learning You";
  if(iq<=40) return "Familiar";
  if(iq<=60) return "Personalized Assistant";
  if(iq<=80) return "Strategic AI Team";
  return "Deep Business Understanding";
}

function bwXpForNext(level){return 100 + Number(level||1)*75;}
function bwLevelProgress(worker){
  const req=bwXpForNext(worker.level);
  return bwClamp((worker.xp%req)/req*100,0,100);
}

function bwComputeIQ(){
  const patterns=bwState.patterns||[];
  const learned=Math.min(100,patterns.length*9);
  const confidence=patterns.length?patterns.reduce((s,p)=>s+(p.confidence||0),0)/patterns.length:8;
  const values=Object.values(bwState.departmentScores||{});
  const covered=values.filter(v=>v>=15).length;
  const coverage=values.length?covered/values.length*100:0;
  const cross=Math.min(100,Math.max(0,(values.reduce((a,b)=>a+b,0)/Math.max(1,values.length))-5));
  const p=bwState.profile;
  const fields=["businessName","primaryIndustry","offering","model","customers","employees","inventory","acquisition","expenses","goal"];
  const complete=fields.filter(k=>String(p[k]||"").trim()).length/fields.length*100;
  const score=.35*learned+.25*confidence+.20*coverage+.10*cross+.10*complete;
  return bwClamp(Math.round(score),5,100);
}

function bwPushFeed(title,detail,type,meta){
  const item={id:bwUid(),time:bwNow(),title,detail,type:type||"learn",meta:meta||{}};
  bwState.feed.unshift(item);
  bwState.feed=bwState.feed.slice(0,80);
  bwSave();
  bwRenderAll();
  return item;
}

function bwShowToast(opts){
  const el=document.getElementById("bwProgressToast");
  if(!el) return;
  clearTimeout(bwToastTimer);
  el.className="bw-progress-toast"+(opts.major?" major":"");
  el.innerHTML=
    '<div class="eyebrow">'+(opts.eyebrow||"AI LEARNING UPDATE")+'</div>'+
    '<h3>'+opts.title+'</h3>'+
    '<p>'+opts.detail+'</p>'+
    (opts.gain?'<span class="gain">'+opts.gain+'</span>':"")+
    (opts.reason?'<div class="reason">'+opts.reason+'</div>':"");
  el.classList.add("show");
  bwToastTimer=setTimeout(()=>el.classList.remove("show"),opts.major?5200:3600);
}

function bwConfirmPattern(name,department,source,explicit){
  const clean=String(name||"").trim();
  if(!clean) return;
  let p=bwState.patterns.find(x=>x.name===clean && x.department===department);
  const before=p?p.confidence:0;
  if(!p){
    p={id:bwUid(),name:clean,department,confidence:explicit?72:28,count:1,source:source||"Player interaction",updated:bwNow()};
    bwState.patterns.push(p);
  }else{
    p.count=(p.count||1)+1;
    p.confidence=bwClamp((p.confidence||0)+(explicit?24:Math.max(6,18-p.count)),0,95);
    p.source=source||p.source;
    p.updated=bwNow();
  }
  const gain=explicit?30:(before<55?20:10);
  bwAwardXP(department,gain,"NEW PATTERN LEARNED",clean,source||"Repeated behavior");
}

function bwContradictPattern(id){
  const p=bwState.patterns.find(x=>x.id===id);
  if(!p) return;
  p.confidence=bwClamp((p.confidence||0)-25,0,100);
  p.updated=bwNow();
  bwPushFeed("PATTERN CONFIDENCE REDUCED",p.name+" is being relearned because your recent behavior changed.","pattern",{patternId:p.id});
  bwShowToast({title:"RELEARNING "+p.name.toUpperCase(),detail:"Your recent behavior changed, so the old pattern is being weakened.",gain:"Confidence "+p.confidence+"%",reason:"The AI should follow your current behavior, not an outdated habit."});
  bwRecalculateIQ();
}

function bwWorkerForDepartment(dept){
  const entries=Object.entries(bwState.workers);
  let found=entries.find(([,w])=>w.department===dept);
  if(found) return found;
  if(dept==="Accounting"||dept==="Finance"||dept==="Technology") return ["Victor",bwState.workers.Victor];
  if(dept==="Research"||dept==="Customer") return ["Moshe",bwState.workers.Moshe];
  return ["Reynaldo",bwState.workers.Reynaldo];
}

function bwAwardXP(department,amount,headline,detail,reason){
  const pair=bwWorkerForDepartment(department);
  const name=pair[0], worker=pair[1];
  const previousLevel=worker.level;
  worker.xp=(worker.xp||0)+Math.max(1,Math.round(amount));
  let req=bwXpForNext(worker.level);
  while(worker.xp>=req && worker.level<50){
    worker.xp-=req;
    worker.level++;
    req=bwXpForNext(worker.level);
  }
  worker.understanding=bwClamp(Math.round((worker.understanding||5)+amount/22),0,100);
  bwState.departmentScores[department]=bwClamp((bwState.departmentScores[department]||5)+Math.max(1,amount/10),0,100);
  const leveled=worker.level>previousLevel;
  const title=leveled?(department.toUpperCase()+" LEVEL UP"):(headline||("BETTER AT "+department.toUpperCase()));
  const body=leveled?(name+" reached Level "+worker.level+". "+detail):detail;
  bwPushFeed(title,body,leveled?"level":"xp",{worker:name,department,amount,reason});
  bwShowToast({
    eyebrow:leveled?"KNOWLEDGE LEVEL UP":"KNOWLEDGE XP",
    title:title,
    detail:body,
    gain:"+"+amount+" Knowledge XP",
    reason:reason||"Learned from how you operate.",
    major:leveled
  });
  if(window.BusinessWorldGameAPI && window.BusinessWorldGameAPI.sendAgent){
    window.BusinessWorldGameAPI.sendAgent(name,bwBuildingForDepartment(department));
  }
  bwRecalculateIQ();
}

function bwRecalculateIQ(){
  const old=bwState.businessIQ||5;
  const next=bwComputeIQ();
  bwState.businessIQ=next;
  if(next>old){
    const milestone=Math.floor(next/10)*10;
    const major=milestone>Math.floor(old/10)*10;
    bwPushFeed(major?"BUSINESS IQ MILESTONE REACHED":"BUSINESS IQ IMPROVED",
      "Your AI team understands more about how this business operates. "+old+" → "+next+".",
      major?"milestone":"iq",{from:old,to:next});
    bwShowToast({
      eyebrow:major?"COMPANY INTELLIGENCE MILESTONE":"COMPANY-WIDE LEARNING",
      title:major?"BUSINESS IQ "+next:"BUSINESS IQ IMPROVED",
      detail:"Your AI team understands more about your business and can personalize suggestions more accurately.",
      gain:old+" → "+next,
      reason:"Improved patterns, confidence and department coverage.",
      major
    });
  }
  bwSave();
  bwRenderAll();
}

function bwBuildingForDepartment(dept){
  const map={
    Sales:"Sales Office",Marketing:"Marketing Studio",Accounting:"Accounting Hub",
    Operations:"Operations Center",Finance:"Bank",Research:"Research Lab",
    Customer:"CRM Center",Production:"Production Facility",Technology:"IT Center"
  };
  return map[dept]||"BW Headquarters";
}

function bwIndustry(){
  return BW_INDUSTRY_TEMPLATES[bwState.profile.primaryIndustry]||BW_INDUSTRY_TEMPLATES.Other;
}

function bwGenerateSuggestions(){
  const t=bwIndustry();
  const p=bwState.profile;
  const base=(t.suggestions||[]).slice(0,3);
  if(p.goal){
    base[0]="Your main goal is "+p.goal+". I will prioritize suggestions that connect directly to that goal.";
  }
  if(String(p.inventory).toLowerCase().indexOf("yes")>=0){
    base[1]="You use inventory. I can learn usage patterns for "+t.inventory+" and flag low-stock risk.";
  }
  bwState.suggestions=base;
  bwSave();
  return base;
}

function bwIndustryContext(building){
  const t=bwIndustry();
  const name=building||"";
  if(name==="Warehouse") return "For your business, inventory means "+t.inventory+".";
  if(name==="Analytics Tower") return "Key metrics for this category: "+t.metrics.join(", ")+".";
  if(name==="Marketing Studio") return "Marketing suggestions will be shaped around "+bwState.profile.primaryIndustry+" and your approved style.";
  if(name==="Sales Office") return "Sales will learn how you price, follow up and prioritize "+(bwState.profile.model||"your")+" customers.";
  if(name==="Accounting Hub") return "Accounting will compare revenue, expenses and margins using the patterns most relevant to "+bwState.profile.primaryIndustry+".";
  return "";
}

function bwModuleTasks(name){
  const tasks={
    "Marketing Studio":["Generate 3 content ideas","Learn my brand tone","Review posting pattern"],
    "Sales Office":["Prioritize leads","Learn follow-up timing","Review pricing pattern"],
    "Accounting Hub":["Review recurring expenses","Check margin pattern","Categorize a business cost"],
    "Operations Center":["Plan this week's work","Learn workflow order","Review deadlines"],
    "Warehouse":["Review low-stock risk","Learn material usage","Plan reorder timing"],
    "Production Facility":["Create production workflow","Learn turnaround time","Review quality-check steps"],
    "Research Lab":["Research a market question","Compare pricing strategy","Find a growth experiment"],
    "CRM Center":["Review inactive customers","Learn repeat-customer pattern","Prepare follow-up list"],
    "Analytics Tower":["Explain strongest metric","Find a trend","Compare departments"],
    "Automation Lab":["Suggest an automation","Create follow-up rule","Create recurring workflow"],
    "Invoice Center":["Review unpaid invoices","Learn deposit pattern","Prepare payment reminder"],
    "Bank":["Review free cash","Review bills","Check goal progress"]
  };
  return tasks[name]||["Ask this department for a suggestion","Teach the AI a preference","Review what this department knows"];
}

function bwTaskLearning(name,task){
  const cfg=BW_BUILDINGS[name]||{department:"Operations"};
  const dept=cfg.department;
  let heading="BETTER AT "+task.toUpperCase();
  if(task.toLowerCase().indexOf("pricing")>=0) heading="BETTER AT PRICING";
  if(task.toLowerCase().indexOf("follow")>=0) heading="BETTER AT CUSTOMER FOLLOW-UPS";
  if(task.toLowerCase().indexOf("expense")>=0) heading="BETTER AT EXPENSE TRACKING";
  if(task.toLowerCase().indexOf("workflow")>=0) heading="BETTER AT TASK PLANNING";
  if(task.toLowerCase().indexOf("brand")>=0) heading="BETTER AT YOUR BRAND VOICE";
  bwAwardXP(dept,20,heading,task+" improved through a player-guided interaction.",name+" activity");
}

function bwOpenBuilding(name){
  if(name==="Bank"){
    bwOpenBank();
    return;
  }
  const panel=document.getElementById("bwBuildingPanel");
  const cfg=BW_BUILDINGS[name]||{module:name,department:"Operations",unlock:0,why:"Business World module."};
  const locked=(bwState.businessIQ||0)<(cfg.unlock||0);
  const context=bwIndustryContext(name);
  const tasks=bwModuleTasks(name);
  panel.innerHTML=
    '<div class="bw-ai-header"><div><div class="bw-ai-kicker">'+cfg.department.toUpperCase()+' DEPARTMENT</div><h2>'+cfg.module+'</h2><p>'+cfg.why+'</p></div><button class="bw-ai-close" id="bwCloseBuilding">×</button></div>'+
    '<div class="bw-detail-box">'+(context||"This module shares knowledge with the rest of the company as Business IQ grows.")+'</div>'+
    (locked?'<div class="bw-detail-box"><b>Locked until Business IQ '+cfg.unlock+'.</b> Keep teaching the AI and expanding department coverage.</div>':
      '<div class="bw-ai-actions">'+tasks.map(t=>'<button class="bw-ai-btn bw-task-btn" data-task="'+t.replace(/"/g,"&quot;")+'">'+t+'</button>').join("")+'</div>')+
    '<div class="bw-detail-box"><b>Department understanding:</b> '+Math.round(bwState.departmentScores[cfg.department]||5)+'%<br><b>Business IQ:</b> '+bwState.businessIQ+' · '+bwStage(bwState.businessIQ)+'</div>';
  panel.classList.add("show");
  document.getElementById("bwCloseBuilding").onclick=()=>panel.classList.remove("show");
  panel.querySelectorAll(".bw-task-btn").forEach(btn=>{
    btn.onclick=()=>{
      bwTaskLearning(name,btn.dataset.task);
      btn.textContent="✓ "+btn.dataset.task;
      btn.disabled=true;
    };
  });
}

function bwOpenWorker(name){
  const worker=bwState.workers[name];
  if(!worker) return;
  const panel=document.getElementById("bwWorkerPanel");
  const relevant=bwState.patterns.filter(p=>p.department===worker.department).slice(0,8);
  panel.innerHTML=
    '<div class="bw-ai-header"><div><div class="bw-ai-kicker">'+worker.department.toUpperCase()+' AI WORKER</div><h2>'+name+'</h2><p>'+worker.role+'</p></div><button class="bw-ai-close" id="bwCloseWorker">×</button></div>'+
    '<div class="bw-detail-box"><b>Level '+worker.level+'</b> · '+worker.xp+' XP toward the next knowledge level<br><b>Understanding:</b> '+worker.understanding+'%</div>'+
    '<div class="bw-xpbar"><i style="width:'+bwLevelProgress(worker)+'%"></i></div>'+
    '<h3 style="margin:14px 0 6px">Learned patterns</h3>'+
    (relevant.length?relevant.map(p=>'<div class="bw-pattern"><div><b>'+p.name+'</b><small>'+p.source+'</small></div><span class="bw-confidence">'+Math.round(p.confidence)+'%</span></div>').join(""):'<div class="bw-detail-box">Still learning. Corrections, approvals and repeated behavior will appear here.</div>')+
    '<div class="bw-ai-actions"><button class="bw-ai-btn" id="bwTeachWorker">Teach a preference</button></div>';
  panel.classList.add("show");
  document.getElementById("bwCloseWorker").onclick=()=>panel.classList.remove("show");
  document.getElementById("bwTeachWorker").onclick=()=>{
    const val=prompt("What should "+name+" remember about how you like this part of the business handled?");
    if(val){
      bwConfirmPattern(val,worker.department,"Player confirmed preference",true);
      bwOpenWorker(name);
    }
  };
}

function bwRenderCommandCenter(){
  const root=document.getElementById("bwCommandCenter");
  if(!root) return;
  const p=bwState.profile, suggestions=bwState.suggestions.length?bwState.suggestions:bwGenerateSuggestions();
  const learned=bwState.patterns.slice().sort((a,b)=>(b.confidence||0)-(a.confidence||0)).slice(0,6);
  root.innerHTML=
    '<div class="bw-ai-header"><div><div class="bw-ai-kicker">HQ / AI COMMAND CENTER</div><h2>'+(p.businessName||"Your Business")+'</h2><p>Your city learns how this company works. Knowledge XP grows worker expertise; Business IQ measures company-wide understanding.</p></div><button class="bw-ai-close" id="bwCloseCommand">×</button></div>'+
    '<div class="bw-iq-hero"><div class="bw-iq-ring"><div><strong>'+bwState.businessIQ+'</strong><span>BUSINESS IQ / 100</span><small>'+bwStage(bwState.businessIQ)+'</small></div></div>'+
    '<div class="bw-ai-summary"><article><span>Industry</span><strong>'+p.primaryIndustry+'</strong></article><article><span>Model</span><strong>'+p.model+'</strong></article><article><span>Main goal</span><strong>'+(p.goal||"Learning")+'</strong></article><article><span>Patterns</span><strong>'+bwState.patterns.length+'</strong></article><article><span>AI workers</span><strong>'+Object.keys(bwState.workers).length+'</strong></article><article><span>Coverage</span><strong>'+Object.values(bwState.departmentScores).filter(v=>v>=15).length+'/'+BW_DEPARTMENTS.length+'</strong></article></div></div>'+
    '<div class="bw-ai-grid">'+
      '<section class="bw-ai-card"><h3>AI team</h3>'+Object.entries(bwState.workers).map(([name,w])=>
        '<div class="bw-agent-row"><div class="bw-agent-avatar">'+name.charAt(0)+'</div><div><b>'+name+' · Level '+w.level+'</b><small>'+w.role+' · '+w.understanding+'% understanding</small><div class="bw-xpbar"><i style="width:'+bwLevelProgress(w)+'%"></i></div></div><button class="bw-agent-open" data-worker="'+name+'">View</button></div>'
      ).join("")+'</section>'+
      '<section class="bw-ai-card"><h3>AI suggestions</h3>'+suggestions.map(s=>'<div class="bw-suggestion">'+s+'</div>').join("")+'<div class="bw-ai-actions"><button class="bw-ai-btn secondary" id="bwRefreshSuggestions">Refresh suggestions</button></div></section>'+
      '<section class="bw-ai-card"><h3>Strongest learned patterns</h3>'+(learned.length?learned.map(p=>'<div class="bw-pattern"><div><b>'+p.name+'</b><small>'+p.department+' · '+p.source+'</small></div><span class="bw-confidence">'+Math.round(p.confidence)+'%</span></div>').join(""):'<div class="bw-detail-box">No confirmed patterns yet. Use the business tools and correct the AI so it can learn.</div>')+'</section>'+
      '<section class="bw-ai-card"><h3>AI Progress feed</h3><div class="bw-feed">'+(bwState.feed.length?bwState.feed.slice(0,12).map(item=>'<div class="bw-feed-item" data-feed="'+item.id+'"><b>'+item.title+'</b><span>'+item.detail+'</span></div>').join(""):'<div class="bw-detail-box">Learning updates will appear here.</div>')+'</div></section>'+
    '</div>'+
    '<section class="bw-ai-card" style="margin-top:12px"><h3>Business modules</h3><div class="bw-building-list">'+Object.entries(BW_BUILDINGS).filter(([name])=>!["Apartments","Cafe","Business Growth Monument"].includes(name)).map(([name,cfg])=>'<button class="bw-building-chip '+((bwState.businessIQ||0)<cfg.unlock?"locked":"")+'" data-building="'+name+'">'+name+(((bwState.businessIQ||0)<cfg.unlock)?' · IQ '+cfg.unlock:'')+'</button>').join("")+'</div></section>'+
    '<section class="bw-ai-card bw-reset"><h3>Business profile</h3><div class="bw-profile-grid"><div><b>Customers:</b> '+(p.customers||"Learning")+'</div><div><b>Offering:</b> '+p.offering+'</div><div><b>Employees:</b> '+p.employees+'</div><div><b>Inventory:</b> '+p.inventory+'</div><div><b>Acquisition:</b> '+(p.acquisition||"Learning")+'</div><div><b>Expenses:</b> '+(p.expenses||"Learning")+'</div></div><div class="bw-ai-actions"><button class="bw-ai-btn secondary" id="bwRetrain">Update business profile</button><button class="bw-ai-btn secondary" id="bwResetLearning">Reset AI learning</button></div></section>';
  document.getElementById("bwCloseCommand").onclick=()=>root.classList.remove("show");
  root.querySelectorAll("[data-worker]").forEach(b=>b.onclick=()=>bwOpenWorker(b.dataset.worker));
  root.querySelectorAll("[data-building]").forEach(b=>b.onclick=()=>bwOpenBuilding(b.dataset.building));
  root.querySelectorAll("[data-feed]").forEach(b=>b.onclick=()=>bwOpenFeedDetail(b.dataset.feed));
  document.getElementById("bwRefreshSuggestions").onclick=()=>{
    bwGenerateSuggestions();
    bwAwardXP("Research",8,"BETTER AT BUSINESS SUGGESTIONS","The AI refreshed its recommendations using your current business profile.","HQ suggestion review");
  };
  document.getElementById("bwRetrain").onclick=()=>bwStartOnboarding(true);
  document.getElementById("bwResetLearning").onclick=()=>{
    if(confirm("Reset Business IQ, Knowledge XP and learned patterns? Your business profile will stay.")){
      const profile=bwClone(bwState.profile);
      bwState=bwDefaultState();
      bwState.profile=profile;
      bwState.onboarded=true;
      bwState.suggestions=[];
      bwGenerateSuggestions();
      bwSave();
      bwRenderAll();
    }
  };
}

function bwOpenFeedDetail(id){
  const item=bwState.feed.find(x=>x.id===id);
  if(!item) return;
  const panel=document.getElementById("bwWorkerPanel");
  panel.innerHTML=
    '<div class="bw-ai-header"><div><div class="bw-ai-kicker">AI PROGRESS DETAIL</div><h2>'+item.title+'</h2><p>'+item.detail+'</p></div><button class="bw-ai-close" id="bwCloseWorker">×</button></div>'+
    '<div class="bw-detail-box"><b>Why it changed:</b> '+(item.meta.reason||"The AI learned from player behavior, corrections, approvals or connected business activity.")+'<br><b>Department:</b> '+(item.meta.department||"Company-wide")+'<br><b>Worker:</b> '+(item.meta.worker||"AI team")+'<br><b>Effect:</b> Future suggestions in this area can use the new knowledge with its current confidence.</div>';
  panel.classList.add("show");
  document.getElementById("bwCloseWorker").onclick=()=>panel.classList.remove("show");
}

function bwRenderFab(){
  const iq=document.getElementById("bwFabIq");
  if(iq) iq.textContent="Business IQ "+bwState.businessIQ+" · "+bwStage(bwState.businessIQ);
}

function bwRenderAll(){
  bwRenderFab();
  if(document.getElementById("bwCommandCenter")?.classList.contains("show")) bwRenderCommandCenter();
}

function bwOpenCommandCenter(){
  document.getElementById("bwCommandCenter").classList.add("show");
  bwRenderCommandCenter();
}

function bwOnboardingMarkup(step,editing){
  const p=bwState.profile;
  if(step===0){
    return '<div class="bw-onboarding-step"><h2>'+(editing?"Update Your Business Profile":"Welcome to Business World")+'</h2><p>Your AI team will learn what kind of company you run, then adapt its suggestions, buildings and learning around your business. You can change this later.</p><div class="bw-form-grid"><label>Business name<input id="bwOBName" value="'+(p.businessName||"").replace(/"/g,"&quot;")+'" placeholder="Your company"></label><label>Primary industry<select id="bwOBIndustry">'+Object.keys(BW_INDUSTRY_TEMPLATES).map(x=>'<option '+(p.primaryIndustry===x?"selected":"")+'>'+x+'</option>').join("")+'</select></label><label>Secondary category<input id="bwOBSecondary" value="'+(p.secondaryCategories||"").replace(/"/g,"&quot;")+'" placeholder="Optional"></label><label>What do you sell?<select id="bwOBOffering"><option '+(p.offering==="Products"?"selected":"")+'>Products</option><option '+(p.offering==="Services"?"selected":"")+'>Services</option><option '+(p.offering==="Both"?"selected":"")+'>Both</option></select></label></div></div>';
  }
  if(step===1){
    return '<div class="bw-onboarding-step"><h2>How does the business operate?</h2><p>This helps the AI decide which workflows and buildings matter most.</p><div class="bw-form-grid"><label>Customer model<select id="bwOBModel"><option '+(p.model==="B2B"?"selected":"")+'>B2B</option><option '+(p.model==="B2C"?"selected":"")+'>B2C</option><option '+(p.model==="Both"?"selected":"")+'>Both</option></select></label><label>Team size<select id="bwOBEmployees"><option '+(p.employees==="Just me"?"selected":"")+'>Just me</option><option '+(p.employees==="2–5"?"selected":"")+'>2–5</option><option '+(p.employees==="6–20"?"selected":"")+'>6–20</option><option '+(p.employees==="21+"?"selected":"")+'>21+</option></select></label><label>Do you carry inventory?<select id="bwOBInventory"><option '+(p.inventory==="No"?"selected":"")+'>No</option><option '+(p.inventory==="Yes"?"selected":"")+'>Yes</option><option '+(p.inventory==="Sometimes"?"selected":"")+'>Sometimes</option></select></label><label>Typical customers<input id="bwOBCustomers" value="'+(p.customers||"").replace(/"/g,"&quot;")+'" placeholder="Local businesses, consumers, contractors..."></label></div></div>';
  }
  return '<div class="bw-onboarding-step"><h2>What should your AI focus on?</h2><p>You do not need perfect answers. The AI will keep learning as you use the city.</p><div class="bw-form-grid"><label>How customers find you<textarea id="bwOBAcquisition" placeholder="Referrals, Instagram, walk-ins, ads...">'+(p.acquisition||"")+'</textarea></label><label>Main expenses<textarea id="bwOBExpenses" placeholder="Labor, inventory, rent, ads...">'+(p.expenses||"")+'</textarea></label><label style="grid-column:1/-1">Main business goal<textarea id="bwOBGoal" placeholder="Increase profit, get more customers, organize operations...">'+(p.goal||"")+'</textarea></label></div></div>';
}

let bwOnboardingStep=0;
let bwOnboardingEditing=false;

function bwCaptureOnboarding(){
  const get=id=>document.getElementById(id);
  if(bwOnboardingStep===0){
    if(get("bwOBName")) bwState.profile.businessName=get("bwOBName").value.trim();
    if(get("bwOBIndustry")) bwState.profile.primaryIndustry=get("bwOBIndustry").value;
    if(get("bwOBSecondary")) bwState.profile.secondaryCategories=get("bwOBSecondary").value.trim();
    if(get("bwOBOffering")) bwState.profile.offering=get("bwOBOffering").value;
  }else if(bwOnboardingStep===1){
    if(get("bwOBModel")) bwState.profile.model=get("bwOBModel").value;
    if(get("bwOBEmployees")) bwState.profile.employees=get("bwOBEmployees").value;
    if(get("bwOBInventory")) bwState.profile.inventory=get("bwOBInventory").value;
    if(get("bwOBCustomers")) bwState.profile.customers=get("bwOBCustomers").value.trim();
  }else{
    if(get("bwOBAcquisition")) bwState.profile.acquisition=get("bwOBAcquisition").value.trim();
    if(get("bwOBExpenses")) bwState.profile.expenses=get("bwOBExpenses").value.trim();
    if(get("bwOBGoal")) bwState.profile.goal=get("bwOBGoal").value.trim();
  }
  bwSave();
}

function bwRenderOnboarding(){
  const el=document.getElementById("bwOnboarding");
  el.hidden=false;
  el.innerHTML=
    '<div class="bw-ai-kicker">BUSINESS SETUP · '+(bwOnboardingStep+1)+' OF 3</div>'+
    bwOnboardingMarkup(bwOnboardingStep,bwOnboardingEditing)+
    '<div class="bw-onboarding-progress"><i style="width:'+((bwOnboardingStep+1)/3*100)+'%"></i></div>'+
    '<div class="bw-onboarding-nav">'+
      '<button class="bw-ai-btn secondary" id="bwOBBack" '+(bwOnboardingStep===0?'disabled':'')+'>Back</button>'+
      '<button class="bw-ai-btn" id="bwOBNext">'+(bwOnboardingStep===2?"Build My AI Team":"Continue")+'</button>'+
    '</div>';
  document.getElementById("bwOBBack").onclick=()=>{
    bwCaptureOnboarding();
    bwOnboardingStep=Math.max(0,bwOnboardingStep-1);
    bwRenderOnboarding();
  };
  document.getElementById("bwOBNext").onclick=()=>{
    bwCaptureOnboarding();
    if(bwOnboardingStep<2){
      bwOnboardingStep++;
      bwRenderOnboarding();
      return;
    }
    const wasNew=!bwState.onboarded;
    bwState.onboarded=true;
    bwState.businessIQ=Math.max(5,bwComputeIQ());
    bwGenerateSuggestions();
    bwSave();
    el.hidden=true;
    bwRenderAll();
    if(wasNew){
      bwPushFeed("BUSINESS PROFILE CREATED",bwState.profile.primaryIndustry+" profile created. Your AI is ready to help while it learns.","profile",{});
      bwShowToast({eyebrow:"YOUR BUSINESS IS READY",title:"BUSINESS IQ "+bwState.businessIQ,detail:"Your AI already has ideas for "+bwState.profile.businessName+" and will become more personalized as you teach it.",gain:bwStage(bwState.businessIQ),reason:"Three starting suggestions are ready in HQ.",major:true});
    }else{
      bwPushFeed("BUSINESS PROFILE UPDATED","The AI updated its understanding of your company category, model and goals.","profile",{});
    }
    bwOpenCommandCenter();
  };
}

function bwStartOnboarding(editing){
  bwOnboardingEditing=!!editing;
  bwOnboardingStep=0;
  bwRenderOnboarding();
}

function bwInitBank(){
  const panel=document.getElementById("bankPanel");
  if(!panel) return;
  const ids={
    br:"bankBusinessRevenue",be:"bankBusinessExpenses",pi:"bankPersonalIncome",pe:"bankPersonalExpenses"
  };
  Object.entries(ids).forEach(([key,id])=>{
    const el=document.getElementById(id);
    if(!el) return;
    const map={br:"businessRevenue",be:"businessExpenses",pi:"personalIncome",pe:"personalExpenses"};
    el.value=bwState.bank[map[key]]||"";
    el.addEventListener("input",()=>{
      bwState.bank[map[key]]=Math.max(0,Number(el.value)||0);
      bwSave();bwRenderBank();
    });
  });
  const close=document.getElementById("closeBank");
  if(close) close.onclick=()=>panel.classList.remove("show");
  const bf=document.getElementById("bankBillForm");
  if(bf) bf.onsubmit=e=>{
    e.preventDefault();
    const name=document.getElementById("bankBillName").value.trim();
    const amount=Number(document.getElementById("bankBillAmount").value)||0;
    const type=document.getElementById("bankBillType").value;
    if(name&&amount>0){
      bwState.bills.push({id:bwUid(),name,amount,type});
      bf.reset();bwSave();bwRenderBank();
      bwAwardXP("Finance",10,"BETTER AT CASH FLOW AWARENESS","Finance learned another recurring obligation.","Bill added");
    }
  };
  const gf=document.getElementById("bankGoalForm");
  if(gf) gf.onsubmit=e=>{
    e.preventDefault();
    const goal={
      id:bwUid(),
      name:document.getElementById("bankGoalName").value.trim(),
      type:document.getElementById("bankGoalType").value,
      target:Number(document.getElementById("bankGoalTarget").value)||0,
      current:Number(document.getElementById("bankGoalCurrent").value)||0,
      monthly:Number(document.getElementById("bankGoalMonthly").value)||0
    };
    if(goal.name&&goal.target>0){
      bwState.goals.push(goal);gf.reset();bwSave();bwRenderBank();
      bwAwardXP("Finance",10,"BETTER AT UNDERSTANDING YOUR GOALS","Finance learned a new business or personal target.","Goal added");
    }
  };
  bwRenderBank();
}

function bwRenderBank(){
  const businessBills=bwState.bills.filter(b=>b.type==="business").reduce((s,b)=>s+b.amount,0);
  const personalBills=bwState.bills.filter(b=>b.type==="personal").reduce((s,b)=>s+b.amount,0);
  const businessProfit=bwState.bank.businessRevenue-bwState.bank.businessExpenses-businessBills;
  const margin=bwState.bank.businessRevenue?businessProfit/bwState.bank.businessRevenue*100:0;
  const free=bwState.bank.personalIncome-bwState.bank.personalExpenses-personalBills;
  const totalBills=businessBills+personalBills;
  const goalPct=bwState.goals.length?bwState.goals.reduce((s,g)=>s+bwClamp(g.current/Math.max(1,g.target)*100,0,100),0)/bwState.goals.length:0;
  const set=(id,val)=>{const e=document.getElementById(id);if(e)e.textContent=val;};
  set("bankBusinessProfit",bwMoney(businessProfit));
  set("bankBusinessMargin",margin.toFixed(1)+"% margin");
  set("bankPersonalFree",bwMoney(free));
  set("bankBillsTotal",bwMoney(totalBills));
  set("bankGoalProgress",Math.round(goalPct)+"%");
  const bills=document.getElementById("bankBillsList");
  if(bills){
    bills.innerHTML=bwState.bills.length?bwState.bills.map(b=>'<div class="bank-row"><div class="bank-row-main"><b>'+b.name+'</b><small>'+b.type+'</small></div><strong>'+bwMoney(b.amount)+'</strong><button class="bank-remove" data-bill="'+b.id+'">×</button></div>').join(""):'<div class="bank-empty">No bills added yet.</div>';
    bills.querySelectorAll("[data-bill]").forEach(btn=>btn.onclick=()=>{bwState.bills=bwState.bills.filter(b=>b.id!==btn.dataset.bill);bwSave();bwRenderBank();});
  }
  const goals=document.getElementById("bankGoalsList");
  if(goals){
    goals.innerHTML=bwState.goals.length?bwState.goals.map(g=>{
      const pct=bwClamp(g.current/Math.max(1,g.target)*100,0,100);
      return '<div class="bank-row"><div class="bank-row-main"><b>'+g.name+'</b><small>'+g.type+' · '+Math.round(pct)+'%</small><div class="bank-goal-progress"><i style="width:'+pct+'%"></i></div></div><strong>'+bwMoney(g.current)+' / '+bwMoney(g.target)+'</strong><button class="bank-remove" data-goal="'+g.id+'">×</button></div>';
    }).join(""):'<div class="bank-empty">No goals added yet.</div>';
    goals.querySelectorAll("[data-goal]").forEach(btn=>btn.onclick=()=>{bwState.goals=bwState.goals.filter(g=>g.id!==btn.dataset.goal);bwSave();bwRenderBank();});
  }
  const strategies=document.getElementById("bankStrategies");
  if(strategies){
    const arr=[];
    if(businessProfit<0) arr.push("<b>Business cash flow:</b> Current entered expenses are above entered revenue. Review the largest recurring costs first.");
    else if(bwState.bank.businessRevenue>0) arr.push("<b>Margin:</b> Entered business margin is "+margin.toFixed(1)+"%. The AI can learn which products or jobs create the strongest margin.");
    if(free<0) arr.push("<b>Personal free cash:</b> Monthly obligations are above entered personal income.");
    if(bwState.goals.length) arr.push("<b>Goals:</b> Keep contributions visible here so the AI can compare goal speed with available cash.");
    if(!arr.length) arr.push("<b>Start here:</b> Add monthly business numbers, bills and at least one goal so Finance can learn your normal cash-flow pattern.");
    strategies.innerHTML=arr.map(x=>'<div class="bank-strategy">'+x+'</div>').join("");
  }
}

function bwOpenBank(){
  const panel=document.getElementById("bankPanel");
  if(panel){panel.classList.add("show");bwRenderBank();}
}

function bwCreateUi(){
  if(document.getElementById("bwAiRoot")) return;
  const root=document.createElement("div");
  root.id="bwAiRoot";
  root.innerHTML=
    '<button class="bw-ai-fab" id="bwAiFab" type="button">AI HQ<small id="bwFabIq"></small></button>'+
    '<section class="bw-ai-panel" id="bwCommandCenter"></section>'+
    '<section class="bw-building-panel" id="bwBuildingPanel"></section>'+
    '<section class="bw-worker-panel" id="bwWorkerPanel"></section>'+
    '<section class="bw-onboarding" id="bwOnboarding" hidden></section>'+
    '<div class="bw-progress-toast" id="bwProgressToast" role="status" aria-live="polite"></div>';
  document.body.appendChild(root);
  document.getElementById("bwAiFab").onclick=bwOpenCommandCenter;
}

function bwFirstRun(){
  if(!bwState.onboarded) bwStartOnboarding(false);
  else{
    if(!bwState.suggestions.length) bwGenerateSuggestions();
    bwRenderAll();
  }
}

window.BusinessAI = {
  openBuilding:bwOpenBuilding,
  openCommandCenter:bwOpenCommandCenter,
  awardXP:bwAwardXP,
  confirmPattern:bwConfirmPattern,
  contradictPattern:bwContradictPattern,
  getState:()=>bwClone(bwState),
  setIndustry:name=>{bwState.profile.primaryIndustry=name;bwGenerateSuggestions();bwRecalculateIQ();}
};

bwCreateUi();
bwInitBank();
bwFirstRun();
