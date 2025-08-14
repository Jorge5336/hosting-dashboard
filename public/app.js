const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const state = {
  secret: sessionStorage.getItem('adminSecret') || ''
};

const api = async (path, opts={}) => {
  const headers = Object.assign({
    'Content-Type':'application/json'
  }, opts.headers || {});
  if (state.secret) headers['X-Admin-Secret'] = state.secret;
  const res = await fetch(`/api/${path}`, { ...opts, headers });
  if (res.status === 204) return null;
  const text = await res.text();
  try{
    return JSON.parse(text);
  }catch(e){
    throw new Error(`Bad JSON from ${path}: ` + text.slice(0,200));
  }
};

async function loadAll(){
  try{
    const overview = await api('overview');
    $('#error-panel').classList.add('hidden');

    $('#kpi-tasks-open').textContent = overview.tasks_open;
    $('#kpi-tasks-done').textContent = overview.tasks_done;
    $('#kpi-hosts').textContent = overview.hosts_total;
    $('#kpi-budget').textContent = overview.budget_used_fmt;

    const tbody = $('#tasks-table tbody');
    tbody.innerHTML = '';
    overview.recent_tasks.forEach(t => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td><a href="${t.url || '#'}" target="_blank" rel="noopener">${escapeHtml(t.name)}</a></td>
                      <td>${escapeHtml(t.section || '')}</td>
                      <td>${t.due_on || ''}</td>
                      <td>${t.completed ? 'Done' : 'Open'}</td>`;
      tbody.appendChild(tr);
    });

    const htbody = $('#hosts-table tbody');
    htbody.innerHTML = '';
    overview.recent_hosts.forEach(h => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${escapeHtml(h.name || '')}</td>
                      <td>${escapeHtml(h.email || '')}</td>
                      <td>${escapeHtml(h.status || '')}</td>
                      <td>${escapeHtml(h.class_year || '')}</td>`;
      htbody.appendChild(tr);
    });

  }catch(e){
    console.warn(e);
    $('#error-panel').classList.remove('hidden');
  }
}

function escapeHtml(str){
  return (str ?? '').toString()
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;');
}

function openAdmin(){ $('#admin-modal').classList.remove('hidden'); $('#admin-secret').focus(); }
function closeAdmin(){ $('#admin-modal').classList.add('hidden'); }

$('#open-admin').addEventListener('click', openAdmin);
$('#error-open-admin').addEventListener('click', openAdmin);
$('#close-admin').addEventListener('click', closeAdmin);
$('#retry').addEventListener('click', loadAll);
document.addEventListener('keydown', (e)=>{ if(e.key.toLowerCase()==='a' && (e.metaKey || e.ctrlKey)) openAdmin(); });

$('#save-secret').addEventListener('click', ()=>{
  const s = $('#admin-secret').value.trim();
  if(!s){ alert('Enter a secret first.'); return; }
  state.secret = s;
  sessionStorage.setItem('adminSecret', s);
  alert('Secret saved for this tab. Now you can run admin actions.');
});
$('#clear-secret').addEventListener('click', ()=>{
  state.secret = '';
  sessionStorage.removeItem('adminSecret');
  alert('Secret cleared for this tab.');
});

$('#import-asana').addEventListener('click', async ()=>{
  const raw = $('#asana-input').value.trim();
  if(!raw) return alert('Paste JSON first');
  try{
    const parsed = JSON.parse(raw);
    const res = await api('asana_import', { method:'POST', body: JSON.stringify(parsed) });
    alert('Imported tasks: '+ res.count);
    closeAdmin();
    loadAll();
  }catch(e){
    alert('Import failed: '+ e.message);
  }
});

$('#upload-hosts').addEventListener('click', async ()=>{
  const csv = $('#hosts-csv').value.trim();
  if(!csv) return alert('Paste CSV first');
  const res = await api('hosts_upload', { method:'POST', body: JSON.stringify({ csv }) });
  alert('Hosts saved: '+res.count);
  closeAdmin();
  loadAll();
});

$('#add-budget').addEventListener('click', async ()=>{
  const desc = $('#budget-desc').value.trim();
  const amt = parseFloat($('#budget-amount').value.trim());
  if(!desc || Number.isNaN(amt)) return alert('Need description and numeric amount');
  await api('budget', { method:'POST', body: JSON.stringify({ description: desc, amount: amt }) });
  alert('Budget item added.');
  closeAdmin();
  loadAll();
});

$('#add-doc').addEventListener('click', async ()=>{
  const title = $('#doc-title').value.trim();
  const url = $('#doc-url').value.trim();
  if(!title || !url) return alert('Need title and URL');
  await api('docs', { method:'POST', body: JSON.stringify({ title, url }) });
  alert('Doc added.');
  closeAdmin();
  loadAll();
});

$('#add-comms').addEventListener('click', async ()=>{
  const channel = $('#comms-channel').value.trim();
  const note = $('#comms-note').value.trim();
  if(!channel || !note) return alert('Need channel and note');
  await api('comms', { method:'POST', body: JSON.stringify({ channel, note }) });
  alert('Comms row added.');
  closeAdmin();
  loadAll();
});

$('#export-json').addEventListener('click', async ()=>{
  const data = await api('export');
  const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'carleton-toc-export.json';
  a.click();
  URL.revokeObjectURL(url);
});

loadAll();