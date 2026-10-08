export const amount = value => Number(String(value ?? '').replace(/[^0-9.-]/g, '')) || 0;
export const PAD_PRICES = {multi:{month:2500,total:90000},sign:{month:1670,total:60000}};
export const deviceNames = {terminal:'단말기',multi:'멀티패드',sign:'서명패드',etc:'기타'};
export function freshSurvey(){
 return {clinic:'',region:'',district:'',contact:'',sales:'',pms:'',devices:{terminal:{use:true,type:'임대',rent:10000,manage:5000,pms:15000},multi:{use:false,type:'',rent:'',manage:'',pms:''},sign:{use:false,type:'',rent:'',manage:'',pms:''},etc:{use:false,type:'',rent:'',manage:'',pms:'',name:''}},paperType:'유상',paperYear:10000,paperUse:true,support:{inquiry:'불편',repair:'불편',visit:'없음'},contract:{van:'NICE',agency:'',term:'3년',expiry:'',cancel:'기기대금 3배',usage:'100건/월'},overrides:{},proposal:{},immediate:false,compliance:false};
}
export function normalizeSurvey(saved){
 const initial=freshSurvey();
 if(!saved?.devices?.terminal||!saved?.contract)return initial;
 const devices=Object.fromEntries(Object.entries(initial.devices).map(([k,d])=>[k,{...d,...saved.devices[k]}]));
 if(devices.multi.use&&devices.sign.use)devices.sign.use=false;
 for(const k of ['multi','sign']){
  if(!devices[k].use){devices[k]={...devices[k],type:'',rent:'',manage:'',pms:''};continue;}
  if(!devices[k].type)devices[k].type=devices[k].rent!==''&&devices[k].rent!=null&&amount(devices[k].rent)>0?'임대':'번들';
 }
 return {...initial,...saved,devices,contract:{...initial.contract,...saved.contract},proposal:saved.proposal||{}};
}
export function updateDevice(s,kind,key,value){
 const d={...s.devices[kind],[key]:value};
 const old=s.devices[kind];
 if(key==='type'&&old.rent!==''&&old.rent!=null&&['구입','임대'].includes(old.type)&&['구입','임대'].includes(value)&&old.type!==value)d.rent=value==='구입'?amount(old.rent)*36:amount(old.rent)/36;
 if(PAD_PRICES[kind]){
  if(key==='use'&&value===true&&!d.type)d.type='번들';
  if(key==='use'&&value===false){d.type='';d.rent='';d.manage='';d.pms='';}
  if(key==='rent'&&value!==''&&value!=null){d.use=true;if(d.type!=='구입'&&d.type!=='임대')d.type='임대';}
  if(key==='type'&&value==='번들')d.rent='';
 }
 if(key==='type')d.use=true;
 const devices={...s.devices,[kind]:d};
 if(PAD_PRICES[kind]&&d.use){const other=kind==='multi'?'sign':'multi';devices[other]={...devices[other],use:false,type:'',rent:'',manage:'',pms:''};}
 return {...s,devices,overrides:{}};
}
export function currentDeviceCost(d,key='rent'){
 if(!d.use)return 0;
 if(key==='rent')return d.type==='번들'?0:amount(d.rent)*(d.type==='구입'?1:36);
 return amount(d[key])*36;
}
export function updatePms(s,value){
 const devices=Object.fromEntries(Object.entries(s.devices).map(([key,d])=>[key,{...d,pms:key==='terminal'?value:''}]));
 return {...s,devices,overrides:{}};
}
export function paidPad(s,key){const d=s.devices[key];return Boolean(d?.use&&['구입','임대'].includes(d.type)&&d.rent!==''&&d.rent!=null);}
export function proposalDeviceCost(s,kind,key='rent',period='total'){
 if(PAD_PRICES[kind]&&!paidPad(s,kind))return '';
 const override=s.proposal?.[`${kind}_${key}_${period}`];
 if(override!==undefined&&override!=='')return amount(override);
 if(PAD_PRICES[kind])return paidPad(s,kind)?PAD_PRICES[kind][period]:'';
 const month=kind==='terminal'?{rent:7000,manage:3000,pms:0}[key]:'';
 return month===''?'':period==='month'?month:month*36;
}
export function calculateComparison(s){
 let gear=0,manage=0,pms=amount(s.devices.terminal.pms)*36,etc=0;
 for(const[k,d]of Object.entries(s.devices)){
  if(!d.use)continue;
  const cost=currentDeviceCost(d);
  if(k!=='terminal')pms+=currentDeviceCost(d,'pms');
  if(k==='etc')etc+=cost+currentDeviceCost(d,'manage');
  else {gear+=cost;manage+=currentDeviceCost(d,'manage');}
 }
 const o=s.overrides||{},v=(k,x)=>o[k]!==undefined&&o[k]!==''?amount(o[k]):x;
 gear=v('gear',gear);manage=v('manage',manage);pms=v('pms',pms);etc=v('etc',etc);
 const osGear=v('osGear',amount(proposalDeviceCost(s,'terminal'))+amount(proposalDeviceCost(s,'multi'))+amount(proposalDeviceCost(s,'sign')));
 const osManage=v('osManage',amount(proposalDeviceCost(s,'terminal','manage'))),osPms=v('osPms',amount(proposalDeviceCost(s,'terminal','pms')));
 const osEtc=v('osEtc',['rent','manage'].reduce((sum,k)=>sum+amount(proposalDeviceCost(s,'etc',k)),0));
 const currentBase=v('currentBase',gear+manage),osBase=v('osBase',osGear+osManage);
 const paper=v('paper',s.paperUse&&s.paperType==='유상'?amount(s.paperYear)*3:0),osPaper=v('osPaper',s.proposal?.paper_total!==undefined&&s.proposal.paper_total!==''?amount(s.proposal.paper_total):0);
 const ancillary=paper+pms,osAncillary=osPaper+osPms;
 const total=v('total',currentBase+etc+ancillary),osTotal=osBase+osEtc+osAncillary;
 return {gear,manage,pms,etc,osGear,osManage,osPms,osEtc,currentBase,osBase,paper,osPaper,ancillary,osAncillary,total,osTotal,saving:total-osTotal};
}
