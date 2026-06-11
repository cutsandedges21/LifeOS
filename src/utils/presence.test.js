// Unit tests for the pure presence helpers. No React, no DOM, no network.
// Run with: node --test src/utils/presence.test.js
import test from "node:test";
import assert from "node:assert/strict";
import { isOnline, relativeLastSeen, ONLINE_WINDOW_MS } from "./presence.js";

const NOW = Date.UTC(2026, 5, 10, 12, 0, 0); // fixed reference instant
const ago = (ms) => new Date(NOW - ms).toISOString();

test("a timestamp inside the window is online", () => {
  assert.equal(isOnline(ago(30 * 1000), NOW), true);
});

test("a timestamp older than the window is offline", () => {
  assert.equal(isOnline(ago(ONLINE_WINDOW_MS + 1000), NOW), false);
});

test("null last-seen is offline", () => {
  assert.equal(isOnline(null, NOW), false);
});

test("a malformed timestamp is offline", () => {
  assert.equal(isOnline("not-a-date", NOW), false);
});

test("relativeLastSeen: sub-minute reads 'just now'", () => {
  assert.equal(relativeLastSeen(ago(5 * 1000), NOW), "just now");
});

test("relativeLastSeen: minutes", () => {
  assert.equal(relativeLastSeen(ago(3 * 60 * 1000), NOW), "3m ago");
});

test("relativeLastSeen: hours", () => {
  assert.equal(relativeLastSeen(ago(2 * 60 * 60 * 1000), NOW), "2h ago");
});

test("relativeLastSeen: days", () => {
  assert.equal(relativeLastSeen(ago(3 * 24 * 60 * 60 * 1000), NOW), "3d ago");
});

test("relativeLastSeen: null reads 'Never'", () => {
  assert.equal(relativeLastSeen(null, NOW), "Never");
});
