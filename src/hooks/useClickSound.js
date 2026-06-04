import { useEffect, useRef } from "react";
import { playClick } from "../utils/sound.js";

// Interactive targets that should feel "clicky". Kept deliberately tight so a
// tap on plain text or a card doesn't tick — only things that read as controls.
const INTERACTIVE_SELECTOR =
  'button, a[href], [role="button"], select, input[type="checkbox"], input[type="radio"], label';

// Global click-sound wiring. When `enabled`, a single capture-phase
// pointerdown listener on the document plays a tick whenever the press lands on
// (or inside) an interactive element.
//
// Why this shape:
//   - pointerdown (not click) → the tick fires the instant you press, which
//     feels far more responsive/satisfying than waiting for release.
//   - capture phase → still fires for controls whose own handlers call
//     stopPropagation (e.g. the swipeable rows), and before navigation.
//   - one document listener → covers every button in the app, including the
//     many raw <button>s, with no per-component changes.
export function useClickSound(enabled) {
  const lastPlayRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    if (typeof document === "undefined") return;

    const onPointerDown = (e) => {
      // Left button / touch / pen only — ignore right- and middle-clicks.
      if (e.button != null && e.button !== 0) return;

      const target = e.target;
      if (!target || typeof target.closest !== "function") return;

      const el = target.closest(INTERACTIVE_SELECTOR);
      if (!el) return;
      if (el.disabled || el.getAttribute?.("aria-disabled") === "true") return;

      // Debounce: a quick double-tap shouldn't double-fire into a rattle.
      const now = Date.now();
      if (now - lastPlayRef.current < 40) return;
      lastPlayRef.current = now;

      playClick();
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [enabled]);
}
