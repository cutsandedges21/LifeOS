import { createClient } from "@supabase/supabase-js";

// Null-safe Supabase client.
//
// The app is offline-first: localStorage is the source of truth and works
// with zero backend. Cloud sync is opt-in — when VITE_SUPABASE_URL +
// VITE_SUPABASE_ANON_KEY are present in .env we create a real client and
// the Account page lets the user sign in to enable cross-device sync.
//
// When env vars are missing, getSupabase() returns null and every caller
// short-circuits cleanly (no errors, no flicker). This means the app keeps
// working perfectly for the "I haven't set up Supabase yet" user.

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let _client = null;

export function getSupabase() {
  if (!url || !anonKey) return null;
  if (_client) return _client;
  _client = createClient(url, anonKey, {
    auth: {
      // Persist session in localStorage so reloads stay signed in. Different
      // key from lifeos_state so a Reset All Data wipe doesn't kill the
      // session token.
      storageKey: "lifeos_auth",
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
  return _client;
}

export function isCloudConfigured() {
  return Boolean(url && anonKey);
}

// SQL the user runs once in the Supabase SQL editor to create the table
// + row-level security policies. Surfaced in the Account page setup tab.
export const SETUP_SQL = `-- One-time setup for LifeOS cloud sync
-- Run this in the Supabase SQL editor.

create table if not exists user_state (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  state       jsonb not null,
  updated_at  timestamptz not null default now()
);

-- RLS: each user can only read/write their own row.
alter table user_state enable row level security;

create policy "users read own state"
  on user_state for select
  using (auth.uid() = user_id);

create policy "users insert own state"
  on user_state for insert
  with check (auth.uid() = user_id);

create policy "users update own state"
  on user_state for update
  using (auth.uid() = user_id);
`;
