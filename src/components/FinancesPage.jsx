import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BusinessCard, GlassCard } from "./GlassComponents.jsx";
import { Input, Button, SectionLabel, Select } from "./UI.jsx";
import { Sparkline } from "./Sparkline.jsx";
import { lastNSnapshots } from "../utils/snapshots.js";
import { upcomingRenewals } from "../utils/notifications.js";
import { fmt$, todayISO } from "../utils/formatters.js";
import { useUndoToast } from "./UndoToast.jsx";

const TXN_CATEGORIES = [
  "Salary", "Business", "Investment", "Freelance", "Gift",
  "Food", "Rent", "Transport", "Shopping", "Entertainment",
  "Health", "Education", "Subscription", "Other",
];

const monthKey = (iso) => {
  if (!iso) return "";
  return iso.slice(0, 7); // YYYY-MM
};

const monthLabel = (iso) => {
  if (!iso) return "";
  const [y, m] = iso.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "short" });
};

const formatDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export function FinancesPage({ state, setState }) {
  const [showAddBusiness, setShowAddBusiness] = useState(false);
  const [showAddSub, setShowAddSub] = useState(false);
  const [showAddTxn, setShowAddTxn] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [txnFilter, setTxnFilter] = useState("all"); // all | income | expense
  const [celebratedGoal, setCelebratedGoal] = useState(null); // { name, color }
  const { show: showUndoToast } = useUndoToast();

  const [newBusiness, setNewBusiness] = useState({
    name: "",
    revenue: 0,
    expenses: 0,
    clients: 0,
    color: "#34D399",
  });

  const [newSub, setNewSub] = useState({ name: "", cost: 0, renews: "" });

  const [newTxn, setNewTxn] = useState({
    description: "",
    amount: 0,
    type: "expense",
    category: "Other",
    date: todayISO(),
  });

  const [newGoal, setNewGoal] = useState({
    name: "",
    target: 0,
    saved: 0,
    color: "#FBBF24",
  });

  // Safely-accessed finance arrays (with old-state fallback)
  const transactions = state.finances.transactions || [];
  const savingsGoals = state.finances.savingsGoals || [];
  const subs = state.finances.subs || [];

  // ── Add handlers ────────────────────────────────────────────────────
  const addBusiness = () => {
    if (!newBusiness.name.trim()) return;
    setState((prev) => ({
      ...prev,
      businesses: [...(prev.businesses || []), { ...newBusiness, id: Date.now() }],
    }));
    setNewBusiness({ name: "", revenue: 0, expenses: 0, clients: 0, color: "#34D399" });
    setShowAddBusiness(false);
  };

  const addSub = () => {
    if (!newSub.name.trim()) return;
    setState((prev) => ({
      ...prev,
      finances: { ...prev.finances, subs: [...(prev.finances.subs || []), { ...newSub, id: Date.now() }] },
    }));
    setNewSub({ name: "", cost: 0, renews: "" });
    setShowAddSub(false);
  };

  const addTxn = () => {
    if (!newTxn.description.trim() || !newTxn.amount) return;
    setState((prev) => ({
      ...prev,
      finances: {
        ...prev.finances,
        transactions: [
          { ...newTxn, amount: Number(newTxn.amount), id: Date.now() },
          ...(prev.finances.transactions || []),
        ],
      },
    }));
    setNewTxn({ description: "", amount: 0, type: "expense", category: "Other", date: todayISO() });
    setShowAddTxn(false);
  };

  const addGoal = () => {
    if (!newGoal.name.trim() || !newGoal.target) return;
    setState((prev) => ({
      ...prev,
      finances: {
        ...prev.finances,
        savingsGoals: [
          ...(prev.finances.savingsGoals || []),
          { ...newGoal, target: Number(newGoal.target), saved: Number(newGoal.saved), id: Date.now() },
        ],
      },
    }));
    setNewGoal({ name: "", target: 0, saved: 0, color: "#FBBF24" });
    setShowAddGoal(false);
  };

  // ── Remove handlers ─────────────────────────────────────────────────
  const removeBusiness = (id) => setState((prev) => ({
    ...prev,
    businesses: prev.businesses.filter((b) => b.id !== id),
  }));

  const removeSub = (id) => setState((prev) => ({
    ...prev,
    finances: { ...prev.finances, subs: (prev.finances.subs || []).filter((s) => s.id !== id) },
  }));

  // Delete + undo. Capture the row and its index in the underlying array so
  // the undo path can re-insert it where it was, not just at the top.
  const removeTxn = (id) => {
    const list = state.finances.transactions || [];
    const index = list.findIndex((t) => t.id === id);
    if (index === -1) return;
    const removed = list[index];
    setState((prev) => ({
      ...prev,
      finances: {
        ...prev.finances,
        transactions: (prev.finances.transactions || []).filter((t) => t.id !== id),
      },
    }));
    const label = (removed.description || "").trim() || "transaction";
    showUndoToast(`Deleted "${label}"`, () => {
      setState((prev) => {
        const current = prev.finances.transactions || [];
        if (current.some((t) => t.id === removed.id)) return prev;
        const next = [...current];
        next.splice(Math.min(index, next.length), 0, removed);
        return { ...prev, finances: { ...prev.finances, transactions: next } };
      });
    });
  };

  const removeGoal = (id) => {
    const list = state.finances.savingsGoals || [];
    const index = list.findIndex((g) => g.id === id);
    if (index === -1) return;
    const removed = list[index];
    setState((prev) => ({
      ...prev,
      finances: {
        ...prev.finances,
        savingsGoals: (prev.finances.savingsGoals || []).filter((g) => g.id !== id),
      },
    }));
    const label = (removed.name || "").trim() || "savings goal";
    showUndoToast(`Deleted "${label}"`, () => {
      setState((prev) => {
        const current = prev.finances.savingsGoals || [];
        if (current.some((g) => g.id === removed.id)) return prev;
        const next = [...current];
        next.splice(Math.min(index, next.length), 0, removed);
        return { ...prev, finances: { ...prev.finances, savingsGoals: next } };
      });
    });
  };

  const adjustGoalSaved = (id, delta) => {
    setState((prev) => {
      const updated = (prev.finances.savingsGoals || []).map((g) => {
        if (g.id !== id) return g;
        const wasDone = g.target > 0 && Number(g.saved || 0) >= Number(g.target);
        const newSaved = Math.max(0, Number(g.saved || 0) + delta);
        const nowDone = g.target > 0 && newSaved >= Number(g.target);
        if (!wasDone && nowDone) {
          // Trigger celebration after state settles
          setTimeout(() => setCelebratedGoal({ name: g.name, color: g.color }), 100);
        }
        return { ...g, saved: newSaved };
      });
      return { ...prev, finances: { ...prev.finances, savingsGoals: updated } };
    });
  };

  // ── Derived data ────────────────────────────────────────────────────
  const subTotal = subs.reduce((s, x) => s + Number(x.cost || 0), 0);

  const thisMonth = todayISO().slice(0, 7);
  const thisMonthTxns = transactions.filter((t) => monthKey(t.date) === thisMonth);
  const monthIncome = thisMonthTxns.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount || 0), 0);
  const monthTxnExpense = thisMonthTxns.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount || 0), 0);
  const monthExpense = monthTxnExpense + subTotal; // includes subscriptions
  const monthNet = monthIncome - monthExpense;

  // Last 6 months income/expense data for chart
  const chartData = useMemo(() => {
    const months = [];
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const monthTxns = transactions.filter((t) => monthKey(t.date) === key);
      const income = monthTxns.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount || 0), 0);
      const txnExpense = monthTxns.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount || 0), 0);
      // Add subscriptions to current month only
      const expense = txnExpense + (key === currentMonthKey ? subTotal : 0);
      months.push({
        key,
        label: d.toLocaleDateString("en-US", { month: "short" }),
        income,
        expense,
      });
    }
    return months;
  }, [transactions, subs]);

  const chartMax = useMemo(() => {
    const max = Math.max(...chartData.map((m) => Math.max(m.income, m.expense)), 1);
    return Math.ceil(max / 100) * 100;
  }, [chartData]);

  // Sort by user-entered date (desc) so the log is always in chronological
  // order regardless of when the row was created. Fall back to id (insertion
  // time) when two rows share the same date so the order stays stable.
  const sortByDateDesc = (a, b) => {
    const cmp = (b.date || "").localeCompare(a.date || "");
    if (cmp !== 0) return cmp;
    return (b.id || 0) - (a.id || 0);
  };
  const filteredTxns = (txnFilter === "all"
    ? transactions
    : transactions.filter((t) => t.type === txnFilter)
  )
    .slice()
    .sort(sortByDateDesc);

  // ── All-time totals ──────────────────────────────────────────────────
  const allTimeIncome  = transactions.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount || 0), 0);
  const allTimeExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount || 0), 0);
  const allTimeNet     = allTimeIncome - allTimeExpense;

  // 30-day net worth trend, sourced from daily snapshots written by App.jsx.
  const netSeries = lastNSnapshots(state.historySnapshots, 30).map((s) => s.netWorth);
  const netDelta30 = netSeries.length >= 2 ? netSeries[netSeries.length - 1] - netSeries[0] : 0;

  return (
    <div style={{ padding: "0 clamp(14px, 4.5vw, 20px)" }}>
      {/* ── ALL-TIME STATS ────────────────────────────────────────── */}
      <GlassCard style={{ padding: "20px 20px 18px", marginBottom: "16px" }}>
        <SectionLabel accent="var(--accent-main)">ALL TIME</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0" }}>

          <div style={{ textAlign: "center", padding: "4px 0" }}>
            <div style={{ fontSize: "9px", fontFamily: "var(--font-mono)", color: "var(--text-faint)", letterSpacing: "0.12em", marginBottom: "6px" }}>INCOME</div>
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              style={{ fontSize: "clamp(15px, 4vw, 22px)", fontWeight: 900, color: "#34D399", letterSpacing: "-0.02em", lineHeight: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
            >
              {fmt$(allTimeIncome)}
            </motion.div>
          </div>

          <div style={{ textAlign: "center", padding: "4px 0", borderLeft: "1px solid var(--border)", borderRight: "1px solid var(--border)" }}>
            <div style={{ fontSize: "9px", fontFamily: "var(--font-mono)", color: "var(--text-faint)", letterSpacing: "0.12em", marginBottom: "6px" }}>EXPENSES</div>
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08 }}
              style={{ fontSize: "clamp(15px, 4vw, 22px)", fontWeight: 900, color: "#F87171", letterSpacing: "-0.02em", lineHeight: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
            >
              {fmt$(allTimeExpense)}
            </motion.div>
          </div>

          <div style={{ textAlign: "center", padding: "4px 0" }}>
            <div style={{ fontSize: "9px", fontFamily: "var(--font-mono)", color: "var(--text-faint)", letterSpacing: "0.12em", marginBottom: "6px" }}>NET</div>
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.16 }}
              style={{ fontSize: "clamp(15px, 4vw, 22px)", fontWeight: 900, color: allTimeNet >= 0 ? "var(--accent-main)" : "#F87171", letterSpacing: "-0.02em", lineHeight: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
            >
              {allTimeNet >= 0 ? "+" : ""}{fmt$(allTimeNet)}
            </motion.div>
          </div>

        </div>
      </GlassCard>

      {/* ── NET WORTH TREND ───────────────────────────────────────── */}
      <GlassCard style={{ padding: "18px 20px 16px", marginBottom: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <SectionLabel accent="var(--accent-main)" style={{ marginBottom: 0 }}>NET WORTH · 30-DAY</SectionLabel>
          <div
            style={{
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              fontWeight: 800,
              color: netDelta30 >= 0 ? "#34D399" : "#F87171",
            }}
          >
            {netDelta30 >= 0 ? "▲ +" : "▼ −"}{fmt$(Math.abs(netDelta30))}
          </div>
        </div>
        <div style={{ width: "100%" }}>
          <Sparkline data={netSeries} color="var(--accent-main)" width={320} height={56} strokeWidth={2} />
        </div>
        {netSeries.length < 7 && (
          <div style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--text-faint)", marginTop: "8px", textAlign: "center", letterSpacing: "0.08em" }}>
            BUILDING HISTORY · {netSeries.length} DAY{netSeries.length === 1 ? "" : "S"} TRACKED
          </div>
        )}
      </GlassCard>

      {/* ── INCOME VS EXPENSE CHART ───────────────────────────────── */}
      <GlassCard style={{ padding: "20px" }}>
        <SectionLabel accent="#34D399">INCOME VS EXPENSE · LAST 6 MONTHS</SectionLabel>

        <div className="stat-row" style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
          <div style={{ flex: 1, background: "rgba(52, 211, 153, 0.08)", padding: "12px", borderRadius: "14px", border: "1px solid rgba(52, 211, 153, 0.18)", minWidth: 0 }}>
            <div style={{ fontSize: "9px", fontFamily: "var(--font-mono)", color: "var(--text-faint)", letterSpacing: "0.12em", marginBottom: "4px" }}>IN</div>
            <div className="stat-val" style={{ color: "#34D399", fontWeight: 800, fontSize: "17px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fmt$(monthIncome)}</div>
          </div>
          <div style={{ flex: 1, background: "rgba(248, 113, 113, 0.08)", padding: "12px", borderRadius: "14px", border: "1px solid rgba(248, 113, 113, 0.18)", minWidth: 0 }}>
            <div style={{ fontSize: "9px", fontFamily: "var(--font-mono)", color: "var(--text-faint)", letterSpacing: "0.12em", marginBottom: "4px" }}>OUT</div>
            <div className="stat-val" style={{ color: "#F87171", fontWeight: 800, fontSize: "17px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fmt$(monthExpense)}</div>
          </div>
          <div style={{ flex: 1, background: monthNet >= 0 ? "rgba(var(--accent-main-rgb),0.10)" : "rgba(248, 113, 113, 0.08)", padding: "12px", borderRadius: "14px", border: `1px solid ${monthNet >= 0 ? "rgba(var(--accent-main-rgb),0.25)" : "rgba(248,113,113,0.18)"}`, minWidth: 0 }}>
            <div style={{ fontSize: "9px", fontFamily: "var(--font-mono)", color: "var(--text-faint)", letterSpacing: "0.12em", marginBottom: "4px" }}>NET</div>
            <div className="stat-val" style={{ color: monthNet >= 0 ? "var(--accent-main)" : "#F87171", fontWeight: 800, fontSize: "17px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {monthNet >= 0 ? "+" : ""}{fmt$(monthNet)}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", height: "140px", gap: "10px", padding: "0 4px" }}>
          {chartData.map((m, idx) => {
            const incomeH = (m.income / chartMax) * 100;
            const expenseH = (m.expense / chartMax) * 100;
            return (
              <div key={m.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                <div style={{ display: "flex", alignItems: "flex-end", gap: "3px", height: "110px", width: "100%", justifyContent: "center" }}>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${incomeH}%` }}
                    transition={{ duration: 0.7, delay: idx * 0.05, ease: "easeOut" }}
                    style={{
                      flex: 1,
                      maxWidth: "16px",
                      background: "linear-gradient(180deg, #34D399, #10B981)",
                      borderRadius: "4px 4px 2px 2px",
                      boxShadow: "0 0 10px rgba(52,211,153,0.35)",
                      minHeight: m.income > 0 ? "3px" : "0",
                    }}
                  />
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${expenseH}%` }}
                    transition={{ duration: 0.7, delay: idx * 0.05 + 0.1, ease: "easeOut" }}
                    style={{
                      flex: 1,
                      maxWidth: "16px",
                      background: "linear-gradient(180deg, #F87171, #EF4444)",
                      borderRadius: "4px 4px 2px 2px",
                      boxShadow: "0 0 10px rgba(248,113,113,0.30)",
                      minHeight: m.expense > 0 ? "3px" : "0",
                    }}
                  />
                </div>
                <div className="chart-label" style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--text-faint)", letterSpacing: "0.08em" }}>
                  {m.label.toUpperCase()}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: "18px", marginTop: "14px", fontSize: "11px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "10px", height: "10px", background: "#34D399", borderRadius: "3px" }} />
            <span style={{ color: "var(--text-muted)" }}>Income</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "10px", height: "10px", background: "#F87171", borderRadius: "3px" }} />
            <span style={{ color: "var(--text-muted)" }}>Expense</span>
          </div>
        </div>
      </GlassCard>

      {/* ── ACTIVE BUSINESSES ─────────────────────────────────────── 
      <div style={{ marginTop: "24px" }}>
        <SectionLabel accent="#34D399">ACTIVE BUSINESSES</SectionLabel>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {(state.businesses || []).map((b, idx) => (
            <BusinessCard
              key={b.id}
              delay={idx * 0.1}
              name={b.name}
              revenue={b.revenue}
              expenses={b.expenses}
              clients={b.clients ?? b.orders ?? 0}
              color={b.color}
              onRemove={() => removeBusiness(b.id)}
            />
          ))}
          {(state.businesses || []).length === 0 && (
            <div style={{ fontSize: "13px", color: "var(--text-faint)", padding: "12px 4px" }}>
              No active businesses yet.
            </div>
          )}
        </div>

        {!showAddBusiness ? (
          <motion.button
            onClick={() => setShowAddBusiness(true)}
            whileTap={{ scale: 0.98 }}
            style={{
              width: "100%",
              marginTop: "8px",
              padding: "16px",
              borderRadius: "16px",
              border: "1px dashed rgba(52, 211, 153, 0.4)",
              background: "rgba(52, 211, 153, 0.05)",
              color: "#34D399",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            + Add New Business
          </motion.button>
        ) : (
          <GlassCard style={{ marginTop: "12px", border: "1px solid rgba(52, 211, 153, 0.3)" }}>
            <Input
              label="Business Name"
              value={newBusiness.name}
              onChange={(e) => setNewBusiness({ ...newBusiness, name: e.target.value })}
              placeholder="e.g., E-commerce Store"
            />
            <div style={{ display: "flex", gap: "10px" }}>
              <Input
                label="Revenue"
                type="number"
                value={newBusiness.revenue || ""}
                onChange={(e) => setNewBusiness({ ...newBusiness, revenue: Number(e.target.value) || 0 })}
                style={{ flex: 1 }}
              />
              <Input
                label="Expenses"
                type="number"
                value={newBusiness.expenses || ""}
                onChange={(e) => setNewBusiness({ ...newBusiness, expenses: Number(e.target.value) || 0 })}
                style={{ flex: 1 }}
              />
            </div>
            <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
              <Input
                label="Clients"
                type="number"
                value={newBusiness.clients || ""}
                onChange={(e) => setNewBusiness({ ...newBusiness, clients: Number(e.target.value) || 0 })}
                style={{ flex: 1, marginBottom: 0 }}
              />
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "10px", color: "var(--text-faint)", fontFamily: "var(--font-mono)", display: "block", marginBottom: "5px" }}>COLOR</label>
                <input
                  type="color"
                  value={newBusiness.color}
                  onChange={(e) => setNewBusiness({ ...newBusiness, color: e.target.value })}
                  style={{ width: "100%", height: "44px", borderRadius: "12px", border: "1px solid var(--border)", background: "var(--card)", padding: "4px", cursor: "pointer" }}
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <Button onClick={addBusiness} variant="success" style={{ flex: 2 }}>Save Business</Button>
              <Button onClick={() => setShowAddBusiness(false)} variant="ghost" style={{ flex: 1 }}>Cancel</Button>
            </div>
          </GlassCard>
        )}
      </div>
      */}

      {/* ── SAVINGS GOALS ─────────────────────────────────────────── */}
      <GlassCard style={{ marginTop: "24px" }}>
        <SectionLabel accent="#FBBF24">SAVINGS GOALS</SectionLabel>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {savingsGoals.length === 0 && (
            <div style={{ fontSize: "13px", color: "var(--text-faint)", padding: "4px 0" }}>
              No savings goals yet. Set a target and start stacking.
            </div>
          )}
          {savingsGoals.map((g) => {
            const pct = g.target > 0 ? Math.min(100, Math.round((g.saved / g.target) * 100)) : 0;
            const isComplete = pct >= 100;
            const remaining = Math.max(0, g.target - g.saved);
            return (
              <motion.div
                key={g.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: isComplete ? "rgba(52,211,153,0.07)" : "var(--card)",
                  borderRadius: "14px",
                  padding: "14px",
                  border: isComplete ? "1px solid rgba(52,211,153,0.35)" : "1px solid var(--border)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: g.color,
                        boxShadow: `0 0 8px ${g.color}90`,
                      }} />
                      <div style={{ color: "var(--text)", fontWeight: 700, fontSize: "15px" }}>{g.name}</div>
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-faint)", marginTop: "4px", marginLeft: "16px" }}>
                      {fmt$(g.saved)} / {fmt$(g.target)} · {fmt$(remaining)} to go
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    {isComplete ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{
                          background: "linear-gradient(135deg, #34D399, #10B981)",
                          borderRadius: "20px",
                          padding: "2px 10px",
                          fontSize: "10px",
                          fontWeight: 800,
                          color: "#fff",
                          letterSpacing: "0.08em",
                          fontFamily: "var(--font-mono)",
                          boxShadow: "0 0 12px rgba(52,211,153,0.5)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        COMPLETE ✓
                      </motion.div>
                    ) : (
                      <div style={{ color: g.color, fontWeight: 800, fontSize: "15px" }}>{pct}%</div>
                    )}
                    <button
                      onClick={() => removeGoal(g.id)}
                      style={{ background: "none", border: "none", color: "var(--text-faint)", cursor: "pointer", fontSize: "16px" }}
                    >
                      ×
                    </button>
                  </div>
                </div>

                <div style={{ height: "6px", background: "var(--card-mid)", borderRadius: "3px", overflow: "hidden", marginBottom: "10px" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    style={{ height: "100%", background: `linear-gradient(90deg, ${g.color}, ${g.color}aa)` }}
                  />
                </div>

                <div style={{ display: "flex", gap: "6px" }}>
                  <Button size="sm" variant="ghost" onClick={() => adjustGoalSaved(g.id, 100)}>+ $100</Button>
                  <Button size="sm" variant="ghost" onClick={() => adjustGoalSaved(g.id, 500)}>+ $500</Button>
                  <Button size="sm" variant="ghost" onClick={() => adjustGoalSaved(g.id, 1000)}>+ $1K</Button>
                  <Button size="sm" variant="ghost" onClick={() => adjustGoalSaved(g.id, -100)}>− $100</Button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {!showAddGoal ? (
          <Button
            onClick={() => setShowAddGoal(true)}
            variant="ghost"
            style={{ width: "100%", marginTop: "12px", border: "1px dashed rgba(251, 191, 36, 0.35)" }}
          >
            + Add Savings Goal
          </Button>
        ) : (
          <div style={{ marginTop: "16px", background: "rgba(0,0,0,0.15)", padding: "16px", borderRadius: "16px", border: "1px solid rgba(251, 191, 36, 0.25)" }}>
            <Input
              label="Goal Name"
              value={newGoal.name}
              onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
              placeholder="e.g., Emergency Fund"
            />
            <div style={{ display: "flex", gap: "10px" }}>
              <Input
                label="Target"
                type="number"
                value={newGoal.target || ""}
                onChange={(e) => setNewGoal({ ...newGoal, target: Number(e.target.value) || 0 })}
                style={{ flex: 1 }}
              />
              <Input
                label="Already Saved"
                type="number"
                value={newGoal.saved || ""}
                onChange={(e) => setNewGoal({ ...newGoal, saved: Number(e.target.value) || 0 })}
                style={{ flex: 1 }}
              />
            </div>
            <div style={{ marginBottom: "12px" }}>
              <label style={{ fontSize: "10px", color: "var(--text-faint)", fontFamily: "var(--font-mono)", display: "block", marginBottom: "5px" }}>COLOR</label>
              <input
                type="color"
                value={newGoal.color}
                onChange={(e) => setNewGoal({ ...newGoal, color: e.target.value })}
                style={{ width: "100%", height: "44px", borderRadius: "12px", border: "1px solid var(--border)", background: "var(--card)", padding: "4px", cursor: "pointer" }}
              />
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <Button onClick={addGoal} variant="primary" style={{ flex: 2, background: "linear-gradient(135deg, #FBBF24, #F59E0B)", border: "1px solid rgba(251,191,36,0.4)" }}>Save Goal</Button>
              <Button onClick={() => setShowAddGoal(false)} variant="ghost" style={{ flex: 1 }}>Cancel</Button>
            </div>
          </div>
        )}
      </GlassCard>

      {/* ── SUBSCRIPTIONS ─────────────────────────────────────────── */}
      <GlassCard style={{ marginTop: "24px" }}>
        <SectionLabel accent="#F87171">SUBSCRIPTIONS</SectionLabel>

        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", letterSpacing: "0.1em", marginBottom: "4px" }}>MONTHLY BURN</div>
          <div style={{ fontSize: "32px", fontWeight: 900, color: "var(--text)" }}>
            ${subTotal.toFixed(2)}
            <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-faint)", marginLeft: "4px" }}>/mo</span>
          </div>
        </div>

        {/* Renewing-in-next-7-days callout. Only renders when there's something
            to nag about — the user shouldn't see empty chrome on a quiet week. */}
        <UpcomingRenewalsBlock subs={subs} />

        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {subs.map((s) => (
            <div
              key={s.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "14px 0",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--text)" }}>{s.name}</div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>Renews {s.renews}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ fontWeight: 800, fontSize: "15px", color: "var(--text)" }}>${Number(s.cost || 0).toFixed(2)}</div>
                <button
                  onClick={() => removeSub(s.id)}
                  style={{ background: "none", border: "none", color: "var(--text-faint)", cursor: "pointer", fontSize: "18px" }}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>

        {!showAddSub ? (
          <Button
            onClick={() => setShowAddSub(true)}
            variant="ghost"
            style={{ width: "100%", marginTop: "12px", border: "1px dashed rgba(248, 113, 113, 0.3)" }}
          >
            + Add Subscription
          </Button>
        ) : (
          <div style={{ marginTop: "16px", background: "rgba(0,0,0,0.15)", padding: "16px", borderRadius: "16px", border: "1px solid rgba(248, 113, 113, 0.2)" }}>
            <Input
              label="Service Name"
              value={newSub.name}
              onChange={(e) => setNewSub({ ...newSub, name: e.target.value })}
              placeholder="e.g., Netflix"
            />
            <div style={{ display: "flex", gap: "10px" }}>
              <Input
                label="Cost"
                type="number"
                step="0.01"
                value={newSub.cost || ""}
                onChange={(e) => setNewSub({ ...newSub, cost: Number(e.target.value) || 0 })}
                style={{ flex: 1 }}
              />
              <Input
                label="Renewal Date"
                type="date"
                value={newSub.renews}
                onChange={(e) => setNewSub({ ...newSub, renews: e.target.value })}
                style={{ flex: 1 }}
              />
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
              <Button onClick={addSub} variant="primary" style={{ flex: 2, background: "#F87171" }}>Add Sub</Button>
              <Button onClick={() => setShowAddSub(false)} variant="ghost" style={{ flex: 1 }}>Cancel</Button>
            </div>
          </div>
        )}
      </GlassCard>

      {/* ── TRANSACTION LOG ───────────────────────────────────────── */}
      <GlassCard style={{ marginTop: "24px" }}>
        <SectionLabel accent="#22D3EE">TRANSACTION LOG</SectionLabel>

        <div style={{ display: "flex", gap: "6px", marginBottom: "14px" }}>
          {[
            { id: "all", label: "All", color: "var(--accent-main)" },
            { id: "income", label: "Income", color: "#34D399" },
            { id: "expense", label: "Expense", color: "#F87171" },
          ].map((f) => {
            const active = txnFilter === f.id;
            return (
              <motion.button
                key={f.id}
                onClick={() => setTxnFilter(f.id)}
                whileTap={{ scale: 0.95 }}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  borderRadius: "10px",
                  border: `1px solid ${active ? f.color + "60" : "var(--card-mid)"}`,
                  background: active ? f.color + "20" : "var(--card)",
                  color: active ? f.color : "var(--text-muted)",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "var(--font-mono)",
                  letterSpacing: "0.05em",
                }}
              >
                {f.label.toUpperCase()}
              </motion.button>
            );
          })}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "2px", maxHeight: "360px", overflowY: "auto" }}>
          <AnimatePresence>
            {filteredTxns.length === 0 && (
              <div style={{ fontSize: "13px", color: "var(--text-faint)", padding: "12px 0", textAlign: "center" }}>
                No transactions yet.
              </div>
            )}
            {filteredTxns.map((t) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 0",
                  borderBottom: "1px solid var(--border)",
                  gap: "10px",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                    <div style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: t.type === "income" ? "#34D399" : "#F87171",
                      flexShrink: 0,
                    }} />
                    <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {t.description}
                    </div>
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-faint)", marginLeft: "14px" }}>
                    {formatDate(t.date)} · {t.category}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{
                    fontWeight: 800,
                    fontSize: "15px",
                    color: t.type === "income" ? "#34D399" : "#F87171",
                    fontFamily: "var(--font-mono)",
                  }}>
                    {t.type === "income" ? "+" : "−"}${Number(t.amount).toLocaleString()}
                  </div>
                  <button
                    onClick={() => removeTxn(t.id)}
                    style={{ background: "none", border: "none", color: "var(--text-faint)", cursor: "pointer", fontSize: "16px" }}
                  >
                    ×
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {!showAddTxn ? (
          <Button
            onClick={() => setShowAddTxn(true)}
            variant="ghost"
            style={{ width: "100%", marginTop: "14px", border: "1px dashed rgba(34, 211, 238, 0.35)" }}
          >
            + Add Transaction
          </Button>
        ) : (
          <div style={{ marginTop: "16px", background: "rgba(0,0,0,0.15)", padding: "16px", borderRadius: "16px", border: "1px solid rgba(34, 211, 238, 0.25)" }}>
            <div style={{ display: "flex", gap: "6px", marginBottom: "14px" }}>
              {[
                { id: "income", label: "Income", color: "#34D399" },
                { id: "expense", label: "Expense", color: "#F87171" },
              ].map((opt) => {
                const active = newTxn.type === opt.id;
                return (
                  <motion.button
                    key={opt.id}
                    onClick={() => setNewTxn({ ...newTxn, type: opt.id })}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: "10px",
                      border: `1px solid ${active ? opt.color + "70" : "var(--card-mid)"}`,
                      background: active ? opt.color + "20" : "var(--card)",
                      color: active ? opt.color : "var(--text-muted)",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {opt.label}
                  </motion.button>
                );
              })}
            </div>

            <Input
              label="Description"
              value={newTxn.description}
              onChange={(e) => setNewTxn({ ...newTxn, description: e.target.value })}
              placeholder="e.g., Grocery run"
            />
            <div style={{ display: "flex", gap: "10px" }}>
              <Input
                label="Amount"
                type="number"
                step="0.01"
                value={newTxn.amount || ""}
                onChange={(e) => setNewTxn({ ...newTxn, amount: Number(e.target.value) || 0 })}
                style={{ flex: 1 }}
              />
              <Input
                label="Date"
                type="date"
                value={newTxn.date}
                onChange={(e) => setNewTxn({ ...newTxn, date: e.target.value })}
                style={{ flex: 1 }}
              />
            </div>
            <Select
              label="Category"
              value={newTxn.category}
              onChange={(e) => setNewTxn({ ...newTxn, category: e.target.value })}
              options={TXN_CATEGORIES.map((c) => ({ value: c, label: c }))}
              placeholder=""
            />
            <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
              <Button
                onClick={addTxn}
                variant="primary"
                style={{ flex: 2, background: "linear-gradient(135deg, #22D3EE, #0891B2)", border: "1px solid rgba(34,211,238,0.4)" }}
              >
                Add Transaction
              </Button>
              <Button onClick={() => setShowAddTxn(false)} variant="ghost" style={{ flex: 1 }}>Cancel</Button>
            </div>
          </div>
        )}
      </GlassCard>

      {/* ── GOAL COMPLETE POPUP ───────────────────────────────────── */}
      <AnimatePresence>
        {celebratedGoal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCelebratedGoal(null)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.65)",
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: "24px",
            }}
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "linear-gradient(145deg, rgba(20,28,24,0.98), rgba(10,20,16,0.98))",
                border: "1.5px solid rgba(52,211,153,0.45)",
                borderRadius: "28px",
                padding: "40px 32px 32px",
                textAlign: "center",
                maxWidth: "340px",
                width: "100%",
                boxShadow: "0 0 80px rgba(52,211,153,0.25), 0 24px 60px rgba(0,0,0,0.6)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Glowing ring */}
              <motion.div
                animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  position: "absolute",
                  inset: "-30px",
                  borderRadius: "50%",
                  background: "radial-gradient(ellipse at center, rgba(52,211,153,0.12) 0%, transparent 70%)",
                  pointerEvents: "none",
                }}
              />

              {/* Trophy emoji */}
              <motion.div
                animate={{ rotate: [-8, 8, -8], y: [0, -4, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                style={{ fontSize: "60px", lineHeight: 1, marginBottom: "20px" }}
              >
                🏆
              </motion.div>

              <div style={{
                fontSize: "22px",
                fontWeight: 900,
                color: "#34D399",
                marginBottom: "8px",
                letterSpacing: "-0.02em",
              }}>
                Goal Reached!
              </div>

              <div style={{
                fontSize: "15px",
                fontWeight: 700,
                color: "var(--text)",
                marginBottom: "6px",
              }}>
                {celebratedGoal.name}
              </div>

              <div style={{
                fontSize: "13px",
                color: "var(--text-muted)",
                marginBottom: "28px",
                lineHeight: 1.5,
              }}>
                You've hit 100% of your savings target.{"\n"}Keep it up! 💪
              </div>

              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setCelebratedGoal(null)}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "14px",
                  border: "none",
                  background: "linear-gradient(135deg, #34D399, #10B981)",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: "15px",
                  cursor: "pointer",
                  boxShadow: "0 4px 20px rgba(52,211,153,0.4)",
                  letterSpacing: "0.02em",
                }}
              >
                Awesome! 🎉
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Surfaces any subscription renewing in the next 7 days. Each row shows the
// human label ("Tomorrow", "in 3 days", etc.) so the user can scan quickly
// instead of mentally diffing dates. Renders nothing when there's no urgency.
function UpcomingRenewalsBlock({ subs }) {
  const upcoming = upcomingRenewals(subs, 7);
  if (upcoming.length === 0) return null;

  const totalDue = upcoming.reduce((s, u) => s + Number(u.cost || 0), 0);

  return (
    <div style={{
      marginBottom: "20px",
      padding: "14px",
      borderRadius: "14px",
      background: "rgba(248, 113, 113, 0.06)",
      border: "1px solid rgba(248, 113, 113, 0.25)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <div style={{
          fontSize: "10px",
          fontFamily: "var(--font-mono)",
          color: "#F87171",
          fontWeight: 800,
          letterSpacing: "0.12em",
        }}>
          ⚠ RENEWING IN 7 DAYS
        </div>
        <div style={{
          fontSize: "12px",
          fontFamily: "var(--font-mono)",
          color: "#F87171",
          fontWeight: 800,
        }}>
          ${totalDue.toFixed(2)}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {upcoming.map((sub) => {
          const whenLabel =
            sub.daysUntil === 0 ? "Today" :
            sub.daysUntil === 1 ? "Tomorrow" :
            `in ${sub.daysUntil} days`;
          return (
            <div
              key={sub.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 10px",
                background: "rgba(0,0,0,0.15)",
                borderRadius: "10px",
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "var(--text)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  {sub.name}
                </div>
                <div style={{
                  fontSize: "10px",
                  color: sub.daysUntil <= 1 ? "#F87171" : "var(--text-faint)",
                  fontFamily: "var(--font-mono)",
                  letterSpacing: "0.05em",
                  marginTop: "2px",
                  fontWeight: sub.daysUntil <= 1 ? 700 : 500,
                }}>
                  {whenLabel.toUpperCase()} · {sub.renews}
                </div>
              </div>
              <div style={{
                fontSize: "14px",
                fontWeight: 800,
                color: "var(--text)",
                fontFamily: "var(--font-mono)",
                marginLeft: "10px",
                flexShrink: 0,
              }}>
                ${Number(sub.cost || 0).toFixed(2)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
