const URL='https://ycuvlaviicecdhuigoyq.supabase.co';
const KEY='sb_publishable_IuRLd4C52USB8rc0VCZq8A_iRgluGbE';
const PAGE_SIZE=1000;

async function rpc(name,body){
 const response=await fetch(`${URL}/rest/v1/rpc/${name}`,{method:'POST',headers:{apikey:KEY,authorization:`Bearer ${KEY}`,'content-type':'application/json'},body:JSON.stringify(body),cache:'no-store',signal:AbortSignal.timeout(15000)});
 const data=await response.json();
 if(!response.ok)throw new Error(`V2 read failed: ${response.status} ${data?.code||''}`);
 return data;
}

export async function readManagementPages(){
 const counts=await rpc('van_v2_clinic_counts',{});
 if(!Number.isSafeInteger(counts?.total)||counts.total<0||counts.total>1000000)throw new Error('Invalid clinic count');
 const pages=new Array(Math.ceil(counts.total/PAGE_SIZE));
 let next=0;
 async function worker(){
  while(next<pages.length){
   const index=next++;
   const rows=await rpc('van_v2_management_clinics_page',{p_offset:index*PAGE_SIZE,p_limit:PAGE_SIZE});
   if(!Array.isArray(rows)||rows.length!==Math.min(PAGE_SIZE,counts.total-index*PAGE_SIZE))throw new Error('Incomplete clinic page');
   pages[index]=rows;
  }
 }
 await Promise.all(Array.from({length:Math.min(4,pages.length)},()=>worker()));
 const rows=pages.flat();
 if(new Set(rows.map(row=>row.facility_key)).size!==counts.total)throw new Error('Inconsistent clinic pages');
 return rows;
}
