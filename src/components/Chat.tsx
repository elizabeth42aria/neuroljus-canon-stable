// src/components/Chat.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import { useSignals } from "@/lib/useSignals";

type Msg = { id: string; role: "user" | "assistant"; text: string; t: number };

type SignalFlags = {
  ruidoAlto: boolean;
  hambre: boolean;
  sobrecargaSensorial: boolean;
  necesitaDescanso: boolean;
};

const initialSignals: SignalFlags = {
  ruidoAlto: false,
  hambre: false,
  sobrecargaSensorial: false,
  necesitaDescanso: false,
};

type Lang = "sv" | "es" | "en";

type Memory = {
  preferredName?: string;
  calmingWords?: string[];
  avoidWords?: string[];
  knownTriggers?: string[];
};

const texts = {
  sv: {
    title: "Neuroljus · Chat",
    greeting:
      "Hej. Jag är Neuroljus. Jag lyssnar utan att anta. Vad behöver du idag?",
    noise:
      "Omgivningen verkar bullrig. Förslag: hörlurar eller en tystare plats.",
    hunger: "Signal om hunger uppfattad. Förslag: vatten + enkelt mellanmål.",
    overload:
      "Sensorisk överbelastning uppfattad. Sänk ljus/ljud och ta en kort paus.",
    rest: "Behov av vila uppfattat. Vi kan pausa och återuppta sen.",
    fallback: "Jag lyssnar. Vad vill du uppnå de närmaste 20 minuterna?",
    input: "Skriv här…",
    send: "Skicka",
    thinking: "Neuroljus tänker…",
    modeLocal: "Lokalt (regler)",
    modeAI: "IA (hybrid)",
    freedom: "Margen de libertad",
    initiative: "Permitir iniciativa",
  },
  es: {
    title: "Neuroljus · Chat",
    greeting:
      "Hola. Soy Neuroljus. Escucho sin suponer. ¿Qué necesitas hoy?",
    noise:
      "El entorno parece ruidoso. Sugerencia: auriculares o un lugar más silencioso.",
    hunger: "Señal de hambre detectada. Propuesta: agua + colación simple.",
    overload:
      "Se percibe sobrecarga sensorial. Bajemos luz/sonido y tomemos una pausa.",
    rest: "Necesidad de descanso detectada. Podemos pausar y retomar.",
    fallback: "Te escucho. ¿Qué resultado quieres en los próximos 20 minutos?",
    input: "Escribe aquí…",
    send: "Enviar",
    thinking: "Neuroljus está pensando…",
    modeLocal: "Local (reglas)",
    modeAI: "IA (híbrido)",
    freedom: "Margen de libertad",
    initiative: "Permitir iniciativa",
  },
  en: {
    title: "Neuroljus · Chat",
    greeting:
      "Hello. I am Neuroljus. I listen without assuming. What do you need today?",
    noise:
      "The environment seems noisy. Suggestion: headphones or a quieter space.",
    hunger: "Hunger signal detected. Suggest: water + a simple snack.",
    overload:
      "Sensory overload detected. Lower light/sound and take a short break.",
    rest: "Need for rest detected. We can pause and resume.",
    fallback: "I’m listening. What outcome do you want in the next 20 minutes?",
    input: "Type here…",
    send: "Send",
    thinking: "Neuroljus is thinking…",
    modeLocal: "Local (rules)",
    modeAI: "AI (hybrid)",
    freedom: "Freedom margin",
    initiative: "Allow initiative",
  },
};

function clamp01(x: number) { return Math.max(0, Math.min(1, x)); }

export default function Chat() {
  const [lang, setLang] = useState<Lang>("sv");
  const t = texts[lang];

  const [mode, setMode] = useState<"local" | "ai">("local");
  const [temperature, setTemperature] = useState(0.4);
  const [allowInitiative, setAllowInitiative] = useState(true);

  const [memory, setMemory] = useState<Memory>(() => {
    if (typeof window === "undefined") return {};
    try { return JSON.parse(localStorage.getItem("nl_memory") || "{}"); }
    catch { return {}; }
  });
  useEffect(() => {
    if (typeof window !== "undefined")
      localStorage.setItem("nl_memory", JSON.stringify(memory));
  }, [memory]);

  const [messages, setMessages] = useState<Msg[]>([{
    id: typeof crypto !== "undefined" ? crypto.randomUUID() : String(Date.now()),
    role: "assistant",
    text: t.greeting,
    t: Date.now(),
  }]);
  useEffect(() => {
    // Al cambiar idioma, actualiza saludo inicial sin duplicar hilo
    setMessages((m) => (m.length === 1 && m[0].role === "assistant")
      ? [{ ...m[0], text: t.greeting }]
      : m);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  // Señales compartidas (simuladas hoy / reales mañana)
  const shared = useSignals(2000) as Partial<SignalFlags> | undefined;
  const [localSignals, setLocalSignals] = useState<SignalFlags>(initialSignals);
  const effectiveSignals: SignalFlags = {
    ruidoAlto: !!(localSignals.ruidoAlto || shared?.ruidoAlto),
    hambre: !!(localSignals.hambre || shared?.hambre),
    sobrecargaSensorial: !!(localSignals.sobrecargaSensorial || shared?.sobrecargaSensorial),
    necesitaDescanso: !!(localSignals.necesitaDescanso || shared?.necesitaDescanso),
  };

  const [isThinking, setIsThinking] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, isThinking]);

  // Reglas locales deterministas (fallback seguro)
  const respondLocal = useMemo(() => {
    return (flags: SignalFlags): string => {
      if (flags.sobrecargaSensorial) return t.overload;
      if (flags.ruidoAlto) return t.noise;
      if (flags.hambre) return t.hunger;
      if (flags.necesitaDescanso) return t.rest;
      return t.fallback;
    };
  }, [t]);

  function push(role: Msg["role"], text: string) {
    setMessages((m) => [
      ...m,
      {
        id: typeof crypto !== "undefined" ? crypto.randomUUID() : String(Date.now() + Math.random()),
        role,
        text,
        t: Date.now(),
      },
    ]);
  }

  async function onSend(e?: React.FormEvent) {
    e?.preventDefault();
    const inp = (document.getElementById("nl-chat-input") as HTMLInputElement | null);
    const raw = inp?.value ?? "";
    const userText = raw.trim();
    if (!userText) return;
    if (inp) inp.value = "";
    push("user", userText);
    setIsThinking(true);

    try {
      let reply = "";
      if (mode === "local") {
        await new Promise((r) => setTimeout(r, 200));
        reply = respondLocal(effectiveSignals);
      } else {
        const r = await fetch("/api/ai", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            messages: messages
              .concat([{ id: "tmp", role: "user", text: userText, t: Date.now() }])
              .map((m) => ({ role: m.role, content: m.text })),
            lang,
            signals: effectiveSignals,
            memory,
            temperature: clamp01(temperature),
            allowInitiative,
          }),
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data?.error || "AI error");
        reply = data?.content || "";
      }
      push("assistant", reply);
    } catch (err: any) {
      push("assistant", `⚠️ ${err?.message || "Error"}`);
    } finally {
      setIsThinking(false);
    }
  }

  function toggleSignal(key: keyof SignalFlags) {
    setLocalSignals((s) => ({ ...s, [key]: !s[key] }));
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
          {/* Libertad */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">{t.freedom}</span>
            <input type="range" min={0} max={1} step={0.1} value={temperature} onChange={(e) => setTemperature(parseFloat(e.target.value))} />
          </div>
          {/* Iniciativa */}
          <label className="text-xs flex items-center gap-2">
            <input type="checkbox" checked={allowInitiative} onChange={(e) => setAllowInitiative(e.target.checked)} /> {t.initiative}
          </label>
        </div>
      </header>

      {/* Señales rápidas (hoy toggles; mañana desde dispositivos) */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button onClick={() => toggleSignal("ruidoAlto")} className={`px-3 py-2 rounded-xl border text-sm ${ effectiveSignals.ruidoAlto ? "bg-slate-900 text-white" : "bg-white" }`}>Noise/Ruido/Buller</button>
        <button onClick={() => toggleSignal("hambre")} className={`px-3 py-2 rounded-xl border text-sm ${ effectiveSignals.hambre ? "bg-slate-900 text-white" : "bg-white" }`}>Hambre/Hunger/Hungrig</button>
        <button onClick={() => toggleSignal("sobrecargaSensorial")} className={`px-3 py-2 rounded-xl border text-sm ${ effectiveSignals.sobrecargaSensorial ? "bg-slate-900 text-white" : "bg-white" }`}>Sobrecarga/Overload/Överbelastning</button>
        <button onClick={() => toggleSignal("necesitaDescanso")} className={`px-3 py-2 rounded-xl border text-sm ${ effectiveSignals.necesitaDescanso ? "bg-slate-900 text-white" : "bg-white" }`}>Descanso/Rest/Vila</button>
      </section>

      {/* Hilo */}
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
        <input id="nl-chat-input" placeholder={t.input} className="flex-1 rounded-xl border px-3 py-2 text-sm" />
        <button type="submit" className="rounded-xl px-4 py-2 text-sm bg-slate-900 text-white">{t.send}</button>
      </form>

      {/* Memoria editable (localStorage) */}
      <details className="text-xs text-slate-500">
        <summary className="cursor-pointer">Personalización local (memoria ligera)</summary>
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <label className="flex flex-col gap-1">
            <span>Preferred name / Nombre preferido</span>
            <input className="border rounded px-2 py-1" value={memory.preferredName || ""} onChange={(e) => setMemory({ ...memory, preferredName: e.target.value })} />
          </label>
          <label className="flex flex-col gap-1">
            <span>Calming words (comma separated)</span>
            <input className="border rounded px-2 py-1" value={(memory.calmingWords || []).join(", ")} onChange={(e) => setMemory({ ...memory, calmingWords: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
          </label>
          <label className="flex flex-col gap-1">
            <span>Avoid words (comma separated)</span>
            <input className="border rounded px-2 py-1" value={(memory.avoidWords || []).join(", ")} onChange={(e) => setMemory({ ...memory, avoidWords: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
          </label>
          <label className="flex flex-col gap-1">
            <span>Known triggers (comma separated)</span>
            <input className="border rounded px-2 py-1" value={(memory.knownTriggers || []).join(", ")} onChange={(e) => setMemory({ ...memory, knownTriggers: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
          </label>
        </div>
      </details>

      <footer className="text-[11px] text-slate-500">
        {mode === "local"
          ? (lang === "sv" ? "Denna modul är deterministisk och lokal."
            : lang === "es" ? "Este módulo es determinístico y local."
            : "This module is deterministic and local.")
          : (lang === "sv" ? "Hybridläge: svar genereras av en extern IA med Neuroljus-policy."
            : lang === "es" ? "Modo híbrido: las respuestas las genera una IA externa con la política Neuroljus."
            : "Hybrid mode: responses by an external AI with Neuroljus policy.")}
      </footer>
    </div>
  );
}