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
    color: "#34D399",
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
      businesses: [...(prev.businesses || []), { ...newBusiness, id: Date.now() }],
    }));
    setNewBusiness({ name: "", revenue: 0, expenses: 0, orders: 0, color: "#34D399" });
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
      finances: { ...prev.finances, subs: (prev.finances.subs || []).filter((s) => s.id !== id) },
    }));
  };

  const subTotal = (state.finances.subs || []).reduce((s, x) => s + x.cost, 0);
  const totalRevenue = (state.businesses || []).reduce((s, b) => s + b.revenue, 0);
  const totalProfit = (state.businesses || []).reduce((s, b) => s + (b.revenue - b.expenses), 0);

  return (
    <div style={{ padding: "0 20px" }}>
      {/* Net Worth Summary */}
      <GlassCard style={{ padding: "24px" }} glow="#34D399">
        <SectionLabel accent="#34D399">NET WORTH</SectionLabel>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ fontSize: "40px", fontWeight: 900, letterSpacing: "-0.04em", marginBottom: "16px", color: "#F8FAFF" }}
        >
          {fmt$(state.finances.netWorth)}
        </motion.div>
        
        <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
          <div style={{ flex: 1, background: "rgba(52, 211, 153, 0.08)", padding: "12px", borderRadius: "16px", border: "1px solid rgba(52, 211, 153, 0.15)" }}>
            <div style={{ fontSize: "10px", color: "rgba(248, 250, 255, 0.45)", fontFamily: "var(--font-mono)", marginBottom: "4px" }}>ASSETS</div>
            <div style={{ color: "#34D399", fontWeight: 800, fontSize: "18px" }}>{fmt$(state.finances.assets)}</div>
          </div>
          <div style={{ flex: 1, background: "rgba(248, 113, 113, 0.08)", padding: "12px", borderRadius: "16px", border: "1px solid rgba(248, 113, 113, 0.15)" }}>
            <div style={{ fontSize: "10px", color: "rgba(248, 250, 255, 0.45)", fontFamily: "var(--font-mono)", marginBottom: "4px" }}>LIABILITIES</div>
            <div style={{ color: "#F87171", fontWeight: 800, fontSize: "18px" }}>{fmt$(state.finances.liabilities)}</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <Input
            label="Edit Net Worth"
            type="number"
            value={state.finances.netWorth || ""}
            onChange={(e) => setState(p => ({ ...p, finances: { ...p.finances, netWorth: Number(e.target.value) || 0 } }))}
            style={{ flex: "1 1 100%", marginBottom: "8px" }}
          />
          <Input
            label="Assets"
            type="number"
            value={state.finances.assets || ""}
            onChange={(e) => setState(p => ({ ...p, finances: { ...p.finances, assets: Number(e.target.value) || 0 } }))}
            style={{ flex: 1, marginBottom: 0 }}
          />
          <Input
            label="Liabilities"
            type="number"
            value={state.finances.liabilities || ""}
            onChange={(e) => setState(p => ({ ...p, finances: { ...p.finances, liabilities: Number(e.target.value) || 0 } }))}
            style={{ flex: 1, marginBottom: 0 }}
          />
        </div>
      </GlassCard>

      {/* Businesses Section */}
      <div style={{ marginTop: "24px" }}>
        <SectionLabel accent="#34D399">ACTIVE VENTURES</SectionLabel>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {(state.businesses || []).map((b, idx) => (
            <BusinessCard
              key={b.id}
              delay={idx * 0.1}
              name={b.name}
              revenue={b.revenue}
              expenses={b.expenses}
              orders={b.orders}
              color={b.color}
              onRemove={() => removeBusiness(b.id)}
            />
          ))}
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
            + Add New Venture
          </motion.button>
        ) : (
          <GlassCard style={{ marginTop: "12px", border: "1px solid rgba(52, 211, 153, 0.3)" }}>
            <Input
              label="Venture Name"
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
                label="Orders"
                type="number"
                value={newBusiness.orders || ""}
                onChange={(e) => setNewBusiness({ ...newBusiness, orders: Number(e.target.value) || 0 })}
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
              <Button onClick={addBusiness} variant="success" style={{ flex: 2 }}>Save Venture</Button>
              <Button onClick={() => setShowAddBusiness(false)} variant="ghost" style={{ flex: 1 }}>Cancel</Button>
            </div>
          </GlassCard>
        )}
      </div>

      {/* Subscriptions Section */}
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
          {(state.finances.subs || []).map((s) => (
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
                <div style={{ fontWeight: 800, fontSize: "15px", color: "#F8FAFF" }}>${s.cost.toFixed(2)}</div>
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

      {/* Incoming Orders Section */}
      <GlassCard style={{ marginTop: "24px" }}>
        <SectionLabel accent="#22D3EE">INCOMING REVENUE</SectionLabel>
        
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
          {(state.finances.orders || []).map((o, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 14px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: 600,
                background: "rgba(34, 211, 238, 0.12)",
                border: "1px solid rgba(34, 211, 238, 0.25)",
                color: "#22D3EE",
              }}
            >
              {o}
              <span
                onClick={() => removeOrder(i)}
                style={{ cursor: "pointer", opacity: 0.6, fontSize: "14px" }}
              >
                ×
              </span>
            </motion.div>
          ))}
          {(state.finances.orders || []).length === 0 && (
            <div style={{ fontSize: "13px", color: "rgba(248, 250, 255, 0.35)", padding: "8px 0" }}>
              No pending orders.
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <Input
            value={newOrder}
            onChange={(e) => setNewOrder(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addOrder()}
            placeholder="Add pending order…"
            style={{ marginBottom: 0, flex: 1 }}
          />
          <Button onClick={addOrder} variant="primary" style={{ background: "#22D3EE", border: "none" }}>+ ADD</Button>
        </div>
      </GlassCard>
    </div>
  );
}
