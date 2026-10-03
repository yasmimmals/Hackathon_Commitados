import type { ReactNode } from "react";

type PainelProps = {
  titulo: ReactNode;
  descricao?: string;
  acao?: ReactNode;
  children: ReactNode;
};

/** Cartão branco padrão das seções do boletim (cabeçalho + conteúdo). */
export default function Painel({ titulo, descricao, acao, children }: PainelProps) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <header className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-800">{titulo}</h2>
          {descricao && <p className="text-xs text-gray-500">{descricao}</p>}
        </div>
        {acao}
      </header>
      {children}
    </section>
  );
}
