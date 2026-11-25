import {createHash} from 'crypto';
export const hash=v=>createHash('sha256').update(v).digest('hex');
export const cookie=req=>(req.headers.get('cookie')||'').match(/(?:^|; )van_v2_admin_session=([^;]+)/)?.[1]||'';
export async function rpc(name,body){const key='sb_publishable_IuRLd4C52USB8rc0VCZq8A_iRgluGbE';const r=await fetch('https://ycuvlaviicecdhuigoyq.supabase.co/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:key,authorization:'Bearer '+key,'content-type':'application/json'},body:JSON.stringify(body),cache:'no-store'});const d=await r.json().catch(()=>null);return {r,d}}
