import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "COCAPEC • Agendamento de Cargas",
    template: "%s | COCAPEC Agendamentos",
  },
  description:
    "Portal do fornecedor para agendar e acompanhar janelas de descarregamento no Terminal Logístico Franca/SP.",
};

export const viewport: Viewport = {
  themeColor: "#0d7d48",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-fundo font-sans text-gray-900">
        {children}
      </body>
    </html>
  );
}
