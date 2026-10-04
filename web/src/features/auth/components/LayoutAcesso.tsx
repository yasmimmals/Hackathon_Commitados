import type { ReactNode } from "react";
import { TreePine } from "lucide-react";
import LogoCocapec from "@/shared/components/ui/LogoCocapec";


function SimboloCocapec({ className, tom }: { className: string; tom: "marca" | "claro" }) {
  const claro = tom === "claro";
  return (
    <span className={`relative flex items-center justify-center ${className}`} aria-hidden>
      <svg viewBox="0 0 512 512" className="absolute inset-0 h-full w-full">
        <circle cx="256" cy="256" r="226" fill="none" stroke={claro ? "currentColor" : "#4ea72e"} strokeWidth="44"
          strokeLinecap="round" strokeDasharray="664 756" transform="rotate(132 256 256)" />
        <circle cx="256" cy="256" r="226" fill="none" stroke={claro ? "currentColor" : "#0a5aa4"} strokeWidth="44"
          strokeLinecap="round" strokeDasharray="580 840" transform="rotate(325 256 256)" />
        <circle cx="256" cy="256" r="168" fill={claro ? "currentColor" : "#f2b705"} opacity={claro ? 0.35 : 1} />
      </svg>
      <span className="relative flex w-[62%] items-end justify-center -space-x-[12%]">
        <TreePine className={`h-auto w-[56%] ${claro ? "" : "text-[#3f9b2f]"}`} fill="currentColor" strokeWidth={1.2} />
        <TreePine className={`h-auto w-[48%] ${claro ? "" : "text-site-verde"}`} fill="currentColor" strokeWidth={1.2} />
      </span>
    </span>
  );
}

export default function LayoutAcesso({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[linear-gradient(135deg,#0a5aa4_0%,#2f86a8_45%,#4ea72e_100%)]">
      
      <div className="relative hidden flex-1 overflow-hidden lg:block" aria-hidden>
        <div className="absolute inset-0 opacity-20 [background:repeating-linear-gradient(115deg,transparent_0_60px,rgba(255,255,255,0.35)_60px_62px)]" />
        
        <SimboloCocapec tom="claro" className="absolute -bottom-56 -left-48 h-140 w-140 text-white/15" />
        
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-10 text-center text-white">
          <span className="rounded-full bg-white p-5 shadow-2xl ring-8 ring-white/25">
            <SimboloCocapec tom="marca" className="h-40 w-40" />
          </span>
          <p className="max-w-sm text-2xl font-bold italic drop-shadow">O melhor café está aqui</p>
          <p className="max-w-xs text-sm text-white/85">Portal de agendamento e recebimento de cargas do Terminal Logístico Franca/SP</p>
        </div>
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
