// Unit tests for the friends shared-stats logic. Pure functions only — no
// Supabase, no DOM. Run with: node --test src/utils/friends.test.js
import test from "node:test";
import assert from "node:assert/strict";
import { computeSharedStats, applySharePrefs, SHAREABLE_STATS } from "./friends.js";
import { todayISO } from "./formatters.js";

const today = todayISO();
const NOT_TODAY = "2000-01-01"; // a date that can never be "today"

// ── net_today (finance comparison) ──────────────────────────────────────────

test("net_today = today's income minus today's expenses", () => {
  const state = {
    finances: {
      transactions: [
        { type: "income", amount: 500, date: today },
        { type: "expense", amount: 80, date: today },
        { type: "income", amount: 1000, date: NOT_TODAY }, // ignored — not today
      ],
    },
  };
  assert.equal(computeSharedStats(state).net_today, 420);
});

test("net_today is negative when today's expenses exceed income", () => {
  const state = {
    finances: {
      transactions: [
        { type: "income", amount: 20, date: today },
        { type: "expense", amount: 75, date: today },
      ],
    },
  };
  assert.equal(computeSharedStats(state).net_today, -55);
});

test("net_today is 0 when nothing was logged today", () => {
  const state = {
    finances: { transactions: [{ type: "income", amount: 999, date: NOT_TODAY }] },
  };
  assert.equal(computeSharedStats(state).net_today, 0);
});

test("net_today defaults to 0 when finances are absent", () => {
  assert.equal(computeSharedStats({}).net_today, 0);
});

// ── applySharePrefs (privacy withholding) ───────────────────────────────────

test("applySharePrefs nulls a stat whose pref is false", () => {
  const out = applySharePrefs(
    { current_streak: 5, net_today: 420 },
    { current_streak: false, net_today: true }
  );
  assert.equal(out.current_streak, null);
  assert.equal(out.net_today, 420);
});

test("applySharePrefs treats a missing pref as shared", () => {
  const out = applySharePrefs({ habit_pct: 80 }, {});
  assert.equal(out.habit_pct, 80);
});

test("applySharePrefs tolerates a missing prefs object", () => {
  const out = applySharePrefs({ habit_pct: 80 }, undefined);
  assert.equal(out.habit_pct, 80);
});

test("applySharePrefs does not mutate its input", () => {
  const stats = { current_streak: 5 };
  applySharePrefs(stats, { current_streak: false });
  assert.equal(stats.current_streak, 5);
});

// ── SHAREABLE_STATS (single source of truth) ────────────────────────────────

test("SHAREABLE_STATS covers all shared stats including net_today", () => {
  const keys = SHAREABLE_STATS.map((s) => s.key);
  for (const k of [
    "current_streak",
    "longest_streak",
    "habit_pct",
    "todo_pct",
    "gym_days_week",
    "avg_sleep",
    "net_today",
  ]) {
    assert.ok(keys.includes(k), `${k} present in SHAREABLE_STATS`);
  }
});

test("net_today is flagged as a money stat (currency formatting)", () => {
  const net = SHAREABLE_STATS.find((s) => s.key === "net_today");
  assert.ok(net, "net_today entry exists");
  assert.equal(net.money, true);
});
