import { createFileRoute } from "@tanstack/react-router";
import Studio from "@/components/Studio";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Atelier AI Studio · Bordado, Pintura, Ponto Cruz & Ilustração" },
      { name: "description", content: "Plataforma premium com IA multimodal para transformar imagens em riscos de bordado, pintura em tecido, ponto cruz, cartoon e arte vetorial." },
      { property: "og:title", content: "Atelier AI Studio" },
      { property: "og:description", content: "Riscos, ponto cruz e ilustração profissional gerados por IA." },
    ],
  }),
  component: Studio,
});
