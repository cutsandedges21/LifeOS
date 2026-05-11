import { useState, useEffect, useRef } from "react";
import { 
  Home, Image as ImageIcon, Settings,
  CheckCircle2, Circle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ─── Utility ────────────────────────────────────────────────────────── */
const cn = (...classes) => classes.filter(Boolean).join(" ");

const GREETINGS = [
  "Let's lock in,",
  "Welcome back,",
  "Ready for greatness,",
  "Pushing forward,",
  "Time to dominate,",
  "Stay focused,",
  "Consistency is key,",
];

/* ─── Styles ─────────────────────────────────────────────────────────── */
const injectStyles = () => {
    const el = document.createElement("style");
    el.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body, #root { height: 100%; background: #000; color: #fff; }

    ::-webkit-scrollbar { width: 3px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #222; border-radius: 2px; }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .fade-up { animation: fadeUp .4s ease both; }

    .nav-tab { cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 6px 12px; background: none; border: none; color: #555; font-family: 'DM Sans', sans-serif; font-size: 10px; transition: color .2s; }
    .nav-tab.active { color: #fff; }
    
    .card { background: #0d0d0d; border-radius: 14px; padding: 18px; margin-bottom: 12px; border: 1px solid #1a1a1a; }
    .section-label { font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: .15em; color: #444; display: flex; align-items: center; gap: 8px; margin-bottom: 14px; }
    .section-label::before { content: ''; display: block; width: 20px; height: 1px; background: #333; }

    input:focus, textarea:focus { outline: none; }
  `;
    document.head.appendChild(el);
};
injectStyles();

/* ─── Helpers ────────────────────────────────────────────────────────── */
const dayStr = () =>
    new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }).toUpperCase();
const timeStr = () =>
    new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true });

const wakeHrs = (settings = { wakeTime: "08:00", sleepTime: "00:00" }) => {
    const now = new Date();
    const [wakeH, wakeM] = settings.wakeTime.split(":").map(Number);
    let [sleepH, sleepM] = settings.sleepTime.split(":").map(Number);
    
    const wake = new Date();
    wake.setHours(wakeH, wakeM, 0, 0);
    
    const sleep = new Date();
    if (sleepH === 0 && sleepM === 0) sleepH = 24;
    sleep.setHours(sleepH, sleepM, 0, 0);
    
    if (sleep <= wake) sleep.setDate(sleep.getDate() + 1);

    const total = (sleep - wake) / 36e5;
    const elapsed = Math.max(0, (now - wake) / 36e5);
    const pct = Math.min(100, Math.round((elapsed / total) * 100));
    const left = Math.max(0, total - elapsed);
    const h = Math.floor(left), m = Math.round((left - h) * 60);
    return { pct, leftStr: `${h}h ${m}m awake time left` };
};

const partOfDay = (pct) => {
    if (pct < 25) return { label: "Morning", emoji: "🌅", cta: "Lock in early." };
    if (pct < 50) return { label: "Midday", emoji: "⚡", cta: "Keep moving." };
    if (pct < 75) return { label: "Afternoon", emoji: "🔥", cta: "Push it." };
    return { label: "Evening", emoji: "🌙", cta: "Finish strong." };
};

/* ─── Seed Data ──────────────────────────────────────────────────────── */
const INITIAL_STATE = {
    user: "Moss",
    workoutDay: "LEGS DAY",
    goals: [
        { id: 1, text: "Close 2 new lawn care clients", done: false },
        { id: 2, text: "Send 3 website proposals", done: false },
    ],
    brand: { handle: "@mossbuilds", tagline: "Building businesses, locking in daily.", reflection: "" },
    overseerLog: [],
    overseerInput: "",
    settings: { wakeTime: "08:00", sleepTime: "00:00" }
};

/* ─── Main App ───────────────────────────────────────────────────────── */
export default function LifeOS() {
    const [state, setState] = useState(INITIAL_STATE);
    const [tab, setTab] = useState("main");
    const [greeting, setGreeting] = useState(GREETINGS[0]);
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const t = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    useEffect(() => {
        if (tab === "main") setGreeting(GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);
    }, [tab]);

    const { pct, leftStr } = wakeHrs(state.settings);
    const pod = partOfDay(pct);

    const sendOverseer = async () => {
        if (!state.overseerInput.trim()) return;
        const msg = state.overseerInput;
        const newLog = [...state.overseerLog, { role: "user", text: msg }];
        setState(p => ({ ...p, overseerLog: newLog, overseerInput: "" }));
        
        const apiKey = "AIzaSyCHvyjkg7scj4AaCE5bupm-d4y73-Sc7lc";
        
        let ctxStr = "";
        try {
            ctxStr = JSON.stringify({ user: state.user, goals: state.goals, streak: state.streak, pod });
        } catch (e) {
            ctxStr = "{ error: 'context error' }";
        }

        try {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: newLog.map(m => ({
                        role: m.role === "ai" ? "model" : "user",
                        parts: [{ text: String(m.text || "") }]
                    })),
                    system_instruction: { parts: [{ text: sys }] },
                    generationConfig: { maxOutputTokens: 200, temperature: 0.7 }
                }),
            });
            const d = await res.json();
            const reply = d.candidates?.[0]?.content?.parts?.[0]?.text ?? "…";
            setState(p => ({ ...p, overseerLog: [...p.overseerLog, { role: "ai", text: reply }] }));
        } catch (error) {
            console.error("Overseer API error:", error);
            setState(p => ({ ...p, overseerLog: [...p.overseerLog, { role: "ai", text: "Sorry, I'm having trouble connecting." }] }));
        }
    };

    return (
        <div style={{ minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", paddingBottom: 80, background: "#000", color: "#fff" }}>
            {/* Top Bar */}
            <div style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 8, fontFamily: "'DM Mono', monospace", fontSize: 11 }}>
                    <span style={{ color: "#555" }}>{dayStr()}</span>
                    <span style={{ color: "#f59e0b", fontWeight: 600 }}>{state.workoutDay}</span>
                </div>
                <span style={{ fontSize: 12, color: "#888", fontFamily: "'DM Mono'" }}>{timeStr()}</span>
            </div>

            <div style={{ padding: "0 18px" }}>
                {tab === "main" && (
                    <div className="fade-up">
                        <Card style={{ display: "flex", alignItems: "center", gap: 20 }}>
                            <DayRing pct={pct} />
                            <div>
                                <div style={{ fontSize: 20, fontWeight: 800 }}>{greeting} {state.user}</div>
                                <div style={{ fontSize: 14, color: "#888" }}>{pod.emoji} {pod.label} — {pod.cta}</div>
                                <div style={{ fontSize: 11, color: "#444", marginTop: 4 }}>{leftStr}</div>
                                <div style={{ fontSize: 10, color: "#333" }}>{state.settings.wakeTime} - {state.settings.sleepTime}</div>
                            </div>
                        </Card>
                        
                        <Card>
                            <div className="section-label">OVERSEER</div>
                            <div style={{ maxHeight: 200, overflowY: "auto", marginBottom: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                                {state.overseerLog.map((m, i) => (
                                    <div key={i} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", background: m.role === "user" ? "#1a1a1a" : "#0a0a0a", padding: "8px 12px", borderRadius: 12, fontSize: 13, border: "1px solid #222" }}>{m.text}</div>
                                ))}
                            </div>
                            <div style={{ display: "flex", gap: 8, background: "#111", padding: 8, borderRadius: 12 }}>
                                <input 
                                    value={state.overseerInput} 
                                    onChange={e => setState(p => ({ ...p, overseerInput: e.target.value }))}
                                    onKeyDown={e => e.key === "Enter" && sendOverseer()}
                                    placeholder="Message Overseer..." 
                                    style={{ flex: 1, background: "none", border: "none", color: "#fff", padding: "4px 8px" }}
                                />
                                <button onClick={sendOverseer} style={{ background: "#fff", color: "#000", border: "none", borderRadius: "50%", width: 28, height: 28, fontWeight: "bold" }}>↑</button>
                            </div>
                        </Card>

                        <Card>
                            <div className="section-label">GOALS</div>
                            {state.goals.map(g => (
                                <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid #111" }}>
                                    <button onClick={() => setState(p => ({ ...p, goals: p.goals.map(x => x.id === g.id ? { ...x, done: !x.done } : x) }))} style={{ color: g.done ? "#2ddb81" : "#444", background: "none", border: "none" }}>
                                        {g.done ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                                    </button>
                                    <span style={{ flex: 1, fontSize: 14, textDecoration: g.done ? "line-through" : "none", color: g.done ? "#444" : "#ccc" }}>{g.text}</span>
                                </div>
                            ))}
                        </Card>
                    </div>
                )}

                {tab === "brand" && (
                    <div className="fade-up">
                        <Card>
                            <div className="section-label">BRAND</div>
                            <div style={{ fontSize: 24, fontWeight: 800 }}>{state.brand.handle}</div>
                            <div style={{ fontSize: 13, color: "#555" }}>{state.brand.tagline}</div>
                        </Card>
                        <Card>
                            <div className="section-label">TODAY'S REFLECTION</div>
                            <textarea 
                                value={state.brand.reflection} 
                                onChange={e => setState(p => ({ ...p, brand: { ...p.brand, reflection: e.target.value } }))}
                                placeholder="Today my brand felt..." 
                                style={{ width: "100%", height: 100, background: "#111", border: "1px solid #222", padding: 12, borderRadius: 8, color: "#fff", resize: "none" }}
                            />
                            <div style={{ textAlign: "right", marginTop: 8 }}>
                                <button onClick={() => alert("Reflection saved!")} style={{ background: "#222", color: "#fff", border: "1px solid #333", padding: "6px 12px", borderRadius: 6, fontSize: 12 }}>Save reflection</button>
                            </div>
                        </Card>
                    </div>
                )}

                {tab === "settings" && (
                    <div className="fade-up">
                        <Card>
                            <div className="section-label">PROFILE</div>
                            <input value={state.user} onChange={e => setState(p => ({ ...p, user: e.target.value }))} style={{ width: "100%", background: "#111", border: "1px solid #222", padding: 12, borderRadius: 8, color: "#fff" }} placeholder="Your name" />
                        </Card>
                        <Card>
                            <div className="section-label">SCHEDULE</div>
                            <div style={{ display: "flex", gap: 10 }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 10, color: "#444", marginBottom: 4 }}>WAKE TIME</div>
                                    <input type="time" value={state.settings.wakeTime} onChange={e => setState(p => ({ ...p, settings: { ...p.settings, wakeTime: e.target.value } }))} style={{ width: "100%", background: "#111", border: "1px solid #222", padding: 12, borderRadius: 8, color: "#fff" }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 10, color: "#444", marginBottom: 4 }}>SLEEP TIME</div>
                                    <input type="time" value={state.settings.sleepTime} onChange={e => setState(p => ({ ...p, settings: { ...p.settings, sleepTime: e.target.value } }))} style={{ width: "100%", background: "#111", border: "1px solid #222", padding: 12, borderRadius: 8, color: "#fff" }} />
                                </div>
                            </div>
                        </Card>
                    </div>
                )}
            </div>

            {/* Nav */}
            <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#050505", borderTop: "1px solid #111", display: "flex", justifyContent: "space-around", padding: "10px 0" }}>
                <button className={cn("nav-tab", tab === "main" && "active")} onClick={() => setTab("main")}><Home size={20} /><span>Main</span></button>
                <button className={cn("nav-tab", tab === "brand" && "active")} onClick={() => setTab("brand")}><ImageIcon size={20} /><span>Brand</span></button>
                <button className={cn("nav-tab", tab === "settings" && "active")} onClick={() => setTab("settings")}><Settings size={20} /><span>Settings</span></button>
            </div>
        </div>
    );
}

function Card({ children, style }) {
    return <div className="card" style={style}>{children}</div>;
}

function DayRing({ pct }) {
    const r = 46, circ = 2 * Math.PI * r;
    const offset = circ * (1 - pct / 100);
    return (
        <svg width="110" height="110" style={{ flexShrink: 0 }}>
            <circle cx="55" cy="55" r={r} fill="none" stroke="#1a1a1a" strokeWidth="8" />
            <circle cx="55" cy="55" r={r} fill="none" stroke="#f97316" strokeWidth="8"
                strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
                transform="rotate(-90 55 55)" style={{ transition: "stroke-dashoffset 1s ease" }} />
            <text x="55" y="55" textAnchor="middle" fill="#fff" fontSize="22" fontWeight="800" dy=".3em">{pct}%</text>
        </svg>
    );
}