import { ensureDefaults, readJSON, json, unauthorized, requireAdmin } from './_lib/common.mjs';
export async function handler(event){
  if (event.httpMethod !== 'GET') return json({ error:'Method not allowed' }, 405);
  if (!requireAdmin(event)) return unauthorized();
  await ensureDefaults();
  const [tasks, hosts, budget, docs, comms] = await Promise.all([
    readJSON('tasks/all.json', []),
    readJSON('hosts/list.json', []),
    readJSON('budget/items.json', []),
    readJSON('docs/list.json', []),
    readJSON('comms/list.json', [])
  ]);
  return json({ tasks, hosts, budget, docs, comms, exported_at: new Date().toISOString() });
}