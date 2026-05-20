import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";

// Single global undo toast. One toast at a time — invoking show() while a
// previous toast is live replaces it (and abandons the previous undo handler),
// matching the way Gmail/iOS handle rapid-fire deletes.

const UndoToastContext = createContext(null);

const TOAST_DURATION_MS = 6000;

export function useUndoToast() {
  const ctx = useContext(UndoToastContext);
  if (!ctx) {
    throw new Error("useUndoToast must be used inside <UndoToastProvider>");
  }
  return ctx;
}

export function UndoToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const dismiss = useCallback(() => {
    clearTimer();
    setToast(null);
  }, [clearTimer]);

  const show = useCallback((message, onUndo) => {
    clearTimer();
    const id = Date.now() + Math.random();
    setToast({ id, message, onUndo });
    timerRef.current = setTimeout(() => {
      setToast((current) => (current && current.id === id ? null : current));
      timerRef.current = null;
    }, TOAST_DURATION_MS);
  }, [clearTimer]);

  const handleUndo = useCallback(() => {
    if (!toast) return;
    try {
      toast.onUndo();
    } finally {
      dismiss();
    }
  }, [toast, dismiss]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  return (
    <UndoToastContext.Provider value={{ show, dismiss }}>
      {children}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            style={{
              position: "fixed",
              bottom: "clamp(80px, 14vh, 110px)",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 5000,
              background: "rgba(20, 22, 28, 0.96)",
              backdropFilter: "blur(22px) saturate(170%)",
              WebkitBackdropFilter: "blur(22px) saturate(170%)",
              border: "1px solid rgba(248, 113, 113, 0.35)",
              borderRadius: "16px",
              padding: "10px 10px 10px 16px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              minWidth: "260px",
              maxWidth: "min(440px, calc(100vw - 32px))",
              boxShadow:
                "0 14px 44px rgba(0,0,0,0.55), 0 0 28px rgba(248,113,113,0.14)",
            }}
          >
            <div
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--text)",
                flex: 1,
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {toast.message}
            </div>
            <motion.button
              onClick={handleUndo}
              whileTap={{ scale: 0.94 }}
              style={{
                background:
                  "linear-gradient(135deg, rgba(52,211,153,0.18), rgba(16,185,129,0.22))",
                border: "1px solid rgba(52,211,153,0.5)",
                color: "#34D399",
                fontFamily: "var(--font-mono)",
                fontWeight: 800,
                fontSize: "11px",
                letterSpacing: "0.08em",
                padding: "8px 14px",
                borderRadius: "10px",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              UNDO
            </motion.button>
            <button
              onClick={dismiss}
              aria-label="Dismiss"
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-faint)",
                fontSize: "18px",
                cursor: "pointer",
                padding: "2px 8px",
                lineHeight: 1,
                flexShrink: 0,
              }}
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </UndoToastContext.Provider>
  );
}
