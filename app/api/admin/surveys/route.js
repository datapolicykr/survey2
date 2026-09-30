import {createHash} from 'crypto';
const URL='https://ycuvlaviicecdhuigoyq.supabase.co',KEY='sb_publishable_IuRLd4C52USB8rc0VCZq8A_iRgluGbE';
const h=v=>createHash('sha256').update(v).digest('hex');
const token=req=>{const m=(req.headers.get('cookie')||'').match(/(?:^|; )van_v2_admin_session=([^;]+)/);return m?.[1]||''};
async function rpc(name,body){const r=await fetch(`${URL}/rest/v1/rpc/${name}`,{method:'POST',headers:{apikey:KEY,authorization:`Bearer ${KEY}`,'content-type':'application/json'},body:JSON.stringify(body),cache:'no-store'});const d=await r.json().catch(()=>null);return{r,d}}
export async function GET(req){const {r,d}=await rpc('van_v2_admin_rows',{p_token_hash:h(token(req))});if(!r.ok)return Response.json({error:'관리자 인증이 필요합니다.'},{status:401});return Response.json({rows:d})}
export async function PATCH(req){const b=await req.json();const {r,d}=await rpc('van_v2_admin_update',{p_token_hash:h(token(req)),p_id:b.id,p_patch:b});if(!r.ok)return Response.json({error:'수정 실패'},{status:r.status===400?401:500});return Response.json({row:d})}
export async function DELETE(req){const b=await req.json();const {r,d}=await rpc('van_v2_admin_delete',{p_token_hash:h(token(req)),p_id:b.id});if(!r.ok)return Response.json({error:'삭제 실패'},{status:r.status===400?401:500});return Response.json({ok:d===true})}
