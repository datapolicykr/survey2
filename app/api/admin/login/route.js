import {createHash} from 'crypto';
const URL='https://ycuvlaviicecdhuigoyq.supabase.co';
const KEY='sb_publishable_IuRLd4C52USB8rc0VCZq8A_iRgluGbE';
const h=v=>createHash('sha256').update(v).digest('hex');
async function rpc(name,body){return fetch(`${URL}/rest/v1/rpc/${name}`,{method:'POST',headers:{apikey:KEY,authorization:`Bearer ${KEY}`,'content-type':'application/json'},body:JSON.stringify(body),cache:'no-store'})}
export async function POST(req){const b=await req.json();const token=crypto.randomUUID()+crypto.randomUUID();const r=await rpc('van_v2_admin_login',{p_id:b.id||'',p_pw:b.password||'',p_token_hash:h(token)});const ok=await r.json().catch(()=>false);if(!r.ok||ok!==true)return Response.json({error:'로그인 실패'},{status:401});const res=Response.json({ok:true});res.headers.set('Set-Cookie',`van_v2_admin_session=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=43200`);return res}
export async function DELETE(){const res=Response.json({ok:true});res.headers.set('Set-Cookie','van_v2_admin_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0');return res}
