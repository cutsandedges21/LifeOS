// Notifications + PWA install plumbing.
//
// Honest about what this can do:
// - When the app (or installed PWA) is open, we can fire local notifications
//   via the SW at any time.
// - When the tab is closed and the device is offline from our server (we
//   don't have one), the only way to deliver notifications is the Web Push
//   protocol, which needs a backend + VAPID keys. We don't have that, so
//   reminders are best-effort: they fire reliably while the app is open or
//   recently backgrounded, which covers the "leave the PWA installed and
//   open it in the morning" use case the user actually has.

let deferredInstallPrompt = null;

export function registerServiceWorker() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  // Defer registration until window load — avoids competing with the React
  // bundle for main-thread time on cold start.
  const register = () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch((err) => console.warn("[LifeOS] SW registration failed:", err));
  };

  if (document.readyState === "complete") {
    register();
  } else {
    window.addEventListener("load", register, { once: true });
  }

  // Capture the install prompt so Settings can fire it later. Browsers only
  // expose this once per session per page load.
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    // Let any listening UI know the install option is now available.
    window.dispatchEvent(new CustomEvent("lifeos:install-available"));
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    window.dispatchEvent(new CustomEvent("lifeos:installed"));
  });
}

export function canInstall() {
  return deferredInstallPrompt !== null;
}

// Returns "accepted", "dismissed", or "unavailable".
export async function promptInstall() {
  if (!deferredInstallPrompt) return "unavailable";
  try {
    deferredInstallPrompt.prompt();
    const choice = await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    return choice?.outcome || "dismissed";
  } catch (e) {
    console.warn("[LifeOS] install prompt failed:", e);
    return "dismissed";
  }
}

export function isStandalone() {
  if (typeof window === "undefined") return false;
  // matchMedia covers Chrome/Edge/Firefox PWAs; navigator.standalone is the
  // iOS Safari home-screen flag.
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

export function notificationStatus() {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission; // "default" | "granted" | "denied"
}

export async function requestNotificationPermission() {
  if (notificationStatus() === "unsupported") return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch (_) {
    // Older Safari uses callback form; fall through with whatever sticks.
    return Notification.permission;
  }
}

// Show a notification — prefer SW so it survives short backgrounding and so
// the click is handled centrally. Falls back to direct Notification() if no
// SW is registered yet.
export async function showNotification(title, body, opts = {}) {
  if (notificationStatus() !== "granted") return false;
  try {
    const reg = await navigator.serviceWorker?.ready;
    if (reg && reg.active) {
      reg.active.postMessage({
        type: "SHOW_NOTIFICATION",
        title,
        body,
        tag: opts.tag,
        data: opts.data,
      });
      return true;
    }
  } catch (_) {
    /* fall through to direct API */
  }
  try {
    new Notification(title, { body, tag: opts.tag });
    return true;
  } catch (_) {
    return false;
  }
}

// ── Daily reminder scheduling ────────────────────────────────────────────
//
// Single canonical chain: compute ms-until-next-9am, setTimeout, fire,
// re-arm for tomorrow. Cancel before re-arming so toggling the setting on
// and off doesn't leak duplicate timers.

let dailyTimerId = null;

function msUntilNext(hour, minute = 0) {
  const now = new Date();
  const target = new Date(now);
  target.setHours(hour, minute, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  return target - now;
}

export function scheduleDailyReminder({ hour = 9, minute = 0, onFire } = {}) {
  cancelDailyReminder();

  const arm = () => {
    const delay = msUntilNext(hour, minute);
    dailyTimerId = setTimeout(async () => {
      try {
        onFire?.();
      } catch (e) {
        console.warn("[LifeOS] daily reminder onFire threw:", e);
      }
      arm(); // re-arm for tomorrow
    }, delay);
  };
  arm();
}

export function cancelDailyReminder() {
  if (dailyTimerId != null) {
    clearTimeout(dailyTimerId);
    dailyTimerId = null;
  }
}

// ── Sub renewal helpers ──────────────────────────────────────────────────

// Returns subs whose `renews` date falls within the next `days` days (inclusive
// of today). Subs without a parseable date are ignored. Sorted by closest
// renewal first.
export function upcomingRenewals(subs, days = 7) {
  if (!Array.isArray(subs)) return [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() + days);

  return subs
    .map((s) => {
      if (!s?.renews) return null;
      const d = new Date(s.renews + "T00:00:00");
      if (isNaN(d.getTime())) return null;
      const daysUntil = Math.round((d - now) / 86400000);
      return { ...s, _renewDate: d, daysUntil };
    })
    .filter((s) => s && s.daysUntil >= 0 && s._renewDate <= cutoff)
    .sort((a, b) => a.daysUntil - b.daysUntil);
}
