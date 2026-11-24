import test from 'node:test';
import assert from 'node:assert/strict';
import {gunzipSync} from 'node:zlib';
import {streamedJson} from '../app/api/json-stream.js';
import {cachedManagementRows,loadManagementRows} from '../app/management-data.js';
import {readManagementPages} from '../app/api/management/read-pages.js';

test('large streamed responses preserve every value and Unicode boundary', async () => {
 const rows = Array.from({length:19681},(_,i)=>({facility_key:String(i),facility_name:'치과😀',memo:'x'.repeat(240),plan:null,completed:false}));
 // Force a surrogate pair across a chunk boundary as well.
 rows[0].memo='x'.repeat(32700)+'😀'.repeat(40);
 assert.ok(Buffer.byteLength(JSON.stringify(rows))>4_500_000);
 for (const encoding of ['gzip','identity','gzip;q=0']) {
  const response = streamedJson(rows,new Request('https://example.test',{headers:{'accept-encoding':encoding}}));
  const bytes=Buffer.from(await response.arrayBuffer());
  assert.equal(response.headers.get('cache-control'),'no-store');
  if(encoding==='gzip') {
   assert.equal(response.headers.get('content-encoding'),'gzip');
   assert.ok(bytes.length<4_500_000);
   assert.deepEqual(JSON.parse(gunzipSync(bytes)),rows);
  } else {
   assert.equal(response.headers.get('content-encoding'),null);
   assert.deepEqual(JSON.parse(bytes),rows);
  }
 }
});

test('bounded pages keep every clinic in order and reject missing or duplicate rows', async () => {
 const original=globalThis.fetch;
 let active=0,maximum=0,mode='ok';
 globalThis.fetch=async(url,options)=>{
  if(url.endsWith('/van_v2_clinic_counts'))return Response.json({total:4501});
  active++;maximum=Math.max(maximum,active);
  await new Promise(resolve=>setTimeout(resolve,2));active--;
  const {p_offset,p_limit}=JSON.parse(options.body);
  let rows=Array.from({length:Math.min(p_limit,4501-p_offset)},(_,i)=>({facility_key:String(p_offset+i)}));
  if(mode==='missing'&&p_offset===1000)rows.pop();
  if(mode==='duplicate'&&p_offset===1000)rows[0].facility_key='0';
  return Response.json(rows);
 };
 try {
  const rows=await readManagementPages();
  assert.equal(rows.length,4501);assert.equal(rows[4500].facility_key,'4500');assert.ok(maximum<=4);
  mode='missing';await assert.rejects(readManagementPages(),/Incomplete/);
  mode='duplicate';await assert.rejects(readManagementPages(),/Inconsistent/);
 } finally {globalThis.fetch=original;}
});

test('tabs share in-flight and recent reads; refresh, revision and failures stay fresh', async () => {
 const original=globalThis.fetch;
 let calls=0,fail=false;
 globalThis.fetch=async()=>{calls++;await new Promise(resolve=>setTimeout(resolve,5));return Response.json(fail?{error:'failed'}:[{facility_key:String(calls)}],{status:fail?502:200})};
 try {
  const [a,b]=await Promise.all([loadManagementRows(),loadManagementRows()]);
  assert.equal(calls,1);assert.equal(a,b);
  assert.equal(await loadManagementRows(),a);assert.equal(calls,1);
  await loadManagementRows({force:true});assert.equal(calls,2);
  await loadManagementRows({revision:1});assert.equal(calls,3);
  assert.equal(cachedManagementRows(0),null);
  fail=true;await assert.rejects(loadManagementRows({revision:2}),/failed/);
  fail=false;await loadManagementRows({revision:2});assert.equal(calls,5);
 } finally {globalThis.fetch=original;}
});
