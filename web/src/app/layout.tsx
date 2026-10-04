import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible, Ubuntu } from "next/font/google";
import AvisoConexao from "@/shared/components/pwa/AvisoConexao";
import RegistroPwa from "@/shared/components/pwa/RegistroPwa";
import { ProvedorAcessibilidade, SCRIPT_ANTES_DE_PINTAR } from "@/shared/acessibilidade";
import "./globals.css";


const ubuntu = Ubuntu({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  style: ["normal", "italic"],
  variable: "--font-ubuntu",
  display: "swap",
});

// Fonte de alta legibilidade (Braille Institute), ativada pela opção "Fonte para dislexia"
const atkinson = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-atkinson",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "COCAPEC • Agendamento de Cargas",
    template: "%s | COCAPEC Agendamentos",
  },
  description:
    "Portal do fornecedor para agendar e acompanhar janelas de descarregamento no Terminal Logístico Franca/SP.",
  applicationName: "COCAPEC",
  appleWebApp: { capable: true, title: "COCAPEC", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0a5aa4",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${ubuntu.variable} ${atkinson.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/* aplica tema e tamanho de texto salvos ANTES de pintar: sem "flash" para quem usa alto contraste */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_ANTES_DE_PINTAR }} />
      </head>
      <body className="flex min-h-full flex-col bg-fundo font-sans text-gray-900">
        <ProvedorAcessibilidade>
          {children}
          <AvisoConexao />
          <RegistroPwa />
        </ProvedorAcessibilidade>
      </body>
    </html>
  );
}
