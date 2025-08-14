
import { getStore } from "@netlify/blobs";
import dayjs from "dayjs";
import { nanoid } from "nanoid";
import { requireAdminSecret, json, readJson } from "./_utils.js";

export const handler = async (event) => {
  if (event.httpMethod !== "POST") return json({ error: "Method not allowed" }, 405);
  const gate = requireAdminSecret(event);
  if (gate) return gate;

  const payload = await readJson(event);
  const items = Array.isArray(payload?.data) ? payload.data : [];
  const cleaned = items.map((t) => ({
    id: t.gid,
    name: t.name,
    completed: !!t.completed,
    completed_at: t.completed_at,
    created_at: t.created_at,
    due_on: t.due_on || t.due_at || null,
    start_on: t.start_on || t.start_at || null,
    section: t.memberships?.[0]?.section?.name || null,
    project: t.projects?.[0]?.name || t.memberships?.[0]?.project?.name || null,
    permalink_url: t.permalink_url,
    workload_hours: Number(t.custom_fields?.find(f => f.name === "Approx. Workload (hrs)")?.number_value || 0),
    budget_code: t.custom_fields?.find(f => f.name === "Budget Code")?.enum_value?.name || null,
    assignee: t.assignee?.name || t.custom_fields?.find(f => f.name === "Assignee (imported)")?.display_value || null,
    notes: t.notes || "",
  }));

  const store = getStore("tasks");
  await store.setJSON("all.json", cleaned);
  // Archive raw
  await store.setJSON(`raw/${Date.now()}-${nanoid(6)}.json`, payload);

  return json({ ok: true, imported: cleaned.length });
};
