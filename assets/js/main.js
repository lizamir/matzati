// Page entry: illustrations, scroll reveal, and the feature modules.
import { initA11y } from "./a11y.js";
import { initBoard } from "./board.js";
import { initChat } from "./chat.js";
import { initDemo } from "./demo.js";
import { itemSvg } from "./items.js";

/** Fills every [data-item] placeholder with its item illustration. */
function paintItems() {
  document.querySelectorAll("[data-item]").forEach((el) => {
    el.innerHTML = itemSvg(el.dataset.item, el.dataset.color, el.dataset.mark || "");
  });
}

/** Reveals [data-reveal] elements when they enter the viewport (attribute based, no class churn). */
function initReveal() {
  const targets = document.querySelectorAll("[data-reveal]");
  if (!("IntersectionObserver" in window)) {
    targets.forEach((el) => el.setAttribute("data-visible", ""));
    return;
  }
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.setAttribute("data-visible", "");
        io.unobserve(entry.target);
      }),
    { rootMargin: "0px 0px -8% 0px" },
  );
  targets.forEach((el) => io.observe(el));
}

paintItems();
initReveal();
initA11y();
initDemo();
initBoard();
initChat();
