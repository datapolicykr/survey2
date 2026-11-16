const URL='https://ycuvlaviicecdhuigoyq.supabase.co';
const KEY='sb_publishable_IuRLd4C52USB8rc0VCZq8A_iRgluGbE';
export async function POST(req){try{
 const b=await req.json();const keys=Array.isArray(b.facility_keys)?b.facility_keys.slice(0,50):[];
 const r=await fetch(URL+'/rest/v1/rpc/van_v2_latest_survey_details',{method:'POST',headers:{apikey:KEY,authorization:'Bearer '+KEY,'content-type':'application/json'},body:JSON.stringify({p_facility_keys:keys}),cache:'no-store'});
 const d=await r.json().catch(()=>null);
 if(!r.ok||!Array.isArray(d))return Response.json({error:'설문 상세 조회 실패'},{status:502});
 return Response.json(d,{headers:{'Cache-Control':'no-store'}});
}catch{return Response.json({error:'설문 상세 연결 실패'},{status:502})}}
