import { ensureDefaults, writeJSON, json, unauthorized, requireAdmin } from './_lib/common.mjs';

function parseCSV(text){
  const rows = [];
  let i=0, field='', row=[], inQ=false;
  while(i<text.length){
    const c = text[i++];
    if (inQ){
      if (c === '"'){
        if (text[i] === '"'){ field+='"'; i++; }
        else inQ = false;
      } else field += c;
    }else{
      if (c === '"') inQ = true;
      else if (c === ','){ row.push(field.trim()); field=''; }
      else if (c === '\n' || c === '\r'){
        if (field.length || row.length){ row.push(field.trim()); rows.push(row); row=[]; field=''; }
      } else field += c;
    }
  }
  if (field.length || row.length){ row.push(field.trim()); rows.push(row); }
  return rows;
}

export async function handler(event){
  if (event.httpMethod === 'OPTIONS') return { statusCode:204, headers:{ 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Headers':'Content-Type, X-Admin-Secret' } };
  if (event.httpMethod !== 'POST') return json({ error:'Method not allowed' }, 405);
  if (!requireAdmin(event)) return unauthorized();

  await ensureDefaults();
  let body;
  try{
    body = JSON.parse(event.body || '{}');
  }catch(e){ return json({ error:'Bad JSON' }, 400); }
  const csv = (body.csv || '').trim();
  if (!csv) return json({ error:'csv missing' }, 400);
  const rows = parseCSV(csv).filter(r => r.length);
  if (!rows.length) return json({ error:'No rows' }, 400);

  const header = rows[0].map(h => h.lower());
  const idx = (name) => header.indexOf(name);

  const col = {
    id: idx('id'),
    name: idx('name'),
    email: idx('email'),
    status: idx('status'),
    class_year: idx('class_year'),
    dorm: idx('dorm'),
    notes: idx('notes')
  };
  const out = [];
  for (let r=1; r<rows.length; r++){
    const row = rows[r];
    if (!row[col.name] && !row[col.email]) continue;
    out.push({
      id: row[col.id] || null,
      name: row[col.name] || '',
      email: row[col.email] || '',
      status: row[col.status] || 'applied',
      class_year: row[col.class_year] || '',
      dorm: row[col.dorm] || '',
      notes: row[col.notes] || ''
    });
  }

  await writeJSON('hosts/list.json', out);
  return json({ ok:true, count: out.length });
}