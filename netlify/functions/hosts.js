
import { getStore } from "@netlify/blobs";
import { json } from "./_utils.js";

export const handler = async (event) => {
  if (event.httpMethod !== "GET") return json({ error: "Method not allowed" }, 405);
  const store = getStore("hosts");
  let hosts = (await store.get("list.json", { type: "json" })) || [];
  const url = new URL(event.rawUrl || (event.headers.origin + event.path));
  const status = url.searchParams.get("status");
  if (status) hosts = hosts.filter(h => (h.status || "").toLowerCase() === status.toLowerCase());
  return json({ hosts });
};
