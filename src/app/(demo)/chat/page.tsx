// src/app/(demo)/chat/page.tsx
"use client";

import { useState } from "react";

export default function ChatPage() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");

  async function send(text: string) {
    if (!text.trim()) return;

    // 1. Mostrar el mensaje del usuario en la UI
    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");

    try {
      // 2. Llamar a la API de OpenAI
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, { role: "user", content: text }] }),
      });

      if (!res.ok) {
        throw new Error(`Error HTTP ${res.status}`);
      }

      const data = await res.json();

      // 3. Mostrar respuesta de la IA
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
    } catch (err) {
      console.error("Error al enviar mensaje:", err);
      setMessages((m) => [...m, { role: "assistant", content: "⚠️ Error al conectar con la IA." }]);
    }
  }

  return (
    <main className="max-w-2xl mx-auto p-4 space-y-4">
      <h1 className="text-xl font-semibold">Neuroljus · Chat</h1>

      <div className="border rounded-lg p-3 h-[60vh] overflow-auto space-y-2 bg-slate-50">
        {messages.map((m, i) => (
          <div
            key={i}
            className={m.role === "user" ? "text-right" : "text-left text-blue-700"}
          >
            <span className="px-2 py-1 inline-block rounded bg-white shadow">
              {m.content}
            </span>
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu mensaje..."
          className="flex-1 border rounded px-2 py-1"
        />
        <button
          type="submit"
          className="px-3 py-1 rounded bg-blue-600 text-white"
        >
          Enviar
        </button>
      </form>
    </main>
  );
}
