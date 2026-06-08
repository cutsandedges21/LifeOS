import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "./GlassComponents.jsx";
import { SectionLabel, Input, Button, Toggle } from "./UI.jsx";
import {
  computeSharedStats,
  friendDisplayName,
  localPart,
  SHAREABLE_STATS,
} from "../utils/friends.js";
import { fmt$ } from "../utils/formatters.js";

const ACCENT = "#60A5FA"; // sky-blue — inherited from the old Account page

// FriendsPage. Replaces the old Account page in the bottom nav. Add friends by
// email, accept/decline incoming requests, and compare curated stats side by
// side. All data + realtime live in the useFriends hook (mounted in App.jsx);
// this component is purely presentational + action dispatch.
//
// Props:
//   hub      — the useFriends() return value
//   state    — local LifeOS state (for computing "your" comparison stats)
//   auth     — auth context (signed-in gate)
//   setState — state updater (for the "What you share" sharing toggles)
export function FriendsPage({ hub, state, auth, setState }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // { type: 'ok'|'err', text }
  const [openId, setOpenId] = useState(null); // expanded friend (stat compare)

  const signedIn = auth?.status === "signed-in" && auth?.user;
  const myStats = computeSharedStats(state);
  const myName = localPart(auth?.user?.email) || "You";

  const handleSend = async () => {
    if (!email.trim() || busy) return;
    setBusy(true);
    setMsg(null);
    const res = await hub.sendRequest(email);
    setBusy(false);
    if (res.ok) {
      setMsg({ type: "ok", text: "Request sent." });
      setEmail("");
    } else {
      setMsg({ type: "err", text: res.error });
    }
  };

  // Invite someone who isn't on LifeOS yet. No email backend — use the native
  // share sheet (mobile / installed PWA) and fall back to copying the link.
  const handleInvite = async () => {
    const url = (typeof window !== "undefined" && window.location.origin) || "";
    const text = "Join me on LifeOS — track your habits, goals, gym & sleep, and we can compare stats.";
    setMsg(null);
    if (navigator.share) {
      try {
        await navigator.share({ title: "LifeOS", text, url });
      } catch (_) {
        /* user dismissed the share sheet — not an error */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setMsg({ type: "ok", text: "Invite link copied to clipboard." });
    } catch (_) {
      setMsg({ type: "ok", text: `Share this link: ${url}` });
    }
  };

  // ── Signed-out gate ─────────────────────────────────────────────────────
  if (!signedIn) {
    return (
      <div style={{ padding: "0 clamp(14px, 4.5vw, 20px)" }}>
        <PageHeader />
        <GlassCard style={{ padding: "24px", textAlign: "center" }}>
          <div style={{ fontSize: "40px", marginBottom: "10px" }}>👥</div>
          <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--text)", marginBottom: "8px" }}>
            Sign in to add friends
          </div>
          <div style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.5 }}>
            Friends let you compare streaks, habits, to-dos, gym, and sleep.
            Head to <strong>Settings → Account &amp; Sync</strong> to sign in or
            create an account.
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div style={{ padding: "0 clamp(14px, 4.5vw, 20px)" }}>
      <PageHeader />

      {/* Add by email */}
      <GlassCard style={{ padding: "20px", marginBottom: "16px" }}>
        <SectionLabel accent={ACCENT}>ADD A FRIEND</SectionLabel>
        <div style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5, marginBottom: "14px" }}>
          Enter your friend's email. They'll get a request to accept or decline.
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="friend@example.com"
            style={{ marginBottom: 0, flex: 1 }}
          />
          <Button
            onClick={handleSend}
            disabled={busy || !email.trim()}
            style={{
              minWidth: "92px",
              background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT}cc)`,
              border: `1px solid ${ACCENT}66`,
              color: "#fff",
              fontWeight: 800,
              boxShadow: `0 4px 20px ${ACCENT}55`,
            }}
          >
            {busy ? "…" : "Send"}
          </Button>
        </div>

        {/* Invite — for people not on LifeOS yet */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "16px 0 14px" }}>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          <span style={{ fontSize: "10px", color: "var(--text-faint)", fontFamily: "var(--font-mono)", letterSpacing: "0.12em" }}>
            OR
          </span>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>
        <Button
          onClick={handleInvite}
          variant="ghost"
          style={{ width: "100%", border: `1px dashed ${ACCENT}66`, color: ACCENT, fontWeight: 700 }}
        >
          ↗ Invite a friend to LifeOS
        </Button>
        <div style={{ fontSize: "11px", color: "var(--text-faint)", marginTop: "8px", lineHeight: 1.4, textAlign: "center" }}>
          Not on LifeOS yet? Share the app — add them by email once they sign up.
        </div>

        <AnimatePresence>
          {msg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                marginTop: "12px",
                padding: "10px 12px",
                borderRadius: "10px",
                fontSize: "12px",
                lineHeight: 1.4,
                background: msg.type === "ok" ? "rgba(52,211,153,0.10)" : "rgba(248,113,113,0.10)",
                border: `1px solid ${msg.type === "ok" ? "rgba(52,211,153,0.30)" : "rgba(248,113,113,0.30)"}`,
                color: msg.type === "ok" ? "#34D399" : "#F87171",
              }}
            >
              {msg.text}
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>

      {/* Incoming requests */}
      {hub.incoming.length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <SectionLabel accent="#FBBF24">
            REQUESTS · {hub.incoming.length}
          </SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {hub.incoming.map((item) => (
              <RequestRow
                key={item.friendship.id}
                item={item}
                onAccept={() => hub.accept(item.friendship.id)}
                onDecline={() => hub.decline(item.friendship.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Outgoing / pending + declined */}
      {hub.outgoing.length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <SectionLabel accent="var(--text-muted)">SENT</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {hub.outgoing.map((item) => (
              <OutgoingRow
                key={item.friendship.id}
                item={item}
                onCancel={() => hub.unfriend(item.friendship.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Friends list */}
      <SectionLabel accent={ACCENT}>
        FRIENDS{hub.friends.length ? ` · ${hub.friends.length}` : ""}
      </SectionLabel>
      {hub.friends.length === 0 ? (
        <GlassCard style={{ padding: "28px 20px", textAlign: "center" }}>
          <div style={{ fontSize: "13px", color: "var(--text-faint)", lineHeight: 1.5 }}>
            No friends yet. Add someone by email above to start comparing stats.
          </div>
        </GlassCard>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {hub.friends.map((item) => (
            <FriendCard
              key={item.friendship.id}
              item={item}
              expanded={openId === item.friendship.id}
              onToggle={() =>
                setOpenId(openId === item.friendship.id ? null : item.friendship.id)
              }
              onUnfriend={() => hub.unfriend(item.friendship.id)}
              myStats={myStats}
              myName={myName}
            />
          ))}
        </div>
      )}

      {/* Sharing controls — what the user exposes to all friends */}
      <ShareSettings state={state} setState={setState} />
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PageHeader() {
  return (
    <GlassCard style={{ padding: "20px", marginBottom: "16px" }}>
      <div style={{ fontSize: "26px", fontWeight: 900, letterSpacing: "-0.02em", color: "var(--text)", lineHeight: 1.05, marginBottom: "6px" }}>
        Friends
      </div>
      <div style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.5 }}>
        Add friends by email and compare your accountability stats. A little
        friendly pressure keeps everyone honest.
      </div>
    </GlassCard>
  );
}

function Avatar({ name }) {
  const initials = ((name || "?").trim().slice(0, 2) || "?").toUpperCase();
  return (
    <div
      style={{
        width: "44px",
        height: "44px",
        borderRadius: "50%",
        background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT}cc)`,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 900,
        fontSize: "15px",
        letterSpacing: "0.04em",
        boxShadow: `0 4px 14px ${ACCENT}55`,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

function RequestRow({ item, onAccept, onDecline }) {
  const name = friendDisplayName(item);
  return (
    <GlassCard style={{ padding: "14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <Avatar name={name} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {name}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-faint)", fontFamily: "var(--font-mono)" }}>
            wants to connect
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
        <Button
          onClick={onAccept}
          style={{ flex: 1, background: "linear-gradient(135deg, #34D399, #10B981)", border: "1px solid rgba(52,211,153,0.5)", color: "#04110b", fontWeight: 800 }}
        >
          Accept
        </Button>
        <Button onClick={onDecline} variant="ghost" style={{ flex: 1, border: "1px solid rgba(248,113,113,0.35)", color: "#F87171" }}>
          Decline
        </Button>
      </div>
    </GlassCard>
  );
}

function OutgoingRow({ item, onCancel }) {
  const name = friendDisplayName(item);
  const declined = item.friendship.status === "declined";
  return (
    <GlassCard style={{ padding: "14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <Avatar name={name} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {name}
          </div>
          <div style={{ fontSize: "11px", color: declined ? "#F87171" : "var(--text-faint)", fontFamily: "var(--font-mono)", letterSpacing: "0.05em" }}>
            {declined ? "DECLINED" : "PENDING"}
          </div>
        </div>
        <button
          onClick={onCancel}
          style={{ background: "none", border: "none", color: "var(--text-faint)", fontSize: "13px", fontWeight: 600, cursor: "pointer", padding: "6px 8px", flexShrink: 0 }}
        >
          {declined ? "Dismiss" : "Cancel"}
        </button>
      </div>
    </GlassCard>
  );
}

function FriendCard({ item, expanded, onToggle, onUnfriend, myStats, myName }) {
  const name = friendDisplayName(item);
  const p = item.profile;
  return (
    <GlassCard style={{ padding: "14px" }}>
      <div
        onClick={onToggle}
        style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}
      >
        <Avatar name={name} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "15px", fontWeight: 800, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {name}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-faint)", fontFamily: "var(--font-mono)" }}>
            {p?.current_streak == null
              ? "tap to compare"
              : `🔥 ${p.current_streak}d streak · tap to compare`}
          </div>
        </div>
        <span style={{ color: "var(--text-faint)", fontSize: "18px", transform: expanded ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}>
          ›
        </span>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid var(--border)" }}>
              {!p ? (
                <div style={{ fontSize: "12px", color: "var(--text-faint)", textAlign: "center", padding: "8px 0" }}>
                  No stats yet — they haven't synced.
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                    <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: ACCENT, fontWeight: 800, letterSpacing: "0.08em" }}>
                      {trunc(myName)}
                    </span>
                    <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--text-muted)", fontWeight: 800, letterSpacing: "0.08em" }}>
                      {trunc(name)}
                    </span>
                  </div>
                  {SHAREABLE_STATS.map((s) => (
                    <CompareRow
                      key={s.key}
                      label={s.label}
                      mine={myStats[s.key]}
                      theirs={p[s.key]}
                      suffix={s.suffix}
                      money={s.money}
                    />
                  ))}
                </>
              )}

              <button
                onClick={onUnfriend}
                style={{ marginTop: "14px", width: "100%", padding: "10px", borderRadius: "12px", border: "1px solid rgba(248,113,113,0.3)", background: "transparent", color: "#F87171", fontSize: "12px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
              >
                Remove friend
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}

function trunc(s, n = 10) {
  if (!s) return "";
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

// One stat, two values, winner highlighted. Higher is better for every stat
// we share (streaks, %, gym days, sleep hours, daily net). A `theirs` of null
// means the friend has toggled that stat off — we show "🔒 Hidden" instead of a
// number and skip win-highlighting for the row. `money` stats format as
// currency (fmt$); everything else as value + suffix. Your own column always
// shows your real numbers regardless of your own sharing prefs.
function CompareRow({ label, mine, theirs, suffix, money }) {
  const hidden = theirs === null || theirs === undefined;
  const m = Number(mine) || 0;
  const t = hidden ? null : Number(theirs) || 0;
  const mineWins = !hidden && m > t;
  const theyWin = !hidden && t > m;
  const win = { color: "#34D399", fontWeight: 900 };
  const base = { color: "var(--text)", fontWeight: 700 };
  const display = (n) => (money ? fmt$(n) : `${fmt(n)}${suffix || ""}`);
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0" }}>
      <span style={{ ...(mineWins ? win : base), fontSize: "15px", fontFamily: "var(--font-mono)", minWidth: "48px" }}>
        {display(m)}
      </span>
      <span style={{ fontSize: "11px", color: "var(--text-faint)", fontFamily: "var(--font-mono)", letterSpacing: "0.06em", textAlign: "center", flex: 1, padding: "0 8px" }}>
        {label}
      </span>
      {hidden ? (
        <span style={{ fontSize: "12px", color: "var(--text-faint)", fontFamily: "var(--font-mono)", minWidth: "48px", textAlign: "right", whiteSpace: "nowrap" }}>
          🔒 Hidden
        </span>
      ) : (
        <span style={{ ...(theyWin ? win : base), fontSize: "15px", fontFamily: "var(--font-mono)", minWidth: "48px", textAlign: "right" }}>
          {display(t)}
        </span>
      )}
    </div>
  );
}

function fmt(n) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

// ── Sharing controls ──────────────────────────────────────────────────────────
// "What you share" — a per-stat on/off list controlling what leaves the user's
// device for friends to read. Off ⇒ the stat is withheld (written as NULL) on
// the next sync. Reads/writes state.sharePrefs; defaults a missing pref to on.
function ShareSettings({ state, setState }) {
  const prefs = state?.sharePrefs || {};
  const setPref = (key, value) =>
    setState((prev) => ({
      ...prev,
      sharePrefs: { ...(prev.sharePrefs || {}), [key]: value },
    }));

  return (
    <div style={{ marginTop: "20px" }}>
      <SectionLabel accent={ACCENT}>WHAT YOU SHARE</SectionLabel>
      <GlassCard style={{ padding: "20px" }}>
        <div style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5, marginBottom: "16px" }}>
          Choose what your friends can compare against. Turning a stat off
          withholds it completely — friends see “🔒 Hidden,” never your number.
        </div>
        {SHAREABLE_STATS.map((s) => (
          <div key={s.key}>
            <Toggle
              label={s.label}
              checked={prefs[s.key] !== false}
              onChange={(v) => setPref(s.key, v)}
              style={s.money ? { marginBottom: "4px" } : {}}
            />
            {s.money && (
              <div style={{ fontSize: "11px", color: "var(--text-faint)", marginBottom: "12px", lineHeight: 1.4 }}>
                Sensitive — shares only today’s net (income − expenses), never
                your balance or net worth.
              </div>
            )}
          </div>
        ))}
      </GlassCard>
    </div>
  );
}
