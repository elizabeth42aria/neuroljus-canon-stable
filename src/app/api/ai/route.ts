import { NextResponse } from "next/server";
import { NEUROLJUS_STYLE, KB_SENSORY_OVERLOAD, KB_COMMUNICATION } from "./policies";

const MODEL = process.env.MODEL || "gpt-4o-mini";

type Lang = "sv" | "es" | "en";
type Audience = "clinician" | "caregiver" | "adult" | "youth";
type Signals = Record<string, unknown>;
type Memory = {
  preferredName?: string;
  calmingWords?: string[];
  avoidWords?: string[];
  knownTriggers?: string[];
};

export async function POST(req: Request) {
  try {
    const {
      messages,
      lang = "sv",
      audience = "caregiver",
      signals = {},
      memory = {},
      temperature = 0.4,
      allowInitiative = true,
    } = await req.json();

    const key = process.env.OPENAI_API_KEY;
    if (!key) return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });

    const system = buildSystemPrompt({ lang, audience, signals, memory, allowInitiative });

    const payload = {
      model: MODEL,
      temperature: Math.max(0, Math.min(1, temperature)),
      messages: [{ role: "system", content: system }].concat(
        (Array.isArray(messages) ? messages : []).slice(-14)
      ),
    } as const;

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify(payload),
    });

    if (!r.ok) return NextResponse.json({ error: await r.text() }, { status: 502 });
    const data = await r.json();
    return NextResponse.json({ content: data?.choices?.[0]?.message?.content ?? "" });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "unknown" }, { status: 500 });
  }
}

function buildSystemPrompt({
  lang,
  audience,
  signals,
  memory,
  allowInitiative,
}: {
  lang: Lang;
  audience: Audience;
  signals: Signals;
  memory: Memory;
  allowInitiative: boolean;
}) {
  const langInstr: Record<Lang, string> = {
    sv: "Svara på enkel, tydlig svenska. Korta meningar, lugn ton.",
    es: "Responde en español claro y técnico; frases cortas, tono sereno.",
    en: "Respond in clear, plain English; short sentences, calm tone.",
  };

  const audMap: Record<Audience, string> = {
    clinician:
      "Audience=clinician. Use concise clinical vocabulary; reference mechanisms briefly; never overstate certainty.",
    caregiver:
      "Audience=caregiver. Practical tone; environment adjustments; short steps; communication scripts.",
    adult:
      "Audience=autistic adult/self-advocate. Collaborative; autonomy-respecting; offer options; ask consent to explore.",
    youth:
      "Audience=youth. Simple sentences; no jargon; one step at a time.",
  };

  const mem = safeJson(memory);
  const sig = safeJson(signals);

  return `
${NEUROLJUS_STYLE}

${langInstr[lang]}
${audMap[audience]}

You are Neuroljus. Use the following knowledge when relevant:
- Sensory overload heuristics: ${KB_SENSORY_OVERLOAD}
- Communication strategies: ${KB_COMMUNICATION}

Context:
- Signals: ${sig}
- Lightweight memory: ${mem}
- Initiative: ${allowInitiative ? "Allowed to gently propose options if clearly useful." : "Do not propose unsolicited suggestions."}

Response format:
1) Brief acknowledgement (1 sentence).
2) If applicable: "Hypothesis (confidence: low/medium/high): … Because …"
3) "Next 5–20 min:" 2–4 bullet steps.
4) Optional: "Ask:" one clarifying question.

Hard rules:
- Non-diagnostic. Avoid “you have X”. Prefer “may be related to…”.
- No prescriptions/dosages.
- If risk detected (self-harm, harm, severe symptoms) → recommend urgent professional help.
- Be concise. Avoid “retreat/coach” language; stay professional and supportive.
`;
}

function safeJson(obj: unknown) {
  try { return JSON.stringify(obj).slice(0, 1500); } catch { return "{}"; }
}