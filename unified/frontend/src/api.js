const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000/api";

async function safeJson(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { _raw: text };
  }
}

export async function getQuestions() {
  const res = await fetch(`${API_BASE}/questions`);
  if (!res.ok) throw new Error(`questions failed: ${res.status}`);
  return await safeJson(res);
}

export async function getFigures() {
  const res = await fetch(`${API_BASE}/figures`);
  if (!res.ok) throw new Error(`figures failed: ${res.status}`);
  return await safeJson(res);
}

export async function analyze(answers) {
  const res = await fetch(`${API_BASE}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answers }),
  });
  if (!res.ok) throw new Error(`analyze failed: ${res.status}`);
  return await safeJson(res);
}

export async function chat({ character, userMessage, chatHistory }) {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      character,
      user_message: userMessage,
      chat_history: chatHistory,
    }),
  });
  if (!res.ok) throw new Error(`chat failed: ${res.status}`);
  return await safeJson(res);
}

