import { useState } from "react";
import { motion } from "framer-motion";
import { PlatformCard, GlassCard } from "./GlassComponents.jsx";
import { Input, Button, SectionLabel, Textarea } from "./UI.jsx";

const PLATFORM_ICONS = {
  twitter: "𝕏",
  x: "𝕏",
  instagram: "📷",
  tiktok: "🎵",
  youtube: "▶️",
  linkedin: "💼",
  facebook: "📘",
  threads: "🧵",
  default: "📱",
};

export function BrandPage({ state, setState }) {
  const [showAddPlatform, setShowAddPlatform] = useState(false);

  const [newPlatform, setNewPlatform] = useState({
    name: "",
    icon: "",
    followers: 0,
    delta: "",
    color: "#38bdf8",
    history: [0],
  });

  const addPlatform = () => {
    if (!newPlatform.name.trim()) return;
    setState((prev) => ({
      ...prev,
      brand: {
        ...prev.brand,
        platforms: [...prev.brand.platforms, { ...newPlatform, id: Date.now() }],
      },
    }));
    setNewPlatform({ name: "", icon: "", followers: 0, delta: "", color: "#38bdf8", history: [0] });
    setShowAddPlatform(false);
  };

  const removePlatform = (id) => {
    setState((prev) => ({
      ...prev,
      brand: { ...prev.brand, platforms: prev.brand.platforms.filter((p) => p.id !== id) },
    }));
  };

  const incrementPosted = () => {
    setState((prev) => ({
      ...prev,
      brand: { ...prev.brand, postedToday: prev.brand.postedToday + 1 },
    }));
  };

  const decrementPosted = () => {
    setState((prev) => ({
      ...prev,
      brand: { ...prev.brand, postedToday: Math.max(0, prev.brand.postedToday - 1) },
    }));
  };

  // Calculate total followers and weekly growth
  const totalFollowers = state.brand.platforms.reduce((sum, p) => sum + p.followers, 0);
  const weeklyGrowth = state.brand.platforms.reduce((sum, p) => {
    const delta = parseInt(p.delta?.replace(/[^\d-]/g, "") || "0");
    return sum + delta;
  }, 0);

  return (
    <div style={{ padding: "var(--spacing-lg)" }}>
      {/* Total Followers Summary */}
      <GlassCard>
        <div style={{ fontSize: "var(--font-xs)", color: "rgba(255, 255, 255, 0.6)", fontFamily: "var(--font-mono)", marginBottom: "4px" }}>
          TOTAL FOLLOWERS
        </div>
        <div style={{ fontSize: "var(--font-4xl)", fontWeight: 800, letterSpacing: -1, marginBottom: "8px" }}>
          {totalFollowers.toLocaleString()}
        </div>
        <div style={{ color: "#4ade80", fontSize: "14px", fontWeight: 600 }}>
          +{weeklyGrowth} this week
        </div>
      </GlassCard>

      {/* Platform Cards */}
      <div style={{ marginBottom: "16px" }}>
        <SectionLabel>SOCIAL PLATFORMS</SectionLabel>
        {state.brand.platforms.map((p) => (
          <PlatformCard
            key={p.id}
            platform={p.name}
            handle={state.brand.handle || "@handle"}
            followers={p.followers.toLocaleString()}
            growth={p.delta?.replace(/[^\d-]/g, "") || "0"}
            icon={PLATFORM_ICONS[p.name.toLowerCase()] || PLATFORM_ICONS.default}
            onRemove={() => removePlatform(p.id)}
          />
        ))}
        {!showAddPlatform ? (
          <motion.button
            onClick={() => setShowAddPlatform(true)}
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
            + Add Platform
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
              label="Platform Name"
              value={newPlatform.name}
              onChange={(e) => setNewPlatform({ ...newPlatform, name: e.target.value })}
              placeholder="e.g., TikTok"
            />
            <div style={{ display: "flex", gap: "var(--spacing-sm)" }}>
              <Input
                label="Icon (single letter)"
                value={newPlatform.icon}
                onChange={(e) => setNewPlatform({ ...newPlatform, icon: e.target.value })}
                placeholder="T"
                maxLength={1}
              />
              <Input
                label="Followers"
                type="number"
                value={newPlatform.followers || ""}
                onChange={(e) => setNewPlatform({ ...newPlatform, followers: Number(e.target.value) || 0 })}
              />
            </div>
            <div style={{ display: "flex", gap: "var(--spacing-sm)" }}>
              <Input
                label="Weekly Growth (e.g., +42)"
                value={newPlatform.delta}
                onChange={(e) => setNewPlatform({ ...newPlatform, delta: e.target.value })}
                placeholder="+42"
              />
              <Input
                label="Color"
                type="color"
                value={newPlatform.color}
                onChange={(e) => setNewPlatform({ ...newPlatform, color: e.target.value })}
                style={{ padding: "var(--spacing-xs)" }}
              />
            </div>
            <div style={{ display: "flex", gap: "var(--spacing-sm)", marginTop: "var(--spacing-sm)" }}>
              <Button onClick={addPlatform} style={{ flex: 1 }}>
                Add Platform
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowAddPlatform(false)}
                style={{ color: "rgba(255, 255, 255, 0.7)" }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Brand Info */}
      <GlassCard>
        <div style={{ fontSize: "var(--font-xs)", color: "rgba(255, 255, 255, 0.6)", fontFamily: "var(--font-mono)", marginBottom: "4px" }}>
          MY PERSONAL BRAND
        </div>
        <div style={{ fontSize: "var(--font-2xl)", fontWeight: 800, marginBottom: "var(--spacing-xs)" }}>
          {state.user || "Your Name"}{" "}
          <span style={{ color: "rgba(255, 255, 255, 0.6)", fontWeight: 400, fontSize: "var(--font-lg)" }}>
            {state.brand.handle || "@handle"}
          </span>
        </div>
        <div style={{ fontSize: "var(--font-sm)", color: "rgba(255, 255, 255, 0.6)", marginBottom: "var(--spacing-lg)" }}>
          {state.brand.tagline || "Your tagline here"}
        </div>

        <div style={{ display: "flex", gap: "var(--spacing-sm)", flexWrap: "wrap" }}>
          <Input
            label="Your Name"
            value={state.user}
            onChange={(e) => setState((prev) => ({ ...prev, user: e.target.value }))}
            placeholder="Your name"
            style={{ flex: 1, marginBottom: 0 }}
          />
          <Input
            label="Handle"
            value={state.brand.handle}
            onChange={(e) => setState((prev) => ({ ...prev, brand: { ...prev.brand, handle: e.target.value } }))}
            placeholder="@handle"
            style={{ flex: 1, marginBottom: 0 }}
          />
        </div>
        <Input
          label="Tagline"
          value={state.brand.tagline}
          onChange={(e) => setState((prev) => ({ ...prev, brand: { ...prev.brand, tagline: e.target.value } }))}
          placeholder="Your tagline here"
        />
      </GlassCard>

      {/* Posted Today */}
      <GlassCard>
        <SectionLabel>SHORT-FORM CONTENT</SectionLabel>
        <div style={{ fontWeight: 700, fontSize: "var(--font-lg)", marginBottom: "var(--spacing-xs)" }}>
          My main thing
        </div>
        <div style={{ fontSize: "var(--font-xs)", color: "rgba(255, 255, 255, 0.6)", marginBottom: "var(--spacing-md)" }}>
          TikTok · Reels · Shorts
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-lg)" }}>
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--font-xs)", color: "rgba(255, 255, 255, 0.6)" }}>
              POSTED TODAY
            </div>
            <div style={{ fontSize: "var(--font-4xl)", fontWeight: 800 }}>{state.brand.postedToday}</div>
            <div style={{ fontSize: "var(--font-sm)", color: "rgba(255, 255, 255, 0.6)" }}>videos</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "var(--font-sm)", color: "rgba(255, 255, 255, 0.6)", marginBottom: "var(--spacing-sm)" }}>
              Get the first one out — momentum starts there.
            </div>
            <div style={{ display: "flex", gap: "var(--spacing-sm)" }}>
              <Button
                variant="ghost"
                onClick={decrementPosted}
                style={{ color: "rgba(255, 255, 255, 0.7)" }}
              >
                −
              </Button>
              <Button onClick={incrementPosted}>Posted one ↑</Button>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Reflection */}
      <GlassCard>
        <SectionLabel>TODAY'S REFLECTION</SectionLabel>
        <div style={{ fontWeight: 700, fontSize: "var(--font-lg)", marginBottom: "var(--spacing-xs)" }}>
          {new Date().toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric" })}
        </div>
        <div style={{ fontSize: "var(--font-sm)", color: "rgba(255, 255, 255, 0.6)", marginBottom: "var(--spacing-md)" }}>
          Where is the account going? What's working? What's failing? What to do next?
        </div>
        <Textarea
          value={state.brand.reflection}
          onChange={(e) => setState((prev) => ({ ...prev, brand: { ...prev.brand, reflection: e.target.value } }))}
          placeholder="Today my brand felt…"
          rows={4}
        />
        <div style={{ textAlign: "right", marginTop: "var(--spacing-sm)" }}>
          <Button
            variant="ghost"
            onClick={() => { }}
            style={{ color: "rgba(255, 255, 255, 0.7)" }}
          >
            📋 Save reflection
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}
