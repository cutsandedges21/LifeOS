// Presence — heartbeat math + the own-row write.
//
// touchPresence updates ONLY the caller's own profiles row (allowed by the
// existing "update own profile" RLS policy). Reading everyone's presence is a
// separate, admin-only concern (see adminUsers.js + the admin RLS policy).

export const ONLINE_WINDOW_MS = 2 * 60 * 1000; // seen within 2 min == online

export function isOnline(lastSeenAt, now = Date.now()) {
  if (!lastSeenAt) return false;
  const t = new Date(lastSeenAt).getTime();
  return Number.isFinite(t) && now - t < ONLINE_WINDOW_MS;
}

// Human-friendly "last online" label for offline users.
export function relativeLastSeen(lastSeenAt, now = Date.now()) {
  if (!lastSeenAt) return "Never";
  const t = new Date(lastSeenAt).getTime();
  if (!Number.isFinite(t)) return "Never";
  const diff = now - t;
  if (diff < 60 * 1000) return "just now";
  const min = Math.floor(diff / (60 * 1000));
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(t).toLocaleDateString();
}

// Best-effort heartbeat. Never throws — presence must not break the app.
export async function touchPresence(supabase, userId) {
  if (!supabase || !userId) return;
  try {
    await supabase
      .from("profiles")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("user_id", userId);
  } catch {
    // swallow — presence is non-critical
  }
}
