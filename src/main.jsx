import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css"; // ✅ restore global styles

// --- DEBUG (temporary) ---
console.log("MAIN.JSX LOADED");

const showFatal = (label, err) => {
  try {
    const pre = document.createElement("pre");
    pre.style.cssText =
      "position:fixed;inset:0;z-index:999999;background:#0b0b0b;color:#ff4d4d;padding:16px;white-space:pre-wrap;overflow:auto;font:12px/1.4 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Courier New', monospace;";
    pre.textContent =
      `[FATAL] ${label}\n\n` + (err?.stack || err?.message || String(err));
    document.body.appendChild(pre);
  } catch {}
};

window.addEventListener("error", (e) =>
  showFatal("window.error", e.error || e.message)
);
window.addEventListener("unhandledrejection", (e) =>
  showFatal("unhandledrejection", e.reason)
);
// --- END DEBUG ---

try {
  const el = document.getElementById("root");
  if (!el) throw new Error("#root not found");

  console.log("ROOT FOUND");

  createRoot(el).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  console.log("APP RENDER CALLED");
} catch (e) {
  showFatal("render", e);
}
