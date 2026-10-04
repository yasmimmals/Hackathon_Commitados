import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "COCAPEC • Agendamento de Cargas",
    short_name: "COCAPEC",
    description:
      "Portal do fornecedor, da Mesa de Compras e do armazém para agendar e receber cargas no Terminal Logístico Franca/SP.",
    lang: "pt-BR",
    start_url: "/login",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#ffffff",
    theme_color: "#0a5aa4",
    categories: ["business", "productivity"],
    icons: [
      { src: "/icons/icone-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icone-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icone-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Agendar Entrega", url: "/fornecedor/agendar", icons: [{ src: "/icons/icone-192.png", sizes: "192x192" }] },
      { name: "Meus Agendamentos", url: "/fornecedor/agendamentos", icons: [{ src: "/icons/icone-192.png", sizes: "192x192" }] },
      { name: "Recebimento do dia", url: "/armazem/recebimento", icons: [{ src: "/icons/icone-192.png", sizes: "192x192" }] },
      { name: "Fila de Validação", url: "/compras/validacoes", icons: [{ src: "/icons/icone-192.png", sizes: "192x192" }] },
    ],
  };
}
