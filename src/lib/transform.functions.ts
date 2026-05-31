import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type TransformMode =
  | "bordado-iniciante"
  | "bordado-intermediario"
  | "bordado-profissional"
  | "pintura-tecido"
  | "cartoon-disney"
  | "cartoon-mangá"
  | "vetorial"
  | "realista-simplificado"
  | "grafite"
  | "linear";

const PROMPTS: Record<TransformMode, string> = {
  "bordado-iniciante":
    "Redesenhe a imagem como um RISCO PARA BORDADO LIVRE NÍVEL INICIANTE. Linhas pretas finas e contínuas, formas grandes e simplificadas, pouquíssimos detalhes, fundo branco puro, sem sombreamento, sem hachuras, sem texturas, sem fotorealismo. Apenas contornos limpos vetoriais. Preserve a identidade do assunto (rosto, anatomia, expressão).",
  "bordado-intermediario":
    "Redesenhe como RISCO PARA BORDADO INTERMEDIÁRIO. Linhas pretas finas, contornos limpos, detalhes médios em olhos, boca e dobras principais. Fundo branco. Sem sombreamento, sem hachura, sem ruído. Estilo de ilustrador profissional.",
  "bordado-profissional":
    "Redesenhe como RISCO PARA BORDADO PROFISSIONAL/REALISTA. Linhas pretas finas e elegantes, detalhamento artístico em cabelos, olhos e tecidos com poucas linhas direcionais (sem hachura densa). Fundo branco. Pronto para transferir para tecido. Sem cor.",
  "pintura-tecido":
    "Redesenhe como RISCO PARA PINTURA EM TECIDO. Linhas pretas fechadas formando áreas bem delimitadas (luz, sombra, volume, fundo, primeiro plano). Sem cor, fundo branco, contornos limpos, fácil de pintar com tintas para tecido.",
  "cartoon-disney":
    "Recrie a imagem como ILUSTRAÇÃO CARTOON ESTILO DISNEY/PIXAR. Cores vibrantes, traço limpo, olhos expressivos grandes, proporções estilizadas, iluminação suave. Preserve a identidade do assunto.",
  "cartoon-mangá":
    "Recrie como ILUSTRAÇÃO MANGÁ/ANIME profissional. Traço limpo, olhos grandes, cabelo estilizado, cores chapadas com leve sombreamento cel-shading.",
  vetorial:
    "Recrie como ARTE VETORIAL FLAT profissional. Formas geométricas limpas, cores chapadas, contornos definidos, estilo ilustração editorial moderna. Fundo simples.",
  "realista-simplificado":
    "Recrie como DESENHO REALISTA SIMPLIFICADO. Linhas elegantes, sombreamento suave em escala de cinza, detalhes essenciais, sem ruído fotográfico.",
  grafite:
    "Recrie como DESENHO EM GRAFITE artístico profissional, com sombreamento realista a lápis, traços suaves, papel branco texturizado de fundo.",
  linear:
    "Recrie como ILUSTRAÇÃO LINEAR (line art) profissional, traço preto contínuo de espessura uniforme, fundo branco, sem preenchimento, estilo editorial moderno.",
};

const InputSchema = z.object({
  imageBase64: z.string().min(100),
  mode: z.string(),
});

export const transformImage = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY ausente");

    const mode = (data.mode as TransformMode) in PROMPTS
      ? (data.mode as TransformMode)
      : "linear";
    const prompt = PROMPTS[mode];

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: data.imageBase64 } },
            ],
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      if (res.status === 429) throw new Error("Limite de requisições atingido. Tente novamente em instantes.");
      if (res.status === 402) throw new Error("Créditos de IA esgotados. Adicione créditos no workspace.");
      throw new Error(`Falha na IA (${res.status}): ${text.slice(0, 200)}`);
    }

    const json = await res.json();
    const msg = json.choices?.[0]?.message;
    const imageUrl: string | undefined =
      msg?.images?.[0]?.image_url?.url ?? msg?.images?.[0]?.url;
    if (!imageUrl) throw new Error("A IA não retornou imagem.");
    return { imageUrl, text: typeof msg?.content === "string" ? msg.content : "" };
  });
