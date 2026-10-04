import { CheckCircle2, Lock, XCircle } from "lucide-react";
import type { Boletim, ResumoBoletim } from "../types";
import { decimal, moeda, pagamentoChapa, type Verificacao } from "../utils/calculo";

type FechamentoBoletimProps = {
  boletim: Boletim;
  resumo: ResumoBoletim;
  verificacoes: Verificacao[];
  onFechar: () => void;
};

export default function FechamentoBoletim({ boletim, resumo, verificacoes, onFechar }: FechamentoBoletimProps) {
  const fechado = boletim.status === "FECHADO";
  const valido = verificacoes.every((v) => v.ok);
  const abaixoDoPiso = resumo.diariasEquivalentes > 0 && resumo.valorPorDiaria < resumo.piso;

  const linhas = [
    { rotulo: "Produção total", valor: moeda(resumo.producaoTotal) },
    { rotulo: "Diárias equivalentes", valor: decimal(resumo.diariasEquivalentes) },
    { rotulo: "Valor por diária (produção ÷ diárias)", valor: moeda(resumo.valorPorDiaria) },
    { rotulo: "Piso por diária completa", valor: moeda(resumo.piso) },
    { rotulo: "Complemento pago pela cooperativa", valor: moeda(resumo.complemento), destaque: resumo.complemento > 0 },
  ];

  return (
    <div className="space-y-6">
      <section aria-labelledby="validacao-titulo" className="rounded-3xl bg-white p-5 shadow-sm">
        <h2 id="validacao-titulo" className="titulo-secao mb-3 border-b-[3px] border-site-amarelo pb-2 text-lg">3. Validação dos dados</h2>
        <ul className="space-y-2">
          {verificacoes.map((v) => (
            <li key={v.regra} className="flex items-start gap-2 text-sm">
              {v.ok ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-label="Ok" />
              ) : (
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-label="Pendente" />
              )}
              <span>
                <span className={v.ok ? "text-gray-800" : "font-semibold text-red-800"}>{v.regra}</span>
                {v.detalhe && <span className="block text-xs text-gray-500">{v.detalhe}</span>}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="fechamento-titulo" className="rounded-3xl bg-white p-5 shadow-sm">
        <h2 id="fechamento-titulo" className="titulo-secao mb-3 border-b-[3px] border-site-amarelo pb-2 text-lg">4. Fechamento</h2>
        <dl className="divide-y divide-gray-100 text-sm">
          {linhas.map((l) => (
            <div key={l.rotulo} className="flex justify-between gap-3 py-1.5">
              <dt className="text-gray-600">{l.rotulo}</dt>
              <dd className={`font-semibold tabular-nums ${l.destaque ? "text-red-700" : "text-gray-900"}`}>{l.valor}</dd>
            </div>
          ))}
          <div className="flex justify-between gap-3 pt-2">
            <dt className="font-bold text-gray-900">Total a pagar</dt>
            <dd className="text-lg font-bold tabular-nums text-site-azul">{moeda(resumo.totalPagar)}</dd>
          </div>
        </dl>
        {abaixoDoPiso && (
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
            A produção por diária ficou abaixo do piso: cada chapa recebe o piso e a diferença entra como complemento.
          </p>
        )}

        {boletim.chapas.length > 0 && (
          <div className="mt-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Pagamento por chapa</p>
            <ul className="max-h-60 divide-y divide-gray-100 overflow-y-auto text-sm">
              {boletim.chapas.map((c, i) => (
                <li key={`${c.matricula}-${i}`} className="flex justify-between gap-3 py-1">
                  <span className="text-gray-700">
                    {c.nome} <span className="text-xs text-gray-400">({c.meiaDiaria ? "meia" : "completa"})</span>
                  </span>
                  <span className="font-semibold tabular-nums text-gray-900">{moeda(pagamentoChapa(c, resumo))}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {fechado ? (
          <p className="mt-4 flex items-center gap-2 rounded-xl bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700">
            <Lock className="h-4 w-4" aria-hidden /> Boletim fechado em{" "}
            {boletim.fechadoEm && new Date(boletim.fechadoEm).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
          </p>
        ) : (
          <>
            <button
              type="button"
              onClick={onFechar}
              disabled={!valido}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-site-verde px-4 py-3 text-sm font-bold text-white hover:bg-site-verde-escuro focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-verde focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Lock className="h-4 w-4" aria-hidden /> Fechar boletim
            </button>
            {!valido && <p className="mt-1 text-center text-xs text-red-700">Corrija os itens da validação para fechar.</p>}
          </>
        )}
      </section>
    </div>
  );
}
