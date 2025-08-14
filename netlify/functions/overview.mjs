import { ensureDefaults, readJSON, json } from './_lib/common.mjs';

export async function handler(event){
  if (event.httpMethod !== 'GET') {
    return json({ error: 'Method not allowed' }, 405);
  }
  await ensureDefaults();
  const tasks = await readJSON('tasks/all.json', []);
  const hosts = await readJSON('hosts/list.json', []);
  const budget = await readJSON('budget/items.json', []);

  const tasks_done = tasks.filter(t => !!t.completed).length;
  const tasks_open = tasks.length - tasks_done;
  const hosts_total = hosts.length;
  const budget_used = budget.reduce((sum,it)=> sum + (Number(it.amount)||0), 0);
  const budget_used_fmt = `$${budget_used.toFixed(2)}`;

  const recent_tasks = tasks.slice(-10).reverse();
  const recent_hosts = hosts.slice(-10).reverse();

  return json({ tasks_done, tasks_open, hosts_total, budget_used, budget_used_fmt, recent_tasks, recent_hosts });
}