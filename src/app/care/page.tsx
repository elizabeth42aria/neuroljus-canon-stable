// src/app/care/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSignals } from '@/lib/useSignals';

// Tipado opcional mínimo para no romper si faltan campos
type Sig = Partial<{
  mock: boolean;                  
  quality: number;                
  state: 'Calm' | 'Alert' | 'Overload' | string;

  noise: number;                  
  gaze: number;                   
  mouth: number;                  
  blinks: number;                 
  hr: number;                     
  ts: number;                     
}>;

// ⬇️ Evita error de hidratación
function ClientTime({ ts }: { ts?: number }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) {
    return <time suppressHydrationWarning>—</time>;
  }
  const d = new Date(ts ?? Date.now());
  return (
    <time dateTime={d.toISOString()} suppressHydrationWarning>
      {d.toLocaleTimeString()}
    </time>
  );
}

// Componente para cada métrica
function Stat({ label, value, unit = '' }: { label: string; value?: number; unit?: string }) {
  const v = (value ?? NaN);
  const text = Number.isFinite(v) ? `${v.toFixed(1)}${unit}` : '—';
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <span className="text-slate-600">{label}</span>
      <span className="font-medium">{text}</span>
    </div>
  );
}

export default function CarePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // 1) Señales (simuladas hoy, reales mañana)
  const sig = (useSignals(1000) ?? {}) as Sig;
  const isMock = !!sig.mock || sig.quality === undefined;
  const quality = Math.max(0, Math.min(100, sig.quality ?? 35));

  // 2) Chat en iframe
  const [chatUrl] = useState('/chat');

  // 3) Auto-scroll del log
  const logRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    logRef.current?.scrollTo({ top: 999999, behavior: 'smooth' });
  }, [sig.ts]);

  if (!mounted) return null; // evita errores SSR

  return (
    <main className="mx-auto max-w-6xl p-4 md:p-6 space-y-6">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Neuroljus · Care</h1>
          <p className="text-slate-500">Panel de señales + Chat (no diagnóstico).</p>
        </div>

        <div className="flex items-center gap-2">
          {isMock ? (
            <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
              Simulación activa
            </span>
          ) : (
            <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Dispositivo conectado
            </span>
          )}
          <Link href="/" className="text-sm underline">Inicio</Link>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Columna izquierda: Live Dashboard */}
        <section className="rounded-2xl border bg-white p-4 md:p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium">Live Dashboard</h2>
            <div className="text-sm">
              Estado:{' '}
              <span className="font-medium">{sig.state ?? '—'}</span>
            </div>
          </div>

          <div className="rounded-xl border bg-slate-50 p-3 mb-4">
            <div className="text-sm">Calidad señal: <span className="font-medium">{quality.toFixed(0)}%</span></div>
            <div className="text-[11px] text-slate-500">
              Esta es retroalimentación de apoyo basada en señales del dispositivo (o simulación). No es diagnóstico.
            </div>
          </div>

          <div className="divide-y">
            <Stat label="Hands activity" value={sig.gaze} />
            <Stat label="Near face (%)" value={sig.gaze} unit="%" />
            <Stat label="Mouth open (%)" value={sig.mouth} unit="%" />
            <Stat label="Blinks / min" value={sig.blinks} />
            <Stat label="Noise level" value={sig.noise} />
            <Stat label="Heart rate" value={sig.hr} />
          </div>

          {/* Log mínimo para demo */}
          <div className="mt-4">
            <div className="text-sm font-medium mb-2">Log de actualización</div>
            <div ref={logRef} className="h-40 overflow-auto rounded-lg border bg-slate-50 p-2 text-xs font-mono">
              <div>
                <ClientTime ts={sig.ts} /> • quality={quality.toFixed(0)} •
                noise={sig.noise ?? '—'} • gaze={sig.gaze ?? '—'} • mouth={sig.mouth ?? '—'} • blinks={sig.blinks ?? '—'}
              </div>
            </div>
          </div>
        </section>

        {/* Columna derecha: Chat */}
        <section className="rounded-2xl border bg-white p-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h2 className="font-medium">Care Chat</h2>
            <div className="text-[11px] text-slate-500">Soporte no-diagnóstico</div>
          </div>
          <iframe
            src={chatUrl}
            className="w-full h-[70vh]"
            title="Neuroljus Chat"
          />
        </section>
      </div>
    </main>
  );
}