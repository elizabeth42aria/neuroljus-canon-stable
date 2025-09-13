// src/app/(demo)/chat/page.tsx
// Multilingüe (sv/es/en) + Modo local (reglas técnicas) + Modo IA híbrida
// Lee señales reales desde useSignals (hands_activity, near_face_pct, mouth_open_pct, blinks_per_min)

'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import { useSignals } from "@/lib/useSignals";

type Msg = { id: string; role: "user" | "assistant"; text: string; t: number };
type Lang = "sv" | "es" | "en";

type Memory = {
  preferredName?: string;
  calmingWords?: string[];
  avoidWords?: string[];
  knownTriggers?: string[];
};

const texts = {
  sv: {
    title: "Neuroljus · Chat MVP",
    greeting:
      "Hej. Jag kan hjälpa till att tolka signaler och stödja beslut. Vad behöver du just nu?",
    input: "Skriv här…",
    send: "Skicka",
    thinking: "Neuroljus tänker…",
    modeLocal: "Lokalt (regler)",
    modeAI: "IA (hybrid)",
    freedom: "Margen de libertad",
    initiative: "Permitir iniciativa",
  },
  es: {
    title: "Neuroljus · Chat MVP",
    greeting:
      "Hola. Puedo ayudar a interpretar señales y apoyar decisiones. ¿Qué necesitas ahora?",
    input: "Escribe aquí…",
    send: "Enviar",
    thinking: "Neuroljus está pensando…",
    modeLocal: "Local (reglas)",
    modeAI: "IA (híbrido)",
    freedom: "Margen de libertad",
    initiative: "Permitir iniciativa",
  },
  en: {
    title: "Neuroljus · Chat MVP",
    greeting:
      "Hello. I can help interpret signals and support decisions. What do you need right now?",
    input: "Type here…",
    send: "Send",
    thinking: "Neuroljus is thinking…",
    modeLocal: "Local (rules)",
    modeAI: "AI (hybrid)",
    freedom: "Freedom margin",
    initiative: "Allow initiative",
  },
};

export default function ChatPage() {
  const [lang, setLang] = useState<Lang>("sv");
  const t = texts[lang];

  const [mode, setMode] = useState<"local" | "ai">("local");
  const [temperature, setTemperature] = useState(0.4);
  const [allowInitiative, setAllowInitiative] = useState(true);

  // memoria ligera en localStorage
  const [memory, setMemory] = useState<Memory>(() => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(localStorage.getItem("nl_memory") || "{}");
    } catch {
      return {};
    }
  });
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("nl_memory", JSON.stringify(memory));
    }
  }, [memory]);

  // mensajes
  const [messages, setMessages] = useState<Msg[]>([
    { id: crypto.randomUUID(), role: "assistant", text: t.greeting, t: Date.now() },
  ]);
  useEffect(() => {
    if (messages.length === 1 && messages[0].role === "assistant") {
      setMessages([{ ...messages[0], text: t.greeting }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  // ← Señales reales (poll /api/signals cada 2s). Estructura esperada:
  // { hands_activity?: number, near_face_pct?: number, mouth_open_pct?: number, blinks_per_min?: number, quality?: number }
  const telemetry = useSignals(2000) || {};

  // scroll al final
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, isThinking]);

  // Reglas locales: producir respuesta técnica a partir de señales (sin suposiciones)
  const respondLocal = useMemo(() => {
    return (sig: any): string => {
      const obs: string[] = [];
      if (typeof sig.hands_activity === "number") obs.push(`hands_activity=${sig.hands_activity}`);
      if (typeof sig.near_face_pct === "number") obs.push(`near_face_pct=${sig.near_face_pct}%`);
      if (typeof sig.mouth_open_pct === "number") obs.push(`mouth_open_pct=${sig.mouth_open_pct}%`);
      if (typeof sig.blinks_per_min === "number") obs.push(`blinks_per_min=${sig.blinks_per_min}`);
      if (typeof sig.quality === "number") obs.push(`signal_quality=${sig.quality}`);

      const header =
        obs.length > 0
          ? `Observación: ${obs.join(", ")} (no diagnóstico).`
          : (lang === "es"
              ? "Observación: sin señales activas recibidas."
              : lang === "sv"
              ? "Observation: inga aktiva signaler mottogs."
              : "Observation: no active signals received.");

      // opciones neutrales
      const options =
        lang === "es"
          ? ["1) reducir estímulos por 3–5 min", "2) cambiar a espacio más silencioso", "3) continuar observando"]
          : lang === "sv"
          ? ["1) minska stimuli i 3–5 min", "2) flytta till tystare plats", "3) fortsätt observera"]
          : ["1) reduce stimuli for 3–5 min", "2) move to a quieter spot", "3) keep observing"];

      const question =
        lang === "es"
          ? "¿Cuál opción prefieres o quieres registrar este evento?"
          : lang === "sv"
          ? "Vilket alternativ föredrar du, eller vill du registrera händelsen?"
          : "Which option do you prefer, or do you want to record this event?";

      return `${header}\nOpciones / Options:\n- ${options.join("\n- ")}\n${question}`;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  function push(role: Msg["role"], text: string) {
    setMessages((m) => [...m, { id: crypto.randomUUID(), role, text, t: Date.now() }]);
  }

  async function onSend(e?: React.FormEvent) {
    e?.preventDefault();
    if (!input.trim()) return;

    const userText = input.trim();
    setInput("");
    push("user", userText);
    setIsThinking(true);

    try {
      let reply = "";
      if (mode === "local") {
        await new Promise((r) => setTimeout(r, 150));
        reply = respondLocal(telemetry);
      } else {
        const r = await fetch("/api/ai", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            messages: messages
              .concat([{ role: "user", text: userText, t: Date.now(), id: "tmp" }])
              .map((m) => ({ role: m.role, content: m.text })),
            lang,
            signals: telemetry,
            memory,
            temperature,
            allowInitiative,
          }),
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data?.error || "AI error");
        reply = data.content || "";
      }
      push("assistant", reply);
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
        <div className="flex flex-wrap gap-2 items-center">
          {/* Idioma */}
          <div className="flex gap-1 border rounded-xl p-1">
            <button onClick={() => setLang("sv")} className={`px-2 py-1 rounded ${lang === "sv" ? "bg-slate-900 text-white" : "bg-white"}`}>Svenska</button>
            <button onClick={() => setLang("es")} className={`px-2 py-1 rounded ${lang === "es" ? "bg-slate-900 text-white" : "bg-white"}`}>Español</button>
            <button onClick={() => setLang("en")} className={`px-2 py-1 rounded ${lang === "en" ? "bg-slate-900 text-white" : "bg-white"}`}>English</button>
          </div>
          {/* Modo */}
          <div className="flex gap-1 border rounded-xl p-1">
            <button onClick={() => setMode("local")} className={`px-2 py-1 rounded ${mode === "local" ? "bg-slate-900 text-white" : "bg-white"}`}>{t.modeLocal}</button>
            <button onClick={() => setMode("ai")} className={`px-2 py-1 rounded ${mode === "ai" ? "bg-slate-900 text-white" : "bg-white"}`}>{t.modeAI}</button>
          </div>
          {/* Libertad (temperature) */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">{t.freedom}</span>
            <input type="range" min={0} max={1} step={0.1} value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}/>
          </div>
          {/* Iniciativa */}
          <label className="text-xs flex items-center gap-2">
            <input type="checkbox" checked={allowInitiative} onChange={(e) => setAllowInitiative(e.target.checked)} /> {t.initiative}
          </label>
        </div>
      </header>

      {/* Mensajes */}
      <div ref={listRef} className="border rounded-2xl p-3 h-[52vh] overflow-y-auto bg-white">
        {messages.map((m) => (
          <div key={m.id} className={`mb-3 flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm border ${m.role === "user" ? "bg-slate-900 text-white" : "bg-slate-50"}`}>
              <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
              <div className="mt-1 text-[10px] opacity-60">{new Date(m.t).toLocaleTimeString()}</div>
            </div>
          </div>
        ))}
        {isThinking && <div className="text-xs text-slate-500">{t.thinking}</div>}
      </div>

      {/* Input */}
      <form onSubmit={onSend} className="flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={t.input} className="flex-1 rounded-xl border px-3 py-2 text-sm" />
        <button type="submit" className="rounded-xl px-4 py-2 text-sm bg-slate-900 text-white">{t.send}</button>
      </form>

      {/* Memoria mínima editable */}
      <details className="text-xs text-slate-500">
        <summary className="cursor-pointer">Personalización local (memoria ligera)</summary>
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <label className="flex flex-col gap-1">
            <span>Preferred name / Nombre preferido</span>
            <input className="border rounded px-2 py-1"
              value={memory.preferredName || ""}
              onChange={(e) => setMemory({ ...memory, preferredName: e.target.value })}/>
          </label>
          <label className="flex flex-col gap-1">
            <span>Calming words (comma separated)</span>
            <input className="border rounded px-2 py-1"
              value={(memory.calmingWords || []).join(", ")}
              onChange={(e) => setMemory({ ...memory, calmingWords: e.target.value.split(",").map((s)=>s.trim()).filter(Boolean) })}/>
          </label>
          <label className="flex flex-col gap-1">
            <span>Avoid words (comma separated)</span>
            <input className="border rounded px-2 py-1"
              value={(memory.avoidWords || []).join(", ")}
              onChange={(e) => setMemory({ ...memory, avoidWords: e.target.value.split(",").map((s)=>s.trim()).filter(Boolean) })}/>
          </label>
          <label className="flex flex-col gap-1">
            <span>Known triggers (comma separated)</span>
            <input className="border rounded px-2 py-1"
              value={(memory.knownTriggers || []).join(", ")}
              onChange={(e) => setMemory({ ...memory, knownTriggers: e.target.value.split(",").map((s)=>s.trim()).filter(Boolean) })}/>
          </label>
        </div>
      </details>

      <footer className="text-[11px] text-slate-500">
        {mode === "local"
          ? (lang === "sv" ? "Deterministisk, lokal modul."
            : lang === "es" ? "Módulo determinístico y local."
            : "Deterministic, local module.")
          : (lang === "sv" ? "Hybridläge: externa IA med Neuroljus-policy."
            : lang === "es" ? "Modo híbrido: IA externa con la política Neuroljus."
            : "Hybrid mode: external AI with Neuroljus policy.")}
      </footer>
    </div>
  );
}