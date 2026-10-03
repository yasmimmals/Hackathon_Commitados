import type { ReactNode } from "react";

type CardCondicaoProps = {
  titulo: string;
  icone: ReactNode;
  children: ReactNode;
};


export default function CardCondicao({ titulo, icone, children }: CardCondicaoProps) {
  return (
    <section className="flex flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <header className="mb-2 flex items-start justify-between">
        <h2 className="text-[11px] font-bold uppercase tracking-wide text-gray-500">{titulo}</h2>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 text-gray-600" aria-hidden>
          {icone}
        </span>
      </header>
      {children}
    </section>
  );
}

export function LinhaInfo({ rotulo, valor }: { rotulo: string; valor: ReactNode }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-gray-500">{rotulo}</span>
      <span className="font-semibold text-gray-800">{valor}</span>
    </div>
  );
}
