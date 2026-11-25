import {rpc,hash,cookie} from '../access';
export async function POST(req){try{const b=await req.json();const {r,d}=await rpc('van_v2_review_external',{p_token_hash:hash(cookie(req)),p_facility_key:b.facility_key,p_response_id:b.response_id||null});return r.ok?Response.json(d):Response.json({error:'담당병원 확인 권한이 없습니다.'},{status:401})}catch{return Response.json({error:'응답 조회 실패'},{status:502})}}
