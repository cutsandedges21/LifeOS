import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

const CONFETTI_COLORS = ["#FBBF24", "#34D399", "#22D3EE", "#F87171", "#A855F7", "#F97316", "#7C6DFA"];

// Full-screen celebration overlay. Driven by a single `event` prop; when
// non-null it animates in, fires confetti, and auto-dismisses after 3.5s.
// Tap anywhere to dismiss early.
//
// event shape: { emoji, label, title, message, color }
export function Celebration({ event, onDismiss }) {
  useEffect(() => {
    if (!event) return;
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [event, onDismiss]);

  return (
    <AnimatePresence>
      {event && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onDismiss}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9998,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          {/* Confetti burst — 32 pieces fly out radially from center */}
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {Array.from({ length: 32 }).map((_, i) => {
              const angle = (i / 32) * Math.PI * 2 + Math.random() * 0.4;
              const distance = 140 + Math.random() * 140;
              const dx = Math.cos(angle) * distance;
              const dy = Math.sin(angle) * distance;
              const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
              const size = 5 + Math.random() * 7;
              return (
                <motion.div
                  key={i}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                  animate={{ x: dx, y: dy, opacity: 0, scale: 1, rotate: Math.random() * 720 }}
                  transition={{ duration: 1.2 + Math.random() * 0.7, ease: "easeOut" }}
                  style={{
                    position: "absolute",
                    width: size,
                    height: size,
                    background: color,
                    borderRadius: Math.random() > 0.5 ? "50%" : "2px",
                    boxShadow: `0 0 10px ${color}`,
                  }}
                />
              );
            })}
          </div>

          {/* Main card */}
          <motion.div
            initial={{ scale: 0.55, opacity: 0, rotate: -6 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 18 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "linear-gradient(145deg, rgba(20,20,30,0.97), rgba(8,8,16,0.97))",
              border: `2px solid ${event.color}`,
              borderRadius: "26px",
              padding: "32px 28px 24px",
              textAlign: "center",
              maxWidth: "320px",
              width: "calc(100% - 40px)",
              boxShadow: `0 0 70px ${event.color}66, 0 22px 60px rgba(0,0,0,0.55)`,
              position: "relative",
              zIndex: 1,
            }}
          >
            <motion.div
              animate={{ scale: [1, 1.12, 1], rotate: [-4, 4, -4] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              style={{ fontSize: "56px", marginBottom: "10px", lineHeight: 1 }}
            >
              {event.emoji}
            </motion.div>

            <div
              style={{
                fontSize: "10px",
                fontFamily: "var(--font-mono)",
                color: event.color,
                fontWeight: 800,
                letterSpacing: "0.15em",
                marginBottom: "8px",
              }}
            >
              {event.label}
            </div>

            <div style={{ fontSize: "22px", fontWeight: 900, color: "#fff", marginBottom: "10px", letterSpacing: "-0.01em", lineHeight: 1.2 }}>
              {event.title}
            </div>

            <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.72)", lineHeight: 1.5, marginBottom: "20px" }}>
              {event.message}
            </div>

            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={onDismiss}
              style={{
                padding: "10px 24px",
                borderRadius: "12px",
                border: "none",
                background: event.color,
                color: "#000",
                fontWeight: 800,
                fontSize: "12px",
                cursor: "pointer",
                letterSpacing: "0.1em",
                fontFamily: "var(--font-mono)",
              }}
            >
              KEEP GOING
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
