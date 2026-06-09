# Signed-Out = Ephemeral State — Design

**Date:** 2026-06-09
**Status:** Approved
**Area:** LifeOS · state persistence (`useLifeOSState`)

## Summary

Make the signed-out experience purely in-memory. When a user is not signed in,
nothing persists; on sign-out (and on every refresh while anonymous) the app
resets to `INITIAL_STATE` (all zeros). Persistence — localStorage and Supabase —
happens only while signed in.

## Decisions (locked)

- **Anonymous data:** in-memory only. Refresh or sign-out wipes it back to 0.
  Nothing is written to storage while signed out.
- **Sign-up carryover:** if an anonymous user signs UP and the account's cloud row
  is empty, the data currently on screen seeds the new account (existing behavior).
  Existing accounts always load their own saved data.
- **Scope:** all changes in `src/hooks/useLifeOSState.js`. No UI changes.

## Architecture

`useLifeOSState` is the single owner of app state and all persistence (local +
cloud). The invariant after this change:

> **localStorage is written only while signed in, and cleared on every transition
> to anonymous.** Therefore it is always empty for anonymous/new users, and holds
> only the current signed-in user's cache.

### Changes

**1. Persist only when signed in**

- Derive `const signedIn = auth.status === "signed-in" && !!auth.user;`
- Debounced localStorage write effect: early-return unless `signedIn`.
- Lifecycle flush (`pagehide` / `visibilitychange` hidden): only write when signed
  in. The listeners bind once, so read the latest value from a `signedInRef`
  (mirrors the existing `stateRef` pattern).
- Cloud sync effect: already signed-in-only — unchanged.

**2. Reset to zero whenever auth resolves to anonymous**

Replace the anon branch of the hydrate effect (keyed on `auth.status`):

```js
if (auth.status === "anon") {
  setState(INITIAL_STATE);
  storage.remove(STORAGE_KEYS.STATE);
  setIsLoaded(true);
}
```

This one effect covers both a cold load with no session and signing out
mid-session (signed-in → anon). It is keyed on `auth.status`, so it fires once per
entry into anon and does not wipe in-session anonymous edits as the user types.

**3. Carryover preserved**

The sign-in path (anon → signed-in) does not reset; only the anon path does. The
cloud-pull effect only `setState`s when `data?.state` exists, so an empty account
keeps the in-memory state, which the cloud-sync effect then seeds. No change
required beyond ensuring the reset fires only on `auth.status === "anon"`.

**4. Init read retained**

The initial `useState` read of localStorage stays (fast load for returning
signed-in users). Safe because localStorage is now only written while signed in
and cleared on every anon resolution; stale data from an expired session is hidden
by the `!isLoaded` skeleton and wiped when auth resolves to anon.

### Small pure helper (for testing)

Extract `isSignedIn(auth)` → `auth?.status === "signed-in" && !!auth?.user`, used
by the gating logic and unit-tested.

## Edge cases

- **Sign out:** state → 0, localStorage cleared. Cloud row untouched (restored on
  next sign-in).
- **Anonymous refresh:** init reads empty localStorage → `INITIAL_STATE`; the anon
  effect reasserts 0 + clears storage. UI shows 0.
- **Signed-in refresh:** init reads cache (fast) → cloud pull confirms; no reset.
- **Anon types data → signs up (empty cloud):** in-memory data preserved → seeds
  cloud, localStorage begins persisting.
- **Anon → sign in to existing account:** cloud data overwrites in-memory; demo
  data dropped (correct).
- **Session expiry without explicit sign-out:** on next load auth resolves to anon
  → reset + clear; the skeleton hides any momentary stale data from the init read.

## Testing

- **Unit (TDD):** `isSignedIn(auth)` truth table (signed-in+user, signed-in+no
  user, anon, loading, null).
- **Browser (no credentials needed):** as an anonymous user, enter data → assert
  `localStorage["lifeos_state"]` stays absent/empty → refresh → assert the app is
  back to 0.

## Out of scope (YAGNI)

- Changing the persisted auth session behavior (Supabase `persistSession`).
- Offline support for signed-in users beyond the existing localStorage cache.
- Any migration prompt/UI when signing in with on-screen demo data.
