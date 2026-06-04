// Tiny Web Audio click synth — no audio files, just a short synthesized tick.
//
// One shared AudioContext is created lazily on the first call (which only ever
// happens inside a user gesture via the global pointerdown listener, so the
// browser's autoplay policy lets it through). Each click builds a throwaway
// oscillator + gain with a fast attack and exponential decay so the whole
// sound lands in ~90ms — a crisp "tick", not a beep.

let ctx = null;

function getCtx() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
    } catch {
      return null;
    }
  }
  // Browsers start the context "suspended" until a gesture resumes it. Safe to
  // call every time; it no-ops once running.
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

// Whether Web Audio is usable in this environment (used to gate UI affordances
// if ever needed — currently informational).
export function isSoundSupported() {
  return (
    typeof window !== "undefined" &&
    !!(window.AudioContext || window.webkitAudioContext)
  );
}

// Play one satisfying click. `volume` is the envelope peak (0–1); kept low by
// default so it's a gentle accent, never startling.
export function playClick({ volume = 0.07 } = {}) {
  const ac = getCtx();
  if (!ac) return;

  const now = ac.currentTime;

  // Master envelope: near-instant attack, ~90ms exponential tail.
  const env = ac.createGain();
  env.gain.setValueAtTime(0.0001, now);
  env.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), now + 0.006);
  env.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
  env.connect(ac.destination);

  // Body: a triangle tone that glides down in pitch — gives the soft "tok".
  const osc = ac.createOscillator();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(660, now);
  osc.frequency.exponentialRampToValueAtTime(180, now + 0.07);
  osc.connect(env);

  osc.start(now);
  osc.stop(now + 0.1);
}
