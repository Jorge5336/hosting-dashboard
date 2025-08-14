import { ensureDefaults, readJSON, writeJSON, json, unauthorized, requireAdmin } from './_lib/common.mjs';
export async function handler(event){
  await ensureDefaults();
  if (event.httpMethod === 'GET'){
    const items = await readJSON('budget/items.json', []);
    return json({ items });
  }
  if (event.httpMethod === 'POST'){
    if (!requireAdmin(event)) return unauthorized();
    const body = JSON.parse(event.body || '{}');
    const items = await readJSON('budget/items.json', []);
    items.push({ id: Date.now().toString(36), description: body.description, amount: Number(body.amount)||0, ts: Date.now() });
    await writeJSON('budget/items.json', items);
    return json({ ok:true });
  }
  return json({ error:'Method not allowed' }, 405);
}