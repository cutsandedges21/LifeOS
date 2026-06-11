import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { getSupabase } from "../utils/supabase.js";
import { fetchAllUsers, summarize } from "../utils/adminUsers.js";
import { isOnline, relativeLastSeen } from "../utils/presence.js";
import { localPart } from "../utils/friends.js";

const GOLD = "#F5C451";
const REFRESH_MS = 30 * 1000;

function StatCard({ label, value, accent }) {
  return (
    <div style={{ flex: 1, minWidth: 0, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 18, padding: "14px 16px" }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.08em", color: "var(--text-faint)", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: accent || "var(--text)", marginTop: 4 }}>{value}</div>
    </div>
  );
}

function StatChip({ label, value }) {
  return (
    <span style={{ display: "inline-flex", gap: 4, alignItems: "center", background: "var(--card-mid)", border: "1px solid var(--border)", borderRadius: 12, padding: "2px 8px", fontSize: 11 }}>
      <span style={{ color: "var(--text-faint)", fontFamily: "var(--font-mono)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
      <span style={{ color: "var(--text)", fontWeight: 700 }}>{value}</span>
    </span>
  );
}

const dash = (v) => (v === null || v === undefined ? "—" : v);
const pct = (v) => (v === null || v === undefined ? "—" : `${v}%`);
const hrs = (v) => (v === null || v === undefined ? "—" : `${v}h`);

function joined(iso) {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "—";
  return new Date(t).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function AdminPage({ auth }) {
  const myId = auth?.user?.id || null;
  const [users, setUsers] = useState([]);
  const [summary, setSummary] = useState({ total: 0, onlineNow: 0, activeToday: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // `now` is pinned at load time (not render time) so the stat-card counts and
  // the per-user online dots are always derived from the exact same instant.
  const [now, setNow] = useState(() => Date.now());

  // showSpinner: true for the initial load and explicit Refresh/Retry; false
  // for the 30s background poll so the populated list never flickers away.
  const load = useCallback(async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    const supabase = getSupabase();
    if (!supabase) {
      setError("Cloud sync not configured.");
      setLoading(false);
      return;
    }
    try {
      const rows = await fetchAllUsers(supabase);
      const loadNow = Date.now();
      rows.sort((a, b) => {
        const ao = isOnline(a.last_seen_at, loadNow) ? 1 : 0;
        const bo = isOnline(b.last_seen_at, loadNow) ? 1 : 0;
        if (ao !== bo) return bo - ao;
        const at = a.last_seen_at ? new Date(a.last_seen_at).getTime() : 0;
        const bt = b.last_seen_at ? new Date(b.last_seen_at).getTime() : 0;
        return bt - at;
      });
      setUsers(rows);
      setSummary(summarize(rows, loadNow));
      setNow(loadNow);
      setError(null);
    } catch (e) {
      setError(e?.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(true);
    const t = setInterval(() => load(), REFRESH_MS);
    return () => clearInterval(t);
  }, [load]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ padding: "0 18px", maxWidth: 720, margin: "0 auto" }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", margin: 0 }}>
          Admin <span style={{ color: GOLD }}>·</span> Users
        </h1>
        <button
          onClick={() => load(true)}
          style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-muted)", borderRadius: 12, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}
        >
          Refresh
        </button>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
        <StatCard label="Total Users" value={summary.total} />
        <StatCard label="Online Now" value={summary.onlineNow} accent={GOLD} />
        <StatCard label="Active Today" value={summary.activeToday} />
      </div>

      {loading && <div style={{ color: "var(--text-faint)", fontSize: 13 }}>Loading users…</div>}

      {error && !loading && (
        <div style={{ background: "var(--card)", border: "1px solid #F8717155", borderRadius: 14, padding: 14, color: "#F87171", fontSize: 13 }}>
          {error}
          <button onClick={() => load(true)} style={{ marginLeft: 8, textDecoration: "underline", background: "none", border: "none", color: "#F87171", cursor: "pointer" }}>Retry</button>
        </div>
      )}

      {!loading && !error && users.length === 0 && (
        <div style={{ color: "var(--text-faint)", fontSize: 13 }}>No users yet.</div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {users.map((u) => {
          const online = isOnline(u.last_seen_at, now);
          const name = localPart(u.email) || u.display_name || "LifeOS user";
          const isMe = u.user_id === myId;
          return (
            <div key={u.user_id} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: "12px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <span style={{ width: 9, height: 9, borderRadius: 5, background: online ? "#34D399" : "var(--border-high)", boxShadow: online ? "0 0 8px #34D399" : "none", flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {u.email || name}
                    {isMe && <span style={{ marginLeft: 6, fontSize: 10, color: GOLD, fontFamily: "var(--font-mono)" }}>YOU</span>}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-faint)", fontFamily: "var(--font-mono)" }}>
                    {online ? "Online" : relativeLastSeen(u.last_seen_at, now)} · joined {joined(u.created_at)}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                <StatChip label="🔥" value={dash(u.current_streak)} />
                <StatChip label="Habits" value={pct(u.habit_pct)} />
                <StatChip label="Gym/wk" value={dash(u.gym_days_week)} />
                <StatChip label="Sleep" value={hrs(u.avg_sleep)} />
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
