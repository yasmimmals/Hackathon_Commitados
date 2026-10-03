import { Construction } from "lucide-react";

type EmConstrucaoProps = {
  titulo: string;
  acoes: string[];
};

/** Placeholder de telas cuja rota e permissão já existem, mas a interface não. */
export default function EmConstrucao({ titulo, acoes }: EmConstrucaoProps) {
  return (
    <section className="rounded-xl border border-dashed border-gray-300 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-600" aria-hidden>
          <Construction className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-gray-900">{titulo}</h1>
          <p className="text-sm text-gray-500">Tela em construção — rota e permissão já configuradas.</p>
        </div>
      </div>
      <h2 className="mt-5 text-xs font-bold uppercase tracking-wide text-gray-500">Ações previstas</h2>
      <ul className="mt-2 space-y-1.5">
        {acoes.map((acao) => (
          <li key={acao} className="flex gap-2 text-sm text-gray-700">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-marca" aria-hidden />
            {acao}
          </li>
        ))}
      </ul>
    </section>
  );
}
