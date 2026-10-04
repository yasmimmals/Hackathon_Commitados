import type { ReactNode } from "react";

type SecaoProps = {
  numero: number;
  titulo: string;
  descricao?: string;
  aside?: ReactNode;
  children: ReactNode;
};


export default function Secao({ numero, titulo, descricao, aside, children }: SecaoProps) {
  const idTitulo = `secao-${numero}-titulo`;
  return (
    <section aria-labelledby={idTitulo} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-marca text-xs font-bold text-white" aria-hidden>
            {numero}
          </span>
          <div>
            <h2 id={idTitulo} className="titulo-secao text-lg">{titulo}</h2>
            {descricao && <p className="text-xs text-gray-500">{descricao}</p>}
          </div>
        </div>
        {aside}
      </header>
      {children}
    </section>
  );
}
