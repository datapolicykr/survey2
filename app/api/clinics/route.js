const URL='https://ycuvlaviicecdhuigoyq.supabase.co';
const KEY='sb_publishable_IuRLd4C52USB8rc0VCZq8A_iRgluGbE';
export async function GET(){try{const r=await fetch(URL+'/rest/v1/rpc/van_v2_clinic_breakdown',{method:'POST',headers:{apikey:KEY,authorization:'Bearer '+KEY,'content-type':'application/json'},body:'{}',cache:'no-store'});if(!r.ok)return Response.json({error:'병원 집계 조회 실패'},{status:502});return Response.json(await r.json(),{headers:{'Cache-Control':'no-store'}})}catch{return Response.json({error:'병원 집계 연결 실패'},{status:502})}}
