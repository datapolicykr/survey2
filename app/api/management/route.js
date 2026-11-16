const URL='https://ycuvlaviicecdhuigoyq.supabase.co';
const KEY='sb_publishable_IuRLd4C52USB8rc0VCZq8A_iRgluGbE';
export async function GET(){try{
 const r=await fetch(URL+'/rest/v1/rpc/van_v2_management_clinics',{method:'POST',headers:{apikey:KEY,authorization:'Bearer '+KEY,'content-type':'application/json'},body:'{}',cache:'no-store'});
 const d=await r.json().catch(()=>null);
 if(!r.ok||!Array.isArray(d))return Response.json({error:'병원 관리 현황 조회 실패'},{status:502});
 return Response.json(d,{headers:{'Cache-Control':'no-store'}});
}catch{return Response.json({error:'병원 관리 현황 연결 실패'},{status:502})}}
