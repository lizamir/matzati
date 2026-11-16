// Live board: reads the sanitized items + automation log from n8n and renders them.
import { fetchBoard } from "./api.js";
import { esc, formatTime, bus } from "./dom.js";
import { itemSvgFromRecord } from "./items.js";

const STATUS_LABEL = { matched: "נמצאה התאמה", returned: "הוחזר" };
const EVENT_LABEL = { report: "דיווח נקלט", match: "התאמה", returned: "הוחזר", chat_error: "תקלה בצ׳אט", workflow_error: "תקלה בתהליך" };

/** Badge text + class for an item, by status first and kind second. */
function badgeFor(item) {
  if (STATUS_LABEL[item.status]) return { text: STATUS_LABEL[item.status], cls: `badge-${item.status}` };
  return item.kind === "found" ? { text: "נמצא", cls: "badge-found" } : { text: "אבד", cls: "badge-lost" };
}

/** Does the item pass the selected filter chip? */
function passes(item, filter) {
  if (filter === "all") return true;
  if (filter === "matched" || filter === "returned") return item.status === filter;
  return item.kind === filter && item.status === "open";
}

export function initBoard() {
  const grid = document.getElementById("board-grid");
  if (!grid) return;
  const statsEl = document.getElementById("board-stats");
  const logEl = document.getElementById("activity-list");
  const refreshBtn = document.getElementById("board-refresh");
  const filterBtns = [...document.querySelectorAll("[data-filter]")];

  let items = [];
  let filter = "all";

  const renderItems = () => {
    const visible = items.filter((i) => passes(i, filter));
    if (!visible.length) {
      grid.innerHTML = `<li class="board-empty">אין פריטים בסינון הזה.</li>`;
      return;
    }
    grid.innerHTML = visible
      .map((item) => {
        const badge = badgeFor(item);
        return `<li class="board-item" data-status="${esc(item.status)}">
          <span class="board-code">${esc(item.code)}</span>
          ${itemSvgFromRecord(item)}
          <h3 class="board-title">${esc(item.title)}</h3>
          ${item.location ? `<span class="board-loc">${esc(item.location)}</span>` : ""}
          <span class="badge ${badge.cls}">${badge.text}</span>
        </li>`;
      })
      .join("");
  };

  const renderStats = (s) => {
    statsEl.innerHTML = `
      <div class="stat"><b>${s.openFound}</b><span>נמצאו ומחכים</span></div>
      <div class="stat"><b>${s.openLost}</b><span>דיווחי אבדה פתוחים</span></div>
      <div class="stat"><b>${s.matched}</b><span>הותאמו, מחכים למסירה</span></div>
      <div class="stat"><b>${s.returned}</b><span>חזרו לבעלים</span></div>`;
  };

  const renderLog = (log) => {
    logEl.innerHTML = log.length
      ? log
          .slice(0, 8)
          .map((l) => `<li data-level="${esc(l.level)}"><time datetime="${esc(l.date)}">${formatTime(l.date)} · ${esc(EVENT_LABEL[l.event] || l.event)}</time>${esc(l.details)}</li>`)
          .join("")
      : `<li>עדיין אין פעולות ביומן.</li>`;
  };

  const load = async () => {
    refreshBtn.disabled = true;
    if (!items.length) grid.innerHTML = `<li class="board-loading">טוען את הלוח מ-n8n...</li>`;
    try {
      const data = await fetchBoard();
      items = data.items || [];
      renderStats(data.stats);
      renderItems();
      renderLog(data.log || []);
    } catch {
      grid.innerHTML = `<li class="board-empty">הלוח לא נטען כרגע. נסו לרענן בעוד רגע.</li>`;
    } finally {
      refreshBtn.disabled = false;
    }
  };

  filterBtns.forEach((btn) =>
    btn.addEventListener("click", () => {
      filter = btn.dataset.filter;
      filterBtns.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      renderItems();
    }),
  );
  refreshBtn.addEventListener("click", load);
  bus.addEventListener("data-changed", load);
  load();
}
