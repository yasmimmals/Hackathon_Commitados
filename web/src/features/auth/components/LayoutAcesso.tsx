import type { ReactNode } from "react";
import LogoCocapec from "@/shared/components/ui/LogoCocapec";

/** Símbolo da COCAPEC em contorno, usado como marca d'água no painel da esquerda. */
function MarcaDagua() {
  return (
    <svg viewBox="0 0 400 400" aria-hidden className="absolute -bottom-24 -left-24 h-140 w-140 text-white/25">
      <circle cx="200" cy="200" r="190" fill="none" stroke="currentColor" strokeWidth="26" />
      <circle cx="200" cy="200" r="140" fill="none" stroke="currentColor" strokeWidth="14" />
      <path d="M200 70 L130 290 Q200 250 270 290 Z" fill="currentColor" />
      <path d="M200 250 V340" stroke="currentColor" strokeWidth="14" />
    </svg>
  );
}

/** Moldura das telas de login e cadastro: painel em degradê à esquerda e o formulário à direita. */
export default function LayoutAcesso({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[linear-gradient(135deg,#0a5aa4_0%,#2f86a8_45%,#4ea72e_100%)]">
      {/* Painel decorativo (só em telas largas) */}
      <div className="relative hidden flex-1 overflow-hidden lg:block" aria-hidden>
        <div className="absolute inset-0 opacity-20 [background:repeating-linear-gradient(115deg,transparent_0_60px,rgba(255,255,255,0.35)_60px_62px)]" />
        <MarcaDagua />
      </div>

      <main className="relative flex w-full flex-col justify-center bg-white px-6 py-10 sm:px-10 lg:w-[42%] lg:min-w-130 lg:rounded-l-[48px] lg:px-12">
        <div className="mx-auto w-full max-w-130">
          <div className="flex justify-center">
            <LogoCocapec />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

export const CLASSE_INPUT_ACESSO =
  "h-14 w-full rounded-xl border border-gray-400 bg-white px-4 text-[15px] text-gray-900 placeholder:text-gray-500 focus-visible:border-site-azul focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-azul/30";
