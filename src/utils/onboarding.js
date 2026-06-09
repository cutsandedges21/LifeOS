// Pure logic for the first-run guided tour. Kept free of React/DOM so the
// trigger rules and step math can be unit-tested in isolation.

// Decide whether the tour should auto-start for the current viewer.
//   - Anonymous users see it every load (no persistence — `onboardingDone`
//     never gets set for them, and we ignore it anyway).
//   - Signed-in users see it once, until the synced `onboardingDone` flag is set.
export function shouldStartTour({ signedIn, onboardingDone } = {}) {
  if (!signedIn) return true;
  return !onboardingDone;
}

// Clamp a step index into [0, length - 1]. Guards Back/Next at the ends and any
// out-of-range jumps. Assumes length >= 1.
export function clampStep(index, length) {
  const max = Math.max(0, length - 1);
  if (index < 0) return 0;
  if (index > max) return max;
  return index;
}
