import { ensureDefaults, readJSON, json } from './_lib/common.mjs';
export async function handler(event){
  if (event.httpMethod !== 'GET') return json({ error:'Method not allowed'}, 405);
  await ensureDefaults();
  let hosts = await readJSON('hosts/list.json', []);
  const qs = event.queryStringParameters || {};
  if (qs.status) hosts = hosts.filter(h => (h.status||'').toLowerCase() === qs.status.toLowerCase());
  if (qs.q){
    const q = qs.q.toLowerCase();
    hosts = hosts.filter(h => (h.name||'').toLowerCase().includes(q) || (h.email||'').toLowerCase().includes(q));
  }
  return json({ hosts });
}