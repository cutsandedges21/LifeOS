import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "./GlassComponents.jsx";
import { SectionLabel, Input, Button, Toggle } from "./UI.jsx";
import { LegalPage } from "./LegalPage.jsx";
import { legalDocs } from "../content/legal.js";
import { playClick } from "../utils/sound.js";
import {
  notificationStatus,
  requestNotificationPermission,
  showNotification,
  isStandalone,
  canInstall,
  promptInstall,
} from "../utils/notifications.js";

const ACCOUNT_ACCENT = "#60A5FA"; // sky-blue — matches the old Account page

// SettingsPage. Extracted out of App.jsx (which had grown past 1500 lines) and
// extended with the Account & Sync section that used to be its own bottom-nav
// page. The Account page slot is now the Friends page; everything that used to
// live there (profile name, sign in/up, sync status, sign out) lives here.
export function SettingsPage({
  state,
  setState,
  resetState,
  auth,
  syncStatus,
  lastSyncedAt,
  syncError,
}) {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  // Which legal document is open as a full-screen overlay: 'privacy' | 'terms' | null.
  const [legalView, setLegalView] = useState(null);

  const soundOn = state.soundEnabled !== false;

  return (
    <div style={{ padding: "clamp(14px, 4.5vw, 20px)" }}>
      <div style={{ fontSize: "32px", fontWeight: 900, marginBottom: "24px", letterSpacing: "-0.02em" }}>
        Settings
      </div>

      {/* Account & Sync — moved here from the old Account page */}
      <AccountSyncSection
        state={state}
        setState={setState}
        auth={auth}
        syncStatus={syncStatus}
        lastSyncedAt={lastSyncedAt}
        syncError={syncError}
      />

      {/* Appearance — theme switcher */}
      <AppearanceCard
        theme={state.theme || "dark"}
        onChange={(t) => setState((prev) => ({ ...prev, theme: t }))}
      />

      {/* Sound — click-sound mute toggle */}
      <div
        style={{
          background: "var(--card)",
          backdropFilter: "blur(20px)",
          borderRadius: "24px",
          padding: "20px",
          marginBottom: "16px",
          border: "1px solid var(--border)",
        }}
      >
        <div style={{ fontSize: "11px", fontWeight: 700, marginBottom: "16px", color: "var(--text-faint)", fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}>
          SOUND
        </div>
        <Toggle
          label="Click sounds"
          checked={soundOn}
          onChange={(v) => {
            // Tick once on enable so the change is audible feedback.
            if (v) playClick();
            setState((prev) => ({ ...prev, soundEnabled: v }));
          }}
          style={{ marginBottom: "8px" }}
        />
        <div style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5 }}>
          A soft tick when you tap buttons and controls. The first sound plays
          after your first interaction (a browser requirement).
        </div>
      </div>

      {/* Install + Notifications */}
      <InstallAndNotificationsCard state={state} setState={setState} />

      {/* Skipped Gym History */}
      <div
        style={{
          background: "var(--card)",
          backdropFilter: "blur(20px)",
          borderRadius: "24px",
          padding: "20px",
          marginBottom: "16px",
          border: "1px solid var(--border)",
        }}
      >
        <div style={{ fontSize: "11px", fontWeight: 700, marginBottom: "16px", color: "var(--text-faint)", fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}>
          REASONS WHY I SKIPPED THE GYM
        </div>

        {(!state.gymSkips || state.gymSkips.length === 0) ? (
          <div style={{ fontSize: "13px", color: "var(--text-faint)", textAlign: "center", padding: "20px 0" }}>
            No gym skips logged. Stay consistent.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {state.gymSkips.map((item) => (
              <div key={item.id} style={{
                background: "rgba(248, 113, 113, 0.05)",
                border: "1px solid rgba(248, 113, 113, 0.15)",
                borderRadius: "16px",
                padding: "14px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#F87171", fontFamily: "var(--font-mono)", letterSpacing: "0.05em" }}>
                    GYM SKIPPED
                  </div>
                  <div style={{ fontSize: "9px", color: "#F87171", fontFamily: "var(--font-mono)" }}>{item.date}</div>
                </div>
                <div style={{ fontSize: "13px", color: "var(--text-muted)", fontStyle: "italic", lineHeight: 1.4 }}>
                  "{item.reason}"
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Missed Goals History */}
      <div
        style={{
          background: "var(--card)",
          backdropFilter: "blur(20px)",
          borderRadius: "24px",
          padding: "20px",
          marginBottom: "16px",
          border: "1px solid var(--border)",
        }}
      >
        <div style={{ fontSize: "11px", fontWeight: 700, marginBottom: "16px", color: "var(--text-faint)", fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}>
          SKIPPED / MISSED GOALS
        </div>

        {(!state.missedGoalsHistory || state.missedGoalsHistory.length === 0) ? (
          <div style={{ fontSize: "13px", color: "var(--text-faint)", textAlign: "center", padding: "20px 0" }}>
            No missed goals yet. Keep it up!
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {state.missedGoalsHistory.map((item) => (
              <div key={item.id} style={{
                background: "rgba(239, 68, 68, 0.05)",
                border: "1px solid rgba(239, 68, 68, 0.15)",
                borderRadius: "16px",
                padding: "14px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>{item.text}</div>
                  <div style={{ fontSize: "9px", color: "#F87171", fontFamily: "var(--font-mono)" }}>{item.date}</div>
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-faint)", fontStyle: "italic", lineHeight: 1.4 }}>
                  "{item.reason}"
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* About & How to Use */}
      <div
        style={{
          background: "var(--card)",
          backdropFilter: "blur(20px)",
          borderRadius: "24px",
          padding: "20px",
          marginBottom: "16px",
          border: "1px solid var(--border)",
        }}
      >
        <div style={{ fontSize: "11px", fontWeight: 700, marginBottom: "16px", color: "var(--text-faint)", fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}>
          ABOUT & HOW TO USE
        </div>

        <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", marginBottom: "8px" }}>
          Welcome to LifeOS
        </div>
        <div style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.55, marginBottom: "20px" }}>
          LifeOS is your personal accountability dashboard. Track your goals, sleep, finances, and gym — all in one place. The Overseer keeps you honest, calls out the slips, and rewards the wins.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {[
            {
              accent: "var(--accent-main)",
              label: "HOME",
              title: "Daily flow + Overseer",
              body: "See your day at a glance. Check off tasks, hit your habits, and chat with the Overseer — a brutally honest AI coach that knows your full context.",
            },
            {
              accent: "#F87171",
              label: "SLEEP",
              title: "Wake / Sleep Tracking",
              body: "Log when you went to bed and when you got up. Grow your sleep score. Hit 8+ hours for a full recovery.",
            },
            {
              accent: "#34D399",
              label: "FINANCES",
              title: "Income, Expenses, Net worth",
              body: "Track money in and money out. Set savings goals and watch your monthly expenses shrink. Numbers don't lie.",
            },
            {
              accent: "#FBBF24",
              label: "GYM",
              title: "Workouts + Skip Log",
              body: "Log sessions. If you skip, you have to write down why. Those excuses show up here in Settings so you can see your patterns.",
            },
            {
              accent: "#60A5FA",
              label: "FRIENDS",
              title: "Add friends, compare stats",
              body: "Add friends by email, accept or decline requests, and see your streaks, habits, to-dos, gym, and sleep side by side. A little friendly pressure goes a long way.",
            },
            {
              accent: "var(--text-muted)",
              label: "SETTINGS",
              title: "Account, History, Reset",
              body: "Manage your account and sync, edit your name, review every skipped gym session and missed goal, and reset everything from the Danger Zone if you need a fresh start.",
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "16px",
                padding: "14px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>{item.title}</div>
                <div style={{ fontSize: "10px", fontWeight: 700, color: item.accent, fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}>
                  {item.label}
                </div>
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5 }}>
                {item.body}
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Danger Zone */}
      <div
        style={{
          background: "rgba(248, 113, 113, 0.05)",
          borderRadius: "24px",
          padding: "20px",
          marginBottom: "16px",
          border: "1px solid rgba(248, 113, 113, 0.15)",
        }}
      >
        <div style={{ fontSize: "11px", fontWeight: 700, marginBottom: "16px", color: "#F87171", fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}>
          DANGER ZONE
        </div>
        {!showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "14px",
              border: "1px solid rgba(248, 113, 113, 0.3)",
              background: "transparent",
              color: "#F87171",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reset All Data
          </button>
        ) : (
          <div>
            <div style={{ fontSize: "13px", color: "var(--text-faint)", marginBottom: "16px" }}>
              Permanent deletion. This cannot be undone.
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => { resetState(); setShowResetConfirm(false); }}
                style={{ flex: 1, padding: "14px", borderRadius: "14px", border: "none", background: "#F87171", color: "#fff", fontWeight: 700, cursor: "pointer" }}
              >
                Reset
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                style={{ flex: 1, padding: "14px", borderRadius: "14px", border: "1px solid var(--border)", background: "transparent", color: "var(--text)", fontWeight: 600, cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Legal */}
      <div
        style={{
          background: "var(--card)",
          backdropFilter: "blur(20px)",
          borderRadius: "24px",
          padding: "20px",
          marginBottom: "16px",
          border: "1px solid var(--border)",
        }}
      >
        <div style={{ fontSize: "11px", fontWeight: 700, marginBottom: "12px", color: "var(--text-faint)", fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}>
          LEGAL
        </div>
        {[
          { id: "privacy", label: "Privacy Policy" },
          { id: "terms", label: "Terms of Service" },
        ].map((row, i) => (
          <button
            key={row.id}
            onClick={() => setLegalView(row.id)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 4px",
              background: "transparent",
              border: "none",
              borderTop: i === 0 ? "none" : "1px solid var(--border)",
              color: "var(--text)",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <span>{row.label}</span>
            <span style={{ color: "var(--text-faint)", fontSize: "18px", lineHeight: 1 }}>›</span>
          </button>
        ))}
      </div>

      <div style={{ textAlign: "center", fontSize: "11px", color: "var(--text-faint)", marginTop: "24px", fontFamily: "var(--font-mono)" }}>
        LIFEOS V3.0.0
      </div>

      {/* Full-screen legal reader overlay */}
      <AnimatePresence>
        {legalView && (
          <LegalPage
            key={legalView}
            doc={legalDocs[legalView]}
            onBack={() => setLegalView(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Account & Sync ──────────────────────────────────────────────────────────
// Ported from the old AccountPage. Two states: signed-in (profile + sync +
// sign out) and signed-out (sign in / sign up form). The "cloud not configured"
// branch was dropped — cloud is always configured via the keys in supabase.js.
function AccountSyncSection({ state, setState, auth, syncStatus, lastSyncedAt, syncError }) {
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [info, setInfo] = useState("");

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) return;
    setBusy(true);
    setErrorMsg("");
    setInfo("");
    try {
      const fn = mode === "signin" ? auth.signIn : auth.signUp;
      const { error } = await fn(email.trim(), password);
      if (error) {
        setErrorMsg(error.message || "Something went wrong.");
      } else if (mode === "signup") {
        setInfo("Account created. Check your inbox to confirm, then sign in.");
        setMode("signin");
      }
    } catch (e) {
      setErrorMsg(e.message || "Unexpected error.");
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    setBusy(true);
    await auth.signOut();
    setBusy(false);
  };

  const signedIn = auth.status === "signed-in" && auth.user;

  return (
    <>
      <ProfileNameCard state={state} setState={setState} />

      {signedIn ? (
        <>
          <GlassCard style={{ padding: "20px", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "16px" }}>
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${ACCOUNT_ACCENT}, ${ACCOUNT_ACCENT}cc)`,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  fontSize: "18px",
                  letterSpacing: "0.05em",
                  boxShadow: `0 4px 18px ${ACCOUNT_ACCENT}66`,
                  flexShrink: 0,
                }}
              >
                {(auth.user.email || "?").slice(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "15px", fontWeight: 800, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {auth.user.email}
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-faint)", fontFamily: "var(--font-mono)", letterSpacing: "0.05em", marginTop: "2px" }}>
                  SIGNED IN
                </div>
              </div>
            </div>

            <SyncStatusRow status={syncStatus} lastSyncedAt={lastSyncedAt} error={syncError} />

            <Button
              onClick={handleSignOut}
              variant="ghost"
              style={{ width: "100%", marginTop: "16px", border: "1px solid rgba(248, 113, 113, 0.3)", color: "#F87171" }}
              disabled={busy}
            >
              Sign out
            </Button>
          </GlassCard>

          <GlassCard style={{ padding: "18px", marginBottom: "16px" }}>
            <SectionLabel accent={ACCOUNT_ACCENT}>WHAT GETS SYNCED</SectionLabel>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.55 }}>
              Goals, habits, gym log, sleep, finances, journal entries, history
              snapshots, and your settings — everything you've built. Sign in on
              another device with the same email/password and it'll pull down
              within a second.
            </div>
          </GlassCard>
        </>
      ) : (
        <GlassCard style={{ padding: "20px", marginBottom: "16px" }}>
          <SectionLabel accent={ACCOUNT_ACCENT}>ACCOUNT & SYNC</SectionLabel>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5, marginBottom: "16px" }}>
            Sign in to back up your data, sync across devices, and add friends.
          </div>

          {/* Mode toggle */}
          <div
            style={{
              display: "flex",
              gap: "6px",
              marginBottom: "20px",
              padding: "4px",
              background: "var(--card)",
              borderRadius: "12px",
              border: "1px solid var(--border)",
            }}
          >
            {[
              { id: "signin", label: "Sign In" },
              { id: "signup", label: "Sign Up" },
            ].map((m) => {
              const active = mode === m.id;
              return (
                <motion.button
                  key={m.id}
                  onClick={() => { setMode(m.id); setErrorMsg(""); setInfo(""); }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "10px",
                    border: "none",
                    background: active ? `linear-gradient(135deg, ${ACCOUNT_ACCENT}, ${ACCOUNT_ACCENT}cc)` : "transparent",
                    color: active ? "#fff" : "var(--text-muted)",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    boxShadow: active ? `0 4px 16px ${ACCOUNT_ACCENT}55` : "none",
                    transition: "background 0.2s",
                  }}
                >
                  {m.label}
                </motion.button>
              );
            })}
          </div>

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === "signup" ? "At least 6 characters" : "••••••••"}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />

          {errorMsg && (
            <div style={{ padding: "10px 12px", borderRadius: "10px", background: "rgba(248, 113, 113, 0.10)", border: "1px solid rgba(248, 113, 113, 0.30)", color: "#F87171", fontSize: "12px", lineHeight: 1.4, marginBottom: "12px", fontFamily: "var(--font-mono)" }}>
              {errorMsg}
            </div>
          )}

          {info && (
            <div style={{ padding: "10px 12px", borderRadius: "10px", background: "rgba(52, 211, 153, 0.10)", border: "1px solid rgba(52, 211, 153, 0.30)", color: "#34D399", fontSize: "12px", lineHeight: 1.5, marginBottom: "12px" }}>
              {info}
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={busy || !email.trim() || !password.trim()}
            style={{ width: "100%", background: `linear-gradient(135deg, ${ACCOUNT_ACCENT}, ${ACCOUNT_ACCENT}cc)`, border: `1px solid ${ACCOUNT_ACCENT}66`, color: "#fff", fontWeight: 800, boxShadow: `0 4px 20px ${ACCOUNT_ACCENT}55` }}
          >
            {busy ? "Working…" : mode === "signin" ? "Sign In" : "Create Account"}
          </Button>

          <div style={{ fontSize: "11px", color: "var(--text-faint)", textAlign: "center", marginTop: "16px", lineHeight: 1.5 }}>
            By creating an account, your data is securely stored in LifeOS's
            cloud so it can sync across your devices. See the Privacy Policy
            below for what's collected and how it's used.
          </div>
        </GlassCard>
      )}
    </>
  );
}

function ProfileNameCard({ state, setState }) {
  return (
    <GlassCard style={{ padding: "20px", marginBottom: "16px" }}>
      <div style={{ fontSize: "11px", fontWeight: 700, marginBottom: "16px", color: "var(--text-faint)", fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}>
        PROFILE
      </div>
      <label style={{ fontSize: "10px", color: "var(--text-faint)", display: "block", marginBottom: "6px", fontFamily: "var(--font-mono)" }}>
        YOUR NAME
      </label>
      <input
        type="text"
        value={state?.user || ""}
        onChange={(e) => setState((prev) => ({ ...prev, user: e.target.value }))}
        placeholder="Your name"
        style={{
          width: "100%",
          background: "var(--input)",
          border: "1px solid var(--border)",
          borderRadius: "14px",
          padding: "14px",
          color: "var(--text)",
          fontSize: "14px",
          fontFamily: "var(--font-sans)",
          outline: "none",
          boxSizing: "border-box",
        }}
      />
      <div style={{ fontSize: "11px", color: "var(--text-faint)", marginTop: "8px", lineHeight: 1.4 }}>
        Used for your greeting. Friends see you by your email name (the part
        before the "@").
      </div>
    </GlassCard>
  );
}

function SyncStatusRow({ status, lastSyncedAt, error }) {
  const cfg = {
    idle: { color: "#34D399", label: "IN SYNC" },
    pulling: { color: "#60A5FA", label: "PULLING…" },
    syncing: { color: "#FBBF24", label: "SYNCING…" },
    error: { color: "#F87171", label: "SYNC ERROR" },
    offline: { color: "var(--text-faint)", label: "OFFLINE" },
  };
  const c = cfg[status] || cfg.idle;
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 14px",
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <motion.span
          animate={status === "syncing" || status === "pulling" ? { scale: [1, 1.3, 1], opacity: [1, 0.6, 1] } : {}}
          transition={{ duration: 1.2, repeat: Infinity }}
          style={{ width: "8px", height: "8px", borderRadius: "50%", background: c.color, boxShadow: `0 0 8px ${c.color}`, display: "inline-block" }}
        />
        <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: c.color, fontWeight: 800, letterSpacing: "0.1em" }}>
          {c.label}
        </span>
      </div>
      <div style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--text-faint)", letterSpacing: "0.05em" }}>
        {error
          ? String(error).slice(0, 32)
          : lastSyncedAt
            ? `LAST · ${new Date(lastSyncedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`
            : "WAITING"}
      </div>
    </div>
  );
}

// ── App install + notifications card (moved from App.jsx) ───────────────────
function InstallAndNotificationsCard({ state, setState }) {
  const [notifPerm, setNotifPerm] = useState(notificationStatus());
  const [installAvailable, setInstallAvailable] = useState(canInstall());
  const [installed, setInstalled] = useState(isStandalone());

  // The beforeinstallprompt event fires asynchronously after page load. Listen
  // for our utility's rebroadcast so the button can light up when available.
  useEffect(() => {
    const onAvailable = () => setInstallAvailable(true);
    const onInstalled = () => {
      setInstallAvailable(false);
      setInstalled(true);
    };
    window.addEventListener("lifeos:install-available", onAvailable);
    window.addEventListener("lifeos:installed", onInstalled);
    return () => {
      window.removeEventListener("lifeos:install-available", onAvailable);
      window.removeEventListener("lifeos:installed", onInstalled);
    };
  }, []);

  const handleToggleNotifications = async () => {
    if (state.notificationsEnabled) {
      setState((p) => ({ ...p, notificationsEnabled: false }));
      return;
    }
    const result = await requestNotificationPermission();
    setNotifPerm(notificationStatus());
    if (result === "granted") {
      setState((p) => ({ ...p, notificationsEnabled: true }));
      // Fire a confirmation ping so the user sees it works.
      showNotification("Overseer wired up", "You'll get a 9am check-in daily. Sub renewals get a heads-up too.", { tag: "lifeos-welcome" });
    }
  };

  const handleInstall = async () => {
    const outcome = await promptInstall();
    if (outcome === "accepted") setInstallAvailable(false);
  };

  const permLabel =
    notifPerm === "granted" ? "GRANTED" :
    notifPerm === "denied" ? "BLOCKED" :
    notifPerm === "unsupported" ? "UNSUPPORTED" : "NOT SET";
  const permColor =
    notifPerm === "granted" ? "#34D399" :
    notifPerm === "denied" ? "#F87171" :
    "var(--text-faint)";

  // Hide the install row entirely once the user is already running standalone.
  const showInstall = !installed;

  return (
    <div
      style={{
        background: "var(--card)",
        backdropFilter: "blur(20px)",
        borderRadius: "24px",
        padding: "20px",
        marginBottom: "16px",
        border: "1px solid var(--border)",
      }}
    >
      <div style={{ fontSize: "11px", fontWeight: 700, marginBottom: "16px", color: "var(--text-faint)", fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}>
        APP & NOTIFICATIONS
      </div>

      {/* Notifications row */}
      <div style={{ marginBottom: showInstall ? "16px" : 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>
            Daily Overseer ping
          </div>
          <div style={{ fontSize: "9px", fontFamily: "var(--font-mono)", letterSpacing: "0.1em", color: permColor, fontWeight: 700 }}>
            {permLabel}
          </div>
        </div>
        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "12px", lineHeight: 1.5 }}>
          9am check-in with streak, habits, and goals — plus a 3-day heads-up before any subscription renews. Best results when LifeOS is installed to your home screen.
        </div>
        <button
          onClick={handleToggleNotifications}
          disabled={notifPerm === "denied" || notifPerm === "unsupported"}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "12px",
            border: state.notificationsEnabled ? "1px solid rgba(52,211,153,0.4)" : "1px solid var(--border)",
            background: state.notificationsEnabled ? "rgba(52,211,153,0.12)" : "var(--card-mid)",
            color: state.notificationsEnabled ? "#34D399" : "var(--text)",
            fontWeight: 700,
            fontSize: "13px",
            cursor: (notifPerm === "denied" || notifPerm === "unsupported") ? "not-allowed" : "pointer",
            opacity: (notifPerm === "denied" || notifPerm === "unsupported") ? 0.5 : 1,
            fontFamily: "inherit",
          }}
        >
          {state.notificationsEnabled ? "✓ Notifications ON" :
           notifPerm === "denied" ? "Blocked in browser settings" :
           notifPerm === "unsupported" ? "Not supported here" :
           "Enable notifications"}
        </button>
      </div>

      {/* Install row */}
      {showInstall && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>
              Install LifeOS
            </div>
            <div style={{ fontSize: "9px", fontFamily: "var(--font-mono)", letterSpacing: "0.1em", color: installAvailable ? "#34D399" : "var(--text-faint)", fontWeight: 700 }}>
              {installAvailable ? "READY" : "USE BROWSER MENU"}
            </div>
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "12px", lineHeight: 1.5 }}>
            Add to your home screen — runs like a native app, opens straight to your dashboard. On iPhone: Safari → Share → Add to Home Screen.
          </div>
          <button
            onClick={handleInstall}
            disabled={!installAvailable}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "12px",
              border: installAvailable ? "1px solid rgba(var(--accent-main-rgb),0.5)" : "1px solid var(--border)",
              background: installAvailable ? "linear-gradient(135deg, var(--accent-main), rgba(var(--accent-main-rgb),0.75))" : "var(--card-mid)",
              color: installAvailable ? "#fff" : "var(--text-faint)",
              fontWeight: 700,
              fontSize: "13px",
              cursor: installAvailable ? "pointer" : "not-allowed",
              opacity: installAvailable ? 1 : 0.7,
              fontFamily: "inherit",
            }}
          >
            {installAvailable ? "Install to Home Screen" : "Open browser's install menu"}
          </button>
        </div>
      )}

      {installed && (
        <div style={{ marginTop: "12px", padding: "10px 12px", borderRadius: "10px", background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.25)", fontSize: "12px", color: "#34D399", fontFamily: "var(--font-mono)", letterSpacing: "0.05em", textAlign: "center" }}>
          ✓ RUNNING AS INSTALLED APP
        </div>
      )}
    </div>
  );
}

// Three-card theme picker. Each card paints itself with its own theme's
// accent + bg as a live preview swatch so the user sees exactly what they're
// switching to. Stacks on narrow screens via auto-fit grid.
function AppearanceCard({ theme, onChange }) {
  const options = [
    { id: "dark",     label: "Dark",     accent: "#7C6DFA", bg: "#080810", text: "#F8FAFF", tagline: "Deep space + indigo glow" },
    { id: "light",    label: "Light",    accent: "#F97316", bg: "#FAFAF7", text: "#1A1A1F", tagline: "Soft white + vibrant orange" },
    { id: "midnight", label: "Midnight", accent: "#10B981", bg: "#03060B", text: "#E8FFF4", tagline: "Pure black + emerald CRT" },
  ];
  return (
    <div
      style={{
        background: "var(--card)",
        backdropFilter: "blur(20px)",
        borderRadius: "24px",
        padding: "20px",
        marginBottom: "16px",
        border: "1px solid var(--border)",
      }}
    >
      <div style={{ fontSize: "11px", fontWeight: 700, marginBottom: "16px", color: "var(--text-faint)", fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}>
        APPEARANCE
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px" }}>
        {options.map((opt) => {
          const selected = theme === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onChange(opt.id)}
              style={{
                background: opt.bg,
                color: opt.text,
                border: `2px solid ${selected ? opt.accent : "var(--border)"}`,
                borderRadius: "16px",
                padding: "14px",
                cursor: "pointer",
                textAlign: "left",
                boxShadow: selected ? `0 0 18px ${opt.accent}55` : "none",
                transition: "border-color 0.2s, box-shadow 0.2s",
                fontFamily: "inherit",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: opt.accent, boxShadow: `0 0 8px ${opt.accent}aa` }} />
                <span style={{ fontWeight: 700, fontSize: "14px" }}>{opt.label}</span>
                {selected && (
                  <span style={{ marginLeft: "auto", fontSize: "10px", fontFamily: "var(--font-mono)", color: opt.accent, letterSpacing: "0.1em" }}>
                    ACTIVE
                  </span>
                )}
              </div>
              <div style={{ fontSize: "11px", opacity: 0.65 }}>
                {opt.tagline}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
