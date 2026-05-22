import { useEffect } from "react";
import { motion } from "framer-motion";

// Full-screen intro shown on first session load and after sign-in/sign-up.
// Animates a wordmark with a sweeping accent line, then fades out and
// notifies the parent via onComplete so the overlay can unmount.
//
// Duration: ~1.8s. Locks scroll while visible.
export function IntroAnimation({ onComplete }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const t = setTimeout(() => {
      onComplete?.();
    }, 1800);

    return () => {
      document.body.style.overflow = prev;
      clearTimeout(t);
    };
  }, [onComplete]);

  const letters = "LIFEOS".split("");

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.45, ease: "easeInOut" } }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "var(--bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        // Belt-and-braces fallback in case --bg isn't loaded yet on cold start.
        backgroundColor: "#0A0E14",
      }}
    >
      {/* Radial accent glow that pulses outward */}
      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: [0.4, 1.6, 2.2], opacity: [0, 0.55, 0] }}
        transition={{ duration: 1.6, ease: "easeOut", times: [0, 0.4, 1] }}
        style={{
          position: "absolute",
          width: "60vmin",
          height: "60vmin",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(var(--accent-main-rgb),0.55) 0%, rgba(var(--accent-main-rgb),0.10) 45%, transparent 70%)",
          filter: "blur(8px)",
          pointerEvents: "none",
        }}
      />

      {/* Wordmark — letters cascade in, then a sweep line passes underneath */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "14px",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "clamp(2px, 0.8vmin, 6px)",
            fontFamily: "var(--font-sans)",
            fontWeight: 900,
            fontSize: "clamp(48px, 14vmin, 120px)",
            letterSpacing: "-0.03em",
            color: "var(--text)",
            lineHeight: 1,
          }}
        >
          {letters.map((ch, i) => (
            <motion.span
              key={i}
              initial={{ y: 24, opacity: 0, filter: "blur(8px)" }}
              animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
              transition={{
                delay: 0.15 + i * 0.06,
                duration: 0.55,
                ease: [0.2, 0.8, 0.2, 1],
              }}
              style={{ display: "inline-block" }}
            >
              {ch}
            </motion.span>
          ))}
        </div>

        {/* Accent sweep line under the wordmark */}
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: ["0%", "100%", "0%"], opacity: [0, 1, 0] }}
          transition={{
            duration: 1.2,
            delay: 0.55,
            ease: "easeInOut",
            times: [0, 0.55, 1],
          }}
          style={{
            height: "2px",
            background:
              "linear-gradient(90deg, transparent, var(--accent-main), transparent)",
            borderRadius: "2px",
            boxShadow: "0 0 14px rgba(var(--accent-main-rgb),0.7)",
          }}
        />

        {/* Tagline */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.95, duration: 0.5, ease: "easeOut" }}
          style={{
            fontSize: "clamp(10px, 1.6vmin, 13px)",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.4em",
            color: "var(--text-faint)",
            textTransform: "uppercase",
            paddingLeft: "0.4em",
          }}
        >
          your operating system
        </motion.div>
      </div>
    </motion.div>
  );
}
