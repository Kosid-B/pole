const KPP_WAGE=347;
const TIER_FACTOR={A:1,B:1.03,C:1.06};
const AREAS={
  120:{w:12,l:10,area:120,perim:44},
  192:{w:16,l:12,area:192,perim:56},
  252:{w:18,l:14,area:252,perim:64}
};
const BASE={
 labor:[
  {id:"survey",name:"Survey/เช็คระดับ",rate:3500,unit:"บาท/จุด",kind:"fixed",v480:null},
  {id:"clearing",name:"เคลียร์ริ่ง/ปรับหน้าดิน",rate:50,unit:"บาท/ตร.ม.",kind:"area",v480:null},
  {id:"compaction",name:"บดอัดพื้นเดิม",rate:35,unit:"บาท/ตร.ม.",kind:"area",v480:null},
  {id:"geoLabor",name:"แรงติดตั้ง Geotextile",rate:15,unit:"บาท/ตร.ม.",kind:"area",v480:null},
  {id:"rockLabor",name:"แรงงานหินคลุกรองพื้น",rate:80,unit:"บาท/ตร.ม.",kind:"area",v480:null},
  {id:"sandLabor",name:"แรงงานทราย",rate:120,unit:"บาท/ลบ.ม.",kind:"volume",v480:null},
  {id:"shoulderLabor",name:"แรงงานหินคลุกไหล่",rate:120,unit:"บาท/ลบ.ม.",kind:"volume",v480:null},
  {id:"concreteLabor",name:"แรงเทคอนกรีต",rate:450,unit:"บาท/ลบ.ม.",kind:"volume",v480:329},
  {id:"wireLabor",name:"แรงวาง Wiremesh",rate:35,unit:"บาท/ตร.ม.",kind:"area",v480:6},
  {id:"formLabor",name:"แรงแบบคอนกรีต",rate:150,unit:"บาท/ตร.ม.",kind:"linear",v480:null},
  {id:"polish",name:"แรงขัดมัน",rate:50,unit:"บาท/ตร.ม.",kind:"area",v480:null},
  {id:"joint",name:"แรงรอยต่อ",rate:25,unit:"บาท/ม.",kind:"linear",v480:null},
  {id:"solarInstall",name:"แรงติดตั้ง Solar Lighting",rate:600,unit:"บาท/จุด",kind:"fixed",v480:null},
  {id:"rbLabor",name:"แรง RB19",rate:3.10,unit:"บาท/กก.",kind:"weight",v480:3.50}
 ],
 material:[
  {id:"concrete",name:"คอนกรีต ST240",rate:2400,unit:"บาท/ลบ.ม.",direct:true},
  {id:"geoMat",name:"Geotextile",rate:50,unit:"บาท/ตร.ม."},
  {id:"rockMat",name:"หินคลุก 3/4",rate:750,unit:"บาท/ลบ.ม."},
  {id:"sandMat",name:"ทราย",rate:650,unit:"บาท/ลบ.ม."},
  {id:"shoulderMat",name:"หินคลุกไหล่",rate:750,unit:"บาท/ลบ.ม."},
  {id:"wireMat",name:"Wiremesh SR24",rate:35,unit:"บาท/ตร.ม."},
  {id:"formMat",name:"วัสดุแบบคอนกรีต",rate:180,unit:"บาท/ตร.ม."},
  {id:"asphalt",name:"ยางมะตอย",rate:60,unit:"บาท/ลิตร"},
  {id:"rbMat",name:"RB19 วัสดุฐาน",rate:26.5947888589,unit:"บาท/กก."},
  {id:"sign",name:"ป้ายโครงการ",rate:4500,unit:"บาท/จุด"}
 ],
 machine:[
  {id:"roller4",name:"รถบด 4 ตัน",rate:5500,unit:"บาท/วัน"},
  {id:"rollerWalk",name:"รถบดเดินตาม",rate:800,unit:"บาท/วัน"},
  {id:"d2",name:"รถแทรกเตอร์ D2",rate:5500,unit:"บาท/วัน"},
  {id:"cutter",name:"เครื่องตัดแนวคอนกรีต",rate:700,unit:"บาท/วัน"},
  {id:"pc30",name:"PC30",rate:3500,unit:"บาท/วัน"},
  {id:"pc60",name:"PC60",rate:5500,unit:"บาท/วัน"},
  {id:"pc120",name:"PC120",rate:6500,unit:"บาท/วัน"}
 ]
};
const DEFAULT={
 gm:.32,vat:.07,freight:1000,poleLabor:820,otherCost:0,
 pkg:{G63:{cctv:0,solar:0,pole:0,speaker:0},G64:{cctv:0,solar:0,pole:0,speaker:0}},
 areaByPoint:{},
 machineDays:{roller4:0,rollerWalk:0,d2:0,cutter:0,pc30:0,pc60:0,pc120:0}
};
function clone(x){return JSON.parse(JSON.stringify(x))}
function merge(a,b){if(!b||typeof b!=="object")return a;Object.keys(b).forEach(k=>{if(b[k]&&typeof b[k]==="object"&&!Array.isArray(b[k])&&a[k]&&typeof a[k]==="object")a[k]=merge(a[k],b[k]);else a[k]=b[k]});return a}
function load(){try{return merge(clone(DEFAULT),JSON.parse(localStorage.getItem("sitecost446_research_v2")||"null")||{})}catch(e){return clone(DEFAULT)}}
let state=load(),chartG="G63",page=1;const pageSize=40;
function save(){localStorage.setItem("sitecost446_research_v2",JSON.stringify(state))}
function thb(n){return Number(n||0).toLocaleString("th-TH",{maximumFractionDigits:0})+" ฿"}
function compact(n){return n>=1e6?(n/1e6).toLocaleString("th-TH",{maximumFractionDigits:2})+" ลบ.":thb(n)}
function fmt(n,d=3){return Number(n).toLocaleString("th-TH",{maximumFractionDigits:d})}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function wageFor(province,district){if(province==="เชียงใหม่"&&String(district).includes("เมืองเชียงใหม่"))return 380;return WAGES[province]||KPP_WAGE}
function laborFactor(province,district){return wageFor(province,district)/KPP_WAGE}
function tierFactor(tier){return TIER_FACTOR[tier]||1}
function areaFor(p){return Number(state.areaByPoint[p.id]||192)}
function qty(area){
 const a=AREAS[area],ar=area/192,lr=a.perim/56;
 return {area,rock:28.8*ar,sand:9.6*ar,shoulder:5.6*lr,concrete:29.36*ar,wire:area,form:8.4*lr,asphalt:20*lr,joint:52*lr,rb:130.79976*lr}
}
function baseItem(cat,id){return BASE[cat].find(x=>x.id===id)}
function adjRate(cat,item,p){
 const lf=laborFactor(p.province,p.district),tf=tierFactor(p.tier);
 if(cat==="labor")return item.rate*lf;
 if(cat==="material"){if(item.direct&&item.id==="concrete")return p.concreteRate;return item.rate*tf}
 if(cat==="machine")return item.rate*tf;
 return item.rate
}
function packageCost(g){const p=state.pkg[g]||{};return state.poleLabor+Number(p.cctv||0)+Number(p.solar||0)+Number(p.pole||0)+Number(p.speaker||0)+Number(state.otherCost||0)}
function machineCost(p){return BASE.machine.reduce((s,m)=>s+adjRate("machine",m,p)*Number(state.machineDays[m.id]||0),0)}
function calc(p,area){
 const q=qty(area),c={labor:0,material:0,machine:0,package:packageCost(p.g),freight:state.freight};
 const L=id=>adjRate("labor",baseItem("labor",id),p), M=id=>adjRate("material",baseItem("material",id),p);
 c.labor += L("survey");
 c.labor += q.area*L("clearing")+q.area*L("compaction")+q.area*L("geoLabor")+q.area*L("rockLabor");
 c.labor += q.sand*L("sandLabor")+q.shoulder*L("shoulderLabor")+q.concrete*L("concreteLabor");
 c.labor += q.wire*L("wireLabor")+q.form*L("formLabor")+q.area*L("polish")+q.joint*L("joint")+L("solarInstall")+q.rb*L("rbLabor");
 c.material += q.area*M("geoMat")+q.rock*M("rockMat")+q.sand*M("sandMat")+q.shoulder*M("shoulderMat");
 c.material += q.concrete*M("concrete")+q.wire*M("wireMat")+q.form*M("formMat")+q.asphalt*M("asphalt")+q.rb*M("rbMat")+M("sign");
 c.machine=machineCost(p);
 c.cost=c.labor+c.material+c.machine+c.package+c.freight;
 c.sale=c.cost/(1-state.gm);c.profit=c.sale-c.cost;c.vat=c.sale*state.vat;c.total=c.sale+c.vat;
 return c
}
function buildPoints(){
 const a=[];let id=1;
 DISTRICTS.forEach(d=>[["G63",d.g63],["G64",d.g64]].forEach(([g,n])=>{for(let i=1;i<=Number(n||0);i++)a.push({id:`LT-${String(id++).padStart(4,"0")}`,g,province:d.province,district:d.district,tier:d.tier,concreteRate:Number(d.concrete),seq:i})}));
 return a
}
const POINTS=buildPoints();

function renderKpis(){
 const a=POINTS.reduce((s,p)=>{const c=calc(p,areaFor(p));s.total+=c.total;s.cost+=c.cost;s.profit+=c.profit;return s},{total:0,cost:0,profit:0});
 kpis.innerHTML=`<div class="card kpi"><b>446</b><span>จุดติดตั้ง</span></div><div class="card kpi"><b>316</b><span>G63</span></div><div class="card kpi"><b>130</b><span>G64</span></div><div class="card kpi"><b>${compact(a.total)}</b><span>ราคาขายรวม VAT</span></div>`;
 gmPill.textContent="GM "+Math.round(state.gm*100)+"%"
}
function scenarioPoint(g,area,tier){
 const rate=tier==="A"?2250:tier==="B"?2400:2650;
 return {id:"REF",g,province:"กำแพงเพชร",district:"เมืองกำแพงเพชร",tier,concreteRate:rate}
}
function renderPriceChart(){
 chartGLabel.textContent=chartG+" • กำแพงเพชร Base";
 const vals=[];[120,192,252].forEach(a=>["A","B","C"].forEach(t=>vals.push(calc(scenarioPoint(chartG,a,t),a).total)));
 const mx=Math.max(...vals);
 priceChart.innerHTML=[120,192,252].map(a=>`<div style="margin:14px 0"><b>${a} ตร.ม. <span class="sub">(${AREAS[a].w}×${AREAS[a].l} ม.)</span></b>${["A","B","C"].map(t=>{const v=calc(scenarioPoint(chartG,a,t),a).total;return `<div class="barRow"><span>Tier ${t}</span><div class="bar ${t.toLowerCase()}"><i style="width:${Math.max(7,v/mx*100)}%"></i></div><b>${thb(v)}</b></div>`}).join("")}</div>`).join("")
}
function provinceStats(){
 const map={};POINTS.forEach(p=>{if(!map[p.province])map[p.province]={G63:0,G64:0,total:0,count:0};const v=calc(p,areaFor(p)).total;map[p.province][p.g]+=v;map[p.province].total+=v;map[p.province].count++});
 return Object.entries(map).map(([province,v])=>({province,...v})).sort((a,b)=>b.total-a.total)
}
function renderProvinceChart(){
 const a=provinceStats(),mx=Math.max(...a.map(x=>x.total));
 provinceChart.innerHTML=a.map(x=>{const w=x.total/mx*100,p63=x.total?x.G63/x.total*100:0;return `<div class="provRow"><div><b>${x.province}</b><div class="sub">${x.count} จุด</div></div><div class="stack" style="width:${Math.max(7,w)}%"><i class="x63" style="width:${p63}%"></i><i class="x64" style="width:${100-p63}%"></i></div><b>${compact(x.total)}</b></div>`}).join("")
}
function setupFilters(){
 const ps=[...new Set(POINTS.map(x=>x.province))].sort((a,b)=>a.localeCompare(b,"th"));
 filterProvince.innerHTML='<option value="">ทุกจังหวัด</option>'+ps.map(x=>`<option>${x}</option>`).join("");
 ["search","filterProvince","filterG","filterArea"].forEach(id=>document.getElementById(id).addEventListener("input",()=>{page=1;renderPoints()}))
}
function filteredPoints(){
 const q=search.value.trim().toLowerCase(),p=filterProvince.value,g=filterG.value,a=filterArea.value;
 return POINTS.filter(x=>(!q||`${x.id} ${x.province} ${x.district} ${x.g}`.toLowerCase().includes(q))&&(!p||x.province===p)&&(!g||x.g===g)&&(!a||String(areaFor(x))===a))
}
function renderPoints(){
 const arr=filteredPoints(),pages=Math.max(1,Math.ceil(arr.length/pageSize));if(page>pages)page=pages;
 const items=arr.slice((page-1)*pageSize,page*pageSize);
 pointList.innerHTML=items.map(p=>{const a=areaFor(p),c=calc(p,a),lf=laborFactor(p.province,p.district),tf=tierFactor(p.tier);return `<div class="point">
 <div class="row"><div><div class="pointTitle"><span class="badge ${p.g.toLowerCase()}">${p.g}</span>${p.id}<span class="badge tier${p.tier.toLowerCase()}">Tier ${p.tier}</span></div><div class="pointMeta">${esc(p.province)} • ${esc(p.district)} • Wage×${fmt(lf)} • Logistic×${fmt(tf)}</div></div><div><div class="pointPrice">${thb(c.total)}</div><div class="sub" style="text-align:right">รวม VAT</div></div></div>
 <div class="pointControls"><div class="field"><label>พื้นที่ลาน</label><select class="areaSel" data-id="${p.id}"><option value="120" ${a===120?"selected":""}>120 ตร.ม.</option><option value="192" ${a===192?"selected":""}>192 ตร.ม.</option><option value="252" ${a===252?"selected":""}>252 ตร.ม.</option></select></div><div class="field"><label>Cost Base</label><input readonly value="${thb(c.cost)}"></div></div>
 <details class="detailBox"><summary>ดูต้นทุนที่มาของราคานี้</summary><div class="breakdown"><div class="row"><span>ค่าแรงปรับจังหวัด</span><b>${thb(c.labor)}</b></div><div class="row"><span>วัสดุ + คอนกรีตอำเภอ</span><b>${thb(c.material)}</b></div><div class="row"><span>เครื่องจักรเพิ่ม</span><b>${thb(c.machine)}</b></div><div class="row"><span>Package ${p.g}</span><b>${thb(c.package)}</b></div><div class="row"><span>ขนส่ง</span><b>${thb(c.freight)}</b></div><div class="row"><span>GM ${Math.round(state.gm*100)}%</span><b>${thb(c.profit)}</b></div></div></details>
 </div>`}).join("")||'<div class="sub">ไม่พบข้อมูล</div>';
 document.querySelectorAll(".areaSel").forEach(s=>s.addEventListener("change",()=>{state.areaByPoint[s.dataset.id]=Number(s.value);save();renderAll()}));
 pager.innerHTML=`<button class="btn secondary" id="prev" ${page<=1?"disabled":""}>ก่อนหน้า</button><span class="sub">หน้า ${page}/${pages} • ${arr.length} จุด</span><button class="btn secondary" id="next" ${page>=pages?"disabled":""}>ถัดไป</button>`;
 prev.onclick=()=>{if(page>1){page--;renderPoints()}};next.onclick=()=>{if(page<pages){page++;renderPoints()}}
}
function districtsForProvince(p){return DISTRICTS.filter(x=>x.province===p)}
function setupCatalog(){
 const ps=[...new Set(DISTRICTS.map(x=>x.province))].sort((a,b)=>a.localeCompare(b,"th"));
 refProvince.innerHTML=ps.map(x=>`<option ${x==="กำแพงเพชร"?"selected":""}>${x}</option>`).join("");
 refProvince.onchange=()=>{fillDistricts();renderCatalog()};refDistrict.onchange=renderCatalog;refCategory.onchange=()=>{fillItems();renderCatalog()};refItem.onchange=renderCatalog;
 fillDistricts();fillItems();renderCatalog()
}
function fillDistricts(){
 const ds=districtsForProvince(refProvince.value);refDistrict.innerHTML=ds.map(x=>`<option>${x.district}</option>`).join("")
}
function fillItems(){
 const cat=refCategory.value;refItem.innerHTML=BASE[cat].map(x=>`<option value="${x.id}">${x.name}</option>`).join("")
}
function currentRefPoint(){
 const d=DISTRICTS.find(x=>x.province===refProvince.value&&x.district===refDistrict.value)||DISTRICTS.find(x=>x.province===refProvince.value);
 return {province:d.province,district:d.district,tier:d.tier,concreteRate:Number(d.concrete),g:"G63"}
}
function renderCatalog(){
 const p=currentRefPoint(),cat=refCategory.value,item=baseItem(cat,refItem.value),lf=laborFactor(p.province,p.district),tf=tierFactor(p.tier),adj=adjRate(cat,item,p);
 let factor=cat==="labor"?lf:cat==="material"?(item.direct?null:tf):tf;
 let factorText=factor==null?"ราคาตามอำเภอ":`× ${fmt(factor)}`;
 let expl=cat==="labor"?`ค่าแรงขั้นต่ำ ${wageFor(p.province,p.district)} ÷ 347 บาท/วัน`:(cat==="material"?(item.direct?"Concrete rate ตามอำเภอ":"Tier "+p.tier+" Logistics proxy"):"Tier "+p.tier+" Logistics proxy");
 refExplain.innerHTML=`<div class="row"><div><b>${item.name}</b><div class="muted">${expl}</div></div><span class="badge tier${p.tier.toLowerCase()}">Tier ${p.tier}</span></div>`;
 refCompare.innerHTML=`<div><small>ฐานกำแพงเพชร</small><b>${fmt(item.rate,2)}</b><small>${item.unit}</small></div><div><small>ตัวปรับจังหวัด</small><b>${factorText}</b><small>${p.province} • ${p.district}</small></div><div><small>ราคาที่ใช้</small><b>${fmt(adj,2)}</b><small>${item.unit}</small></div>`;
 refRows.innerHTML=BASE[cat].map(x=>{const v=adjRate(cat,x,p);const f=cat==="labor"?lf:cat==="material"?(x.direct?null:tf):tf;return `<tr><td>${x.name}${x.v480!=null?`<div class="muted">ว480: ${x.v480}</div>`:""}</td><td>${fmt(x.rate,2)}</td><td>${x.unit}</td><td>${f==null?"ตามอำเภอ":"× "+fmt(f)}</td><td><b>${fmt(v,2)}</b></td></tr>`}).join("")
}
function setupSettings(){
 gm.value=Math.round(state.gm*100);vat.value=state.vat*100;freight.value=state.freight;poleLabor.value=state.poleLabor;otherCost.value=state.otherCost;
 document.querySelectorAll(".pkg").forEach(i=>{i.value=state.pkg[i.dataset.g][i.dataset.k]||0;i.oninput=()=>{state.pkg[i.dataset.g][i.dataset.k]=Math.max(0,Number(i.value||0));save();renderAll()}});
 gm.oninput=()=>{state.gm=Math.max(.25,Math.min(.32,Number(gm.value||32)/100));save();renderAll()};
 vat.oninput=()=>{state.vat=Math.max(0,Number(vat.value||0)/100);save();renderAll()};
 freight.oninput=()=>{state.freight=Math.max(0,Number(freight.value||0));save();renderAll()};
 poleLabor.oninput=()=>{state.poleLabor=Math.max(800,Math.min(840,Number(poleLabor.value||820)));save();renderAll()};
 otherCost.oninput=()=>{state.otherCost=Math.max(0,Number(otherCost.value||0));save();renderAll()};
 machineUsage.innerHTML=BASE.machine.map(m=>`<div class="row" style="padding:7px 0;border-bottom:1px solid var(--line)"><div><b style="font-size:13px">${m.name}</b><div class="sub">${fmt(m.rate)} บาท/วัน ก่อน Tier</div></div><select class="machineDay" data-id="${m.id}" style="max-width:150px"><option value="0">ไม่ใช้เพิ่ม</option><option value=".25">0.25 วัน/จุด</option><option value=".5">0.50 วัน/จุด</option><option value="1">1 วัน/จุด</option></select></div>`).join("");
 document.querySelectorAll(".machineDay").forEach(s=>{s.value=String(state.machineDays[s.dataset.id]||0);s.onchange=()=>{state.machineDays[s.dataset.id]=Number(s.value);save();renderAll()}});
 resetBtn.onclick=()=>{if(confirm("คืนค่าเริ่มต้นทั้งหมด?")){state=clone(DEFAULT);save();location.reload()}}
}
function showView(name){
 document.querySelectorAll(".view").forEach(x=>x.classList.toggle("active",x.id==="view-"+name));
 document.querySelectorAll(".navBtn").forEach(x=>x.classList.toggle("active",x.dataset.view===name));
 window.scrollTo({top:0,behavior:"smooth"})
}
document.querySelectorAll(".navBtn").forEach(b=>b.onclick=()=>showView(b.dataset.view));
g63Btn.onclick=()=>{chartG="G63";g63Btn.classList.add("active");g64Btn.classList.remove("active");renderPriceChart()};
g64Btn.onclick=()=>{chartG="G64";g64Btn.classList.add("active");g63Btn.classList.remove("active");renderPriceChart()};
printBtn.onclick=()=>window.print();
function renderAll(){renderKpis();renderPriceChart();renderProvinceChart();renderPoints();renderCatalog()}
setupFilters();setupCatalog();setupSettings();renderAll();