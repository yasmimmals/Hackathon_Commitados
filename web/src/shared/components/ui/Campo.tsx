import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

/** Classe base dos inputs de formulário. Combine com `tomCampo(erro)`. */
export const CLASSE_CAMPO =
  "w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2";

export const tomCampo = (erro?: string) =>
  erro
    ? "border-red-300 focus:border-red-500 focus:ring-red-100"
    : "border-gray-200 focus:border-marca focus:ring-emerald-100";

type CampoProps = {
  id: string;
  rotulo: string;
  icone?: LucideIcon;
  erro?: string;
  children: ReactNode;
};

/** Rótulo + controle + mensagem de erro (com id `${id}-erro` para aria-describedby). */
export default function Campo({ id, rotulo, icone: Icone, erro, children }: CampoProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-gray-700">
        {Icone && <Icone className="h-3.5 w-3.5 text-marca" aria-hidden />} {rotulo}
      </label>
      {children}
      {erro && <p id={`${id}-erro`} className="mt-1 text-xs text-red-600">{erro}</p>}
    </div>
  );
}
