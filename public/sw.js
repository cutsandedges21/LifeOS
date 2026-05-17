// LifeOS service worker.
//
// Scope: minimal. We're not trying to be an offline-first PWA — the app is
// a single SPA that depends on the Gemini API anyway. The SW exists to:
//   1. Make the app installable (Chrome requires an SW for the install prompt).
//   2. Show notifications via showNotification() so they survive the page
//      being briefly backgrounded, and so notification clicks can focus an
//      existing tab via clients.matchAll().
//   3. Accept SHOW_NOTIFICATION postMessage from the page so scheduling logic
//      stays in JS (no need to coordinate timers across SW restarts).

const SW_VERSION = "lifeos-v1";

self.addEventListener("install", (event) => {
  // Take over immediately on first install so the page doesn't need a reload
  // to start receiving messages.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Page → SW: { type: "SHOW_NOTIFICATION", title, body, tag, data }
self.addEventListener("message", (event) => {
  const msg = event.data || {};
  if (msg.type === "SHOW_NOTIFICATION") {
    const { title, body, tag, data } = msg;
    self.registration.showNotification(title || "LifeOS", {
      body: body || "",
      tag: tag || "lifeos",
      icon: "/LifeOS/android-chrome-192x192.png",
      badge: "/LifeOS/favicon-32x32.png",
      data: data || {},
      // renotify only matters if tag matches; safe to leave true so the user
      // gets a fresh ping when an updated reminder of the same type fires.
      renotify: true,
    });
  }
});

// Real push payload support — only fires if a push backend is ever added.
// Until then this is dormant.
self.addEventListener("push", (event) => {
  let payload = { title: "LifeOS", body: "Time to check in." };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch (_) {
    if (event.data) payload.body = event.data.text();
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      tag: payload.tag || "lifeos-push",
      icon: "/LifeOS/android-chrome-192x192.png",
      badge: "/LifeOS/favicon-32x32.png",
      data: payload.data || {},
    })
  );
});

// Notification click → focus existing tab if one is open, otherwise open a
// new one. Without this the click is silently ignored on most platforms.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if ("focus" in client) return client.focus();
        }
        if (self.clients.openWindow) return self.clients.openWindow("/");
      })
  );
});
