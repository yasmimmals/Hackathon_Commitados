import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { Ubuntu } from "next/font/google";
import "./globals.css";


const ubuntu = Ubuntu({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  style: ["normal", "italic"],
  variable: "--font-ubuntu",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "COCAPEC • Agendamento de Cargas",
    template: "%s | COCAPEC Agendamentos",
  },
  description:
    "Portal do fornecedor para agendar e acompanhar janelas de descarregamento no Terminal Logístico Franca/SP.",
};

export const viewport: Viewport = {
  themeColor: "#0a5aa4",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${ubuntu.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-fundo font-sans text-gray-900">
        {children}
      </body>
    </html>
  );
}
