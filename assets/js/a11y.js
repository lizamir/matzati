// Accessibility menu: text size, contrast, link emphasis, stop motion. Choices persist in localStorage.

const KEY = "matzati-a11y";
const root = document.documentElement;

/** Reads the saved choices ({text, contrast, links, motion}). */
function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

/** Applies choices to <html> data attributes and saves them. */
function apply(state) {
  ["text", "contrast", "links", "motion"].forEach((k) => {
    if (state[k]) root.setAttribute(`data-a11y-${k}`, state[k]);
    else root.removeAttribute(`data-a11y-${k}`);
  });
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* private mode: choices just won't persist */
  }
}

export function initA11y() {
  const wrap = document.getElementById("a11y");
  if (!wrap) return;
  const toggle = wrap.querySelector(".a11y-toggle");
  const panel = wrap.querySelector(".a11y-panel");
  const buttons = [...panel.querySelectorAll("[data-a11y]")];
  let state = read();

  const sync = () => buttons.forEach((b) => b.setAttribute("aria-pressed", String(Boolean(state[b.dataset.a11y]))));

  const setOpen = (open) => {
    panel.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
  };

  toggle.addEventListener("click", () => setOpen(panel.hidden));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !panel.hidden) {
      setOpen(false);
      toggle.focus();
    }
  });
  document.addEventListener("click", (e) => {
    if (!wrap.contains(e.target)) setOpen(false);
  });

  buttons.forEach((btn) =>
    btn.addEventListener("click", () => {
      const k = btn.dataset.a11y;
      // Text size cycles off -> 1 -> 2; the others are simple toggles.
      if (k === "text") state.text = state.text === "1" ? "2" : state.text === "2" ? "" : "1";
      else state[k] = state[k] ? "" : "1";
      apply(state);
      sync();
    }),
  );
  panel.querySelector("[data-a11y-reset]").addEventListener("click", () => {
    state = {};
    apply(state);
    sync();
  });

  sync();
}
