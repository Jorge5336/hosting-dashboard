import { ensureDefaults, readJSON, writeJSON, json, unauthorized, requireAdmin } from './_lib/common.mjs';
export async function handler(event){
  await ensureDefaults();
  if (event.httpMethod === 'GET'){
    const list = await readJSON('docs/list.json', []);
    return json({ list });
  }
  if (event.httpMethod === 'POST'){
    if (!requireAdmin(event)) return unauthorized();
    const body = JSON.parse(event.body || '{}');
    const list = await readJSON('docs/list.json', []);
    list.push({ id: Date.now().toString(36), title: body.title, url: body.url, ts: Date.now() });
    await writeJSON('docs/list.json', list);
    return json({ ok:true });
  }
  return json({ error:'Method not allowed' }, 405);
}