import { useState } from "react";
import { motion } from "framer-motion";
import { GlassCard, MetricCard, PlatformCard } from "./GlassComponents.jsx";
import { Input, Button, SectionLabel, Textarea } from "./UI.jsx";

export function BrandPage({ state, setState }) {
  const [showAddPlatform, setShowAddPlatform] = useState(false);
  const [newPlatform, setNewPlatform] = useState({
    platform: "",
    handle: "",
    followers: 0,
    growth: 0,
    icon: "📱",
  });

  const addPlatform = () => {
    if (!newPlatform.platform.trim() || !newPlatform.handle.trim()) return;
    setState((prev) => ({
      ...prev,
      brand: {
        ...prev.brand,
        platforms: [...(prev.brand?.platforms || []), { ...newPlatform, id: Date.now() }],
      },
    }));
    setNewPlatform({ platform: "", handle: "", followers: 0, growth: 0, icon: "📱" });
    setShowAddPlatform(false);
  };

  const removePlatform = (id) => {
    setState((prev) => ({
      ...prev,
      brand: {
        ...prev.brand,
        platforms: (prev.brand?.platforms || []).filter((p) => p.id !== id),
      },
    }));
  };

  const totalFollowers = (state.brand?.platforms || []).reduce(
    (s, p) => s + Number(p.followers || 0),
    0
  );
  const totalGrowth = (state.brand?.platforms || []).reduce(
    (s, p) => s + Number(p.growth || 0),
    0
  );

  return (
    <div style={{ padding: "0 20px" }}>
      {/* Brand Hero */}
      <GlassCard style={{ padding: "24px" }} glow="#22D3EE">
        <SectionLabel accent="#22D3EE">PERSONAL BRAND</SectionLabel>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "20px" }}>
          <div>
            <div style={{ fontSize: "10px", color: "rgba(248, 250, 255, 0.45)", fontFamily: "var(--font-mono)", marginBottom: "4px" }}>TOTAL REACH</div>
            <div style={{ fontSize: "42px", fontWeight: 900, color: "#F8FAFF", letterSpacing: "-0.04em", lineHeight: 1 }}>
              {totalFollowers.toLocaleString()}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#34D399", fontWeight: 800, fontSize: "16px" }}>+{totalGrowth.toLocaleString()}</div>
            <div style={{ fontSize: "9px", color: "rgba(248, 250, 255, 0.45)", fontFamily: "var(--font-mono)" }}>30D GROWTH</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <MetricCard
            label="POSTS"
            value={state.brand?.posts || 0}
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
          />
          <MetricCard
            label="ENGAGEMENT"
            value={`${state.brand?.engagement || 0}%`}
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
          />
        </div>
      </GlassCard>

      {/* Platforms Section */}
      <div style={{ marginTop: "24px" }}>
        <SectionLabel accent="#22D3EE">PLATFORMS</SectionLabel>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {(state.brand?.platforms || []).map((p, idx) => (
            <PlatformCard
              key={p.id}
              delay={idx * 0.08}
              platform={p.platform}
              handle={p.handle}
              followers={p.followers.toLocaleString()}
              growth={p.growth.toLocaleString()}
              icon={p.icon}
              onRemove={() => removePlatform(p.id)}
            />
          ))}
        </div>

        {!showAddPlatform ? (
          <motion.button
            onClick={() => setShowAddPlatform(true)}
            whileTap={{ scale: 0.98 }}
            style={{
              width: "100%",
              marginTop: "12px",
              padding: "16px",
              borderRadius: "16px",
              border: "1px dashed rgba(34, 211, 238, 0.4)",
              background: "rgba(34, 211, 238, 0.05)",
              color: "#22D3EE",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            + Connect New Platform
          </motion.button>
        ) : (
          <GlassCard style={{ marginTop: "12px", border: "1px solid rgba(34, 211, 238, 0.3)" }}>
            <div style={{ display: "flex", gap: "10px" }}>
              <Input
                label="Platform"
                value={newPlatform.platform}
                onChange={(e) => setNewPlatform({ ...newPlatform, platform: e.target.value })}
                placeholder="Instagram"
                style={{ flex: 2 }}
              />
              <Input
                label="Icon"
                value={newPlatform.icon}
                onChange={(e) => setNewPlatform({ ...newPlatform, icon: e.target.value })}
                placeholder="📸"
                style={{ flex: 1 }}
              />
            </div>
            <Input
              label="Handle"
              value={newPlatform.handle}
              onChange={(e) => setNewPlatform({ ...newPlatform, handle: e.target.value })}
              placeholder="@username"
            />
            <div style={{ display: "flex", gap: "10px" }}>
              <Input
                label="Followers"
                type="number"
                value={newPlatform.followers || ""}
                onChange={(e) => setNewPlatform({ ...newPlatform, followers: Number(e.target.value) || 0 })}
                style={{ flex: 1 }}
              />
              <Input
                label="30D Growth"
                type="number"
                value={newPlatform.growth || ""}
                onChange={(e) => setNewPlatform({ ...newPlatform, growth: Number(e.target.value) || 0 })}
                style={{ flex: 1 }}
              />
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <Button onClick={addPlatform} style={{ flex: 2, background: "#22D3EE", border: "none" }}>Add Platform</Button>
              <Button onClick={() => setShowAddPlatform(false)} variant="ghost" style={{ flex: 1 }}>Cancel</Button>
            </div>
          </GlassCard>
        )}
      </div>

      {/* Content Strategy */}
      <GlassCard style={{ marginTop: "24px" }}>
        <SectionLabel accent="#7C6DFA">STRATEGY & REFLECTION</SectionLabel>
        
        <div style={{ marginBottom: "20px" }}>
          <label style={{ fontSize: "10px", color: "rgba(248, 250, 255, 0.4)", display: "block", marginBottom: "8px", fontFamily: "var(--font-mono)" }}>MISSION STATEMENT</label>
          <Textarea
            value={state.brand?.mission || ""}
            onChange={(e) => setState(p => ({ ...p, brand: { ...p.brand, mission: e.target.value } }))}
            placeholder="What are you building? Who are you helping?"
            rows={3}
            style={{ marginBottom: "16px" }}
          />
        </div>

        <div>
          <label style={{ fontSize: "10px", color: "rgba(248, 250, 255, 0.4)", display: "block", marginBottom: "8px", fontFamily: "var(--font-mono)" }}>WEEKLY REFLECTION</label>
          <Textarea
            value={state.brand?.reflection || ""}
            onChange={(e) => setState(p => ({ ...p, brand: { ...p.brand, reflection: e.target.value } }))}
            placeholder="Wins from this week? Lessons learned?"
            rows={5}
            style={{ marginBottom: 0 }}
          />
          <div style={{ textAlign: "right", marginTop: "8px", fontSize: "10px", color: "rgba(248, 250, 255, 0.3)", fontFamily: "var(--font-mono)" }}>
            {state.brand?.reflection?.length || 0} CHARS
          </div>
        </div>
      </GlassCard>

      {/* Quick Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "24px", paddingBottom: "20px" }}>
        <Input
          label="Total Posts"
          type="number"
          value={state.brand?.posts || ""}
          onChange={(e) => setState(p => ({ ...p, brand: { ...p.brand, posts: Number(e.target.value) || 0 } }))}
        />
        <Input
          label="Engage Rate %"
          type="number"
          step="0.1"
          value={state.brand?.engagement || ""}
          onChange={(e) => setState(p => ({ ...p, brand: { ...p.brand, engagement: Number(e.target.value) || 0 } }))}
        />
      </div>
    </div>
  );
}
