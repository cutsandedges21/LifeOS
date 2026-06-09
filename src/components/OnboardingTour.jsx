import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clampStep } from "../utils/onboarding.js";

const ACCENT = "var(--accent-main)";

// Each step navigates to `tab`, then glows the element matching `target`
// (a [data-tour] anchor) and explains it. `target: null` = a centered message
// step (welcome / finish) with no element highlight.
const STEPS = [
  {
    tab: "main",
    target: null,
    title: "Welcome to LifeOS 👋",
    body: "Your personal operating system for sleep, money, habits, gym, and goals. Here's a 20-second tour of what's inside.",
  },
  {
    tab: "main",
    target: "[data-tour='home']",
    title: "Home",
    body: "Your day at a glance — progress, sleep, streak, and goals, all in one place.",
  },
  {
    tab: "health",
    target: "[data-tour='sleep']",
    title: "Sleep",
    body: "Log each night's sleep and track your rest quality and recovery over time.",
  },
  {
    tab: "finances",
    target: "[data-tour='finances']",
    title: "Finances",
    body: "Track net worth, income, expenses, and savings goals — and compare with friends.",
  },
  {
    tab: "habits",
    target: "[data-tour='habits']",
    title: "Habits & Goals",
    body: "Build daily streaks and check off your to-dos to keep momentum going.",
  },
  {
    tab: "gym",
    target: "[data-tour='gym']",
    title: "Gym",
    body: "Plan your weekly split, log every workout, and protect your gym streak.",
  },
  {
    tab: "friends",
    target: "[data-tour='friends']",
    title: "Friends",
    body: "Add friends by email and compare accountability stats — a little friendly pressure.",
  },
  {
    tab: "settings",
    target: "[data-tour='settings']",
    title: "Settings",
    body: "Sign in to sync across devices and unlock the AI, trends, and more. Themes and sound live here too.",
  },
  {
    tab: "main",
    target: null,
    title: "You're all set! 🎉",
    body: "Tap the menu button at the bottom anytime to jump between sections. Enjoy LifeOS.",
  },
];

const HIGHLIGHT_CLASS = "tour-highlight";

function clearHighlights() {
  if (typeof document === "undefined") return;
  document
    .querySelectorAll(`.${HIGHLIGHT_CLASS}`)
    .forEach((el) => el.classList.remove(HIGHLIGHT_CLASS));
}

// OnboardingTour — a clean, page-driven first-run walkthrough.
//
// Drives `setTab` to each section, glows that section's hero via a CSS class on
// its [data-tour] anchor (no coordinate math, so it never drifts on mobile), and
// shows a fixed bottom card explaining it. A transparent blocker absorbs taps on
// the page behind so the tour can't be desynced; only the card is interactive.
//
// Props:
//   open    — whether the tour is showing
//   onClose — called on Skip or Finish (App persists/clears the flag)
//   setTab  — navigate to a section
export function OnboardingTour({ open, onClose, setTab }) {
  const [step, setStep] = useState(0);

  // Reset to the first step each time the tour opens.
  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  // Navigate to the step's section, then highlight its anchor once the page has
  // rendered. The glow is attached to the element itself, so it tracks the
  // element through scroll/resize with zero measurement.
  useEffect(() => {
    if (!open) return;
    const s = STEPS[step];
    setTab?.(s.tab);

    const t = setTimeout(() => {
      clearHighlights();
      if (s.target) {
        const el = document.querySelector(s.target);
        if (el) {
          el.classList.add(HIGHLIGHT_CLASS);
          el.scrollIntoView({ block: "center", behavior: "smooth" });
        }
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 240); // let the page-transition fade (0.15s) settle first

    return () => clearTimeout(t);
  }, [open, step, setTab]);

  // Always clear the glow when the tour closes or unmounts.
  useEffect(() => {
    if (!open) clearHighlights();
    return clearHighlights;
  }, [open]);

  if (!open) return null;

  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  const next = () => (isLast ? onClose?.() : setStep((i) => clampStep(i + 1, STEPS.length)));
  const back = () => setStep((i) => clampStep(i - 1, STEPS.length));

  return (
    <>
      {/* Transparent tap-blocker: prevents the page behind from being touched
          mid-tour (which could desync navigation). Visually subtle dim. */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1000,
          background: "rgba(0,0,0,0.18)",
          // Block taps from reaching the page, but do nothing on click.
        }}
        aria-hidden="true"
      />

      {/* Explainer card — fixed bottom sheet, thumb-friendly. */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
          role="dialog"
          aria-modal="true"
          aria-label={`Tour step ${step + 1} of ${STEPS.length}: ${current.title}`}
          style={{
            // Centered via auto margins (not translateX) because framer-motion
            // owns the `transform` property for the y animation and would
            // otherwise clobber a translateX(-50%).
            position: "fixed",
            left: 0,
            right: 0,
            marginLeft: "auto",
            marginRight: "auto",
            bottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
            zIndex: 1001,
            width: "min(440px, calc(100vw - 28px))",
            background: "var(--card-high, var(--card))",
            backdropFilter: "blur(24px) saturate(180%)",
            WebkitBackdropFilter: "blur(24px) saturate(180%)",
            border: "1px solid var(--border-high, var(--border))",
            borderRadius: "20px",
            boxShadow: "0 18px 50px rgba(0,0,0,0.45)",
            padding: "20px",
          }}
        >
          {/* Header row: step counter + skip */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
            <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--text-faint)", letterSpacing: "0.12em", fontWeight: 700 }}>
              {step + 1} / {STEPS.length}
            </span>
            <button
              onClick={onClose}
              aria-label="Skip tour"
              style={{
                background: "none",
                border: "none",
                color: "var(--text-faint)",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                padding: "4px 6px",
              }}
            >
              Skip ✕
            </button>
          </div>

          <div style={{ fontSize: "18px", fontWeight: 900, color: "var(--text)", letterSpacing: "-0.01em", marginBottom: "6px" }}>
            {current.title}
          </div>
          <div style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.5, marginBottom: "16px" }}>
            {current.body}
          </div>

          {/* Progress dots */}
          <div style={{ display: "flex", gap: "6px", justifyContent: "center", marginBottom: "16px" }}>
            {STEPS.map((_, i) => (
              <span
                key={i}
                style={{
                  width: i === step ? "18px" : "6px",
                  height: "6px",
                  borderRadius: "3px",
                  background: i === step ? ACCENT : "var(--border-high, var(--border))",
                  transition: "width 0.25s, background 0.25s",
                }}
              />
            ))}
          </div>

          {/* Controls */}
          <div style={{ display: "flex", gap: "10px" }}>
            {!isFirst && (
              <button
                onClick={back}
                style={{
                  flex: 1,
                  minHeight: "44px",
                  borderRadius: "12px",
                  border: "1px solid var(--border-high, var(--border))",
                  background: "transparent",
                  color: "var(--text-muted)",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Back
              </button>
            )}
            <button
              onClick={next}
              style={{
                flex: isFirst ? 1 : 2,
                minHeight: "44px",
                borderRadius: "12px",
                border: "1px solid rgba(var(--accent-main-rgb), 0.5)",
                background: "linear-gradient(135deg, var(--accent-main), rgba(var(--accent-main-rgb), 0.78))",
                color: "#fff",
                fontSize: "14px",
                fontWeight: 800,
                cursor: "pointer",
                fontFamily: "inherit",
                boxShadow: "0 6px 22px rgba(var(--accent-main-rgb), 0.4)",
              }}
            >
              {isLast ? "Finish" : isFirst ? "Take the tour" : "Next"}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
