'use strict';

// Simple state & storage
const state = {
  applicants: [], hosts: [], assignments: [], engagement: [], comms: [],
};

const storage = {
  save(){ localStorage.setItem('toc_state', JSON.stringify(state)); },
  load(){
    try{ const raw = localStorage.getItem('toc_state'); if(raw){
      const parsed = JSON.parse(raw);
      for(const k of Object.keys(state)){ state[k] = Array.isArray(parsed[k]) ? parsed[k] : []; }
    }}catch(e){ console.warn('storage parse', e); }
  }
};

// Utilities
const $ = (sel, el=document) => el.querySelector(sel);
const $$ = (sel, el=document) => Array.from(el.querySelectorAll(sel));
const sanitize = s => String(s ?? '').replace(/[<>]/g, m => ({'<':'&lt;','>':'&gt;'}[m]));

// CSV parse (simple)
function csvParse(text){
  const rows = []; let i=0, cell="", cur=[], inQ=false;
  while(i<text.length){
    const ch = text[i];
    if(inQ){
      if(ch === '"'){
        if(text[i+1] === '"'){ cell+='"'; i+=2; continue; }
        inQ=false; i++; continue;
      }
      cell += ch; i++; continue;
    }
    if(ch === '"'){ inQ=true; i++; continue; }
    if(ch === ','){ cur.push(cell); cell=""; i++; continue; }
    if(ch === '\n'){ cur.push(cell); rows.push(cur); cur=[]; cell=""; i++; continue; }
    if(ch === '\r'){ i++; continue; }
    cell += ch; i++;
  }
    if(cell !== "" or cur.length){ cur.push(cell); rows.push(cur); }
  const header = rows.shift() || [];
  return rows.map(r => {
    const obj = {};
    header.forEach((h, idx) => obj[String(h||'').trim().toLowerCase()] = (r[idx] ?? '').trim());
    return obj;
  });
}

// CSV from objects
function csvFromObjects(rows, header){
  const esc = v => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g,'""') + '"' : s;
  };
  const lines = [header.join(',')];
  for(const row of rows) lines.push(header.map(h => esc(row[h])).join(','));
  return lines.join('\n');
}

function download(name, text){
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], {type:'text/csv'}));
  a.download = name; a.click(); URL.revokeObjectURL(a.href);
}

// Rendering
function renderOverview(){
  $('#ov-applicants').textContent = state.applicants.length;
  $('#ov-hosts').textContent = state.hosts.length;
  $('#ov-assignments').textContent = state.assignments.length;
}

let currentFilter = 'all';
function renderApplicants(filter='all', search=''){
  currentFilter = filter;
  const tbody = $('#applicants-table tbody'); tbody.innerHTML = '';
  const term = (search||'').toLowerCase().trim();
  const list = state.applicants.filter(a => {
    const decision = String(a.decision||'').toLowerCase();
    const okF = filter==='all' || decision===filter;
    const okS = !term || (a.name||'').toLowerCase().includes(term) || (a.state||'').toLowerCase().includes(term);
    return okF && okS;
  });
  for(const a of list){
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${sanitize(a.name)}</td>
      <td>${sanitize(a.state)}</td>
      <td>${sanitize(a.program)}</td>
      <td>${sanitize(a.decision)}</td>
      <td>${sanitize(a.interest_level)}</td>
      <td>${(a.leadership_review==='true'||a.leadership_review==='1')?'LR ':''}${(a.interview_rec==='true'||a.interview_rec==='1')?'INT ':''}${(a.ai_flag==='true'||a.ai_flag==='1')?'AI ':''}</td>`;
    tbody.appendChild(tr);
  }
}

function renderHosts(){
  const tbody = $('#hosts-table tbody'); tbody.innerHTML = '';
  const assigned = {};
  for(const asg of state.assignments){ if(asg.host_id) assigned[asg.host_id] = (assigned[asg.host_id]||0)+1; }
  for(const h of state.hosts){
    const as = assigned[h.id]||0, cap = Number(h.capacity||0), left = Math.max(0, cap-as);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${sanitize(h.name)}</td>
      <td>${sanitize(h.building)}</td>
      <td>${sanitize(h.room)}</td>
      <td>${cap}</td>
      <td>${as}</td>
      <td>${left}</td>
      <td>${sanitize(h.notes)}</td>`;
    tbody.appendChild(tr);
  }
}

function renderAssignments(){
  const tbody = $('#assignments-table tbody'); tbody.innerHTML = '';
  const byId = arr => Object.fromEntries(arr.map(o=>[o.id,o]));
  const A = byId(state.applicants), H = byId(state.hosts);
  for(const asg of state.assignments){
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${sanitize((A[asg.applicant_id]||{}).name||'')}</td>
      <td>${sanitize((H[asg.host_id]||{}).name||'')}</td>
      <td>${sanitize(asg.status)}</td>`;
    tbody.appendChild(tr);
  }
  const asApp = $('#as-app'); const asHost = $('#as-host');
  asApp.innerHTML = '<option value="">Select applicant</option>' + state.applicants.map(a=>`<option value="${sanitize(a.id)}">${sanitize(a.name)}</option>`).join('');
  asHost.innerHTML = '<option value="">Select host</option>' + state.hosts.map(h=>`<option value="${sanitize(h.id)}">${sanitize(h.name)}</option>`).join('');
}

function renderEngagement(){
  const tbody = $('#eng-table tbody'); tbody.innerHTML = '';
  const A = Object.fromEntries(state.applicants.map(a=>[a.id,a]));
  for(const e of state.engagement){
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${sanitize((A[e.applicant_id]||{}).name||'')}</td>
      <td><input type="checkbox" ${e.invite_sent==='true'?'checked':''} data-key="invite_sent"></td>
      <td><input type="checkbox" ${e.attending==='true'?'checked':''} data-key="attending"></td>
      <td><input type="checkbox" ${e.checked_in==='true'?'checked':''} data-key="checked_in"></td>
      <td><input type="checkbox" ${e.no_show==='true'?'checked':''} data-key="no_show"></td>
      <td contenteditable="true" data-key="notes">${sanitize(e.notes)}</td>`;
    tr.dataset.applicantId = e.applicant_id;
    tbody.appendChild(tr);
  }
  tbody.addEventListener('change', e=>{
    const tr = e.target.closest('tr'); if(!tr) return;
    const id = tr.dataset.applicantId; const key = e.target.dataset.key;
    const row = state.engagement.find(x=>x.applicant_id===id);
    if(row && key){ row[key] = String(e.target.checked); storage.save(); }
  });
  tbody.addEventListener('input', e=>{
    const tr = e.target.closest('tr'); if(!tr) return;
    const id = tr.dataset.applicantId; const key = e.target.dataset.key;
    const row = state.engagement.find(x=>x.applicant_id===id);
    if(row && key){ row[key] = String(e.target.textContent||''); storage.save(); }
  });
}

function renderComms(){
  const el = $('#comms-summary'); el.innerHTML='';
  if(!state.comms.length){ el.innerHTML='<div class="card muted">No communications uploaded yet.</div>'; return; }
  const byCampaign = {};
  for(const c of state.comms){
    const k = c.campaign || '(unknown)';
    byCampaign[k] = byCampaign[k] || {sent:0, opens:0, clicks:0};
    byCampaign[k].sent++;
    byCampaign[k].opens += Number(c.opens||0);
    byCampaign[k].clicks += Number(c.clicks||0);
  }
  for(const [k,v] of Object.entries(byCampaign)){
    const card = document.createElement('div'); card.className='card';
    card.innerHTML = `<strong>${sanitize(k)}</strong><br>Sent: ${v.sent} • Opens: ${v.opens} • Clicks: ${v.clicks}`;
    el.appendChild(card);
  }
}

function renderAll(){
  renderOverview();
  renderApplicants(currentFilter, $('#app-search')?.value || '');
  renderHosts(); renderAssignments(); renderEngagement(); renderComms();
}

// Events
$$('.tab-btn[role="tab"]').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    $$('.tab-btn[role="tab"]').forEach(b=> b.setAttribute('aria-selected','false'));
    btn.setAttribute('aria-selected','true');
    const tab = btn.dataset.tab;
    $$('main > section').forEach(s=> s.classList.add('hidden'));
    $('#tab-'+tab).classList.remove('hidden');
  });
});

$('#themeToggle').addEventListener('click', ()=>{
  const root = document.body;
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
});
document.addEventListener('keydown', e=>{
  if(e.key.toLowerCase()==='t') $('#themeToggle').click();
  if(e.key==='/'){ const s=$('#app-search'); if(s && !s.closest('.hidden')){ s.focus(); e.preventDefault(); } }
  if(e.key.toLowerCase()==='s'){ $$('[data-tab="settings"]')[0]?.click(); }
});

// Filters
$$('#tab-applicants .filter').forEach(b=>{
  b.addEventListener('click', ()=>{
    $$('#tab-applicants .filter').forEach(x=> x.setAttribute('aria-pressed','false'));
    b.setAttribute('aria-pressed','true');
    renderApplicants(b.dataset.filter, $('#app-search').value||'');
  });
});
$('#app-search').addEventListener('input', ()=> renderApplicants(currentFilter, $('#app-search').value||''));

// CSV handling
function hookCsv(input, key){
  input.addEventListener('change', async ()=>{
    const f = input.files?.[0]; if(!f) return;
    const text = await f.text();
    state[key] = csvParse(text);
    storage.save(); renderAll();
  });
}
hookCsv($('#csv-app'), 'applicants');
hookCsv($('#csv-host'), 'hosts');
hookCsv($('#csv-asg'), 'assignments');
hookCsv($('#csv-eng'), 'engagement');
hookCsv($('#csv-comms'), 'comms');

// Exports
$('#export-app').addEventListener('click', ()=>{
  const cols=['id','name','program','state','gender','decision','leadership_review','interview_rec','interest_level','ai_flag'];
  download('applicants.csv', csvFromObjects(state.applicants, cols));
});
$('#export-host').addEventListener('click', ()=>{
  const cols=['id','name','email','phone','building','room','capacity','gender','notes'];
  download('hosts.csv', csvFromObjects(state.hosts, cols));
});
$('#export-asg').addEventListener('click', ()=>{
  const cols=['applicant_id','host_id','status'];
  download('assignments.csv', csvFromObjects(state.assignments, cols));
});
$('#export-eng').addEventListener('click', ()=>{
  const cols=['applicant_id','invite_sent','attending','checked_in','no_show','notes'];
  download('engagement.csv', csvFromObjects(state.engagement, cols));
});
$('#export-comms').addEventListener('click', ()=>{
  const cols=['timestamp','recipient','campaign','subject','status','opens','clicks'];
  download('comms.csv', csvFromObjects(state.comms, cols));
});

// Save assignment
$('#as-save').addEventListener('click', ()=>{
  const a=$('#as-app').value, h=$('#as-host').value, s=$('#as-status').value;
  if(!a || !h) return alert('Select an applicant and a host.');
  const existing = state.assignments.find(x=>x.applicant_id===a);
  if(existing){ existing.host_id=h; existing.status=s; }
  else state.assignments.push({ applicant_id:a, host_id:h, status:s });
  storage.save(); renderAll();
});

// Init + tests
storage.load();
renderAll();

(function tests(){
  const out=[]; const ok=(t,m)=> out.push((t?'✅':'❌')+' '+m);
  try{
    ok($('#tab-overview') instanceof HTMLElement, 'Overview exists');
    ok($('#applicants-table tbody') instanceof HTMLElement, 'Applicants table body exists');
    // CSV parser tests
    const sample='id,name,state,decision\n1,"Doe, Jane",MN,admit\n2,"O""Connor, Liam",IL,deny\n';
    const parsed=csvParse(sample);
    ok(parsed.length===2,'CSV parsed 2 rows');
    ok(parsed[0].name==='Doe, Jane','CSV handles comma in quotes');
    ok(parsed[1].name==='O"Connor, Liam','CSV handles escaped quotes');
    // Smoke render
    state.applicants=[{id:'1',name:'Test Student',state:'MN',program:'TOC',gender:'F',decision:'admit',leadership_review:'false',interview_rec:'true',interest_level:'high',ai_flag:'false'}];
    state.hosts=[{id:'H1',name:'RA Host',building:'Centennial',room:'101',capacity:'2',gender:'F',notes:''}];
    state.assignments=[{applicant_id:'1',host_id:'H1',status:'assigned'}];
    state.engagement=[{applicant_id:'1',invite_sent:'true',attending:'true',checked_in:'false',no_show:'false',notes:'N/A'}];
    state.comms=[{timestamp:'2025-08-10',recipient:'x@carleton.edu',campaign:'Nudge A',subject:'Hi',status:'sent',opens:'2',clicks:'1'}];
    renderAll();
    ok($('#ov-applicants').textContent==='1','Overview totals update');
    ok($('#applicants-table tbody').children.length===1,'Applicants 1 row');
    ok($('#hosts-table tbody').children.length===1,'Hosts 1 row');
    ok($('#assignments-table tbody').children.length===1,'Assignments 1 row');
    ok($('#eng-table tbody').children.length===1,'Engagement 1 row');
    ok($('#comms-summary').children.length>=1,'Comms summary renders');
  }catch(e){ out.push('❌ Test harness error: '+e.message); }
  $('#test-output').textContent = out.join('\\n');
})();