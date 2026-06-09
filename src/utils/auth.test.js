// Unit tests for the pure auth gating helper. No React, no DOM.
// Run with: node --test src/utils/auth.test.js
import test from "node:test";
import assert from "node:assert/strict";
import { isSignedIn } from "./auth.js";

test("signed-in with a user is signed in", () => {
  assert.equal(isSignedIn({ status: "signed-in", user: { id: "u1" } }), true);
});

test("signed-in status but no user is NOT signed in", () => {
  assert.equal(isSignedIn({ status: "signed-in", user: null }), false);
});

test("anonymous is not signed in", () => {
  assert.equal(isSignedIn({ status: "anon", user: null }), false);
});

test("loading is not signed in", () => {
  assert.equal(isSignedIn({ status: "loading" }), false);
});

test("missing/undefined auth is not signed in", () => {
  assert.equal(isSignedIn(undefined), false);
  assert.equal(isSignedIn(null), false);
  assert.equal(isSignedIn({}), false);
});
