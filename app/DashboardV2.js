'use client';

import { useEffect, useState } from 'react';

export default function DashboardV2() {
  const [active, setActive] = useState(false);
  const [rows, setRows] = useState([]);
  const [rep, setRep] = useState('');

  async function load() {
    try {
      const response = await fetch('/api/surveys', { cache: 'no-store' });
      const data = await response.json();
      setRows(Array.isArray(data) ? data : []);
    } catch {
      setRows([]);
    }
  }

  useEffect(() => {
    const checkTab = () => {
      const button = document.querySelector('.tabs button:nth-child(3)');
      setActive(Boolean(button && button.classList.contains('on')));
    };
    checkTab();
    load();
    document.addEventListener('click', checkTab);
    return () => document.removeEventListener('click', checkTab);
  }, []);

  if (!active) return null;

  const reps = Array.from(new Set(rows.map((row) => row.sales_rep).filter(Boolean))).sort();
  const data = rep ? rows.filter((row) => row.sales_rep === rep) : rows;

  function downloadCsv() {
    const columns = ['dentist_name', 'region', 'district', 'van_company', 'current_pms', 'sales_rep', 'contract_end_date'];
    const quote = (value) => '"' + String(value ?? '').replaceAll('"', '""') + '"';
    const lines = [columns, ...data.map((row) => columns.map((key) => row[key]))];
    const text = '\ufeff' + lines.map((line) => line.map(quote).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `VAN_설문_${rep || '전체'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const box = { border: '1px solid #ddd', borderRadius: 10, padding: 14, background: '#fff' };
  const control = { border: '1px solid #ccc', borderRadius: 7, padding: '8px 10px', background: '#fff' };

  return (
    <section style={{ width: 'min(1180px, calc(100vw - 30px))', margin: '-760px auto 40px', position: 'relative', zIndex: 20, background: '#fff', minHeight: 760, padding: 20, boxSizing: 'border-box', fontFamily: 'Arial, Malgun Gothic, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0 }}>VAN 설문 대시보드</h2>
          <small>V2 전용 DB 실시간 연동</small>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select style={control} value={rep} onChange={(event) => setRep(event.target.value)}>
            <option value="">전체 영업사원</option>
            {reps.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
          <button style={control} type="button" onClick={downloadCsv}>엑셀 내려받기</button>
          <a style={{ ...control, color: '#222', textDecoration: 'none' }} href="/admin">Admin</a>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, margin: '18px 0' }}>
        <div style={box}><small>총 조사</small><b style={{ display: 'block', fontSize: 28 }}>{data.length}</b></div>
        <div style={box}><small>영업사원</small><b style={{ display: 'block', fontSize: 28 }}>{rep ? 1 : reps.length}</b></div>
        <div style={box}><small>지역</small><b style={{ display: 'block', fontSize: 28 }}>{new Set(data.map((row) => row.region).filter(Boolean)).size}</b></div>
        <div style={box}><small>약정정보</small><b style={{ display: 'block', fontSize: 28 }}>{data.filter((row) => row.contract_end_date).length}</b></div>
      </div>

      <h3>공략 리스트</h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead><tr>{['치과명', '지역', 'VAN', 'PMS', '영업사원', '약정만료'].map((label) => <th key={label} style={{ padding: 8, background: '#f3f3f3', borderBottom: '1px solid #ddd' }}>{label}</th>)}</tr></thead>
          <tbody>{data.map((row) => <tr key={row.id}><td style={{ padding: 8 }}>{row.dentist_name}</td><td style={{ padding: 8 }}>{row.region} {row.district}</td><td style={{ padding: 8 }}>{row.van_company}</td><td style={{ padding: 8 }}>{row.current_pms}</td><td style={{ padding: 8 }}>{row.sales_rep}</td><td style={{ padding: 8 }}>{row.contract_end_date || '-'}</td></tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}
