import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BusinessCard, GlassCard } from "./GlassComponents.jsx";
import { Input, Button, SectionLabel, Select } from "./UI.jsx";
import { fmt$ } from "../utils/formatters.js";

const TXN_CATEGORIES = [
  "Salary", "Business", "Investment", "Freelance", "Gift",
  "Food", "Rent", "Transport", "Shopping", "Entertainment",
  "Health", "Education", "Subscription", "Other",
];

const todayISO = () => new Date().toISOString().slice(0, 10);

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
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [txnFilter, setTxnFilter] = useState("all"); // all | income | expense

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

  const [newBudget, setNewBudget] = useState({
    category: "Food",
    limit: 0,
    color: "#7C6DFA",
  });

  const [newGoal, setNewGoal] = useState({
    name: "",
    target: 0,
    saved: 0,
    color: "#22D3EE",
  });

  // Safely-accessed finance arrays (with old-state fallback)
  const transactions = state.finances.transactions || [];
  const budgets = state.finances.budgets || [];
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

  const addBudget = () => {
    if (!newBudget.category.trim() || !newBudget.limit) return;
    setState((prev) => ({
      ...prev,
      finances: {
        ...prev.finances,
        budgets: [...(prev.finances.budgets || []), { ...newBudget, limit: Number(newBudget.limit), id: Date.now() }],
      },
    }));
    setNewBudget({ category: "Food", limit: 0, color: "#7C6DFA" });
    setShowAddBudget(false);
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
    setNewGoal({ name: "", target: 0, saved: 0, color: "#22D3EE" });
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

  const removeTxn = (id) => setState((prev) => ({
    ...prev,
    finances: { ...prev.finances, transactions: (prev.finances.transactions || []).filter((t) => t.id !== id) },
  }));

  const removeBudget = (id) => setState((prev) => ({
    ...prev,
    finances: { ...prev.finances, budgets: (prev.finances.budgets || []).filter((b) => b.id !== id) },
  }));

  const removeGoal = (id) => setState((prev) => ({
    ...prev,
    finances: { ...prev.finances, savingsGoals: (prev.finances.savingsGoals || []).filter((g) => g.id !== id) },
  }));

  const adjustGoalSaved = (id, delta) => setState((prev) => ({
    ...prev,
    finances: {
      ...prev.finances,
      savingsGoals: (prev.finances.savingsGoals || []).map((g) =>
        g.id === id ? { ...g, saved: Math.max(0, Number(g.saved || 0) + delta) } : g
      ),
    },
  }));

  // ── Derived data ────────────────────────────────────────────────────
  const subTotal = subs.reduce((s, x) => s + Number(x.cost || 0), 0);

  const thisMonth = todayISO().slice(0, 7);
  const thisMonthTxns = transactions.filter((t) => monthKey(t.date) === thisMonth);
  const monthIncome = thisMonthTxns.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount || 0), 0);
  const monthExpense = thisMonthTxns.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount || 0), 0);
  const monthNet = monthIncome - monthExpense;

  // Last 6 months income/expense data for chart
  const chartData = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const monthTxns = transactions.filter((t) => monthKey(t.date) === key);
      const income = monthTxns.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount || 0), 0);
      const expense = monthTxns.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount || 0), 0);
      months.push({
        key,
        label: d.toLocaleDateString("en-US", { month: "short" }),
        income,
        expense,
      });
    }
    return months;
  }, [transactions]);

  const chartMax = useMemo(() => {
    const max = Math.max(...chartData.map((m) => Math.max(m.income, m.expense)), 1);
    return Math.ceil(max / 100) * 100;
  }, [chartData]);

  // Budget spent this month (sum of expense txns matching category)
  const budgetUsage = (category) => {
    return thisMonthTxns
      .filter((t) => t.type === "expense" && t.category === category)
      .reduce((s, t) => s + Number(t.amount || 0), 0);
  };

  const filteredTxns = txnFilter === "all"
    ? transactions
    : transactions.filter((t) => t.type === txnFilter);

  return (
    <div style={{ padding: "0 clamp(14px, 4.5vw, 20px)" }}>
      {/* ── NET WORTH ─────────────────────────────────────────────── */}
 

      {/* ── INCOME VS EXPENSE CHART ───────────────────────────────── */}
      <GlassCard style={{ padding: "20px" }}>
        <SectionLabel accent="#34D399">INCOME VS EXPENSE · LAST 6 MONTHS</SectionLabel>

        <div className="stat-row" style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
          <div style={{ flex: 1, background: "rgba(52, 211, 153, 0.08)", padding: "12px", borderRadius: "14px", border: "1px solid rgba(52, 211, 153, 0.18)", minWidth: 0 }}>
            <div style={{ fontSize: "9px", fontFamily: "var(--font-mono)", color: "rgba(248,250,255,0.45)", letterSpacing: "0.12em", marginBottom: "4px" }}>THIS MONTH IN</div>
            <div className="stat-val" style={{ color: "#34D399", fontWeight: 800, fontSize: "17px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fmt$(monthIncome)}</div>
          </div>
          <div style={{ flex: 1, background: "rgba(248, 113, 113, 0.08)", padding: "12px", borderRadius: "14px", border: "1px solid rgba(248, 113, 113, 0.18)", minWidth: 0 }}>
            <div style={{ fontSize: "9px", fontFamily: "var(--font-mono)", color: "rgba(248,250,255,0.45)", letterSpacing: "0.12em", marginBottom: "4px" }}>THIS MONTH OUT</div>
            <div className="stat-val" style={{ color: "#F87171", fontWeight: 800, fontSize: "17px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fmt$(monthExpense)}</div>
          </div>
          <div style={{ flex: 1, background: monthNet >= 0 ? "rgba(124,109,250,0.10)" : "rgba(248, 113, 113, 0.08)", padding: "12px", borderRadius: "14px", border: `1px solid ${monthNet >= 0 ? "rgba(124,109,250,0.25)" : "rgba(248,113,113,0.18)"}`, minWidth: 0 }}>
            <div style={{ fontSize: "9px", fontFamily: "var(--font-mono)", color: "rgba(248,250,255,0.45)", letterSpacing: "0.12em", marginBottom: "4px" }}>NET</div>
            <div className="stat-val" style={{ color: monthNet >= 0 ? "#7C6DFA" : "#F87171", fontWeight: 800, fontSize: "17px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
                <div className="chart-label" style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "rgba(248,250,255,0.45)", letterSpacing: "0.08em" }}>
                  {m.label.toUpperCase()}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: "18px", marginTop: "14px", fontSize: "11px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "10px", height: "10px", background: "#34D399", borderRadius: "3px" }} />
            <span style={{ color: "rgba(248,250,255,0.6)" }}>Income</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "10px", height: "10px", background: "#F87171", borderRadius: "3px" }} />
            <span style={{ color: "rgba(248,250,255,0.6)" }}>Expense</span>
          </div>
        </div>
      </GlassCard>

      {/* ── ACTIVE BUSINESSES ─────────────────────────────────────── */}
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
            <div style={{ fontSize: "13px", color: "rgba(248, 250, 255, 0.35)", padding: "12px 4px" }}>
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
                <label style={{ fontSize: "10px", color: "rgba(248, 250, 255, 0.4)", fontFamily: "var(--font-mono)", display: "block", marginBottom: "5px" }}>COLOR</label>
                <input
                  type="color"
                  value={newBusiness.color}
                  onChange={(e) => setNewBusiness({ ...newBusiness, color: e.target.value })}
                  style={{ width: "100%", height: "44px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", padding: "4px", cursor: "pointer" }}
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

      {/* ── SAVINGS GOALS ─────────────────────────────────────────── */}
      <GlassCard style={{ marginTop: "24px" }}>
        <SectionLabel accent="#22D3EE">SAVINGS GOALS</SectionLabel>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {savingsGoals.length === 0 && (
            <div style={{ fontSize: "13px", color: "rgba(248, 250, 255, 0.35)", padding: "4px 0" }}>
              No savings goals yet. Set a target and start stacking.
            </div>
          )}
          {savingsGoals.map((g) => {
            const pct = g.target > 0 ? Math.min(100, Math.round((g.saved / g.target) * 100)) : 0;
            const remaining = Math.max(0, g.target - g.saved);
            return (
              <motion.div
                key={g.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: "14px",
                  padding: "14px",
                  border: "1px solid rgba(255,255,255,0.08)",
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
                      <div style={{ color: "#F8FAFF", fontWeight: 700, fontSize: "15px" }}>{g.name}</div>
                    </div>
                    <div style={{ fontSize: "11px", color: "rgba(248,250,255,0.4)", marginTop: "4px", marginLeft: "16px" }}>
                      {fmt$(g.saved)} / {fmt$(g.target)} · {fmt$(remaining)} to go
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ color: g.color, fontWeight: 800, fontSize: "15px" }}>{pct}%</div>
                    <button
                      onClick={() => removeGoal(g.id)}
                      style={{ background: "none", border: "none", color: "rgba(248,250,255,0.3)", cursor: "pointer", fontSize: "16px" }}
                    >
                      ×
                    </button>
                  </div>
                </div>

                <div style={{ height: "6px", background: "rgba(255,255,255,0.08)", borderRadius: "3px", overflow: "hidden", marginBottom: "10px" }}>
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
            style={{ width: "100%", marginTop: "12px", border: "1px dashed rgba(34, 211, 238, 0.35)" }}
          >
            + Add Savings Goal
          </Button>
        ) : (
          <div style={{ marginTop: "16px", background: "rgba(0,0,0,0.15)", padding: "16px", borderRadius: "16px", border: "1px solid rgba(34, 211, 238, 0.25)" }}>
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
              <label style={{ fontSize: "10px", color: "rgba(248, 250, 255, 0.4)", fontFamily: "var(--font-mono)", display: "block", marginBottom: "5px" }}>COLOR</label>
              <input
                type="color"
                value={newGoal.color}
                onChange={(e) => setNewGoal({ ...newGoal, color: e.target.value })}
                style={{ width: "100%", height: "44px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", padding: "4px", cursor: "pointer" }}
              />
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <Button onClick={addGoal} variant="primary" style={{ flex: 2, background: "linear-gradient(135deg, #22D3EE, #0891B2)", border: "1px solid rgba(34,211,238,0.4)" }}>Save Goal</Button>
              <Button onClick={() => setShowAddGoal(false)} variant="ghost" style={{ flex: 1 }}>Cancel</Button>
            </div>
          </div>
        )}
      </GlassCard>

      {/* ── BUDGET TRACKING ───────────────────────────────────────── */}
      <GlassCard style={{ marginTop: "24px" }}>
        <SectionLabel accent="#FBBF24">BUDGET TRACKING · THIS MONTH</SectionLabel>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {budgets.length === 0 && (
            <div style={{ fontSize: "13px", color: "rgba(248, 250, 255, 0.35)", padding: "4px 0" }}>
              No budgets set. Add categories to track spending.
            </div>
          )}
          {budgets.map((b) => {
            const spent = budgetUsage(b.category);
            const pct = b.limit > 0 ? Math.min(100, Math.round((spent / b.limit) * 100)) : 0;
            const overPct = b.limit > 0 ? Math.round((spent / b.limit) * 100) : 0;
            const isOver = spent > b.limit;
            const isWarning = !isOver && pct >= 80;
            const barColor = isOver ? "#F87171" : isWarning ? "#FBBF24" : b.color;
            return (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: "14px",
                  padding: "14px",
                  border: `1px solid ${isOver ? "rgba(248,113,113,0.3)" : "rgba(255,255,255,0.08)"}`,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: barColor,
                      boxShadow: `0 0 8px ${barColor}90`,
                    }} />
                    <div style={{ color: "#F8FAFF", fontWeight: 700, fontSize: "14px" }}>{b.category}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ fontSize: "13px", color: "rgba(248,250,255,0.7)", fontFamily: "var(--font-mono)" }}>
                      <span style={{ color: barColor, fontWeight: 700 }}>{fmt$(spent)}</span>
                      <span style={{ color: "rgba(248,250,255,0.35)" }}> / {fmt$(b.limit)}</span>
                    </div>
                    <button
                      onClick={() => removeBudget(b.id)}
                      style={{ background: "none", border: "none", color: "rgba(248,250,255,0.3)", cursor: "pointer", fontSize: "16px" }}
                    >
                      ×
                    </button>
                  </div>
                </div>

                <div style={{ height: "6px", background: "rgba(255,255,255,0.08)", borderRadius: "3px", overflow: "hidden" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    style={{ height: "100%", background: `linear-gradient(90deg, ${barColor}, ${barColor}aa)` }}
                  />
                </div>
                {isOver && (
                  <div style={{ fontSize: "11px", color: "#F87171", marginTop: "6px", fontWeight: 600 }}>
                    Over budget by {fmt$(spent - b.limit)} ({overPct}%)
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {!showAddBudget ? (
          <Button
            onClick={() => setShowAddBudget(true)}
            variant="ghost"
            style={{ width: "100%", marginTop: "12px", border: "1px dashed rgba(251, 191, 36, 0.35)" }}
          >
            + Add Budget Category
          </Button>
        ) : (
          <div style={{ marginTop: "16px", background: "rgba(0,0,0,0.15)", padding: "16px", borderRadius: "16px", border: "1px solid rgba(251, 191, 36, 0.25)" }}>
            <Select
              label="Category"
              value={newBudget.category}
              onChange={(e) => setNewBudget({ ...newBudget, category: e.target.value })}
              options={TXN_CATEGORIES.map((c) => ({ value: c, label: c }))}
              placeholder=""
            />
            <Input
              label="Monthly Limit"
              type="number"
              value={newBudget.limit || ""}
              onChange={(e) => setNewBudget({ ...newBudget, limit: Number(e.target.value) || 0 })}
              placeholder="500"
            />
            <div style={{ marginBottom: "12px" }}>
              <label style={{ fontSize: "10px", color: "rgba(248, 250, 255, 0.4)", fontFamily: "var(--font-mono)", display: "block", marginBottom: "5px" }}>COLOR</label>
              <input
                type="color"
                value={newBudget.color}
                onChange={(e) => setNewBudget({ ...newBudget, color: e.target.value })}
                style={{ width: "100%", height: "44px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", padding: "4px", cursor: "pointer" }}
              />
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <Button onClick={addBudget} variant="primary" style={{ flex: 2, background: "linear-gradient(135deg, #FBBF24, #F59E0B)", border: "1px solid rgba(251,191,36,0.4)" }}>Save Budget</Button>
              <Button onClick={() => setShowAddBudget(false)} variant="ghost" style={{ flex: 1 }}>Cancel</Button>
            </div>
          </div>
        )}
      </GlassCard>

      {/* ── SUBSCRIPTIONS ─────────────────────────────────────────── */}
      <GlassCard style={{ marginTop: "24px" }}>
        <SectionLabel accent="#F87171">SUBSCRIPTIONS</SectionLabel>

        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontSize: "10px", color: "rgba(248, 250, 255, 0.45)", fontFamily: "var(--font-mono)", letterSpacing: "0.1em", marginBottom: "4px" }}>MONTHLY BURN</div>
          <div style={{ fontSize: "32px", fontWeight: 900, color: "#F8FAFF" }}>
            ${subTotal.toFixed(2)}
            <span style={{ fontSize: "14px", fontWeight: 500, color: "rgba(248, 250, 255, 0.4)", marginLeft: "4px" }}>/mo</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {subs.map((s) => (
            <div
              key={s.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "14px 0",
                borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: "14px", color: "#F8FAFF" }}>{s.name}</div>
                <div style={{ fontSize: "11px", color: "rgba(248, 250, 255, 0.45)", marginTop: "2px" }}>Renews {s.renews}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ fontWeight: 800, fontSize: "15px", color: "#F8FAFF" }}>${Number(s.cost || 0).toFixed(2)}</div>
                <button
                  onClick={() => removeSub(s.id)}
                  style={{ background: "none", border: "none", color: "rgba(248, 250, 255, 0.3)", cursor: "pointer", fontSize: "18px" }}
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
            { id: "all", label: "All", color: "#7C6DFA" },
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
                  border: `1px solid ${active ? f.color + "60" : "rgba(255,255,255,0.08)"}`,
                  background: active ? f.color + "20" : "rgba(255,255,255,0.03)",
                  color: active ? f.color : "rgba(248,250,255,0.5)",
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
              <div style={{ fontSize: "13px", color: "rgba(248, 250, 255, 0.35)", padding: "12px 0", textAlign: "center" }}>
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
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
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
                    <div style={{ fontWeight: 700, fontSize: "14px", color: "#F8FAFF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {t.description}
                    </div>
                  </div>
                  <div style={{ fontSize: "11px", color: "rgba(248, 250, 255, 0.4)", marginLeft: "14px" }}>
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
                    style={{ background: "none", border: "none", color: "rgba(248,250,255,0.3)", cursor: "pointer", fontSize: "16px" }}
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
                      border: `1px solid ${active ? opt.color + "70" : "rgba(255,255,255,0.08)"}`,
                      background: active ? opt.color + "20" : "rgba(255,255,255,0.03)",
                      color: active ? opt.color : "rgba(248,250,255,0.5)",
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
    </div>
  );
}
