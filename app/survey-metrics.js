const amount=value=>{
 if(value===null||value===undefined||String(value).trim()==='')return null;
 const text=String(value).replace(/[₩원,\s]/g,'');
 return /^\d+(?:\.\d+)?$/.test(text)?Number(text):null;
};
function longTerm(value){
 const text=String(value??'').replace(/\s/g,'');
 if(!text||/모름|미입력/.test(text))return false;
 const range=text.match(/^(\d+(?:\.\d+)?)\s*[~～\-–]\s*(\d+(?:\.\d+)?)(년|개월)/);
 if(range)return Number(range[1])*(range[3]==='년'?12:1)>36;
 const years=text.match(/(\d+(?:\.\d+)?)년/),months=text.match(/(\d+(?:\.\d+)?)개월/);
 if(!years&&!months)return false;
 const duration=(years?Number(years[1])*12:0)+(months?Number(months[1]):0);
 return duration>36||(duration===36&&/초과/.test(text));
}
function allCostsZero(row){
 const draft=row.survey_details?.draft;
 if(draft?.devices){
  const active=Object.values(draft.devices).filter(d=>d.use);
  if(!active.length)return false;
  const costs=active.flatMap(d=>[d.type==='번들'?0:amount(d.rent),amount(d.manage),amount(d.pms)]);
  costs.push(draft.paperUse&&draft.paperType!=='무상'?amount(draft.paperYear):0);
  for(const key of ['gear','manage','pms','etc','paper','currentBase','total']){
   const value=draft.overrides?.[key];
   if(value!==undefined&&value!=='')costs.push(amount(value));
  }
  return costs.every(v=>v!==null&&v===0);
 }
 const costs=[row.monthly_cost,row.management_fee,row.link_fee].map(amount);
 for(const key of ['paper_cost','other_cost']){
  if(row[key]!==undefined&&row[key]!==null&&row[key]!=='')costs.push(amount(row[key]));
 }
 return costs.every(v=>v!==null&&v===0);
}
export function needsCompliance(row){
 const term=row.terminal_use_period||row.survey_details?.draft?.contract?.term||'';
 return allCostsZero(row)||longTerm(term);
}
