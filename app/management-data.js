const MAX_AGE = 30_000;
let cached = null;
let pending = null;
let generation = 0;

// Shared only inside this browser session. Explicit refresh and saves bypass it.
export function cachedManagementRows(revision = 0) {
 return cached?.revision === revision && Date.now() - cached.at < MAX_AGE ? cached.rows : null;
}

export function loadManagementRows({revision = 0, force = false} = {}) {
 const rows = cachedManagementRows(revision);
 if (!force && rows) return Promise.resolve(rows);
 if (!force && pending?.revision === revision) return pending.promise;
 const current = ++generation;
 const promise = (async () => {
  const response = await fetch('/api/management', {cache:'no-store'});
  const data = await response.json();
  if (!response.ok || !Array.isArray(data)) throw new Error(data?.error || '관리 현황 조회 실패');
  if (current === generation) cached = {rows:data, revision, at:Date.now()};
  return data;
 })().finally(() => { if (pending?.promise === promise) pending = null; });
 pending = {revision, promise};
 return promise;
}
