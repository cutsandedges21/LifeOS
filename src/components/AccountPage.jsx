import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "./GlassComponents.jsx";
import { SectionLabel, Input, Button } from "./UI.jsx";
import { SETUP_SQL } from "../utils/supabase.js";

const ACCENT = "#60A5FA"; // sky-blue — distinct from other page accents

// AccountPage. Three rendered states:
//   1. configured=false           → setup instructions (how to wire Supabase)
//   2. configured=true, signed-out → login/signup form
//   3. configured=true, signed-in  → profile + sync status + sign out
//
// The page is the 7th item in the bottom nav, which keeps Home at the apex
// (centered) of the 7-item half-circle.

export function AccountPage({
  state,
  setState,
  auth,
  syncStatus,
  lastSyncedAt,
  syncError,
}) {
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [info, setInfo] = useState("");
  const [showSql, setShowSql] = useState(false);

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
        setInfo(
          "Account created. Check your inbox to confirm, then sign in."
        );
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

  // ── 1. Cloud not configured ────────────────────────────────────────
  if (!auth.configured) {
    return (
      <PageShell>
        <PageHeader
          title="Account & Sync"
          subtitle="Sync your data across devices with optional cloud backup."
        />

        <ProfileNameCard state={state} setState={setState} />

        <GlassCard
          style={{
            padding: "20px",
            border: `1px dashed ${ACCENT}55`,
            background: `${ACCENT}0d`,
          }}
        >
          <div
            style={{
              fontSize: "10px",
              fontFamily: "var(--font-mono)",
              color: ACCENT,
              letterSpacing: "0.12em",
              fontWeight: 800,
              marginBottom: "10px",
            }}
          >
            CLOUD SYNC NOT CONFIGURED
          </div>
          <div
            style={{
              fontSize: "13px",
              color: "var(--text-muted)",
              lineHeight: 1.55,
              marginBottom: "16px",
            }}
          >
            Right now your data is saved locally only — fast and private, but
            it lives on this device. To sync across devices, take 3 minutes to
            set up Supabase (free tier).
          </div>

          <ol
            style={{
              margin: 0,
              paddingLeft: "20px",
              fontSize: "13px",
              color: "var(--text-muted)",
              lineHeight: 1.6,
            }}
          >
            <li>
              Create a free project at{" "}
              <a
                href="https://supabase.com"
                target="_blank"
                rel="noreferrer"
                style={{ color: ACCENT }}
              >
                supabase.com
              </a>
            </li>
            <li>
              In Supabase → SQL editor, paste and run the snippet below.
            </li>
          </ol>

          <button
            onClick={() => setShowSql((v) => !v)}
            style={{
              marginTop: "14px",
              width: "100%",
              padding: "10px",
              borderRadius: "10px",
              border: `1px solid ${ACCENT}55`,
              background: `${ACCENT}1a`,
              color: ACCENT,
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.06em",
            }}
          >
            {showSql ? "HIDE SQL ↑" : "SHOW SETUP SQL ↓"}
          </button>

          <AnimatePresence>
            {showSql && (
              <motion.pre
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{
                  marginTop: "10px",
                  padding: "12px",
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "10px",
                  fontSize: "11px",
                  fontFamily: "var(--font-mono)",
                  color: "var(--text-muted)",
                  overflow: "auto",
                  whiteSpace: "pre",
                  lineHeight: 1.5,
                  maxHeight: "300px",
                }}
              >
                {SETUP_SQL}
              </motion.pre>
            )}
          </AnimatePresence>
        </GlassCard>

        <LocalOnlyCard />
      </PageShell>
    );
  }

  // ── 2. Configured + signed in ─────────────────────────────────────
  if (auth.status === "signed-in" && auth.user) {
    const initials = (auth.user.email || "?").slice(0, 2).toUpperCase();
    return (
      <PageShell>
        <PageHeader title="Account" />

        <ProfileNameCard state={state} setState={setState} />

        <GlassCard style={{ padding: "20px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT}cc)`,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: "18px",
                letterSpacing: "0.05em",
                boxShadow: `0 4px 18px ${ACCENT}66`,
                flexShrink: 0,
              }}
            >
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: "15px",
                  fontWeight: 800,
                  color: "var(--text)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {auth.user.email}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "var(--text-faint)",
                  fontFamily: "var(--font-mono)",
                  letterSpacing: "0.05em",
                  marginTop: "2px",
                }}
              >
                SIGNED IN
              </div>
            </div>
          </div>

          <SyncStatusRow
            status={syncStatus}
            lastSyncedAt={lastSyncedAt}
            error={syncError}
          />

          <Button
            onClick={handleSignOut}
            variant="ghost"
            style={{
              width: "100%",
              marginTop: "16px",
              border: "1px solid rgba(248, 113, 113, 0.3)",
              color: "#F87171",
            }}
            disabled={busy}
          >
            Sign out
          </Button>
        </GlassCard>

        <GlassCard style={{ padding: "18px" }}>
          <SectionLabel accent={ACCENT}>WHAT GETS SYNCED</SectionLabel>
          <div
            style={{
              fontSize: "12px",
              color: "var(--text-muted)",
              lineHeight: 1.55,
            }}
          >
            Goals, habits, gym log, sleep, finances, journal entries, history
            snapshots, and your settings — everything you've built. Sign in on
            another device with the same email/password and it'll pull down
            within a second.
          </div>
        </GlassCard>
      </PageShell>
    );
  }

  // ── 3. Configured + signed out → auth form ────────────────────────
  return (
    <PageShell>
      <PageHeader
        title="Account & Sync"
        subtitle="Sign in to back up your data and sync it across every device."
      />

      <ProfileNameCard state={state} setState={setState} />

      <GlassCard style={{ padding: "20px" }}>
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
                onClick={() => {
                  setMode(m.id);
                  setErrorMsg("");
                  setInfo("");
                }}
                whileTap={{ scale: 0.97 }}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "10px",
                  border: "none",
                  background: active
                    ? `linear-gradient(135deg, ${ACCENT}, ${ACCENT}cc)`
                    : "transparent",
                  color: active ? "#fff" : "var(--text-muted)",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  boxShadow: active ? `0 4px 16px ${ACCENT}55` : "none",
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
          <div
            style={{
              padding: "10px 12px",
              borderRadius: "10px",
              background: "rgba(248, 113, 113, 0.10)",
              border: "1px solid rgba(248, 113, 113, 0.30)",
              color: "#F87171",
              fontSize: "12px",
              lineHeight: 1.4,
              marginBottom: "12px",
              fontFamily: "var(--font-mono)",
            }}
          >
            {errorMsg}
          </div>
        )}

        {info && (
          <div
            style={{
              padding: "10px 12px",
              borderRadius: "10px",
              background: "rgba(52, 211, 153, 0.10)",
              border: "1px solid rgba(52, 211, 153, 0.30)",
              color: "#34D399",
              fontSize: "12px",
              lineHeight: 1.5,
              marginBottom: "12px",
            }}
          >
            {info}
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={busy || !email.trim() || !password.trim()}
          style={{
            width: "100%",
            background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT}cc)`,
            border: `1px solid ${ACCENT}66`,
            color: "#fff",
            fontWeight: 800,
            boxShadow: `0 4px 20px ${ACCENT}55`,
          }}
        >
          {busy
            ? "Working…"
            : mode === "signin"
              ? "Sign In"
              : "Create Account"}
        </Button>

        <div
          style={{
            fontSize: "11px",
            color: "var(--text-faint)",
            textAlign: "center",
            marginTop: "16px",
            lineHeight: 1.5,
          }}
        >
          By creating an account, your data is securely stored in LifeOS's
          cloud so it can sync across your devices. See the Privacy Policy in
          Settings for what's collected and how it's used.
        </div>
      </GlassCard>

      <LocalOnlyCard />
    </PageShell>
  );
}

// ── Sub-components ──────────────────────────────────────────────────

function ProfileNameCard({ state, setState }) {
  return (
    <GlassCard style={{ padding: "20px", marginBottom: "16px" }}>
      <div
        style={{
          fontSize: "11px",
          fontWeight: 700,
          marginBottom: "16px",
          color: "var(--text-faint)",
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.1em",
        }}
      >
        PROFILE
      </div>
      <div>
        <label
          style={{
            fontSize: "10px",
            color: "var(--text-faint)",
            display: "block",
            marginBottom: "6px",
            fontFamily: "var(--font-mono)",
          }}
        >
          YOUR NAME
        </label>
        <input
          type="text"
          value={state?.user || ""}
          onChange={(e) =>
            setState((prev) => ({ ...prev, user: e.target.value }))
          }
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
      </div>
    </GlassCard>
  );
}

function PageShell({ children }) {
  return (
    <div style={{ padding: "0 clamp(14px, 4.5vw, 20px)" }}>{children}</div>
  );
}

function PageHeader({ title, subtitle }) {
  return (
    <GlassCard style={{ padding: "20px", marginBottom: "16px" }}>
      <div
        style={{
          fontSize: "26px",
          fontWeight: 900,
          letterSpacing: "-0.02em",
          color: "var(--text)",
          lineHeight: 1.05,
          marginBottom: subtitle ? "6px" : 0,
        }}
      >
        {title}
      </div>
      {subtitle && (
        <div
          style={{
            fontSize: "13px",
            color: "var(--text-muted)",
            lineHeight: 1.5,
          }}
        >
          {subtitle}
        </div>
      )}
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
          animate={
            status === "syncing" || status === "pulling"
              ? { scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }
              : {}
          }
          transition={{ duration: 1.2, repeat: Infinity }}
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: c.color,
            boxShadow: `0 0 8px ${c.color}`,
            display: "inline-block",
          }}
        />
        <span
          style={{
            fontSize: "11px",
            fontFamily: "var(--font-mono)",
            color: c.color,
            fontWeight: 800,
            letterSpacing: "0.1em",
          }}
        >
          {c.label}
        </span>
      </div>
      <div
        style={{
          fontSize: "10px",
          fontFamily: "var(--font-mono)",
          color: "var(--text-faint)",
          letterSpacing: "0.05em",
        }}
      >
        {error
          ? error.slice(0, 32)
          : lastSyncedAt
            ? `LAST · ${new Date(lastSyncedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`
            : "WAITING"}
      </div>
    </div>
  );
}

function LocalOnlyCard() {
  return (
    <GlassCard style={{ padding: "16px" }}>
      <SectionLabel accent="var(--text-muted)">LOCAL-ONLY MODE</SectionLabel>
      <div
        style={{
          fontSize: "12px",
          color: "var(--text-muted)",
          lineHeight: 1.5,
        }}
      >
        You can keep using LifeOS without an account — everything works,
        nothing leaves the device. Sign in later when you're ready to sync across devices.
      </div>
    </GlassCard>
  );
}
