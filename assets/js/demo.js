// Live demo form: sends a real report to n8n and shows the pipeline + the AI-built item card.
import { sendReport } from "./api.js";
import { esc, bus } from "./dom.js";
import { itemSvgFromRecord } from "./items.js";

const MAX_SIDE = 900; // px, images are downscaled in the browser before upload

/** Reads an image File/Blob and returns a downscaled JPEG data URL. */
async function toDataUrl(blob) {
  const bitmap = await createImageBitmap(blob);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

/** Drives the "what n8n is doing now" list while the request is in flight. */
function createPipeline(listEl, hintEl) {
  const steps = [...listEl.querySelectorAll("li")];
  let timer = null;

  const set = (i, state) => steps[i] && (steps[i].dataset.state = state);

  return {
    start() {
      steps.forEach((s) => delete s.dataset.state);
      let i = 0;
      set(0, "active");
      hintEl.textContent = "הדיווח בדרך ל-n8n...";
      // The server answers once, at the end. Until then we advance through the first four steps on a timer.
      timer = setInterval(() => {
        if (i >= 3) return;
        set(i, "done");
        i += 1;
        set(i, "active");
      }, 1300);
    },
    finish(hasMatch, aiOk) {
      clearInterval(timer);
      steps.forEach((_, i) => set(i, "done"));
      if (!hasMatch) set(4, "skip");
      hintEl.textContent = aiOk
        ? hasMatch
          ? "הסתיים. נמצאה התאמה, והצוות קיבל מייל."
          : "הסתיים. אין התאמה כרגע, אז לא נשלח מייל. הפריט מחכה בלוח."
        : "הסתיים עם גיבוי: ה-AI לא היה זמין, והדיווח נשמר כמו שנכתב.";
    },
    fail() {
      clearInterval(timer);
      steps.forEach((s) => delete s.dataset.state);
      hintEl.textContent = "הבקשה לא הגיעה ל-n8n.";
    },
  };
}

/** Builds the result card HTML from the webhook answer. */
function renderResult(data) {
  const kindLabel = data.kind === "found" ? "נמצא" : "אבד";
  const match = data.match
    ? `<div class="match-box">
        <h4>נמצאה התאמה <span class="match-score">${esc(data.match.score)}%</span></h4>
        <p><strong>${esc(data.match.title)}</strong> · <bdi dir="ltr">${esc(data.match.code)}</bdi>${data.match.location ? ` · ${esc(data.match.location)}` : ""}</p>
        <p>${esc(data.match.reason)}</p>
      </div>`
    : `<div class="nomatch-box"><p>אין התאמה כרגע. הפריט נשמר בלוח, וכשיגיע דיווח מתאים מהצד השני המערכת תזהה אותו.</p></div>`;

  return `<article class="result-card" aria-label="כרטיס הפריט שנוצר">
      <div class="result-top">
        <div class="result-art">${itemSvgFromRecord(data)}</div>
        <div>
          <span class="result-code">${esc(data.code)}</span>
          <h3 class="result-title">${esc(data.title)}</h3>
          <div class="result-meta">
            <span class="chip">${kindLabel}</span>
            <span class="chip">${esc(data.category)}</span>
            ${data.color ? `<span class="chip">${esc(data.color)}</span>` : ""}
            ${data.location ? `<span class="chip">${esc(data.location)}</span>` : ""}
          </div>
        </div>
      </div>
      <p class="result-desc">${esc(data.description)}</p>
      ${match}
    </article>`;
}

/** Wires the form, the example buttons and the photo picker. */
export function initDemo() {
  const form = document.getElementById("report-form");
  if (!form) return;

  const description = document.getElementById("f-description");
  const location = document.getElementById("f-location");
  const fileInput = document.getElementById("f-image");
  const preview = document.getElementById("photo-preview");
  const previewImg = document.getElementById("photo-img");
  const errorEl = document.getElementById("form-error");
  const submit = document.getElementById("report-submit");
  const resultEl = document.getElementById("report-result");
  const pipeline = createPipeline(document.getElementById("pipe-steps"), document.getElementById("pipe-hint"));

  let imageData = "";

  const setImage = (dataUrl) => {
    imageData = dataUrl;
    preview.hidden = !dataUrl;
    if (dataUrl) previewImg.src = dataUrl;
    else fileInput.value = "";
  };

  const showError = (msg) => {
    errorEl.textContent = msg;
    errorEl.hidden = !msg;
  };

  const setKind = (kind) => {
    form.querySelector(`input[name="kind"][value="${kind}"]`).checked = true;
  };

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    try {
      setImage(await toDataUrl(file));
      showError("");
    } catch {
      showError("לא הצלחתי לקרוא את התמונה. נסו קובץ JPG או PNG.");
    }
  });

  document.getElementById("photo-remove").addEventListener("click", () => setImage(""));

  // Ready-made examples: text ones fill the fields, the image one loads the bundled sample photo.
  form.querySelectorAll("[data-example]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const [kind, text, where] = btn.dataset.example.split("|");
      setKind(kind);
      description.value = text;
      location.value = where;
      setImage("");
      description.focus();
    }),
  );
  form.querySelectorAll("[data-example-image]").forEach((btn) =>
    btn.addEventListener("click", async () => {
      try {
        const blob = await (await fetch(btn.dataset.exampleImage)).blob();
        setKind(btn.dataset.kind || "found");
        description.value = "";
        location.value = "";
        setImage(await toDataUrl(blob));
        showError("");
      } catch {
        showError("תמונת הדוגמה לא נטענה.");
      }
    }),
  );

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const text = description.value.trim();
    if (text.length < 3 && !imageData) {
      showError("צריך תיאור קצר או תמונה של הפריט.");
      description.focus();
      return;
    }
    showError("");
    submit.disabled = true;
    submit.textContent = "האוטומציה עובדת...";
    resultEl.hidden = true;
    document.getElementById("result-empty")?.remove();
    pipeline.start();

    try {
      const kind = new FormData(form).get("kind");
      const data = await sendReport({ kind, description: text, location: location.value.trim(), image: imageData });
      if (!data.ok) throw new Error(data.error || "שגיאה");
      pipeline.finish(Boolean(data.match), data.aiOk !== false);
      resultEl.innerHTML = renderResult(data);
      resultEl.hidden = false;
      resultEl.focus({ preventScroll: true });
      resultEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
      bus.dispatchEvent(new Event("data-changed"));
    } catch (err) {
      pipeline.fail();
      showError(`הדיווח לא נשלח (${err.message}). בדקו את החיבור ונסו שוב.`);
    } finally {
      submit.disabled = false;
      submit.textContent = "שליחה לאוטומציה";
    }
  });
}
