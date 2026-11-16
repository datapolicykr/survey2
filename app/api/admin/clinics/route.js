import {createHash} from 'crypto';
const URL='https://ycuvlaviicecdhuigoyq.supabase.co',KEY='sb_publishable_IuRLd4C52USB8rc0VCZq8A_iRgluGbE';
const h=v=>createHash('sha256').update(v).digest('hex');
const token=req=>{const m=(req.headers.get('cookie')||'').match(/(?:^|; )van_v2_admin_session=([^;]+)/);return m?.[1]||''};
async function rpc(name,body){const r=await fetch(`${URL}/rest/v1/rpc/${name}`,{method:'POST',headers:{apikey:KEY,authorization:`Bearer ${KEY}`,'content-type':'application/json'},body:JSON.stringify(body),cache:'no-store'});const d=await r.json().catch(()=>null);return{r,d}}
export async function PATCH(req){const b=await req.json();const {r,d}=await rpc('van_v2_admin_update_clinic',{p_token_hash:h(token(req)),p_facility_key:String(b.facility_key||''),p_patch:b.patch||{}});if(!r.ok)return Response.json({error:'수정 권한이 없거나 세션이 만료되었습니다.'},{status:r.status===400?401:500});return Response.json({row:d})}
