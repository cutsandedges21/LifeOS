// Unit tests for the pure onboarding/tour logic. No React, no DOM.
// Run with: node --test src/utils/onboarding.test.js
import test from "node:test";
import assert from "node:assert/strict";
import { shouldStartTour, clampStep } from "./onboarding.js";

// ── shouldStartTour ─────────────────────────────────────────────────────────

test("anonymous users always get the tour", () => {
  assert.equal(shouldStartTour({ signedIn: false, onboardingDone: false }), true);
  // Even if a stale flag is set, anon always sees it (no persistence for anon).
  assert.equal(shouldStartTour({ signedIn: false, onboardingDone: true }), true);
});

test("signed-in users get the tour only until onboarding is marked done", () => {
  assert.equal(shouldStartTour({ signedIn: true, onboardingDone: false }), true);
  assert.equal(shouldStartTour({ signedIn: true, onboardingDone: true }), false);
});

test("shouldStartTour tolerates a missing onboardingDone (treated as not done)", () => {
  assert.equal(shouldStartTour({ signedIn: true }), true);
});

// ── clampStep ───────────────────────────────────────────────────────────────

test("clampStep keeps an in-range index unchanged", () => {
  assert.equal(clampStep(3, 9), 3);
});

test("clampStep floors at 0", () => {
  assert.equal(clampStep(-2, 9), 0);
});

test("clampStep ceils at length - 1", () => {
  assert.equal(clampStep(12, 9), 8);
  assert.equal(clampStep(9, 9), 8);
});

test("clampStep handles a single-step tour", () => {
  assert.equal(clampStep(5, 1), 0);
});
