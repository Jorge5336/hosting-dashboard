
import dayjs from "dayjs";
import { getStore } from "@netlify/blobs";
import { json } from "./_utils.js";

export const handler = async () => {
  const tasksStore = getStore("tasks");
  const hostsStore = getStore("hosts");
  const budgetStore = getStore("budget");
  const commsStore = getStore("comms");

  // Fetch aggregates
  const tasks = (await tasksStore.get("all.json", { type: "json" })) || [];
  const hosts = (await hostsStore.get("list.json", { type: "json" })) || [];
  const budget = (await budgetStore.get("items.json", { type: "json" })) || [];
  const comms = (await commsStore.get("items.json", { type: "json" })) || [];

  const completed = tasks.filter(t => t.completed).length;
  const total = tasks.length;
  const pct = total ? Math.round((completed / total) * 100) : 0;
  const dueSoon = tasks.filter(t => !t.completed && t.due_on && dayjs(t.due_on).diff(dayjs(), "day") <= 7).length;

  const hostsByStatus = hosts.reduce((acc, h) => {
    acc[h.status || "unspecified"] = (acc[h.status || "unspecified"] || 0) + 1;
    return acc;
  }, {});

  const planned = budget.reduce((s, b) => s + (b.planned_cents || 0), 0);
  const spent = budget.reduce((s, b) => s + (b.spent_cents || 0), 0);

  const scheduleNext7 = comms.filter(c => dayjs(c.date).isAfter(dayjs().subtract(1, "day")) && dayjs(c.date).diff(dayjs(), "day") <= 7);

  return json({
    summary: {
      tasks: { total, completed, pct, dueSoon },
      hosts: hostsByStatus,
      budget: { planned_cents: planned, spent_cents: spent, remaining_cents: Math.max(planned - spent, 0) },
      comms_next_7: scheduleNext7.length
    }
  });
};
