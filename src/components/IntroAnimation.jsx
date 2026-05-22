import { useEffect } from "react";
import { motion } from "framer-motion";

// Full-screen intro shown on first session load and after sign-in/sign-up.
// Choreographed in five phases over ~3.6s:
//   0.00–0.50  →  corner brackets sweep in, frame closes around the stage
//   0.40–1.10  →  accent ring expands from center, radial glow pulses
//   0.70–1.90  →  LIFEOS letters cascade with y-rise + blur clear,
//                  glitchy chromatic-aberration flicker on each
//   1.60–2.40  →  underline sweeps left-to-right, then a counter-sweep
//   2.10–3.00  →  tagline letters un-spread from wide letter-spacing
//   3.00–3.60  →  scale + fade out
//
// Theme-aware via the `theme` prop. Light theme gets stronger drop-shadows
// and a higher-opacity glow so the accent reads against white; dark/midnight
// keep their bloom-heavy look.
export function IntroAnimation({ onComplete, theme = "dark" }) {
  const isLight = theme === "light";

  // Hold + exit timing — overlay unmounts ~600ms after we call onComplete so
  // the exit transition can play through.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const t = setTimeout(() => {
      onComplete?.();
    }, 3000);

    return () => {
      document.body.style.overflow = prev;
      clearTimeout(t);
    };
  }, [onComplete]);

  const letters = "LIFEOS".split("");
  const tagline = "YOUR OPERATING SYSTEM".split("");

  // Light-theme tuning — bumps glow intensity and adds drop shadows so the
  // orange accent and the dark wordmark both pop against the off-white bg.
  const glowOpacity = isLight ? 0.85 : 0.6;
  const glowMid = isLight ? 0.18 : 0.12;
  const wordmarkShadow = isLight
    ? "0 8px 32px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.08)"
    : "0 8px 40px rgba(var(--accent-main-rgb),0.45), 0 0 60px rgba(var(--accent-main-rgb),0.25)";
  const lineShadow = isLight
    ? "0 0 18px rgba(var(--accent-main-rgb),0.55), 0 2px 8px rgba(var(--accent-main-rgb),0.35)"
    : "0 0 22px rgba(var(--accent-main-rgb),0.9), 0 0 40px rgba(var(--accent-main-rgb),0.5)";
  const ringBorder = isLight
    ? "2px solid rgba(var(--accent-main-rgb), 0.7)"
    : "2px solid rgba(var(--accent-main-rgb), 0.9)";
  const ringShadow = isLight
    ? "0 0 0 1px rgba(var(--accent-main-rgb),0.15), 0 0 40px rgba(var(--accent-main-rgb),0.35)"
    : "0 0 80px rgba(var(--accent-main-rgb),0.55)";

  // Solid hex fallback in case --bg hasn't resolved yet on cold boot.
  const bgFallback =
    theme === "light" ? "#FAFAF7" : theme === "midnight" ? "#03060B" : "#080810";

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{
        // Background-only exit: stays fully opaque through both the
        // shrink and the pause, then fades over the expand leg so the
        // app behind is revealed as the content bursts outward.
        opacity: [1, 1, 1, 0],
        transition: {
          duration: 2.1,
          times: [0, 0.67, 0.81, 1],
          ease: ["linear", "linear", "easeIn"],
        },
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "var(--bg)",
        backgroundColor: bgFallback,
        overflow: "hidden",
      }}
    >
      <motion.div
        initial={{ scale: 1 }}
        animate={{ scale: 1 }}
        exit={{
          // Three-phase scale, decoupled from the bg so only the center
          // elements move:
          //   0 → 67%   →  slow dramatic shrink 1.0 → 0.15 (~1.4s, easeOut
          //                so the deceleration toward the smallest size
          //                reads as a held breath)
          //   67 → 81% →   short pause held at 0.15 (~0.3s of stillness —
          //                a quick dramatic beat)
          //   81 → 100% →  fast burst expand 0.15 → 1.8 (~0.4s, easeOut so
          //                it leaps out then settles past the viewport)
          scale: [1, 0.15, 0.15, 1.8],
          transition: {
            duration: 2.1,
            times: [0, 0.67, 0.81, 1],
            ease: ["easeOut", "linear", "easeOut"],
          },
        }}
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transformOrigin: "50% 50%",
          pointerEvents: "none",
        }}
      >
      {/* ── Corner brackets — sweep in to frame the stage ────────────── */}
      <CornerBrackets isLight={isLight} />

      {/* ── Halo layer — shifted up so the circle centers on LIFEOS ─────
          Wraps the glow + both rings in a full-screen flex container that's
          translated upward, so the geometric center of the circle aligns
          with the wordmark letters rather than the full wordmark+tagline
          stack. ~3.5vmin (~25-30px) lifts past the gap+underline+tagline. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: "translateY(-3.5vmin)",
          pointerEvents: "none",
        }}
      >
        {/* Radial accent glow that pulses outward */}
        <motion.div
          initial={{ scale: 0.2, opacity: 0 }}
          animate={{
            scale: [0.2, 1.4, 2.4, 2.8],
            opacity: [0, glowOpacity, glowMid, 0],
          }}
          transition={{
            duration: 3,
            ease: "easeOut",
            times: [0, 0.25, 0.7, 1],
            delay: 0.4,
          }}
          style={{
            position: "absolute",
            width: "65vmin",
            height: "65vmin",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(var(--accent-main-rgb),0.7) 0%, rgba(var(--accent-main-rgb),0.18) 40%, transparent 70%)",
            filter: "blur(12px)",
          }}
        />

        {/* Expanding accent ring */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1, 1.6], opacity: [0, 1, 0] }}
          transition={{ duration: 1.6, ease: "easeOut", delay: 0.5, times: [0, 0.4, 1] }}
          style={{
            position: "absolute",
            width: "32vmin",
            height: "32vmin",
            borderRadius: "50%",
            border: ringBorder,
            boxShadow: ringShadow,
          }}
        />

        {/* Secondary expanding ring (delayed) */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.2, 2], opacity: [0, 0.7, 0] }}
          transition={{ duration: 1.6, ease: "easeOut", delay: 0.85, times: [0, 0.4, 1] }}
          style={{
            position: "absolute",
            width: "32vmin",
            height: "32vmin",
            borderRadius: "50%",
            border: `1px solid rgba(var(--accent-main-rgb), ${isLight ? 0.5 : 0.7})`,
          }}
        />
      </div>

      {/* ── Wordmark stack ───────────────────────────────────────────── */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "18px",
        }}
      >
        {/* LIFEOS letters */}
        <div
          style={{
            display: "flex",
            gap: "clamp(2px, 0.8vmin, 6px)",
            fontFamily: "var(--font-sans)",
            fontWeight: 900,
            fontSize: "clamp(54px, 15vmin, 132px)",
            letterSpacing: "-0.035em",
            color: "var(--text)",
            lineHeight: 1,
            textShadow: wordmarkShadow,
          }}
        >
          {letters.map((ch, i) => (
            <motion.span
              key={i}
              initial={{ y: 60, opacity: 0, filter: "blur(14px)", rotateX: -45 }}
              animate={{ y: 0, opacity: 1, filter: "blur(0px)", rotateX: 0 }}
              transition={{
                delay: 0.7 + i * 0.1,
                duration: 0.75,
                ease: [0.16, 1, 0.3, 1],
              }}
              style={{ display: "inline-block", transformOrigin: "50% 100%" }}
            >
              {ch}
            </motion.span>
          ))}
        </div>

        {/* Underline — primary sweep left-to-right */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0, transformOrigin: "0% 50%" }}
          animate={{ scaleX: [0, 1, 1, 0], opacity: [0, 1, 1, 0] }}
          transition={{
            duration: 1.4,
            delay: 1.6,
            ease: "easeInOut",
            times: [0, 0.35, 0.7, 1],
          }}
          style={{
            width: "min(60vmin, 480px)",
            height: "2.5px",
            background:
              "linear-gradient(90deg, transparent, var(--accent-main) 20%, var(--accent-main) 80%, transparent)",
            borderRadius: "2px",
            boxShadow: lineShadow,
          }}
        />

        {/* Tagline — letters un-spread from very wide tracking */}
        <div
          style={{
            display: "flex",
            fontSize: "clamp(10px, 1.7vmin, 13px)",
            fontFamily: "var(--font-mono)",
            color: "var(--text-faint)",
            textTransform: "uppercase",
            marginTop: "4px",
          }}
        >
          {tagline.map((ch, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, x: i < tagline.length / 2 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: 2.1 + i * 0.02,
                duration: 0.6,
                ease: "easeOut",
              }}
              style={{
                display: "inline-block",
                whiteSpace: "pre",
                letterSpacing: "0.32em",
              }}
            >
              {ch === " " ? " " : ch}
            </motion.span>
          ))}
        </div>
      </div>

      {/* ── Scan-line sweep over the wordmark ─────────────────────────── */}
      <motion.div
        initial={{ y: "-120vh", opacity: 0 }}
        animate={{ y: ["-120vh", "120vh"], opacity: [0, isLight ? 0.45 : 0.7, 0] }}
        transition={{
          duration: 1.4,
          delay: 1.2,
          ease: "easeInOut",
          times: [0, 0.5, 1],
        }}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          height: "3px",
          background:
            "linear-gradient(90deg, transparent, var(--accent-main), transparent)",
          pointerEvents: "none",
          boxShadow: `0 0 20px rgba(var(--accent-main-rgb), ${isLight ? 0.55 : 0.85})`,
        }}
      />
      </motion.div>
    </motion.div>
  );
}

// Four corner brackets that sweep inward to frame the stage. Drawn with SVG
// so the stroke renders crisply at any size and respects the accent color.
function CornerBrackets({ isLight }) {
  const stroke = "var(--accent-main)";
  const strokeWidth = isLight ? 2.5 : 2;
  const filter = isLight
    ? "drop-shadow(0 1px 3px rgba(0,0,0,0.12))"
    : "drop-shadow(0 0 8px rgba(var(--accent-main-rgb),0.6))";
  const offset = "min(7vmin, 56px)";
  const size = "min(8vmin, 60px)";

  const Bracket = ({ style, d, delay }) => (
    <motion.svg
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      width={size}
      height={size}
      viewBox="0 0 60 60"
      style={{ position: "absolute", filter, ...style }}
    >
      <motion.path
        d={d}
        stroke={stroke}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.7, delay: delay + 0.05, ease: "easeOut" }}
      />
    </motion.svg>
  );

  return (
    <>
      <Bracket
        style={{ top: offset, left: offset }}
        d="M 4 24 L 4 4 L 24 4"
        delay={0.0}
      />
      <Bracket
        style={{ top: offset, right: offset }}
        d="M 36 4 L 56 4 L 56 24"
        delay={0.1}
      />
      <Bracket
        style={{ bottom: offset, left: offset }}
        d="M 4 36 L 4 56 L 24 56"
        delay={0.2}
      />
      <Bracket
        style={{ bottom: offset, right: offset }}
        d="M 36 56 L 56 56 L 56 36"
        delay={0.3}
      />
    </>
  );
}
