import { useEffect, useRef } from "react";

const ACCENT = "#60A5FA"; // sky-blue — matches the Account & Sync / sign-in styling

// LockGate — gates a feature behind sign-in.
//
// Signed in  → renders children untouched.
// Signed out → renders the real children as a blurred, non-interactive preview
//              with a centered "Sign in to unlock" overlay. The preview is made
//              `inert` (no focus/tab/pointer) so the locked controls can't be
//              reached behind the overlay.
//
// Purely presentational — no layout measurement, so it can wrap any card safely.
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
    <div style={{ position: "relative" }}>
      <div
        ref={previewRef}
        aria-hidden="true"
        style={{
          filter: "blur(5px)",
          opacity: 0.45,
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        {children}
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          gap: "8px",
          padding: "20px",
          borderRadius: "20px",
        }}
      >
        <div style={{ fontSize: "30px", lineHeight: 1 }}>🔒</div>
        <div style={{ fontSize: "15px", fontWeight: 800, color: "var(--text)" }}>
          {title}
        </div>
        {note && (
          <div style={{ fontSize: "12px", color: "var(--text-muted)", maxWidth: "260px", lineHeight: 1.45 }}>
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
