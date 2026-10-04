import { CalendarCheck, LoaderCircle, Send } from "lucide-react";
import { ACONDICIONAMENTOS } from "../constants";
import type { NovaEntrega } from "../types";
import { formatarData, rotuloCategoria } from "../utils/agendamento";

const PROXIMOS_PASSOS = [
  "A Mesa de Compras valida a NF contra o pedido (resposta média: 45 min).",
  "Aprovado, o agendamento aparece em Autorizados com o QR Pass da portaria.",
  "Chegue até 30 min após o horário. Depois disso a vaga pode ser liberada.",
];

export function ListaResumo({ entrega }: { entrega: NovaEntrega }) {
  const acondicionamento = ACONDICIONAMENTOS.find((a) => a.key === entrega.acondicionamento)?.rotulo;
  const itens = [
    { rotulo: "Data", valor: entrega.data && formatarData(entrega.data) },
    { rotulo: "Horário", valor: entrega.horario && entrega.horario.replace(":00", "h") },
    { rotulo: "Categoria", valor: rotuloCategoria(entrega.categoria) },
    { rotulo: "Acondicionamento", valor: acondicionamento },
    { rotulo: "Peso", valor: entrega.peso && `${entrega.peso} t` },
    { rotulo: "Nota fiscal", valor: entrega.notaFiscal?.name },
  ];

  return (
    <dl className="divide-y divide-gray-100 text-sm">
      {itens.map(({ rotulo, valor }) => (
        <div key={rotulo} className="flex justify-between gap-3 py-1.5">
          <dt className="text-gray-500">{rotulo}</dt>
          <dd className={`min-w-0 truncate text-right font-medium ${valor ? "text-gray-900" : "text-gray-400"}`}>
            {valor || "—"}
          </dd>
        </div>
      ))}
    </dl>
  );
}

type ResumoAgendamentoProps = {
  entrega: NovaEntrega;
  enviando: boolean;
 
  erroEnvio?: string;
};

export default function ResumoAgendamento({ entrega, enviando, erroEnvio }: ResumoAgendamentoProps) {
  return (
    <aside className="space-y-4 lg:sticky lg:top-4">
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-800">
          <CalendarCheck className="h-4 w-4 text-marca" aria-hidden /> Resumo do agendamento
        </h2>
        <ListaResumo entrega={entrega} />
        {erroEnvio && (
          <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{erroEnvio}</p>
        )}
        <button
          type="submit"
          disabled={enviando}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-marca px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-marca-escuro focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
        >
          {enviando ? (
            <><LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> Enviando…</>
          ) : (
            <><Send className="h-4 w-4" aria-hidden /> Enviar para validação</>
          )}
        </button>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-semibold text-gray-800">Próximos passos</h2>
        <ol className="space-y-2">
          {PROXIMOS_PASSOS.map((passo, i) => (
            <li key={passo} className="flex gap-2 text-xs text-gray-600">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[10px] font-bold text-marca" aria-hidden>
                {i + 1}
              </span>
              {passo}
            </li>
          ))}
        </ol>
      </section>
    </aside>
  );
}
