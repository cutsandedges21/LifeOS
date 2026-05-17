import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles/responsive.css";
import { registerServiceWorker } from "./utils/notifications.js";

// PWA: register the service worker so the app is installable and notifications
// can be shown via the SW (which survives short backgrounding).
registerServiceWorker();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
