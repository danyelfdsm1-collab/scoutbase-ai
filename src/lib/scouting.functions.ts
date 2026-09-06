import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InsightInput = z.object({
  position: z.string().min(1),
  category: z.string().min(1),
  focus: z.string().max(200).optional(),
});

export const getScoutingInsights = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InsightInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const prompt = `Você é um observador técnico (scout) de futebol de base no Brasil.
Categoria: ${data.category}. Posição: ${data.position}.${data.focus ? ` Foco adicional: ${data.focus}.` : ""}

Explique, de forma objetiva e prática, o que os observadores técnicos buscam neste atleta.
Responda em português do Brasil, em markdown simples, com estas seções curtas:
### Técnica individual
### Tática / leitura de jogo
### Física
### Mental / comportamental
### Sinais de alerta
Use no máximo 4 bullets por seção, cada bullet com no máximo 20 palavras, adequados à faixa etária.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "google/gemini-3.7-flash",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const message = await res.text();
      if (res.status === 429)
        throw new Error("Muitas solicitações à IA no momento. Tente novamente em instantes.");
      if (res.status === 402)
        throw new Error("Créditos de IA esgotados. Adicione créditos no workspace Lovable.");
      throw new Error(`Falha na IA (${res.status}): ${message.slice(0, 200)}`);
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return { text: json.choices?.[0]?.message?.content ?? "Sem resposta da IA." };
  });

const ScoresInput = z.object({
  position: z.string().min(1),
  category: z.string().min(1),
  notes: z.string().max(1000).optional(),
});

export const generateScores = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ScoresInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const prompt = `Você é um observador técnico (scout) de futebol de base no Brasil.
Categoria: ${data.category}. Posição: ${data.position}.
Observações do olheiro: ${data.notes?.trim() ? data.notes : "nenhuma (gere notas de referência medianas para a posição e categoria)"}.

Gere uma pontuação de 0 a 10 para cada critério abaixo, coerente com as observações.
Responda APENAS com um JSON válido (sem markdown, sem texto extra) no formato:
{"tecnica.controle": 7, "tecnica.passe": 6, "tecnica.finalizacao": 5, "tecnica.conducao": 6, "tecnica.jogo_aereo": 5, "tatica.posicionamento": 6, "tatica.corredores": 5, "tatica.impedimento": 5, "tatica.transicoes": 6, "fisica.velocidade": 7, "fisica.agilidade": 7, "fisica.resistencia": 6, "mental.concentracao": 6, "mental.decisao": 6, "mental.atitude": 7}
Use apenas números inteiros de 0 a 10.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "google/gemini-3.7-flash",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const message = await res.text();
      if (res.status === 429)
        throw new Error("Muitas solicitações à IA no momento. Tente novamente em instantes.");
      if (res.status === 402)
        throw new Error("Créditos de IA esgotados. Adicione créditos no workspace Lovable.");
      throw new Error(`Falha na IA (${res.status}): ${message.slice(0, 200)}`);
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = json.choices?.[0]?.message?.content ?? "";

    let scores: Record<string, number> = {};
    try {
      const match = raw.match(/\{[\s\S]*\}/);
      const parsed = match ? (JSON.parse(match[0]) as Record<string, unknown>) : {};
      scores = Object.fromEntries(
        Object.entries(parsed)
          .filter(([, v]) => typeof v === "number" && Number.isFinite(v))
          .map(([k, v]) => [k, Math.max(0, Math.min(10, Math.round(v as number)))]),
      );
    } catch {
      throw new Error("A IA retornou um formato inválido. Tente novamente.");
    }
    if (!Object.keys(scores).length)
      throw new Error("A IA não retornou notas. Tente novamente.");

    return { scores };
  });

const VideoInput = z.object({
  position: z.string().min(1),
  category: z.string().min(1),
  mimeType: z.string().min(1),
  /** vídeo em base64 puro (sem prefixo data:) */
  videoBase64: z.string().min(100),
});

export const analyzeVideo = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => VideoInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const prompt = `Você é um observador técnico (scout) de futebol de base no Brasil.
Analise o vídeo do atleta. Categoria: ${data.category}. Posição: ${data.position}.

Avalie exclusivamente pelo que é observável no vídeo e gere uma nota inteira de 0 a 10 para cada critério.
Responda APENAS com JSON válido (sem markdown, sem texto extra) no formato:
{"resumo": "2 a 4 frases em português do Brasil sobre o desempenho observado", "scores": {"tecnica.controle": 7, "tecnica.passe": 6, "tecnica.finalizacao": 5, "tecnica.conducao": 6, "tecnica.jogo_aereo": 5, "tatica.posicionamento": 6, "tatica.corredores": 5, "tatica.impedimento": 5, "tatica.transicoes": 6, "fisica.velocidade": 7, "fisica.agilidade": 7, "fisica.resistencia": 6, "mental.concentracao": 6, "mental.decisao": 6, "mental.atitude": 7}}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "google/gemini-3.7-flash",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "video_url",
                video_url: { url: `data:${data.mimeType};base64,${data.videoBase64}` },
              },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const message = await res.text();
      if (res.status === 429)
        throw new Error("Muitas solicitações à IA no momento. Tente novamente em instantes.");
      if (res.status === 402)
        throw new Error("Créditos de IA esgotados. Adicione créditos no workspace Lovable.");
      throw new Error(`Falha na IA (${res.status}): ${message.slice(0, 200)}`);
    }

    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = json.choices?.[0]?.message?.content ?? "";

    let scores: Record<string, number> = {};
    let summary = "";
    try {
      const match = raw.match(/\{[\s\S]*\}/);
      const parsed = match
        ? (JSON.parse(match[0]) as { resumo?: unknown; scores?: Record<string, unknown> })
        : {};
      summary = typeof parsed.resumo === "string" ? parsed.resumo : "";
      scores = Object.fromEntries(
        Object.entries(parsed.scores ?? {})
          .filter(([, v]) => typeof v === "number" && Number.isFinite(v))
          .map(([k, v]) => [k, Math.max(0, Math.min(10, Math.round(v as number)))]),
      );
    } catch {
      throw new Error("A IA retornou um formato inválido. Tente novamente.");
    }
    if (!Object.keys(scores).length)
      throw new Error("A IA não conseguiu avaliar este vídeo. Tente outro trecho.");

    return { scores, summary };
  });
