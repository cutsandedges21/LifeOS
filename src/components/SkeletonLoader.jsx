import { motion } from "framer-motion";

// SkeletonLoader. Shown during initial hydration (localStorage + cloud pull)
// so users see the page shape they're about to get instead of a bare "LIFEOS"
// text loader that then jumps into a fully-populated layout.
//
// All bones use a single shared keyframe + CSS variables so the loader matches
// the active theme without code changes.

// Inject the shimmer keyframes once. Cheap, idempotent — same pattern as
// GlassComponents.jsx uses for its `shake` animation.
if (typeof document !== "undefined") {
  const existing = document.getElementById("lifeos-skeleton-styles");
  if (!existing) {
    const s = document.createElement("style");
    s.id = "lifeos-skeleton-styles";
    s.textContent = `
      @keyframes lifeos-shimmer {
        0%   { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
      .lifeos-bone {
        background: linear-gradient(
          90deg,
          var(--card) 0%,
          var(--card-mid) 50%,
          var(--card) 100%
        );
        background-size: 200% 100%;
        animation: lifeos-shimmer 1.4s ease-in-out infinite;
        border: 1px solid var(--border);
        border-radius: 12px;
      }
    `;
    document.head.appendChild(s);
  }
}

function Bone({ width = "100%", height = 16, radius = 8, style = {} }) {
  return (
    <div
      className="lifeos-bone"
      style={{
        width,
        height,
        borderRadius: radius,
        ...style,
      }}
    />
  );
}

// Full-page skeleton used during initial load. Layout mirrors MainPage so the
// reveal feels like content snapping into the bones rather than a layout
// shift.
export function PageSkeleton() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--text)",
        fontFamily: "var(--font-sans)",
        padding: "12px 16px 100px",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {/* Top pill bar */}
      <Bone
        height={42}
        radius={24}
        style={{ marginBottom: "20px", maxWidth: "100%" }}
      />

      {/* Health strip — 4 pills */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "16px",
          overflow: "hidden",
        }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <Bone key={i} width={84} height={26} radius={20} />
        ))}
      </div>

      {/* Hero card */}
      <div
        style={{
          padding: "20px",
          borderRadius: "20px",
          background: "var(--card-mid)",
          border: "1px solid var(--border-high)",
          marginBottom: "14px",
        }}
      >
        <Bone height={12} width="40%" style={{ marginBottom: "8px" }} />
        <Bone height={28} width="70%" style={{ marginBottom: "18px" }} />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 1fr",
            gap: "8px",
          }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <Bone key={i} height={56} radius={12} />
          ))}
        </div>
      </div>

      {/* Habits & goals link card */}
      <div
        style={{
          padding: "18px",
          borderRadius: "20px",
          background: "var(--card)",
          border: "1px solid var(--border)",
          marginBottom: "14px",
        }}
      >
        <Bone height={14} width="35%" style={{ marginBottom: "14px" }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <Bone height={56} radius={14} />
          <Bone height={56} radius={14} />
        </div>
      </div>

      {/* Trends card */}
      <div
        style={{
          padding: "18px",
          borderRadius: "20px",
          background: "var(--card)",
          border: "1px solid var(--border)",
          marginBottom: "14px",
        }}
      >
        <Bone height={14} width="30%" style={{ marginBottom: "14px" }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Bone key={i} height={84} radius={14} />
          ))}
        </div>
      </div>

      {/* Bottom nav placeholder */}
      <div
        style={{
          position: "fixed",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "64px",
          height: "64px",
          borderRadius: "50%",
          background:
            "linear-gradient(135deg, var(--card-mid), var(--card-high))",
          border: "1px solid var(--border-high)",
          opacity: 0.7,
        }}
      />

      {/* Soft logo wordmark fading in/out so users see "yes, this is LifeOS,
          and yes, it's still loading" — keeps the brand presence we had with
          the old text loader. */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.45, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "fixed",
          bottom: "100px",
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: "var(--font-mono)",
          fontSize: "10px",
          letterSpacing: "0.3em",
          color: "var(--text-faint)",
          pointerEvents: "none",
        }}
      >
        LIFEOS · LOADING
      </motion.div>
    </div>
  );
}

// Inline skeleton used inside a card when only part of the page is loading
// (e.g. waiting for an in-card cloud fetch). Kept tiny so callers can mix it
// into existing layouts without wrapper chrome.
export function InlineSkeleton({ rows = 3, height = 14, gap = 8 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap }}>
      {Array.from({ length: rows }).map((_, i) => (
        <Bone
          key={i}
          height={height}
          width={`${100 - i * 8}%`}
          radius={6}
        />
      ))}
    </div>
  );
}
