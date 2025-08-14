
import { getStore } from "@netlify/blobs";
import { nanoid } from "nanoid";
import { json, readJson, requireAdminSecret } from "./_utils.js";

const key = "items.json";

async function readItems(store) {
  return (await store.get(key, { type: "json" })) || [];
}

export const handler = async (event) => {
  const store = getStore("budget");

  if (event.httpMethod === "GET") {
    const items = await readItems(store);
    return json({ items });
  }

  // All other methods are admin-protected
  const gate = requireAdminSecret(event);
  if (gate) return gate;

  const items = await readItems(store);

  if (event.httpMethod === "POST") {
    const body = await readJson(event);
    const item = {
      id: nanoid(8),
      category: body.category || "General",
      description: body.description || "",
      planned_cents: Number(body.planned_cents || 0),
      spent_cents: Number(body.spent_cents || 0),
      updated_at: new Date().toISOString()
    };
    items.push(item);
    await store.setJSON(key, items);
    return json({ ok: true, item });
  }

  if (event.httpMethod === "PUT") {
    const body = await readJson(event);
    const id = body.id;
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) return json({ error: "Not found" }, 404);
    items[idx] = { ...items[idx], ...body, updated_at: new Date().toISOString() };
    await store.setJSON(key, items);
    return json({ ok: true, item: items[idx] });
  }

  if (event.httpMethod === "DELETE") {
    const body = await readJson(event);
    const id = body.id;
    const next = items.filter(i => i.id !== id);
    await store.setJSON(key, next);
    return json({ ok: true, removed: id });
  }

  return json({ error: "Method not allowed" }, 405);
};
