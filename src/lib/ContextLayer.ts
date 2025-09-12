// nl-context-layer.js
// Ajustado para arrancar rápido el baseline y emitir con suavizado

export class ContextLayer {
  public cfg: any;
  constructor(opts = {}) {
    this.cfg = {
      // ⬇️ Arranque rápido del baseline personal (antes: 15min / 60 muestras)
      baselineHalfLifeMin: opts.baselineHalfLifeMin ?? 3,
      minSamplesForBaseline: opts.minSamplesForBaseline ?? 10,

      // Sensibilidad por z-score relativo al baseline personal
      zInfo:  opts.zInfo  ?? 0.5,
      zWarn:  opts.zWarn  ?? 1.5,
      zAlert: opts.zAlert ?? 2.5,

      // Anti-ruido: no emitas “calm” más de una vez por ~1.5s
      minEmitIntervalMs: 1500,
    };

    this.signals = {
      blinks_per_min: this._newChannel(),
    };

    this._lastEmit = 0;
  }

  _now() {
    return (typeof performance !== 'undefined' && performance.now)
      ? performance.now()
      : Date.now();
  }

  _newChannel() {
    return {
      haveBaseline: false,
      mean: 0,
      var: 0,
      n: 0,
      alpha: null,
      lastTs: null,
    };
  }

  update(name, value, tsMs = this._now()) {
    // Ignora valores no numéricos
    if (typeof value !== 'number' || !isFinite(value)) return;

    if (!(name in this.signals)) this.signals[name] = this._newChannel();
    const ch = this.signals[name];

    // Inicializa alpha dinámico según half-life
    if (ch.alpha == null) {
      const halfLife = this.cfg.baselineHalfLifeMin * 60 * 1000; // ms
      ch.alpha = (dtMs) => 1 - Math.exp(-Math.LN2 * (dtMs / Math.max(1, halfLife)));
    }

    // Primera muestra
    if (ch.n === 0) {
      ch.mean = value;
      ch.var = 0;
      ch.n = 1;
      ch.lastTs = tsMs;
      return;
    }

    // Paso variable
    const dt = Math.max(1, tsMs - ch.lastTs);
    ch.lastTs = tsMs;
    const a = ch.alpha(dt);

    // EMA media
    const prevMean = ch.mean;
    ch.mean = (1 - a) * ch.mean + a * value;

    // Varianza EMA (aprox)
    const diff = value - prevMean;
    ch.var = Math.max(0, (1 - a) * (ch.var + a * diff * diff));

    ch.n++;
    if (!ch.haveBaseline && ch.n >= this.cfg.minSamplesForBaseline) ch.haveBaseline = true;

    if (ch.haveBaseline && name === 'blinks_per_min') {
      const z = (value - ch.mean) / (Math.sqrt(ch.var + 1e-6) || 1e-6);
      const payload = this._interpretBlinks(z, value, ch);
      this._emitContextThrottled(payload);
    }
  }

  _interpretBlinks(z, value, ch) {
    let state = 'calm';
    const az = Math.abs(z);
    if (az >= this.cfg.zInfo)  state = 'notable';
    if (az >= this.cfg.zWarn)  state = 'heightened';
    if (az >= this.cfg.zAlert) state = 'marked';

    const hypotheses = [];
    if (z > this.cfg.zInfo) {
      hypotheses.push('posible sobrecarga sensorial');
      hypotheses.push('posible fatiga ocular o sequedad');
    } else if (z < -this.cfg.zInfo) {
      hypotheses.push('posible relajación profunda o somnolencia');
    } else {
      hypotheses.push('compatible con calma personal');
    }

    const recommendation = {
      text: this._phraseFromBlinks(state, z, value, hypotheses),
      meta: { z, value, mean: ch.mean },
    };

    return {
      signal: 'blinks_per_min',
      z, state, value,
      hypotheses,
      recommendation,
    };
  }

  _phraseFromBlinks(state, z, value, hypotheses) {
    const hint = hypotheses[0] ?? 'estado no definido';
    const dz = `Δ≈${z.toFixed(1)}σ`;
    if (state === 'marked') {
      return `Cambio marcado en parpadeos (${dz}); ${hint}. Considera bajar estímulos y ofrecer agua/pausa.`;
    }
    if (state === 'heightened') {
      return `Cambio notable en parpadeos (${dz}); ${hint}. Quizá reducir luz o sonido un momento.`;
    }
    if (state === 'notable') {
      return `Variación leve en parpadeos (${dz}); ${hint}. Observemos y confirmemos con la persona/cuidador.`;
    }
    return `Parpadeos dentro del rango personal. Compatible con calma.`;
  }

  _emitContext(detail) {
    try {
      window.dispatchEvent(new CustomEvent('nl:context', { detail }));
    } catch {}
  }

  _emitContextThrottled(detail) {
    const now = this._now();
    if (detail.state === 'calm' && now - this._lastEmit < this.cfg.minEmitIntervalMs) return;
    this._lastEmit = now;
    this._emitContext(detail);
    return;
  }
}
