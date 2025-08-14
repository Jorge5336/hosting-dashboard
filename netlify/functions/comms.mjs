import { ensureDefaults, readJSON, writeJSON, json, unauthorized, requireAdmin } from './_lib/common.mjs';
export async function handler(event){
  await ensureDefaults();
  if (event.httpMethod === 'GET'){
    const list = await readJSON('comms/list.json', []);
    return json({ list });
  }
  if (event.httpMethod === 'POST'){
    if (!requireAdmin(event)) return unauthorized();
    const body = JSON.parse(event.body || '{}');
    const list = await readJSON('comms/list.json', []);
    list.push({ id: Date.now().toString(36), channel: body.channel, note: body.note, ts: Date.now() });
    await writeJSON('comms/list.json', list);
    return json({ ok:true });
  }
  return json({ error:'Method not allowed' }, 405);
}