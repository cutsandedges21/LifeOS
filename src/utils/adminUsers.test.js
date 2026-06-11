// Unit tests for the pure admin summary. No React, no DOM, no network.
// Run with: node --test src/utils/adminUsers.test.js
import test from "node:test";
import assert from "node:assert/strict";
import { summarize } from "./adminUsers.js";

const NOW = Date.UTC(2026, 5, 10, 12, 0, 0);
const ago = (ms) => new Date(NOW - ms).toISOString();

test("summarize counts total rows", () => {
  const users = [{ last_seen_at: ago(0) }, { last_seen_at: null }];
  assert.equal(summarize(users, NOW).total, 2);
});

test("summarize counts only users online within 2 minutes", () => {
  const users = [
    { last_seen_at: ago(30 * 1000) },     // online
    { last_seen_at: ago(5 * 60 * 1000) }, // offline
    { last_seen_at: null },               // offline
  ];
  assert.equal(summarize(users, NOW).onlineNow, 1);
});

test("summarize counts users active within the last 24h", () => {
  const users = [
    { last_seen_at: ago(60 * 1000) },             // today
    { last_seen_at: ago(23 * 60 * 60 * 1000) },   // today
    { last_seen_at: ago(25 * 60 * 60 * 1000) },   // not today
    { last_seen_at: null },                       // not today
  ];
  assert.equal(summarize(users, NOW).activeToday, 2);
});

test("summarize handles an empty list", () => {
  assert.deepEqual(summarize([], NOW), { total: 0, onlineNow: 0, activeToday: 0 });
});

test("summarize handles a null list", () => {
  assert.deepEqual(summarize(null, NOW), { total: 0, onlineNow: 0, activeToday: 0 });
});
