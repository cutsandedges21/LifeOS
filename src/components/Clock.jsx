import { useEffect, useState } from "react";
import { timeStr } from "../utils/formatters.js";

// Isolated clock — owns its own per-second timer so the surrounding tree
// doesn't re-render every tick. Critical for mobile scroll smoothness:
// the previous setup re-rendered every page + framer-motion subtree once
// per second, blocking the main thread long enough to stall touch scroll.
export function Clock({ style }) {
  const [t, setT] = useState(() => timeStr());
  useEffect(() => {
    const i = setInterval(() => setT(timeStr()), 1000);
    return () => clearInterval(i);
  }, []);
  return <span style={style}>{t}</span>;
}
