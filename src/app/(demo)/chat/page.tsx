// src/app/(demo)/chat/page.tsx
// Chat multilingüe: UI en un idioma a la vez, IA entiende todos.

'use client';

import { useEffect, useRef, useState } from "react";

type Msg = {
  id: string;
  role: "user" | "assistant";
  text: string;
  t: number;
};

type Lang = "sv" | "es" | "en";

const texts = {
  sv: {
    title: "Neuroljus · Chat MVP",
    greeting: "Hej. Jag är Neuroljus. Jag kan lyssna och svara med klarhet. Vad behöver du idag?",
    input: "Skriv här…",
    send: "Skicka",
    thinking: "Neuroljus tänker…",
  },
  es: {
    title: "Neuroljus · Chat MVP",
    greeting: "Hola. Soy Neuroljus. Puedo escucharte y responder con claridad. ¿Qué necesitas hoy?",
    input: "Escribe aquí…",
    send: "Enviar",
    thinking: "Neuroljus está pensando…",
  },
  en: {
    title: "Neuroljus · Chat MVP",
    greeting: "Hello. I am Neuroljus. I can listen and respond with clarity. What do you need today?",
    input: "Type here…",
    send: "Send",
    thinking: "Neuroljus is thinking…",
  },
};
function ClientTime({ t }: { t: number }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) return null; // no renderiza nada en SSR
  const d = new Date(t);
  return (
    <time dateTime={d.toISOString()} suppressHydrationWarning>
      {d.toLocaleTimeString()}
    </time>
  );
}

export default function ChatPage() {
  const [lang, setLang] = useState<Lang>("sv");
  const t = texts[lang];

  const [messages, setMessages] = useState<Msg[]>([
    {
      id: crypto.randomUUID(),
      role: "assistant",
      text: t.greeting,
      t: Date.now(),
    },
  ]);

  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length, isThinking]);

  // Actualiza saludo al cambiar idioma
  useEffect(() => {
    if (messages.length === 1 && messages[0].role === "assistant") {
      setMessages([{ ...messages[0], text: t.greeting }]);
    }
  }, [lang]);

  function push(role: Msg["role"], text: string) {
    setMessages((m) => [
      ...m,
      { id: crypto.randomUUID(), role, text, t: Date.now() },
    ]);
  }

  async function onSend(e?: React.FormEvent) {
    e?.preventDefault();
    if (!input.trim()) return;
    const userText = input.trim();
    setInput("");
    push("user", userText);
    setIsThinking(true);

    try {
      const r = await fetch("/api/ai", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: messages
            .concat([{ role: "user", text: userText, t: Date.now(), id: "tmp" }])
            .map((m) => ({ role: m.role, content: m.text })),
          lang,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "AI error");
      push("assistant", data.content || "");
    } catch (err: any) {
      push("assistant", `⚠️ ${err?.message || "Error"}`);
    } finally {
      setIsThinking(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl w-full space-y-4">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">{t.title}</h1>

        {/* Idioma */}
        <div className="flex gap-1 border rounded-xl p-1 w-fit">
          <button
            onClick={() => setLang("sv")}
            className={`px-2 py-1 rounded ${lang === "sv" ? "bg-slate-900 text-white" : "bg-white"}`}
          >
            Svenska
          </button>
          <button
            onClick={() => setLang("es")}
            className={`px-2 py-1 rounded ${lang === "es" ? "bg-slate-900 text-white" : "bg-white"}`}
          >
            Español
          </button>
          <button
            onClick={() => setLang("en")}
            className={`px-2 py-1 rounded ${lang === "en" ? "bg-slate-900 text-white" : "bg-white"}`}
          >
            English
          </button>
        </div>
      </header>

      {/* Mensajes */}
      <div
        ref={listRef}
        className="border rounded-2xl p-3 h-[52vh] overflow-y-auto bg-white"
      >
        {messages.map((m) => (
          <div
            key={m.id}
            className={`mb-3 flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm border ${
                m.role === "user" ? "bg-slate-900 text-white" : "bg-slate-50"
              }`}
            >
              <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
              <div className="mt-1 text-[10px] opacity-60">
                <ClientTime t={m.t} />
              </div>
            </div>
          </div>
        ))}
        {isThinking && <div className="text-xs text-slate-500">{t.thinking}</div>}
      </div>

      {/* Input */}
      <form onSubmit={onSend} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.input}
          className="flex-1 rounded-xl border px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-xl px-4 py-2 text-sm bg-slate-900 text-white"
        >
          {t.send}
        </button>
      </form>
    </div>
  );
}