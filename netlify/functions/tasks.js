
import { getStore } from "@netlify/blobs";
import { json } from "./_utils.js";

export const handler = async (event) => {
  if (event.httpMethod !== "GET") return json({ error: "Method not allowed" }, 405);
  const store = getStore("tasks");
  const tasks = (await store.get("all.json", { type: "json" })) || [];
  return json({ tasks });
};
