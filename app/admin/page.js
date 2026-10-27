'use client';
import {useState} from 'react';

const field={padding:'8px',border:'1px solid #cbd5e1',borderRadius:6,boxSizing:'border-box'};
const button={...field,background:'#fff',cursor:'pointer',color:'#17324d'};
const labels={
 id:'응답 ID',created_at:'등록일시',dentist_name:'치과명',region:'지역',district:'구·군',van_company:'VAN사',
 devices:'결제기기',linked_services:'연동 서비스',inconveniences:'불편 사항',contract_type:'계약 형태',
 cost_items:'비용 항목',contract_terms:'계약 조건',improvement_items:'개선 요구',sales_rep:'영업사원',
 terminal_use_period:'약정기간',contract_end_date:'약정만료',monthly_cost:'월 기기비용 합계',management_fee:'월 관리비 합계',
 link_fee:'월 연동비 합계',current_pms:'PMS',current_van_dealer:'VAN 대리점',pms_integrated:'PMS 연동',
 result_type:'결과 유형',field_memo:'연락처·메모',survey_details:'설문 상세',
 draft:'설문 입력 원본',version:'데이터 버전',seed:'샘플 출처',clinic:'치과명',contact:'연락처',sales:'영업사원',pms:'PMS',
 terminal:'단말기',multi:'멀티패드',sign:'서명패드',etc:'기타 기기',use:'사용 여부',type:'계약 형태',rent:'기기 비용',
 manage:'관리비',name:'기타 기기 품목',paperType:'용지 비용 형태',paperYear:'연간 용지 비용',paperUse:'용지 사용',
 support:'고객 대응 현황',inquiry:'문의 응대',repair:'고장 수리',visit:'방문 점검',contract:'계약 조건',
 van:'VAN사',agency:'대리점',term:'약정기간',expiry:'약정만료',cancel:'중도해지 위약금',usage:'의무사용건수/월',
 expiryUnknown:'약정만료 모름',expired:'약정만료 지남',proposal:'오스템 제안 입력',overrides:'비교 비용 수정값',
 immediate:'즉시 비교안 희망',compliance:'준법 확인 필요',costDefaultsVersion:'비용 기본값 버전',
 terminal_rent_month:'단말기 비용 월',terminal_rent_total:'단말기 비용 3년',terminal_manage_month:'단말기 관리비 월',terminal_manage_total:'단말기 관리비 3년',
 terminal_pms_month:'PMS 연동비 월',terminal_pms_total:'PMS 연동비 3년',multi_rent_month:'멀티패드 비용 월',multi_rent_total:'멀티패드 비용 3년',
 sign_rent_month:'서명패드 비용 월',sign_rent_total:'서명패드 비용 3년',etc_rent_month:'기타 기기 비용 월',etc_rent_total:'기타 기기 비용 3년',
 etc_manage_month:'기타 관리비 월',etc_manage_total:'기타 관리비 3년',paper_total:'용지 비용 3년',
 gear:'현재 기기비',manage:'현재 관리비',pms:'현재 PMS 연동비',currentBase:'현재 기본비용',total:'현재 총비용',
 osGear:'오스템 기기비',osManage:'오스템 관리비',osPms:'오스템 PMS 연동비',osEtc:'오스템 기타 비용',osBase:'오스템 기본비용',paper:'현재 용지비',osPaper:'오스템 용지비'
};
function show(v){if(v===null||v===undefined||v==='')return '미입력';if(typeof v==='boolean')return v?'예':'아니요';if(Array.isArray(v))return v.length?v.map(x=>typeof x==='object'?JSON.stringify(x):String(x)).join(', '):'없음';return String(v)}
function Details({value}){if(!value||typeof value!=='object'||Array.isArray(value))return <span>{show(value)}</span>;const entries=Object.entries(value);if(!entries.length)return <span>별도 입력 없음</span>;return <div className="detail-grid">{entries.map(([k,v])=><div className="detail-item" key={k}><div className="detail-label">{labels[k]||k}</div>{v&&typeof v==='object'&&!Array.isArray(v)?<Details value={v}/>:<div className="detail-value">{show(v)}</div>}</div>)}</div>}
const columns=[['치과명','dentist_name'],['지역','region'],['구군','district'],['VAN','van_company'],['PMS','current_pms'],['영업사원','sales_rep'],['약정만료','contract_end_date'],['월사용료','monthly_cost'],['관리비','management_fee'],['연동비','link_fee'],['계약형태','contract_type'],['사용기간','terminal_use_period'],['연락처','field_memo']];
export default function Admin(){
 const[id,setId]=useState('admin'),[pw,setPw]=useState(''),[rows,setRows]=useState([]),[ok,setOk]=useState(false),[selected,setSelected]=useState(null),[edit,setEdit]=useState(null),[msg,setMsg]=useState(''),[query,setQuery]=useState('');
 async function load(){try{const q=await fetch('/api/admin/surveys',{cache:'no-store'});const d=await q.json();if(!q.ok)throw Error(d.error||'조회 실패');setRows(Array.isArray(d.rows)?d.rows:[]);setMsg('')}catch(e){setMsg(e.message)}}
 async function login(){try{const r=await fetch('/api/admin/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id,password:pw})});if(!r.ok){setMsg('로그인 실패');return}setOk(true);setPw('');setMsg('');await load()}catch{setMsg('로그인 연결에 실패했습니다.')}}
 async function save(){try{const r=await fetch('/api/admin/surveys',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify(edit)}),d=await r.json();if(!r.ok)throw Error(d.error||'저장 실패');setRows(v=>v.map(x=>x.id===edit.id?d.row:x));setEdit(null);setMsg('수정 내용을 저장했습니다.')}catch(e){setMsg(e.message)}}
 async function del(r){if(!confirm('이 설문을 삭제하시겠습니까?'))return;const q=await fetch('/api/admin/surveys',{method:'DELETE',headers:{'content-type':'application/json'},body:JSON.stringify({id:r.id})});const d=await q.json();if(q.ok&&d.ok){setRows(v=>v.filter(x=>x.id!==r.id));setMsg('삭제했습니다.')}else setMsg(d.error||'삭제하지 못했습니다.')}
 const filtered=rows.filter(r=>[r.dentist_name,r.region,r.district,r.sales_rep,r.van_company].some(x=>String(x||'').toLowerCase().includes(query.toLowerCase())));
 return <main className="admin"><style>{`
 .admin{max-width:1400px;margin:30px auto;padding:0 18px;font-family:"Malgun Gothic",Arial,sans-serif;color:#172b43}
 .admin h1{font-size:26px}.admin p{line-height:1.5}.tools{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
 .list-wrap{overflow:auto;border:1px solid #dce4ed;border-radius:8px;margin-top:16px}
 .list{width:100%;border-collapse:collapse;min-width:850px}.list th,.list td{padding:10px;border-bottom:1px solid #e8edf3;text-align:left;font-size:14px}
 .list th{background:#eef5fb;color:#294b6c;white-space:nowrap}.list tr:hover td{background:#f8fbfe}
 .backdrop{position:fixed;inset:0;background:#0009;display:flex;align-items:center;justify-content:center;padding:16px;z-index:20}
 .modal{background:#fff;border-radius:12px;width:min(1100px,100%);max-height:92vh;overflow:auto;padding:22px;box-sizing:border-box}
 .modal-head{display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap;position:sticky;top:-22px;background:white;z-index:1}
 .section-title{font-size:17px;color:#1b587e;border-bottom:2px solid #d6e5ef;padding-bottom:8px;margin:24px 0 12px}
 .detail-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:8px}
 .detail-item{background:#f6f9fc;border:1px solid #e3eaf1;border-radius:6px;padding:10px;min-width:0}
 .detail-item .detail-grid{grid-template-columns:repeat(auto-fit,minmax(160px,1fr));margin-top:8px}
 .detail-label{font-size:12px;color:#536c80;font-weight:bold;margin-bottom:5px}
 .detail-value{font-size:14px;white-space:pre-wrap;overflow-wrap:anywhere}
 .notice{color:#536c80;font-size:13px;background:#f4f7fb;padding:10px;border-radius:6px}
 .edit-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px}
 details pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px;background:#f4f6f8;padding:12px}
 `}</style><h1>설문 DB 관리</h1>{!ok?<div><input style={field} value={id} onChange={e=>setId(e.target.value)} placeholder="ID" aria-label="아이디"/> <input style={field} type="password" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==='Enter'&&login()} placeholder="비밀번호" aria-label="비밀번호"/> <button style={button} onClick={login}>로그인</button><p role="status">{msg}</p></div>:<>
 <div className="tools"><b>전체 {rows.length}건</b><input style={field} placeholder="치과명·지역·영업사원 검색" aria-label="설문 검색" value={query} onChange={e=>setQuery(e.target.value)}/><span>표시 {filtered.length}건</span><button style={button} onClick={load}>새로고침</button><a href="/">대시보드로</a></div><p role="status">{msg}</p>
 <div className="list-wrap"><table className="list"><thead><tr>{['치과명','지역','VAN사','PMS','영업사원','약정만료','관리'].map(x=><th key={x}>{x}</th>)}</tr></thead><tbody>{filtered.map(r=><tr key={r.id}><td>{show(r.dentist_name)}</td><td>{[r.region,r.district].filter(Boolean).join(' ')||'미입력'}</td><td>{show(r.van_company)}</td><td>{show(r.current_pms)}</td><td>{show(r.sales_rep)}</td><td>{show(r.contract_end_date)}</td><td><button style={button} onClick={()=>setSelected(r)}>전체 내용</button>{' '}<button style={button} onClick={()=>setEdit({...r})}>수정</button>{' '}<button style={button} onClick={()=>del(r)}>삭제</button></td></tr>)}</tbody></table></div></>}
 {selected&&<div className="backdrop" role="presentation"><div className="modal" role="dialog" aria-modal="true" aria-label="설문 전체 내용"><div className="modal-head"><h2>설문 전체 내용 · {selected.dentist_name}</h2><button style={button} onClick={()=>setSelected(null)}>닫기</button></div>
 <p className="notice">DB에 저장된 내용을 표시합니다. 미입력·별도 입력 없는 항목은 저장된 값 기준입니다.</p>
 <h3 className="section-title">기본 정보 및 집계</h3><Details value={Object.fromEntries(Object.entries(selected).filter(([k])=>!['survey_details','devices','linked_services','inconveniences','cost_items','contract_terms','improvement_items'].includes(k)))}/>
 <h3 className="section-title">저장된 기기·비용·계약·요구 사항</h3><Details value={Object.fromEntries(['devices','linked_services','inconveniences','cost_items','contract_terms','improvement_items'].map(k=>[k,selected[k]]))}/>
 <h3 className="section-title">설문 상세 입력</h3>{selected.survey_details?.draft?<><p className="notice">기기 비용은 구입이면 일시금, 임대이면 월 금액으로 저장됩니다. 제안 입력과 비교 수정값은 직접 입력되어 저장된 항목을 표시합니다.</p><Details value={selected.survey_details.draft}/></>:<p className="notice">이 응답에는 항목별 설문 원본이 저장되어 있지 않습니다. 위의 저장 항목과 아래의 추가 데이터를 확인해 주세요.</p>}
 <h3 className="section-title">추가 저장 데이터</h3><Details value={Object.fromEntries(Object.entries(selected.survey_details||{}).filter(([k])=>k!=='draft'))}/>
 <details><summary>원본 데이터 전체 보기</summary><pre>{JSON.stringify(selected,null,2)}</pre></details></div></div>}
 {edit&&<div className="backdrop" role="presentation"><div className="modal" role="dialog" aria-modal="true" aria-label="설문 기본정보 수정"><div className="modal-head"><h2>기본정보 수정</h2><button style={button} onClick={()=>setEdit(null)}>닫기</button></div><p className="notice">아래 기본 항목을 수정합니다. 설문 상세 원본은 전체 내용에서 확인할 수 있습니다.</p><div className="edit-grid">{columns.map(([l,k])=><label key={k}><small>{l}</small><input style={{...field,width:'100%'}} value={edit[k]??''} onChange={e=>setEdit(v=>({...v,[k]:e.target.value}))}/></label>)}</div><p><button style={button} onClick={save}>저장</button></p></div></div>}
 </main>
}
