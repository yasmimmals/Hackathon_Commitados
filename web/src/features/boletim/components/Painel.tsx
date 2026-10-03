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
    <section className="rounded-3xl bg-white p-5 shadow-sm">
      <header className="mb-3 flex items-start justify-between gap-3 border-b-[3px] border-site-amarelo pb-2">
        <div>
          <h2 className="titulo-secao flex items-center gap-2 text-base">{titulo}</h2>
          {descricao && <p className="text-xs text-gray-500">{descricao}</p>}
        </div>
        {acao}
      </header>
      {children}
    </section>
  );
}
