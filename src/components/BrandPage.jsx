import { useState, useEffect } from "react";
import { Card, SectionLabel, Input, Button, Textarea, Chip } from "./UI.jsx";

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

  return (
    <div style={{ padding: "var(--spacing-lg)" }}>
      {/* Brand Info */}
      <Card>
        <div style={{ fontSize: "var(--font-xs)", color: "var(--color-text-muted)", fontFamily: "var(--font-mono)", marginBottom: "var(--spacing-xs)" }}>
          MY PERSONAL BRAND
        </div>
        <div style={{ fontSize: "var(--font-2xl)", fontWeight: 800, marginBottom: "var(--spacing-xs)" }}>
          {state.user || "Your Name"}{" "}
          <span style={{ color: "var(--color-text-muted)", fontWeight: 400, fontSize: "var(--font-lg)" }}>
            {state.brand.handle || "@handle"}
          </span>
        </div>
        <div style={{ fontSize: "var(--font-sm)", color: "var(--color-text-muted)", marginBottom: "var(--spacing-lg)" }}>
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
      </Card>

      {/* Platforms */}
      <Card>
        <SectionLabel>SOCIAL PLATFORMS</SectionLabel>
        {state.brand.platforms.map((p) => (
          <div
            key={p.id}
            style={{
              background: "var(--color-input)",
              borderRadius: "var(--radius-md)",
              padding: "var(--spacing-md)",
              marginBottom: "var(--spacing-md)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--spacing-sm)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-sm)" }}>
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "var(--radius-sm)",
                    background: `${p.color}22`,
                    border: `1px solid ${p.color}44`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "var(--font-sm)",
                    color: p.color,
                    fontWeight: 700,
                  }}
                >
                  {p.icon || p.name[0]}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "var(--font-sm)" }}>{p.name}</div>
                  <div style={{ fontSize: "var(--font-xs)", color: "var(--color-text-muted)" }}>{state.brand.handle}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-sm)" }}>
                <span
                  style={{
                    fontSize: "var(--font-xs)",
                    color: "var(--color-success)",
                    background: "var(--color-success)22",
                    borderRadius: "4px",
                    padding: "2px 8px",
                  }}
                >
                  ● LIVE
                </span>
                <Button variant="ghost" size="sm" onClick={() => removePlatform(p.id)}>
                  ✕
                </Button>
              </div>
            </div>
            <div style={{ fontSize: "var(--font-4xl)", fontWeight: 800, marginBottom: "var(--spacing-xs)" }}>
              {p.followers.toLocaleString()}
            </div>
            <div style={{ marginTop: "var(--spacing-sm)", fontSize: "var(--font-sm)", color: "var(--color-text-muted)" }}>
              {p.delta || "+0"} · followers
            </div>
          </div>
        ))}
        {!showAddPlatform ? (
          <Button variant="secondary" onClick={() => setShowAddPlatform(true)} style={{ width: "100%" }}>
            + Add Platform
          </Button>
        ) : (
          <div style={{ marginTop: "var(--spacing-md)", padding: "var(--spacing-md)", background: "var(--color-input)", borderRadius: "var(--radius-sm)" }}>
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
                label="Delta (e.g., +42)"
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
              <Button variant="ghost" onClick={() => setShowAddPlatform(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Reflection */}
      <Card>
        <SectionLabel>TODAY'S REFLECTION</SectionLabel>
        <div style={{ fontWeight: 700, fontSize: "var(--font-lg)", marginBottom: "var(--spacing-xs)" }}>
          {new Date().toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric" })}
        </div>
        <div style={{ fontSize: "var(--font-sm)", color: "var(--color-text-muted)", marginBottom: "var(--spacing-md)" }}>
          Where is the account going? What's working? What's failing? What to do next?
        </div>
        <Textarea
          value={state.brand.reflection}
          onChange={(e) => setState((prev) => ({ ...prev, brand: { ...prev.brand, reflection: e.target.value } }))}
          placeholder="Today my brand felt…"
          rows={4}
        />
        <div style={{ textAlign: "right", marginTop: "var(--spacing-sm)" }}>
          <Button variant="secondary" onClick={() => {}}>
            📋 Save reflection
          </Button>
        </div>
      </Card>

      {/* Posted Today */}
      <Card>
        <SectionLabel>SHORT-FORM CONTENT</SectionLabel>
        <div style={{ fontWeight: 700, fontSize: "var(--font-lg)", marginBottom: "var(--spacing-xs)" }}>
          My main thing
        </div>
        <div style={{ fontSize: "var(--font-xs)", color: "var(--color-text-muted)", marginBottom: "var(--spacing-md)" }}>
          TikTok · Reels · Shorts
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-lg)" }}>
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--font-xs)", color: "var(--color-text-muted)" }}>
              POSTED TODAY
            </div>
            <div style={{ fontSize: "var(--font-4xl)", fontWeight: 800 }}>{state.brand.postedToday}</div>
            <div style={{ fontSize: "var(--font-sm)", color: "var(--color-text-muted)" }}>videos</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "var(--font-sm)", color: "var(--color-text-muted)", marginBottom: "var(--spacing-sm)" }}>
              Get the first one out — momentum starts there.
            </div>
            <div style={{ display: "flex", gap: "var(--spacing-sm)" }}>
              <Button variant="secondary" onClick={decrementPosted}>
                −
              </Button>
              <Button onClick={incrementPosted}>Posted one ↑</Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
