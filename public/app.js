
const $ = (sel) => document.querySelector(sel);
const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text) n.textContent = text; return n; };

async function getJSON(url){
  const res = await fetch(url, { headers: { "X-Requested-With":"fetch" } });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function money(cents){
  const n = Number(cents||0)/100;
  return n.toLocaleString(undefined,{style:"currency",currency:"USD"});
}

function witty(which){
  const lines = [
    "Logistics are just puzzles with better snacks.",
    "Progress bars are my love language.",
    "We fight chaos with checkboxes.",
    "Operational excellence, with a wink."
  ];
  return lines[which % lines.length];
}

async function loadAll(){
  const ov = await getJSON("/.netlify/functions/overview");
  const tasks = await getJSON("/.netlify/functions/tasks");
  const hosts = await getJSON("/.netlify/functions/hosts");
  const budget = await getJSON("/.netlify/functions/budget");
  const comms = await getJSON("/.netlify/functions/comms");
  const docs = await getJSON("/.netlify/functions/docs");
  renderKpis(ov.summary);
  renderTasks(tasks.tasks);
  renderHosts(hosts.hosts);
  renderBudget(budget.items);
  renderComms(comms.items);
  renderDocs(docs.items);
}

function renderKpis(sum){
  const g = $("#kpi-grid"); g.innerHTML="";
  const k = (title, big, small, i)=>{
    const box = el("div","kpi");
    box.appendChild(el("div","big",big));
    box.appendChild(el("div",null,title));
    box.appendChild(el("small",null,small || witty(i)));
    return box;
  };
  g.append(
    k("Tasks done", `${sum.tasks.completed}/${sum.tasks.total}`, `${sum.tasks.pct}% complete`,0),
    k("Due soon", String(sum.tasks.dueSoon), "7‑day window",1),
    k("Hosts (ready)", String(sum.hosts?.approved || 0), "goal: 45+",2),
    k("Budget left", money(sum.budget.remaining_cents), `${money(sum.budget.spent_cents)} spent`,3),
    k("Comms (next 7d)", String(sum.comms_next_7), "don’t ghost your audience",4)
  );
}

function renderTasks(list){
  const wrap = $("#tasks"); wrap.innerHTML="";
  if (!list.length){ wrap.textContent="No tasks yet."; return; }
  const ul = el("ul"); ul.style.paddingLeft="1rem";
  list.slice(0,12).forEach(t=>{
    const li = el("li");
    li.innerHTML = `<strong>${t.name}</strong> — ${t.section || t.project || ""} ${t.completed ? "✔︎" : ""}`;
    ul.append(li);
  });
  wrap.append(ul);
}

function renderHosts(list){
  const wrap = $("#hosts"); wrap.innerHTML="";
  if (!list.length){ wrap.textContent="No hosts uploaded yet."; return; }
  const counts = list.reduce((a,h)=>{a[h.status||"unspecified"]=(a[h.status||"unspecified"]||0)+1;return a;},{});
  const ul = el("ul"); ul.style.paddingLeft="1rem";
  Object.entries(counts).forEach(([k,v])=>{
    const li = el("li"); li.textContent = `${k}: ${v}`; ul.append(li);
  });
  wrap.append(ul);
}

function renderBudget(items){
  const wrap = $("#budget"); wrap.innerHTML="";
  if (!items.length){ wrap.textContent="No budget lines yet."; return; }
  const tplan = items.reduce((s,b)=>s+(b.planned_cents||0),0);
  const tspent = items.reduce((s,b)=>s+(b.spent_cents||0),0);
  const div = el("div"); div.innerHTML = `<b>Total:</b> ${money(tspent)} / ${money(tplan)}`;
  const ul = el("ul"); ul.style.paddingLeft="1rem";
  items.slice(0,8).forEach(i=>{
    const li = el("li");
    li.innerHTML = `<b>${i.category}</b>—${i.description} (${money(i.spent_cents)} / ${money(i.planned_cents)})`;
    ul.append(li);
  });
  wrap.append(div, ul);
}

function renderComms(items){
  const wrap = $("#comms"); wrap.innerHTML="";
  if (!items.length){ wrap.textContent="No comms scheduled yet."; return; }
  const ul = el("ul"); ul.style.paddingLeft="1rem";
  items.slice(0,8).forEach(i=>{
    const li = el("li");
    li.textContent = `${i.date}: ${i.channel} → ${i.audience}`;
    ul.append(li);
  });
  wrap.append(ul);
}

function renderDocs(items){
  const ul = $("#docs"); ul.innerHTML="";
  if (!items.length){ ul.innerHTML="<li><span class='dot'></span> Add some links in Admin.</li>"; return; }
  items.forEach(d=>{
    const li = el("li");
    const dot = el("span","dot"); li.append(dot);
    const a = el("a"); a.href = d.url; a.target = "_blank"; a.rel="noopener"; a.textContent = d.title || d.url;
    li.append(a); ul.append(li);
  });
}

function adminPanel(){
  const dlg = $("#admin-dialog");
  const secret = $("#admin-secret");
  $("#btn-admin").addEventListener("click", ()=> dlg.showModal());

  dlg.addEventListener("click", (e)=>{
    const btn = e.target.closest("button[data-action]");
    if(!btn) return;
    const hdrs = { "Content-Type":"application/json", "X-Admin-Secret": secret.value || "" };
    const action = btn.dataset.action;

    if (action === "asana"){
      const body = $("#asana-json").value;
      fetch("/.netlify/functions/asana_import", { method:"POST", headers: hdrs, body })
        .then(r=>r.json()).then(()=>{ loadAll(); alert("Imported."); });
    }
    if (action === "hosts"){
      const csv = $("#hosts-csv").value;
      fetch("/.netlify/functions/hosts_upload", { method:"POST", headers: { "Content-Type":"text/csv", "X-Admin-Secret": secret.value || "" }, body: csv })
        .then(r=>r.json()).then(()=>{ loadAll(); alert("Hosts uploaded."); });
    }
    if (action === "budget-add"){
      const cents = v => Math.round((Number(v||0))*100);
      const body = {
        category: $("#b-cat").value,
        description: $("#b-desc").value,
        planned_cents: cents($("#b-plan").value),
        spent_cents: cents($("#b-spent").value),
      };
      fetch("/.netlify/functions/budget", { method:"POST", headers: hdrs, body: JSON.stringify(body)})
        .then(r=>r.json()).then(()=>{ loadAll(); alert("Budget line added."); });
    }
    if (action === "docs-add"){
      const body = { title: $("#d-title").value, url: $("#d-url").value };
      fetch("/.netlify/functions/docs", { method:"POST", headers: hdrs, body: JSON.stringify(body)})
        .then(r=>r.json()).then(()=>{ loadAll(); alert("Doc link added."); });
    }
    if (action === "export"){
      fetch("/.netlify/functions/export", { headers: { "X-Admin-Secret": secret.value || "" } })
        .then(r=>r.json()).then(data=>{
          const blob = new Blob([JSON.stringify(data,null,2)], { type:"application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url; a.download = "toc-dashboard-export.json"; a.click();
          URL.revokeObjectURL(url);
        });
    }
  });
}

$("#btn-refresh").addEventListener("click", loadAll);
adminPanel();
loadAll().catch(err=>{
  console.error(err);
  document.body.innerHTML = "<main class='container'><div class='card'><h2>Oops.</h2><p>Could not load data. If the site is freshly deployed, try adding data via Admin.</p></div></main>";
});
