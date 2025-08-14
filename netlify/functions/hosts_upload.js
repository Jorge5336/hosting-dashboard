
import { getStore } from "@netlify/blobs";
import { parse } from "csv-parse/sync";
import { requireAdminSecret, json } from "./_utils.js";

export const handler = async (event) => {
  if (event.httpMethod !== "POST") return json({ error: "Method not allowed" }, 405);
  const gate = requireAdminSecret(event);
  if (gate) return gate;

  const csv = event.body || "";
  if (!csv.trim()) return json({ error: "Empty CSV" }, 400);

  const rows = parse(csv, { columns: true, skip_empty_lines: true, trim: true });
  // Normalize: expect columns like id, name, email, status, class_year, dorm, notes
  const list = rows.map((r, i) => ({
    id: r.id || String(i+1),
    name: r.name || null,
    email: r.email || null,
    status: r.status || "applied",
    class_year: r.class_year || null,
    dorm: r.dorm || null,
    notes: r.notes || null
  }));

  const store = getStore("hosts");
  await store.setJSON("list.json", list);
  return json({ ok: true, count: list.length });
};
