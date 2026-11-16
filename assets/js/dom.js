// Tiny DOM helpers shared by the page modules.

/** Escapes text before it is placed inside innerHTML. */
export function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
}

/** Short Hebrew date + time for log lines and cards. */
export function formatTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("he-IL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

/** True when the visitor or the accessibility menu asked to stop motion. */
export function motionOff() {
  return document.documentElement.dataset.a11yMotion === "1" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** A page-wide event bus so modules stay decoupled (demo -> board refresh, staff -> chat). */
export const bus = new EventTarget();
