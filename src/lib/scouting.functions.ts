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
