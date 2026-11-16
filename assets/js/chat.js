// Chat with Motzi (the orchestrator agent) + staff mode.
import { sendChat, staffAction } from "./api.js";
import { bus } from "./dom.js";

/** Sub-agent tool name -> label and chip color shown under each answer. */
const AGENTS = {
  reports_agent: ["סוכן הדיווחים", "var(--peach)"],
  search_agent: ["סוכן האיתור", "var(--mint)"],
  knowledge_agent: ["סוכן הידע", "var(--lilac)"],
  staff_agent: ["סוכן הצוות", "var(--sun)"],
};

/** A fresh session id per page load keeps each demo conversation separate in the agent's memory. */
function newSessionId() {
  return `web-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function initChat() {
  const log = document.getElementById("chat-log");
  if (!log) return;
  const form = document.getElementById("chat-form");
  const input = document.getElementById("chat-input");
  const sendBtn = document.getElementById("chat-send");
  const roleEl = document.getElementById("chat-role");
  const staffForm = document.getElementById("staff-form");
  const staffInput = document.getElementById("staff-code");
  const staffStatus = document.getElementById("staff-status");
  const resetBtn = document.getElementById("staff-reset");

  const sessionId = newSessionId();
  let staffCode = "";
  let busy = false;

  /** Appends a message bubble. Text goes in via textContent, never innerHTML. */
  const addMessage = (text, who, agents = []) => {
    const el = document.createElement("div");
    el.className = `msg msg-${who}`;
    el.textContent = text;
    if (agents.length) {
      const row = document.createElement("div");
      row.className = "msg-agents";
      row.append("עבדו על זה:");
      agents.forEach((name) => {
        const [label, color] = AGENTS[name] || [name, "#fff"];
        const chip = document.createElement("span");
        chip.className = "agent-chip";
        chip.style.setProperty("--c", color);
        chip.textContent = label;
        row.append(chip);
      });
      el.append(row);
    }
    log.append(el);
    log.scrollTop = log.scrollHeight;
    return el;
  };

  const addTyping = () => {
    const el = document.createElement("div");
    el.className = "msg msg-bot";
    el.innerHTML = '<span class="typing" role="img" aria-label="מוצי כותב"><i></i><i></i><i></i></span>';
    log.append(el);
    log.scrollTop = log.scrollHeight;
    return el;
  };

  const ask = async (text) => {
    if (busy || !text) return;
    busy = true;
    sendBtn.disabled = true;
    addMessage(text, "user");
    const typing = addTyping();
    try {
      const data = await sendChat({ sessionId, message: text, staffCode });
      typing.remove();
      addMessage(data.reply || "לא התקבלה תשובה.", "bot", data.agents || []);
      roleEl.textContent = `מדבר עם: ${data.role === "staff" ? data.userName || "צוות" : "אורח"}`;
      // Reports and staff actions change the data, so the board should refresh.
      if ((data.agents || []).some((a) => a === "reports_agent" || a === "staff_agent")) bus.dispatchEvent(new Event("data-changed"));
    } catch {
      typing.remove();
      addMessage("לא הצלחתי להגיע ל-n8n כרגע. נסו שוב בעוד רגע.", "bot");
    } finally {
      busy = false;
      sendBtn.disabled = false;
    }
  };

  addMessage("היי, אני מוצי 👋 איבדתם משהו, מצאתם משהו, או שיש שאלה על פינת האבדות?", "bot");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = input.value.trim();
    input.value = "";
    ask(text);
  });

  document.querySelectorAll("#chat-suggest button").forEach((btn) => btn.addEventListener("click", () => ask(btn.textContent.trim())));

  // Staff mode: the code is verified by the server; the page only remembers it for this visit.
  staffForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const code = staffInput.value.trim();
    if (!code) return;
    staffStatus.textContent = "בודק מול השרת...";
    try {
      const data = await staffAction({ staffCode: code, action: "list" });
      if (data.ok) {
        staffCode = code;
        staffStatus.textContent = `מחובר כ: ${data.staffName}. עכשיו מוצי יכול להפעיל את סוכן הצוות.`;
        roleEl.textContent = `מדבר עם: ${data.staffName}`;
        resetBtn.hidden = false;
      } else {
        staffCode = "";
        resetBtn.hidden = true;
        staffStatus.textContent = data.error || "הקוד לא התקבל.";
      }
    } catch {
      staffStatus.textContent = "השרת לא ענה. נסו שוב.";
    }
  });

  resetBtn.addEventListener("click", async () => {
    resetBtn.disabled = true;
    staffStatus.textContent = "מאפס את נתוני ההדגמה...";
    try {
      const data = await staffAction({ staffCode, action: "reset" });
      staffStatus.textContent = data.ok ? data.message : data.error || "האיפוס נכשל.";
      if (data.ok) bus.dispatchEvent(new Event("data-changed"));
    } catch {
      staffStatus.textContent = "השרת לא ענה. נסו שוב.";
    } finally {
      resetBtn.disabled = false;
    }
  });
}
