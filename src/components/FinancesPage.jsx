import { useState } from "react";
import { motion } from "framer-motion";
import { BusinessCard, GlassCard, MetricCard } from "./GlassComponents.jsx";
import { Input, Button, SectionLabel } from "./UI.jsx";
import { fmt$ } from "../utils/formatters.js";

export function FinancesPage({ state, setState }) {
  const [newOrder, setNewOrder] = useState("");
  const [showAddBusiness, setShowAddBusiness] = useState(false);
  const [showAddSub, setShowAddSub] = useState(false);

  const [newBusiness, setNewBusiness] = useState({
    name: "",
    revenue: 0,
    expenses: 0,
    orders: 0,
    color: "#4ade80",
  });

  const [newSub, setNewSub] = useState({
    name: "",
    cost: 0,
    renews: "",
  });

  const addOrder = () => {
    if (!newOrder.trim()) return;
    setState((prev) => ({
      ...prev,
      finances: { ...prev.finances, orders: [...prev.finances.orders, newOrder.trim()] },
    }));
    setNewOrder("");
  };

  const addBusiness = () => {
    if (!newBusiness.name.trim()) return;
    setState((prev) => ({
      ...prev,
      businesses: [...prev.businesses, { ...newBusiness, id: Date.now() }],
    }));
    setNewBusiness({ name: "", revenue: 0, expenses: 0, orders: 0, color: "#4ade80" });
    setShowAddBusiness(false);
  };

  const addSub = () => {
    if (!newSub.name.trim()) return;
    setState((prev) => ({
      ...prev,
      finances: { ...prev.finances, subs: [...prev.finances.subs, { ...newSub, id: Date.now() }] },
    }));
    setNewSub({ name: "", cost: 0, renews: "" });
    setShowAddSub(false);
  };

  const removeOrder = (index) => {
    setState((prev) => ({
      ...prev,
      finances: { ...prev.finances, orders: prev.finances.orders.filter((_, i) => i !== index) },
    }));
  };

  const removeBusiness = (id) => {
    setState((prev) => ({
      ...prev,
      businesses: prev.businesses.filter((b) => b.id !== id),
    }));
  };

  const removeSub = (id) => {
    setState((prev) => ({
      ...prev,
      finances: { ...prev.finances, subs: prev.finances.subs.filter((s) => s.id !== id) },
    }));
  };

  const subTotal = state.finances.subs.reduce((s, x) => s + x.cost, 0);
  const totalRevenue = state.businesses.reduce((s, b) => s + b.revenue, 0);
  const totalProfit = state.businesses.reduce((s, b) => s + (b.revenue - b.expenses), 0);

  return (
    <div style={{ padding: "var(--spacing-lg)" }}>
      {/* Net Worth Summary */}
      <GlassCard>
        <SectionLabel>NET WORTH</SectionLabel>
        <div style={{ fontSize: "var(--font-4xl)", fontWeight: 800, letterSpacing: -1, marginBottom: "var(--spacing-sm)" }}>
          {fmt$(state.finances.netWorth)}
        </div>
        <div style={{ display: "flex", gap: "var(--spacing-lg)" }}>
          <div>
            <div
              style={{
                fontSize: "var(--font-xs)",
                color: "rgba(255, 255, 255, 0.6)",
                fontFamily: "var(--font-mono)",
              }}
            >
              ASSETS
            </div>
            <div style={{ color: "#4ade80", fontWeight: 700 }}>{fmt$(state.finances.assets)}</div>
          </div>
          <div>
            <div
              style={{
                fontSize: "var(--font-xs)",
                color: "rgba(255, 255, 255, 0.6)",
                fontFamily: "var(--font-mono)",
              }}
            >
              LIABILITIES
            </div>
            <div style={{ color: "#ef4444", fontWeight: 700 }}>{fmt$(state.finances.liabilities)}</div>
          </div>
        </div>
        <div style={{ marginTop: "var(--spacing-md)", display: "flex", gap: "var(--spacing-sm)", flexWrap: "wrap" }}>
          <Input
            label="Net Worth"
            type="number"
            value={state.finances.netWorth || ""}
            onChange={(e) =>
              setState((prev) => ({
                ...prev,
                finances: { ...prev.finances, netWorth: Number(e.target.value) || 0 },
              }))
            }
            style={{ flex: 1, marginBottom: 0 }}
          />
          <Input
            label="Assets"
            type="number"
            value={state.finances.assets || ""}
            onChange={(e) =>
              setState((prev) => ({
                ...prev,
                finances: { ...prev.finances, assets: Number(e.target.value) || 0 },
              }))
            }
            style={{ flex: 1, marginBottom: 0 }}
          />
          <Input
            label="Liabilities"
            type="number"
            value={state.finances.liabilities || ""}
            onChange={(e) =>
              setState((prev) => ({
                ...prev,
                finances: { ...prev.finances, liabilities: Number(e.target.value) || 0 },
              }))
            }
            style={{ flex: 1, marginBottom: 0 }}
          />
        </div>
      </GlassCard>

      {/* Businesses */}
      <div style={{ marginBottom: "var(--spacing-md)" }}>
        <SectionLabel>BUSINESSES</SectionLabel>
        {state.businesses.map((b) => (
          <BusinessCard
            key={b.id}
            name={b.name}
            revenue={b.revenue}
            expenses={b.expenses}
            orders={b.orders}
            color={b.color}
            onRemove={() => removeBusiness(b.id)}
          />
        ))}
        {!showAddBusiness ? (
          <motion.button
            onClick={() => setShowAddBusiness(true)}
            whileTap={{ scale: 0.98 }}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "12px",
              border: "1px dashed rgba(255, 255, 255, 0.3)",
              background: "rgba(255, 255, 255, 0.1)",
              color: "rgba(255, 255, 255, 0.7)",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            + Add Business
          </motion.button>
        ) : (
          <div
            style={{
              marginTop: "var(--spacing-md)",
              padding: "var(--spacing-md)",
              background: "rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(10px)",
              borderRadius: "12px",
              border: "1px solid rgba(255, 255, 255, 0.15)",
            }}
          >
            <Input
              label="Business Name"
              value={newBusiness.name}
              onChange={(e) => setNewBusiness({ ...newBusiness, name: e.target.value })}
              placeholder="e.g., Lawn Care Co."
            />
            <div style={{ display: "flex", gap: "var(--spacing-sm)" }}>
              <Input
                label="Revenue"
                type="number"
                value={newBusiness.revenue || ""}
                onChange={(e) => setNewBusiness({ ...newBusiness, revenue: Number(e.target.value) || 0 })}
              />
              <Input
                label="Expenses"
                type="number"
                value={newBusiness.expenses || ""}
                onChange={(e) => setNewBusiness({ ...newBusiness, expenses: Number(e.target.value) || 0 })}
              />
            </div>
            <div style={{ display: "flex", gap: "var(--spacing-sm)" }}>
              <Input
                label="Orders"
                type="number"
                value={newBusiness.orders || ""}
                onChange={(e) => setNewBusiness({ ...newBusiness, orders: Number(e.target.value) || 0 })}
              />
              <Input
                label="Color"
                type="color"
                value={newBusiness.color}
                onChange={(e) => setNewBusiness({ ...newBusiness, color: e.target.value })}
                style={{ padding: "var(--spacing-xs)" }}
              />
            </div>
            <div style={{ display: "flex", gap: "var(--spacing-sm)", marginTop: "var(--spacing-sm)" }}>
              <Button onClick={addBusiness} style={{ flex: 1 }}>
                Add Business
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowAddBusiness(false)}
                style={{ color: "rgba(255, 255, 255, 0.7)" }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Subscriptions */}
      <GlassCard>
        <SectionLabel>ACTIVE SUBSCRIPTIONS</SectionLabel>
        <div style={{ marginBottom: "var(--spacing-md)" }}>
          <div
            style={{
              fontSize: "var(--font-xs)",
              color: "rgba(255, 255, 255, 0.6)",
              fontFamily: "var(--font-mono)",
            }}
          >
            MONTHLY BURN
          </div>
          <div style={{ fontSize: "var(--font-3xl)", fontWeight: 800 }}>
            USD {subTotal.toFixed(2)}
            <span style={{ fontSize: "var(--font-sm)", color: "rgba(255, 255, 255, 0.6)", fontWeight: 400 }}>
              {" "}
              /mo
            </span>
          </div>
        </div>
        {state.finances.subs.map((s) => (
          <div
            key={s.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 0",
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: "var(--font-sm)" }}>{s.name}</div>
              <div style={{ fontSize: "var(--font-xs)", color: "rgba(255, 255, 255, 0.6)" }}>
                Renews {s.renews}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-sm)" }}>
              <div style={{ fontWeight: 700, fontSize: "var(--font-sm)" }}>
                USD {s.cost.toFixed(2)}
              </div>
              <button
                onClick={() => removeSub(s.id)}
                style={{
                  background: "none",
                  border: "none",
                  color: "rgba(255, 255, 255, 0.5)",
                  cursor: "pointer",
                  fontSize: "16px",
                  padding: "4px",
                }}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
        {!showAddSub ? (
          <motion.button
            onClick={() => setShowAddSub(true)}
            whileTap={{ scale: 0.98 }}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "12px",
              border: "1px dashed rgba(255, 255, 255, 0.3)",
              background: "rgba(255, 255, 255, 0.1)",
              color: "rgba(255, 255, 255, 0.7)",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 500",
              marginTop: "var(--spacing-md)",
            }}
          >
            + Add Subscription
          </motion.button>
        ) : (
          <div
            style={{
              marginTop: "var(--spacing-md)",
              padding: "var(--spacing-md)",
              background: "rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(10px)",
              borderRadius: "12px",
              border: "1px solid rgba(255, 255, 255, 0.15)",
            }}
          >
            <Input
              label="Subscription Name"
              value={newSub.name}
              onChange={(e) => setNewSub({ ...newSub, name: e.target.value })}
              placeholder="e.g., Claude Max"
            />
            <div style={{ display: "flex", gap: "var(--spacing-sm)" }}>
              <Input
                label="Monthly Cost"
                type="number"
                step="0.01"
                value={newSub.cost || ""}
                onChange={(e) => setNewSub({ ...newSub, cost: Number(e.target.value) || 0 })}
              />
              <Input
                label="Renews Date"
                type="date"
                value={newSub.renews}
                onChange={(e) => setNewSub({ ...newSub, renews: e.target.value })}
              />
            </div>
            <div style={{ display: "flex", gap: "var(--spacing-sm)", marginTop: "var(--spacing-sm)" }}>
              <Button onClick={addSub} style={{ flex: 1 }}>
                Add Subscription
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowAddSub(false)}
                style={{ color: "rgba(255, 255, 255, 0.7)" }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Incoming Orders */}
      <GlassCard>
        <SectionLabel>INCOMING ORDERS</SectionLabel>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--spacing-xs)",
            marginBottom: "var(--spacing-md)",
          }}
        >
          {state.finances.orders.map((o, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "6px 12px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: 500,
                background: "rgba(255, 255, 255, 0.15)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "#fff",
              }}
            >
              {o}
              <span
                onClick={() => removeOrder(i)}
                style={{
                  cursor: "pointer",
                  opacity: 0.6,
                  fontSize: "10px",
                  marginLeft: "4px",
                }}
              >
                ✕
              </span>
            </motion.div>
          ))}
        </div>
        <div style={{ display: "flex", gap: "var(--spacing-sm)" }}>
          <Input
            value={newOrder}
            onChange={(e) => setNewOrder(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addOrder()}
            placeholder="Add an incoming order…"
            style={{ marginBottom: 0 }}
          />
          <Button onClick={addOrder}>+ Add</Button>
        </div>
      </GlassCard>
    </div>
  );
}
