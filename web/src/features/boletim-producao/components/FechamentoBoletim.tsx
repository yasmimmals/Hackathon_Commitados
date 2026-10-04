import { AlertTriangle, CheckCircle2, LoaderCircle, Lock, LockOpen, XCircle } from "lucide-react";
import type { Boletim } from "@/shared/services";
import { decimal, moeda } from "@/shared/utils/formatacao";
import { pagamentoChapa, type Verificacao } from "../utils/boletim";

type FechamentoBoletimProps = {
  boletim: Boletim;
  verificacoes: Verificacao[];
  /** Produção editada e ainda não salva: fechar agora usaria os números antigos. */
  producaoPendente: boolean;
  enviando: boolean;
  onFechar: () => void;
  onReabrir: () => void;
};

export default function FechamentoBoletim({ boletim, verificacoes, producaoPendente, enviando, onFechar, onReabrir }: FechamentoBoletimProps) {
  const c = boletim.calculo;
  const fechado = boletim.status === "FECHADO";
  const bloqueios = verificacoes.filter((v) => !v.ok && !v.aviso);
  const podeFechar = bloqueios.length === 0 && !producaoPendente;

  const linhas = [
    { rotulo: "Produção total", valor: moeda(c.producao_total) },
    { rotulo: "Diárias equivalentes", valor: decimal(c.diarias_equivalentes) },
    { rotulo: "Valor por diária (produção ÷ diárias)", valor: c.valor_por_diaria == null ? "—" : moeda(c.valor_por_diaria) },
    { rotulo: "Piso por diária completa", valor: Number(c.piso_diaria).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 4 }) },
    { rotulo: "Piso total da equipe", valor: moeda(c.piso_total) },
    { rotulo: "Complemento pago pela cooperativa", valor: moeda(c.complemento), destaque: c.abaixo_do_piso },
  ];

  return (
    <div className="space-y-6">
      <section aria-labelledby="validacao-titulo" className="rounded-3xl bg-white p-5 shadow-sm">
        <h2 id="validacao-titulo" className="titulo-secao mb-3 border-b-[3px] border-site-amarelo pb-2 text-lg">3. Validação dos dados</h2>
        <ul className="space-y-2">
          {verificacoes.map((v) => {
            const Icone = v.ok ? CheckCircle2 : v.aviso ? AlertTriangle : XCircle;
            const cor = v.ok ? "text-emerald-600" : v.aviso ? "text-amber-600" : "text-red-600";
            return (
              <li key={v.regra} className="flex items-start gap-2 text-sm">
                <Icone className={`mt-0.5 h-4 w-4 shrink-0 ${cor}`} aria-label={v.ok ? "Ok" : v.aviso ? "Atenção" : "Pendente"} />
                <span>
                  <span className={v.ok ? "text-gray-800" : v.aviso ? "font-semibold text-amber-900" : "font-semibold text-red-800"}>{v.regra}</span>
                  {v.detalhe && <span className="block text-xs text-gray-500">{v.detalhe}</span>}
                </span>
              </li>
            );
          })}
        </ul>
        {boletim.avisos.length > 0 && (
          <ul className="mt-3 space-y-1 rounded-xl bg-amber-50 p-3">
            {boletim.avisos.map((a) => (
              <li key={a} className="flex items-start gap-2 text-xs text-amber-900">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden /> {a}
              </li>
            ))}
          </ul>
        )}
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
            <dd className="text-lg font-bold tabular-nums text-site-azul">{moeda(c.total_pagar)}</dd>
          </div>
        </dl>

        {boletim.equipe.length > 0 && (
          <div className="mt-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Pagamento por chapa</p>
            <ul className="max-h-60 divide-y divide-gray-100 overflow-y-auto text-sm">
              {boletim.equipe.map((ch) => (
                <li key={ch.matricula} className="flex justify-between gap-3 py-1">
                  <span className="text-gray-700">
                    {ch.nome} <span className="text-xs text-gray-400">({ch.meia_diaria ? "meia" : "completa"})</span>
                  </span>
                  <span className="font-semibold tabular-nums text-gray-900">{moeda(pagamentoChapa(ch, boletim))}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {fechado ? (
          <div className="mt-4 space-y-2">
            <p className="flex items-center gap-2 rounded-xl bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700">
              <Lock className="h-4 w-4" aria-hidden /> Fechado por {boletim.fechado_por ?? "—"} em{" "}
              {boletim.fechado_em && new Date(boletim.fechado_em).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
            </p>
            <button
              type="button"
              onClick={onReabrir}
              disabled={enviando}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-azul disabled:opacity-60"
            >
              <LockOpen className="h-4 w-4" aria-hidden /> Reabrir para corrigir
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={onFechar}
              disabled={!podeFechar || enviando}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-site-verde px-4 py-3 text-sm font-bold text-white hover:bg-site-verde-escuro focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-verde focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {enviando ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> : <Lock className="h-4 w-4" aria-hidden />} Fechar boletim
            </button>
            {!podeFechar && (
              <p className="mt-1 text-center text-xs text-red-700">
                {producaoPendente ? "Salve a produção antes de fechar." : "Corrija os itens da validação para fechar."}
              </p>
            )}
          </>
        )}
      </section>
    </div>
  );
}
