import { ensureDefaults, readJSON, json } from './_lib/common.mjs';
export async function handler(event){
  if (event.httpMethod !== 'GET') return json({ error:'Method not allowed'}, 405);
  await ensureDefaults();
  const tasks = await readJSON('tasks/all.json', []);
  return json({ tasks });
}