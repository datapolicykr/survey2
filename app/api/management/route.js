import {streamedJson} from '../json-stream';
import {readManagementPages} from './read-pages';
export const runtime='nodejs';
export const maxDuration=60;
export async function GET(request){try{
 const d=await readManagementPages();
 return streamedJson(d,request);
}catch(error){console.error('V2 management read:',error.message);return Response.json({error:'병원 관리 현황 연결 실패'},{status:502})}}
