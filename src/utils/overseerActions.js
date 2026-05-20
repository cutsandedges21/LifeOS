// Overseer write-actions.
//
// The Overseer can propose a structured `action` alongside its chat reply
// (see api/overseer.js responseSchema). This module turns that proposal into
// a one-line summary for the confirmation chip (describeAction) and, once the
// user confirms, applies it to app state (applyOverseerAction).
//
// applyOverseerAction is a PURE reducer: (action, prevState) -> result. It
// never mutates prevState and never reads the clock except through the
// injectable `today` arg, so every branch is unit-testable without React.
// Each branch mirrors the exact state shape its corresponding page writes, so
// an Overseer-logged entry is indistinguishable from a manually-entered one.

import { todayISO, getWeeklyRestPercent, timeStr } from "./formatters.js";

export const ACTION_KINDS = [
  "transaction",
  "sleep",
  "gym",
  "habit_done",
  "goal_add",
  "goal_done",
  "journal",
];

function money(n) {
  return `$${Number(n || 0).toLocaleString()}`;
}

// One-line, human-readable summary of a proposed action for the confirm chip.
export function describeAction(a) {
  if (!a || !a.kind) return "";
  const when = a.date && a.date !== todayISO() ? a.date : "today";
  switch (a.kind) {
    case "transaction": {
      const income = a.txnType === "income";
      const cat = a.category ? ` · ${a.category}` : "";
      return `${income ? "💵 Income +" : "💸 Expense −"}${money(a.amount)}${cat} · ${when}`;
    }
    case "sleep":
      return `😴 Sleep ${Math.round(a.score || 0)}% · ${when}`;
    case "gym":
      return `🏋️ Gym session · ${when}`;
    case "habit_done":
      return `✅ Habit done: ${a.note || "?"} · ${when}`;
    case "goal_add":
      return `🎯 New goal: ${a.note || "?"}`;
    case "goal_done":
      return `✓ Complete goal: ${a.note || "?"}`;
    case "journal": {
      const t = a.note || "";
      return `📓 Journal: "${t.slice(0, 40)}${t.length > 40 ? "…" : ""}"`;
    }
    default:
      return "";
  }
}

// Pure reducer. Returns { ok, message, state }. On failure ok=false and state
// is returned unchanged so callers can surface `message` without side effects.
export function applyOverseerAction(action, prevState, today = todayISO()) {
  if (!action || !action.kind) {
    return { ok: false, message: "No action.", state: prevState };
  }
  const a = action;
  const date = a.date || today;

  switch (a.kind) {
    case "transaction": {
      const amount = Number(a.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        return { ok: false, message: "Invalid amount.", state: prevState };
      }
      const type = a.txnType === "income" ? "income" : "expense";
      const txn = {
        id: Date.now(),
        description: a.note || (type === "income" ? "Income" : "Expense"),
        amount,
        type,
        category: a.category || "Other",
        date,
      };
      return {
        ok: true,
        message: "Logged.",
        state: {
          ...prevState,
          finances: {
            ...prevState.finances,
            transactions: [txn, ...((prevState.finances && prevState.finances.transactions) || [])],
          },
        },
      };
    }

    case "sleep": {
      const score = Math.round(Number(a.score));
      if (!Number.isFinite(score)) {
        return { ok: false, message: "Invalid sleep score.", state: prevState };
      }
      const clamped = Math.max(0, Math.min(100, score));
      const entries = [
        ...(prevState.sleepEntries || []).filter((e) => e.date !== date),
        { date, score: clamped },
      ];
      return {
        ok: true,
        message: "Logged.",
        state: {
          ...prevState,
          sleepEntries: entries,
          whoop: { ...prevState.whoop, sleep: clamped, recovery: getWeeklyRestPercent(entries) },
        },
      };
    }

    case "gym": {
      if ((prevState.gymVisits || []).some((v) => v.date === date)) {
        return { ok: false, message: "Gym already logged for that day.", state: prevState };
      }
      return {
        ok: true,
        message: "Logged.",
        state: {
          ...prevState,
          gymVisits: [{ id: Date.now(), date }, ...(prevState.gymVisits || [])],
        },
      };
    }

    case "habit_done": {
      const name = (a.note || "").trim().toLowerCase();
      if (!name) return { ok: false, message: "No habit specified.", state: prevState };
      const habit = (prevState.habits || []).find(
        (h) => (h.name || "").trim().toLowerCase() === name
      );
      if (!habit) return { ok: false, message: `No habit named "${a.note}".`, state: prevState };
      const all = { ...(prevState.habitCompletions || {}) };
      all[habit.id] = { ...(all[habit.id] || {}), [date]: true };
      return { ok: true, message: "Logged.", state: { ...prevState, habitCompletions: all } };
    }

    case "goal_add": {
      const text = (a.note || "").trim();
      if (!text) return { ok: false, message: "No goal text.", state: prevState };
      return {
        ok: true,
        message: "Added.",
        state: {
          ...prevState,
          goals: [...(prevState.goals || []), { id: Date.now(), text, done: false, time: timeStr() }],
        },
      };
    }

    case "goal_done": {
      const kw = (a.note || "").trim().toLowerCase();
      if (!kw) return { ok: false, message: "No goal specified.", state: prevState };
      const goals = prevState.goals || [];
      const target =
        goals.find((g) => !g.done && (g.text || "").trim().toLowerCase().includes(kw)) ||
        goals.find((g) => (g.text || "").trim().toLowerCase().includes(kw));
      if (!target) return { ok: false, message: `No goal matching "${a.note}".`, state: prevState };
      return {
        ok: true,
        message: "Completed.",
        state: {
          ...prevState,
          goals: goals.map((g) => (g.id === target.id ? { ...g, done: true, missed: false } : g)),
        },
      };
    }

    case "journal": {
      const text = (a.note || "").trim();
      if (!text) return { ok: false, message: "No journal text.", state: prevState };
      const entries = [
        ...(prevState.journalEntries || []).filter((e) => e.date !== date),
        { date, text },
      ];
      return { ok: true, message: "Logged.", state: { ...prevState, journalEntries: entries } };
    }

    default:
      return { ok: false, message: "Unknown action.", state: prevState };
  }
}
