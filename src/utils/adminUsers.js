// Admin data layer — reads every profile row (RLS grants this to the admin
// only) and derives the dashboard summary.
import { isOnline } from "./presence.js";

export async function fetchAllUsers(supabase) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("last_seen_at", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return data || [];
}

export function summarize(users, now = Date.now()) {
  const DAY = 24 * 60 * 60 * 1000;
  const list = users || [];
  let onlineNow = 0;
  let activeToday = 0;
  for (const u of list) {
    if (isOnline(u.last_seen_at, now)) onlineNow++;
    if (u.last_seen_at) {
      const t = new Date(u.last_seen_at).getTime();
      const diff = now - t;
      if (Number.isFinite(t) && diff >= 0 && diff < DAY) activeToday++;
    }
  }
  return { total: list.length, onlineNow, activeToday };
}
