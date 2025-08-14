import { getStore } from '@netlify/blobs';

export const store = getStore('carleton');

export async function readJSON(key, fallback){
  try{
    const data = await store.getJSON(key);
    return (data === null || typeof data === 'undefined') ? fallback : data;
  }catch(e){
    return fallback;
  }
}

export async function writeJSON(key, data){
  await store.setJSON(key, data);
}

export function json(body, status=200, headers={}){
  return {
    statusCode: status,
    headers: {
      'Content-Type':'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Secret',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      ...headers
    },
    body: JSON.stringify(body)
  };
}

export function noContent(){
  return { statusCode:204, headers: { 'Access-Control-Allow-Origin':'*' }, body:'' };
}

export function unauthorized(){
  return json({ error: 'Unauthorized' }, 401);
}

export function methodNotAllowed(){
  return json({ error: 'Method not allowed' }, 405);
}

export function requireAdmin(event){
  const secret = process.env.ADMIN_SECRET;
  const provided = event.headers['x-admin-secret'] || event.headers['X-Admin-Secret'];
  return !!secret && provided === secret;
}

export async function ensureDefaults(){
  const defaults = [
    ['tasks/all.json', []],
    ['hosts/list.json', []],
    ['budget/items.json', []],
    ['docs/list.json', []],
    ['comms/list.json', []]
  ];
  for (const [key, fallback] of defaults){
    const exists = await store.get(key);
    if (exists === null) await store.setJSON(key, fallback);
  }
}