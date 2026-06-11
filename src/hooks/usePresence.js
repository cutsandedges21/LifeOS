import { useEffect } from "react";
import { getSupabase } from "../utils/supabase.js";
import { touchPresence } from "../utils/presence.js";

// usePresence — keeps the signed-in user's profiles.last_seen_at fresh.
//
// Mounted once at the app level. Pings on mount, whenever the tab becomes
// visible, and every 45s while visible. No pings while the tab is hidden so we
// don't mark a backgrounded tab as "online". Each user writes only their own
// row; the admin reads everyone's via RLS.
const PING_INTERVAL_MS = 45 * 1000;

export function usePresence(auth) {
  const userId = auth?.user?.id || null;
  const signedIn = auth?.status === "signed-in" && !!userId;

  useEffect(() => {
    if (!signedIn) return;
    const supabase = getSupabase();
    if (!supabase) return;

    let cancelled = false;
    const ping = () => {
      if (cancelled) return;
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      touchPresence(supabase, userId);
    };

    ping(); // immediate on mount / sign-in
    const interval = setInterval(ping, PING_INTERVAL_MS);

    const onVisibility = () => {
      if (document.visibilityState === "visible") ping();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [signedIn, userId]);
}
