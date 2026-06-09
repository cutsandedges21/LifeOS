import { useEffect, useRef } from "react";

const ACCENT = "#60A5FA"; // sky-blue — matches the Account & Sync / sign-in styling

// LockGate — gates a feature behind sign-in.
//
// Signed in  → renders children untouched.
// Signed out → renders a self-contained locked card: a blurred, non-interactive
//              teaser of the real feature behind a centered "Sign in to unlock"
//              overlay.
//
// Layout: the lock content sits in NORMAL FLOW so it defines the card's height,
// and the blurred teaser is absolutely positioned behind it and clipped
// (overflow: hidden). This is what keeps short features (e.g. the gym day
// selector) from letting the lock content overflow onto neighbouring cards —
// the card always grows to fit the lock, never the other way around.
//
// The teaser is `inert` (no focus/tab/pointer) so locked controls can't be
// reached behind the overlay.
//
// Props:
//   signedIn — boolean
//   title    — feature name shown under the lock (e.g. "Overseer AI")
//   note     — optional one-line explanation
//   onSignIn — called when the CTA is tapped (App routes this to Settings)
export function LockGate({ signedIn, title, note, onSignIn, children }) {
  const previewRef = useRef(null);

  // Set `inert` imperatively so it works regardless of React version's support
  // for the prop. Belt-and-suspenders alongside pointer-events / aria-hidden.
  useEffect(() => {
    if (previewRef.current) previewRef.current.inert = true;
  });

  if (signedIn) return children;

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: "20px",
        border: "1px solid var(--border)",
        background: "var(--card)",
        marginBottom: "16px",
      }}
    >
      {/* Blurred teaser of the real feature, clipped to the card. Absolutely
          positioned so it never affects the card's height. */}
      <div
        ref={previewRef}
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          filter: "blur(6px)",
          opacity: 0.4,
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        {children}
      </div>

      {/* Lock content — in normal flow, so it sets the card height. */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          gap: "8px",
          padding: "32px 20px",
          minHeight: "120px",
        }}
      >
        <div style={{ fontSize: "30px", lineHeight: 1 }}>🔒</div>
        <div style={{ fontSize: "15px", fontWeight: 800, color: "var(--text)" }}>
          {title}
        </div>
        {note && (
          <div style={{ fontSize: "12px", color: "var(--text-muted)", maxWidth: "280px", lineHeight: 1.45 }}>
            {note}
          </div>
        )}
        <button
          onClick={onSignIn}
          style={{
            marginTop: "4px",
            padding: "10px 18px",
            borderRadius: "12px",
            border: `1px solid ${ACCENT}66`,
            background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT}cc)`,
            color: "#fff",
            fontSize: "13px",
            fontWeight: 800,
            cursor: "pointer",
            fontFamily: "inherit",
            boxShadow: `0 4px 18px ${ACCENT}55`,
          }}
        >
          Sign in to unlock
        </button>
      </div>
    </div>
  );
}
