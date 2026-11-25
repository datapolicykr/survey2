'use client';
import {use,useEffect,useState} from 'react';
import SurveyTab from '../../SurveyTab';
import {freshSurvey} from '../../survey-costs';
import '../../survey-tab.css';
import './respond.css';
export default function Respond({params}){const {token}=use(params);const [s,setS]=useState(null),[message,setMessage]=useState('설문을 불러오는 중…'),[saving,setSaving]=useState(false),[done,setDone]=useState(false),[consent,setConsent]=useState(false);
useEffect(()=>{let active=true;fetch('/api/invitations?token='+encodeURIComponent(token)).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error);if(active){setS({...freshSurvey(),...d});setMessage('')}}).catch(e=>active&&setMessage(e.message));return()=>{active=false}},[token]);
async function submit(){setSaving(true);setMessage('');try{const r=await fetch('/api/surveys',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({draft:s,invitation:token})});const d=await r.json();if(!r.ok)throw Error(d.error);setDone(true);setMessage('응답이 접수되었습니다. 감사합니다. 담당 영업사원이 확인하겠습니다.')}catch(e){setMessage(e.message)}finally{setSaving(false)}}
if(done||!s)return <main className="external-message" role="status">{message}</main>;
return <main className="external-survey"><div className="external-intro"><h1>{s.clinic} 설문</h1><p>기본값이 미리 입력되어 있습니다. 병원의 실제 이용 현황에 맞게 확인·수정해 주세요. 응답은 오스템의 카드결제서비스 조사·상담에 사용됩니다.</p></div><SurveyTab s={s} change={setS} external/><section className="external-actions"><label><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/> 작성한 응답을 담당 영업사원에게 전달하는 데 동의합니다.</label><button className="primary" disabled={saving||!consent} onClick={submit}>{saving?'제출 중…':'설문 제출'}</button><p role="status">{message}</p></section></main>}
