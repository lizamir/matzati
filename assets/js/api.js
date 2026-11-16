// Thin client for the Matzati n8n webhooks. No keys live in the browser:
// every call goes to a public webhook, and permissions are checked server-side.

const BASE = "https://ailizhajage.app.n8n.cloud/webhook";

/** POSTs JSON and returns the parsed body, even for 4xx answers that carry a JSON error. */
async function postJson(path, payload, timeoutMs = 120000) {
  const res = await fetch(`${BASE}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`HTTP ${res.status}`);
  }
}

/** Sends a lost/found report to workflow 1 (intake + matching). */
export function sendReport({ kind, description, location, image }) {
  return postJson("matzati-report", { kind, description, location, image: image || "", source: "site" });
}

/** Reads the public, sanitized board (workflow 3). */
export async function fetchBoard() {
  const res = await fetch(`${BASE}/matzati-board`, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/** Sends one chat turn to Motzi, the orchestrator agent (workflow 2). */
export function sendChat({ sessionId, message, staffCode }) {
  return postJson("matzati-chat", { sessionId, message, staffCode: staffCode || "" });
}

/** Staff-only actions (workflow 3). The server validates the code; a wrong code returns ok:false. */
export function staffAction({ staffCode, action, code = "" }) {
  return postJson("matzati-staff", { staffCode, action, code }, 60000);
}
