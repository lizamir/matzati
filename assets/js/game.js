// Matzati game: the player is the matching agent. A lost report arrives, four found
// items sit on the shelf, and only one fits the description.
import { initA11y } from "./a11y.js";
import { motionOff } from "./dom.js";
import { COLORS, itemSvg } from "./items.js";

const ROUNDS = 8;
const BEST_KEY = "matzati-best";

/** Item kinds: Hebrew noun, grammatical gender ("m"/"f") used for the color adjective. */
const TYPES = {
  bottle: ["בקבוק", "m"],
  lunchbox: ["קופסת אוכל", "f"],
  cap: ["כובע", "m"],
  hoodie: ["קפוצ׳ון", "m"],
  pencilcase: ["קלמר", "m"],
  bag: ["תיק", "m"],
  umbrella: ["מטרייה", "f"],
  ball: ["כדור", "m"],
  scarf: ["צעיף", "m"],
};

/** Color key (as in items.js COLORS) -> [masculine, feminine] adjective. */
const COLOR_WORDS = {
  כחול: ["כחול", "כחולה"],
  אדום: ["אדום", "אדומה"],
  ירוק: ["ירוק", "ירוקה"],
  צהוב: ["צהוב", "צהובה"],
  כתום: ["כתום", "כתומה"],
  ורוד: ["ורוד", "ורודה"],
  סגול: ["סגול", "סגולה"],
  אפור: ["אפור", "אפורה"],
  תכלת: ["תכלת", "תכלת"],
};

/** Mark key -> phrase. The empty key is a plain item. */
const MARKS = {
  "": "בלי שום סימן",
  star: "עם כוכב",
  heart: "עם לב",
  stripes: "עם פסים",
  dots: "עם נקודות",
  dino: "עם דינוזאור",
};

const OPENERS = [
  "הבת שלי איבדה {item}. ראיתם אולי?",
  "איבדנו אתמול {item}. מישהו מצא?",
  "הבן שלי חזר הביתה בלי {item}.",
  "נשאר בבית הספר {item}. אפשר לבדוק?",
  "מחפשים {item}, נעלם אחרי ההפסקה.",
  "שכחנו בחצר {item}. אשמח לעזרה!",
];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (arr) => arr.map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(([, v]) => v);
const sameItem = (a, b) => a.type === b.type && a.color === b.color && a.mark === b.mark;

/** "בקבוק כחול עם כוכב" */
function describe(item) {
  const [noun, gender] = TYPES[item.type];
  const adj = COLOR_WORDS[item.color][gender === "f" ? 1 : 0];
  return `${noun} ${adj} ${MARKS[item.mark]}`;
}

function randomItem() {
  return { type: pick(Object.keys(TYPES)), color: pick(Object.keys(COLOR_WORDS)), mark: pick(Object.keys(MARKS)) };
}

/**
 * Builds one round. Difficulty grows with the round number:
 * easy = unrelated items, medium = same kind, hard = same kind and one more shared trait.
 */
function buildRound(n) {
  const target = randomItem();
  const options = [target];
  const level = n < 2 ? 0 : n < 5 ? 1 : 2;
  let guard = 0;
  while (options.length < 4 && guard++ < 300) {
    const d = randomItem();
    if (level >= 1) d.type = target.type;
    if (level === 2) {
      // Share either the color or the mark with the target, so a quick glance is not enough.
      if (Math.random() < 0.5) d.color = target.color;
      else d.mark = target.mark;
    }
    if (!options.some((o) => sameItem(o, d))) options.push(d);
  }
  return { target, options: shuffle(options), seconds: Math.max(5, 12 - n * 0.9) };
}

function init() {
  initA11y();
  document.querySelectorAll("[data-item]").forEach((el) => (el.innerHTML = itemSvg(el.dataset.item, el.dataset.color, el.dataset.mark || "")));

  const $ = (id) => document.getElementById(id);
  const screens = { start: $("screen-start"), play: $("screen-play"), end: $("screen-end") };
  const hud = $("hud");
  const shelf = $("shelf");
  const feedback = $("feedback");
  const timerEl = $("timer");
  const timerFill = $("timer-fill");

  let state = null;
  let raf = 0;

  const show = (name) => Object.entries(screens).forEach(([k, el]) => (el.hidden = k !== name));

  const best = () => Number(localStorage.getItem(BEST_KEY) || 0);
  const showBest = () => {
    const line = $("best-line");
    line.hidden = !best();
    line.textContent = `השיא שלכם במכשיר הזה: ${best()}`;
  };

  const updateHud = () => {
    $("hud-round").textContent = Math.min(state.round + 1, ROUNDS);
    $("hud-score").textContent = state.score;
    $("hud-streak").hidden = state.streak < 2;
    $("hud-streak-n").textContent = state.streak;
  };

  /** Runs the countdown bar; calls onEnd when time is up. */
  const startTimer = (seconds, onEnd) => {
    cancelAnimationFrame(raf);
    if (state.relaxed) {
      timerEl.hidden = true;
      return;
    }
    timerEl.hidden = false;
    const started = performance.now();
    const tick = (now) => {
      const left = Math.max(0, 1 - (now - started) / (seconds * 1000));
      state.timeLeft = left;
      timerFill.style.transform = `scaleX(${left})`;
      timerFill.toggleAttribute("data-low", left < 0.3);
      timerEl.setAttribute("aria-valuenow", String(Math.round(left * 100)));
      if (left <= 0) onEnd();
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  };

  const nextRound = () => {
    if (state.round >= ROUNDS) return finish();
    const round = buildRound(state.round);
    state.current = round;
    state.locked = false;
    state.timeLeft = 1;
    updateHud();
    feedback.textContent = "";
    feedback.removeAttribute("data-kind");
    $("report-text").textContent = pick(OPENERS).replace("{item}", describe(round.target));

    shelf.innerHTML = "";
    round.options.forEach((item, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pick";
      btn.setAttribute("aria-label", `פריט ${i + 1}: ${describe(item)}`);
      btn.innerHTML = `<span class="pick-key" aria-hidden="true">${i + 1}</span>${itemSvg(item.type, COLORS[item.color], item.mark)}`;
      btn.addEventListener("click", () => answer(i));
      shelf.append(btn);
    });
    startTimer(round.seconds, () => answer(-1));
  };

  /** index = chosen option, or -1 when the timer ran out. */
  const answer = (index) => {
    if (state.locked) return;
    state.locked = true;
    cancelAnimationFrame(raf);
    const { options, target } = state.current;
    const buttons = [...shelf.children];
    const rightIndex = options.findIndex((o) => sameItem(o, target));
    const correct = index === rightIndex;

    buttons.forEach((b, i) => {
      b.disabled = true;
      b.dataset.result = i === rightIndex ? "right" : i === index ? "wrong" : "dim";
    });

    if (correct) {
      const bonus = state.relaxed ? 0 : Math.round(state.timeLeft * 50);
      state.streak += 1;
      state.correct += 1;
      state.score += 100 + bonus + (state.streak >= 3 ? 25 : 0);
      feedback.dataset.kind = "right";
      feedback.textContent = pick(["התאמה! הפריט חוזר הביתה.", "בול. עוד ילד מרוצה.", "מצאתם! המייל לצוות בדרך.", "נכון, וגם מהר."]);
    } else {
      state.streak = 0;
      feedback.dataset.kind = "wrong";
      feedback.textContent = index === -1 ? `נגמר הזמן. זה היה: ${describe(target)}.` : `כמעט. חיפשנו: ${describe(target)}.`;
    }
    state.round += 1;
    updateHud();
    setTimeout(nextRound, motionOff() ? 1600 : correct ? 1100 : 1900);
  };

  const finish = () => {
    cancelAnimationFrame(raf);
    hud.hidden = true;
    const c = state.correct;
    const title = c === ROUNDS ? "אלופי ההתאמות!" : c >= 6 ? "סוכני איתור מצטיינים" : c >= 3 ? "מתמחים בפינת האבדות" : "המדף ניצח הפעם";
    const text =
      c === ROUNDS
        ? "שמונה מתוך שמונה. אפילו כשהפריטים היו כמעט זהים."
        : c >= 6
          ? "עבודה יפה. הסיבובים האחרונים, עם פריטים כמעט זהים, הם בדיוק המקום שבו בני אדם מתבלבלים."
          : "זה קשה יותר ממה שזה נראה, נכון? כשכל הבקבוקים כחולים, קל לפספס את הכוכב.";
    $("end-title").textContent = title;
    $("end-score").textContent = state.score;
    $("end-correct").textContent = c;
    $("end-total").textContent = ROUNDS;
    $("end-text").textContent = text;
    if (!state.relaxed && state.score > best()) localStorage.setItem(BEST_KEY, String(state.score));
    show("end");
    $("end-title").focus();
  };

  const start = () => {
    state = { round: 0, score: 0, streak: 0, correct: 0, locked: false, timeLeft: 1, relaxed: $("relax-mode").checked, current: null };
    $("hud-total").textContent = ROUNDS;
    hud.hidden = false;
    show("play");
    nextRound();
  };

  $("start-btn").addEventListener("click", start);
  $("again-btn").addEventListener("click", () => {
    showBest();
    start();
  });
  document.addEventListener("keydown", (e) => {
    if (screens.play.hidden || e.metaKey || e.ctrlKey || e.altKey) return;
    const n = Number(e.key);
    if (n >= 1 && n <= 4) answer(n - 1);
  });

  showBest();
}

init();
