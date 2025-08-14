
import { getStore } from "@netlify/blobs";
import { json, requireAdminSecret } from "./_utils.js";

export const handler = async (event) => {
  if (event.httpMethod !== "GET") return json({ error: "Method not allowed" }, 405);
  const gate = requireAdminSecret(event);
  if (gate) return gate;

  const tasks = (await getStore("tasks").get("all.json", { type: "json" })) || [];
  const hosts = (await getStore("hosts").get("list.json", { type: "json" })) || [];
  const budget = (await getStore("budget").get("items.json", { type: "json" })) || [];
  const comms = (await getStore("comms").get("items.json", { type: "json" })) || [];
  const docs = (await getStore("docs").get("items.json", { type: "json" })) || [];

  return json({ tasks, hosts, budget, comms, docs });
};
