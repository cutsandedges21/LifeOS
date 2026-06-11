// Unit tests for the pure admin-identity helper. No React, no DOM.
// Run with: node --test src/utils/admin.test.js
import test from "node:test";
import assert from "node:assert/strict";
import { isAdmin, ADMIN_EMAIL } from "./admin.js";

test("exact admin email is admin", () => {
  assert.equal(isAdmin({ email: ADMIN_EMAIL }), true);
});

test("admin email with different case is admin", () => {
  assert.equal(isAdmin({ email: "SportsDude3133@Gmail.com" }), true);
});

test("a different email is not admin", () => {
  assert.equal(isAdmin({ email: "someone@else.com" }), false);
});

test("null user is not admin", () => {
  assert.equal(isAdmin(null), false);
});

test("undefined user is not admin", () => {
  assert.equal(isAdmin(undefined), false);
});

test("user without an email is not admin", () => {
  assert.equal(isAdmin({ id: "u1" }), false);
});
