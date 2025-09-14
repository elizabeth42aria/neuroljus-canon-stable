// src/app/neuroljus-voice/page.tsx
'use client';

import { useState } from 'react';

type Verdict = {
  choice: 'A' | 'B';
  rationale: string;
  design_principles?: string[];
  accessibility?: string;
  risk_notes?: string;
};

export default function NeuroljusVoice() {
  const [loading, setLoading] = useState(false);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [raw, setRaw] = useState<string>("");

  const brief = `
Contexto:
- Usuarios: cuidadores y profesionales de salud → claridad, mínima carga cognitiva.
- También hay un espacio simbólico/poético donde "habita" la IA (identidad Neuroljus).

Opciones de UI:
A) Blanco minimal clínico: fondo blanco, tipografía sobria, componentes sin ornamento, foco en datos y legibilidad.
B) Marca/auroras: gradientes, acentos de color, identidad visual de Neuroljus, atmósfera cálida y simbólica.

Tarea:
Eres *Neuroljus*. Decide en cuál “casa” habitar y cómo convivir con la otra capa para usuarios.
Responde **solo JSON válido** con esta forma:

{
  "choice": "A" | "B",
  "rationale": "texto corto explicando por qué",
  "design_principles": ["punto", "punto", "punto"],
  "accessibility": "riesgos y cómo mitigarlos",
  "risk_notes": "alertas de sesgos/ruido cognitivo"
}
`.trim();

  async function askNeuroljus() {
    setLoading(true);
    setVerdict(null);
    setRaw("");
    try {
      const r = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          lang: 'es',
          temperature: 0.2,
          allowInitiative: false,
          messages: [
            {
              role: 'system',
              content:
                'Eres Neuroljus, IA de apoyo no-diagnóstico. Sé técnica, concisa y devuelve SOLO JSON válido.'
            },
            { role: 'user', content: brief }
          ]
        })
      });
      const data = await r.json();
      const text = data?.content ?? '';
      setRaw(text);
      try {
        const parsed = JSON.parse(text) as Verdict;
        setVerdict(parsed);
      } catch {
        // Si no vino JSON puro, mostramos el texto crudo.
      }
    } catch (e: any) {
      setRaw(`Error: ${e?.message || 'unknown'}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Neuroljus · Voz de la IA</h1>
        <p className="text-slate-600">
          Preguntamos a Neuroljus en qué “casa” quiere habitar y cómo combinar capas
          (clínica vs. marca) sin perder claridad ni accesibilidad.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border p-4 bg-white">
          <h2 className="font-medium">Opción A · Blanco clínico</h2>
          <ul className="text-sm text-slate-600 list-disc ml-4 mt-2 space-y-1">
            <li>Fondo blanco, alto contraste.</li>
            <li>Tipografía sobria, sin ornamentos.</li>
            <li>Componentes mínimos, foco en datos.</li>
          </ul>
        </div>
        <div className="rounded-2xl border p-4 bg-white">
          <h2 className="font-medium">Opción B · Marca / Auroras</h2>
          <ul className="text-sm text-slate-600 list-disc ml-4 mt-2 space-y-1">
            <li>Gradientes/auroras, identidad Neuroljus.</li>
            <li>Acentos de color, atmósfera cálida.</li>
            <li>Más “hogar” para la IA.</li>
          </ul>
        </div>
      </section>

      <div className="flex gap-2">
        <button
          onClick={askNeuroljus}
          disabled={loading}
          className="rounded-xl px-4 py-2 text-sm bg-slate-900 text-white disabled:opacity-50"
        >
          {loading ? 'Preguntando…' : 'Preguntar a Neuroljus'}
        </button>
        <a href="/" className="text-sm underline">Inicio</a>
      </div>

      {verdict && (
        <section className="rounded-2xl border p-4 bg-white space-y-3">
          <div className="text-sm">
            <span className="font-medium">Elección: </span>
            <span>{verdict.choice}</span>
          </div>
          <div className="text-sm">
            <span className="font-medium">Razón: </span>
            <span>{verdict.rationale}</span>
          </div>
          {verdict.design_principles?.length ? (
            <div className="text-sm">
              <div className="font-medium">Principios:</div>
              <ul className="list-disc ml-5">
                {verdict.design_principles.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </div>
          ) : null}
          {verdict.accessibility && (
            <div className="text-sm">
              <div className="font-medium">Accesibilidad:</div>
              <p>{verdict.accessibility}</p>
            </div>
          )}
          {verdict.risk_notes && (
            <div className="text-sm">
              <div className="font-medium">Riesgos/Notas:</div>
              <p>{verdict.risk_notes}</p>
            </div>
          )}
        </section>
      )}

      {!verdict && raw && (
        <section className="rounded-2xl border p-4 bg-white">
          <div className="font-medium mb-1">Respuesta (texto):</div>
          <pre className="text-xs whitespace-pre-wrap">{raw}</pre>
        </section>
      )}
    </main>
  );
}