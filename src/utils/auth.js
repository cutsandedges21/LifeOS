// Pure auth helpers. Kept free of React so the gating logic can be unit-tested.

// True only when there is a confirmed signed-in session with a user. Persistence
// (localStorage + cloud) is gated on this: signed-out is purely in-memory.
export function isSignedIn(auth) {
  return auth?.status === "signed-in" && !!auth?.user;
}
