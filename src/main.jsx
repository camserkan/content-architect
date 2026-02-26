import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

// --- DEBUG BOOTSTRAP (temporary) ---
const showFatal = (label, err) => {
  try {
    const pre = document.createElement("pre");
    pre.style.cssText =
      "position:fixed;inset:0;z-index:999999;background:#0b0b0b;color:#ff4d4d;padding:16px;white-space:pre-wrap;overflow:auto;font:12px/1.4 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;";
    pre.textContent =
      `[FATAL] ${label}\n\n` +
      (err?.stack || err?.message || String(err));
    document.body.appendChild(pre);
  } catch {}
};

window.addEventListener("error", (e) =>
  showFatal("window.error", e.error || e.message)
);
window.addEventListener("unhandledrejection", (e) =>
  showFatal("unhandledrejection", e.reason)
);

try {
  const root = document.getElementById("root");
  if (root) {
    root.innerHTML =
      "<div style='padding:12px;color:#9ae6b4;font-family:ui-monospace'>Booting…</div>";
  }
} catch (e) {
  showFatal("bootstrap", e);
}
// --- END DEBUG BOOTSTRAP ---

try {
  const el = document.getElementById("root");
  if (!el) throw new Error("#root not found");

  // Visible badge: confirms JS runs and body isn't hidden by CSS
  document.body.insertAdjacentHTML(
    "afterbegin",
    "<div style='position:fixed;top:10px;left:10px;z-index:1000000;background:yellow;color:black;padding:8px;font:14px monospace'>DEBUG: JS RUNNING</div>"
  );

  createRoot(el).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (e) {
  showFatal("render", e);
}
