import { createClient } from "@supabase/supabase-js";

// Supabase client.
//
// These two values are SAFE to commit to a public repo:
//   - The URL is a public endpoint.
//   - The anon / publishable key is the client-side key Supabase issues
//     specifically to be shipped in browsers. Data security comes from
//     the Row Level Security policies in SETUP_SQL below, not from the
//     key being secret.
//
// Do NOT put the service_role key here — that one is a real secret and
// must stay on a server.

const url = "https://xomxqoqcyxrilrhvpole.supabase.co";
const anonKey = "sb_publishable_RjehWu3QtU-Exn-3gV1ufA_3xI4pfUb";

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
