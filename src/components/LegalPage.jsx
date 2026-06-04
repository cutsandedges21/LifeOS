import { useEffect } from "react";
import { motion } from "framer-motion";

// Full-screen reader for a legal document (Privacy Policy / Terms of Service).
// Rendered as a fixed overlay above everything else so it reads like its own
// page, with a sticky "← Back" header. Driven entirely by the `doc` data shape
// defined in src/content/legal.js, so the same component renders both docs.
export function LegalPage({ doc, onBack }) {
  // Lock body scroll while open and start the reader at the top.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  if (!doc) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ type: "spring", stiffness: 360, damping: 32 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 4000,
        background: "var(--bg)",
        color: "var(--text)",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {/* Sticky header */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 1,
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "16px clamp(14px, 4.5vw, 22px)",
          background: "var(--card-mid)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <button
          onClick={onBack}
          aria-label="Back to settings"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 12px",
            borderRadius: "12px",
            border: "1px solid var(--border)",
            background: "var(--card)",
            color: "var(--text)",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          <span style={{ fontSize: "15px", lineHeight: 1 }}>‹</span> Back
        </button>
        <div
          style={{
            fontSize: "15px",
            fontWeight: 800,
            letterSpacing: "-0.01em",
            color: "var(--text)",
          }}
        >
          {doc.title}
        </div>
      </div>

      {/* Body */}
      <div
        style={{
          maxWidth: "720px",
          margin: "0 auto",
          padding: "24px clamp(14px, 4.5vw, 22px) 96px",
        }}
      >
        <h1
          style={{
            fontSize: "clamp(26px, 6vw, 34px)",
            fontWeight: 900,
            letterSpacing: "-0.02em",
            margin: "0 0 6px",
          }}
        >
          {doc.title}
        </h1>
        <div
          style={{
            fontSize: "11px",
            fontFamily: "var(--font-mono)",
            color: "var(--text-faint)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: "20px",
          }}
        >
          Last updated · {doc.lastUpdated}
        </div>

        {doc.intro && (
          <p
            style={{
              fontSize: "14px",
              lineHeight: 1.65,
              color: "var(--text-muted)",
              marginBottom: "8px",
            }}
          >
            {doc.intro}
          </p>
        )}

        {doc.sections.map((section, i) => (
          <section key={i} style={{ marginTop: "26px" }}>
            <h2
              style={{
                fontSize: "16px",
                fontWeight: 800,
                color: "var(--text)",
                margin: "0 0 10px",
                letterSpacing: "-0.01em",
              }}
            >
              {section.heading}
            </h2>
            {section.body.map((item, j) =>
              typeof item === "string" ? (
                <p
                  key={j}
                  style={{
                    fontSize: "13.5px",
                    lineHeight: 1.65,
                    color: "var(--text-muted)",
                    margin: "0 0 10px",
                  }}
                >
                  {item}
                </p>
              ) : (
                <ul
                  key={j}
                  style={{
                    margin: "0 0 10px",
                    paddingLeft: "20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "7px",
                  }}
                >
                  {item.list.map((li, k) => (
                    <li
                      key={k}
                      style={{
                        fontSize: "13.5px",
                        lineHeight: 1.55,
                        color: "var(--text-muted)",
                      }}
                    >
                      {li}
                    </li>
                  ))}
                </ul>
              )
            )}
          </section>
        ))}

        <div
          style={{
            marginTop: "40px",
            paddingTop: "16px",
            borderTop: "1px solid var(--border)",
            fontSize: "11px",
            fontFamily: "var(--font-mono)",
            color: "var(--text-faint)",
            letterSpacing: "0.06em",
            textAlign: "center",
          }}
        >
          LIFEOS · {doc.title.toUpperCase()}
        </div>
      </div>
    </motion.div>
  );
}
