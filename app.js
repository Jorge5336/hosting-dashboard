/* Seed-mode static dashboard (no serverless, no admin). */

const SEED_TASKS = [
  // Phase 1 – Approvals & Governance
  { id:"t1", title:"Secure overnight-stay approvals", phase:"Phase 1 – Approvals & Governance", due:"2025-07-11", status:"done", owner:"Gladys", notes:"Res Life, Risk Mgmt, Security Services", url:"#"},
  { id:"t2", title:"Document risk & policy notes",   phase:"Phase 1 – Approvals & Governance", due:"2025-07-15", status:"done", owner:"Gladys", notes:"Summaries in shared folder", url:"#"},
  // Phase 2 – Host Framework
  { id:"t3", title:"Finalize host profile & incentive plan", phase:"Phase 2 – Host Framework", due:"2025-07-18", status:"open", owner:"Jorge", notes:"Eligibility + incentives", url:"#"},
  { id:"t3a",title:"Draft host criteria", phase:"Phase 2 – Host Framework", due:"2025-07-16", status:"done", owner:"Jorge", notes:"Drafted in Google Doc", url:"#"},
  { id:"t4", title:"Draft Host & Attendee Handbook", phase:"Phase 2 – Host Framework", due:"2025-07-25", status:"open", owner:"Jorge", notes:"Two docs to merge", url:"#"},
  // Phase 3 – Recruitment & Vetting
  { id:"t5", title:"Slate form and Advertising", phase:"Phase 3 – Recruitment & Vetting", due:"2025-08-29", status:"open", owner:"Access Team", notes:"IG heavy; Jenna to help", url:"#"},
  { id:"t5a",title:"Create Slate form", phase:"Phase 3 – Recruitment & Vetting", due:"2025-07-31", status:"open", owner:"Holly", notes:"Form link added", url:"#"},
  { id:"t5b",title:"Schedule social posts", phase:"Phase 3 – Recruitment & Vetting", due:"2025-08-01", status:"open", owner:"Jorge", notes:"Access Comms", url:"#"},
  { id:"t6", title:"Vet hosts (goal 50+ apps)", phase:"Phase 3 – Recruitment & Vetting", due:"2025-09-19", status:"open", owner:"Access Team", notes:"Dean of Students conduct check", url:"#"},
  { id:"t7", title:"Host recruitment complete ✔︎ (milestone)", phase:"Phase 3 – Recruitment & Vetting", due:"2025-09-19", status:"open", owner:"Access Team", notes:"Target 45+ confirmed", url:"#"},
];

const SEED_HOSTS = { goal: 50, confirmed: 45, lastUpdated: "2025-07-07" };

const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

async function loadJSON(path){
  try{
    const res = await fetch(path, {cache:'no-store'});
    if(!res.ok) throw new Error(String(res.status));
    return await res.json();
  }catch(_){
    return null;
  }
}

async function loadData(){
  // Try local seed files first; fall back to embedded constants
  const [tasks, hosts] = await Promise.all([
    loadJSON('/seed/tasks.json').then(d => d || SEED_TASKS),
    loadJSON('/seed/hosts.json').then(d => d || SEED_HOSTS),
  ]);
  return { tasks, hosts };
}

function groupByPhase(tasks){
  const phases = {};
  for(const t of tasks){
    (phases[t.phase] ||= []).push(t);
  }
  // Stable order
  const order = [
    "Phase 1 – Approvals & Governance",
    "Phase 2 – Host Framework",
    "Phase 3 – Recruitment & Vetting"
  ];
  return order.map(name => ({ name, items: (phases[name]||[])}));
}

function dateObj(s){ return s ? new Date(s+"T12:00:00") : null }
function fmtDate(s){
  if(!s) return "";
  const d = dateObj(s);
  return d?.toLocaleDateString(undefined,{month:'short',day:'numeric'}) || s;
}

function renderKPIs({tasks, hosts}){
  const completed = tasks.filter(t => t.status === 'done').length;
  const open = tasks.length - completed;
  const pct = tasks.length ? Math.round((completed/tasks.length)*100) : 0;

  const upcoming = tasks
    .filter(t => t.status !== 'done' && t.due)
    .sort((a,b)=> (dateObj(a.due) - dateObj(b.due)) )
    .slice(0,1)[0];

  $('#kpis').innerHTML = `
    <div class="kpi">
      <h3>Hosts Confirmed <span class="tag">${hosts.goal} goal</span></h3>
      <div class="value">${hosts.confirmed}</div>
      <div class="meta">Last updat
