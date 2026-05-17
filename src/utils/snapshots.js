// Daily snapshot system. Captures a single row of metrics per day so trend
// charts and weekly reviews have a stable time series to read from.
//
// Today's snapshot is upserted on every relevant state change; past days are
// frozen the moment the date rolls over.

const todayISO = () => new Date().toISOString().slice(0, 10);

export function computeNetWorth(state) {
  const txns = state?.finances?.transactions || [];
  return txns.reduce(
    (s, t) =>
      s +
      (t.type === "income"
        ? Number(t.amount || 0)
        : -Number(t.amount || 0)),
    0
  );
}

export function buildTodaySnapshot(state) {
  const today = todayISO();
  const sleepEntry = (state.sleepEntries || []).find((e) => e.date === today);
  const goals = state.goals || [];
  return {
    date: today,
    sleep: sleepEntry?.score || 0,
    streak: state.streak || 0,
    netWorth: computeNetWorth(state),
    goalsHit: goals.filter((g) => g.done).length,
    goalsTotal: goals.length,
    gymWent: (state.gymVisits || []).some((v) => v.date === today),
  };
}

// Returns true if both snapshots carry the same metric values (date assumed
// equal). Used to short-circuit redundant setState calls.
export function snapshotsEqual(a, b) {
  if (!a || !b) return false;
  return (
    a.sleep === b.sleep &&
    a.streak === b.streak &&
    a.netWorth === b.netWorth &&
    a.goalsHit === b.goalsHit &&
    a.goalsTotal === b.goalsTotal &&
    a.gymWent === b.gymWent
  );
}

// Replace today's snapshot if present; otherwise append. Sorted by date,
// trimmed to the most recent 90 days.
export function upsertSnapshot(snapshots, snap) {
  const others = (snapshots || []).filter((s) => s.date !== snap.date);
  const next = [...others, snap].sort((a, b) => a.date.localeCompare(b.date));
  return next.slice(-90);
}

export function lastNSnapshots(snapshots, n) {
  return (snapshots || []).slice(-n);
}

// Weekly review: aggregate of the last 7 snapshots.
export function weeklyReview(snapshots) {
  const last7 = lastNSnapshots(snapshots, 7);
  if (last7.length === 0) return null;

  const sleeps = last7.filter((s) => s.sleep > 0).map((s) => s.sleep);
  const avgSleep = sleeps.length
    ? Math.round(sleeps.reduce((a, b) => a + b, 0) / sleeps.length)
    : 0;

  const gymDays = last7.filter((s) => s.gymWent).length;

  const startNet = last7[0].netWorth;
  const endNet = last7[last7.length - 1].netWorth;
  const netDelta = endNet - startNet;

  const goalDays = last7.filter((s) => s.goalsTotal > 0);
  const avgGoalPct = goalDays.length
    ? Math.round(
        goalDays.reduce((s, d) => s + (d.goalsHit / d.goalsTotal) * 100, 0) /
          goalDays.length
      )
    : 0;

  return { avgSleep, gymDays, netDelta, avgGoalPct, daysTracked: last7.length };
}

// ISO-week key like "2026-W20" — used to dedupe weekly-review badges.
export function weekKey(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}
