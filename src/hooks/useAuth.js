import { useEffect, useState, useCallback } from "react";
import { getSupabase, isCloudConfigured } from "../utils/supabase.js";

// useAuth — thin wrapper around Supabase auth.
//
// Returns:
//   { user, session, status, signUp, signIn, signOut, configured }
//
// status:
//   "loading"  — initial session fetch in flight
//   "anon"     — no user signed in
//   "signed-in"— user is authenticated
//
// When cloud isn't configured (env vars missing), configured = false and
// status settles to "anon" immediately so the Account page can show a setup
// state instead of spinning forever.

export function useAuth() {
  const [session, setSession] = useState(null);
  const [status, setStatus] = useState("loading");
  const configured = isCloudConfigured();

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setStatus("anon");
      return;
    }

    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session || null);
      setStatus(data.session ? "signed-in" : "anon");
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, sess) => {
      if (!mounted) return;
      setSession(sess || null);
      setStatus(sess ? "signed-in" : "anon");
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  const signUp = useCallback(async (email, password) => {
    const supabase = getSupabase();
    if (!supabase) return { error: { message: "Cloud sync not configured." } };
    return supabase.auth.signUp({ email, password });
  }, []);

  const signIn = useCallback(async (email, password) => {
    const supabase = getSupabase();
    if (!supabase) return { error: { message: "Cloud sync not configured." } };
    return supabase.auth.signInWithPassword({ email, password });
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  return {
    user: session?.user || null,
    session,
    status,
    configured,
    signUp,
    signIn,
    signOut,
  };
}
