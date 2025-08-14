import { store, ensureDefaults, writeJSON, json, unauthorized, requireAdmin } from './_lib/common.mjs';

function pick(cf, name){
  if(!Array.isArray(cf)) return null;
  const item = cf.find(x => x && x.name === name);
  if(!item) return null;
  if(item.display_value !== undefined && item.display_value !== null) return item.display_value;
  if(item.enum_value && item.enum_value.name) return item.enum_value.name;
  if(item.number_value !== undefined && item.number_value !== null) return item.number_value;
  return null;
}

function simplify(task){
  const out = {
    id: task.gid,
    name: task.name,
    completed: !!task.completed,
    due_on: task.due_on || null,
    start_on: task.start_on || null,
    section: task.memberships?.[0]?.section?.name || null,
    project: task.memberships?.[0]?.project?.name || task.projects?.[0]?.name || null,
    url: task.permalink_url || null,
    notes: task.notes || null,
    assignee: task.assignee?.name || pick(task.custom_fields, 'Assignee (imported)'),
    workload_hrs: Number(pick(task.custom_fields, 'Approx. Workload (hrs)')) || null,
    budget_code: pick(task.custom_fields, 'Budget Code') || null,
    money_spent: Number(pick(task.custom_fields, 'Money Spent')) || null
  };
  if (Array.isArray(task.subtasks) && task.subtasks.length){
    out.subtasks = task.subtasks.map(simplify);
  }
  return out;
}

export async function handler(event){
  if (event.httpMethod === 'OPTIONS') return { statusCode:204, headers:{ 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Headers':'Content-Type, X-Admin-Secret' } };
  if (event.httpMethod !== 'POST') return json({ error:'Method not allowed' }, 405);
  if (!requireAdmin(event)) return unauthorized();

  await ensureDefaults();

  let body;
  try{
    body = JSON.parse(event.body || '{}');
  }catch(e){
    return json({ error:'Invalid JSON body' }, 400);
  }

  const arr = Array.isArray(body.data) ? body.data : Array.isArray(body) ? body : [];
  const simplified = arr.map(simplify);

  await writeJSON('tasks/all.json', simplified);
  const ts = Date.now();
  await store.setJSON(`tasks/raw/${ts}.json`, body);

  return json({ ok:true, count: simplified.length, archived_key: `tasks/raw/${ts}.json` });
}