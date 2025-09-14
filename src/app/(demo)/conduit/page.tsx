'use client';
import { useEffect, useState } from 'react';

type Sig = { t: number; type: 'ruido' | 'pausa' | 'gaze' | 'hr'; value: number };

export default function ConduitPage() {
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<Sig[]>([]);
  const [quality, setQuality] = useState<number>(0);

  // Stream simulado de señales
  useEffect(() => {
    if (!running) return;
    const tick = setInterval(() => {
      const types: Sig['type'][] = ['ruido', 'pausa', 'gaze', 'hr'];
      const type = types[Math.floor(Math.random() * types.length)];
      const value = Math.round((Math.random() * 100) * 10) / 10;

      setLog((l) => [...l.slice(-300), { t: Date.now(), type, value }]);

      // Calidad simple: % de muestras en rango medio (suavizada)
      setQuality((q) => {
        const ok = value > 10 && value < 90 ? 1 : 0;
        return Math.round((0.9 * q + 0.1 * ok) * 100) / 100;
      });
    }, 800);
    return () => clearInterval(tick);
  }, [running]);

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">Conduit · señales simuladas</h1>
      <p className="text-slate-600 mt-1">
        Arranca/parar stream y observa el log. Luego conectamos dispositivo real.
      </p>

      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={() => setRunning(v => !v)}
          className="rounded-xl px-4 py-2 bg-black text-white"
        >
          {running ? 'Parar stream' : 'Arrancar stream'}
        </button>
        <button
          onClick={() => setLog([])}
          className="rounded-xl px-4 py-2 border"
        >
          Limpiar
        </button>
        <span className="text-sm text-slate-600">
          Calidad señal: <b>{Math.round(quality * 100)}%</b>
        </span>
      </div>

      <div className="mt-4 border rounded-2xl p-3 h-[60vh] overflow-auto bg-white">
        {log.length === 0 && (
          <div className="text-sm text-slate-500">
            Sin datos… (pulsa “Arrancar stream”)
          </div>
        )}
        {log.slice().reverse().map((s, i) => (
          <div key={i} className="font-mono text-xs">
            {new Date(s.t).toLocaleTimeString()} · {s.type.padEnd(6)} → {s.value}
          </div>
        ))}
      </div>
    </main>
  );
}