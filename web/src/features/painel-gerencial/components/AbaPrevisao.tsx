import { useState } from "react";
import { obterPrevisao, type SemanaPrevista } from "@/shared/services";
import { decimal, moeda } from "@/shared/utils/formatacao";
import { COR, diaMes, useCarga } from "../utils/carga";
import { Carregando, Erro, Kpi, Premissas } from "./Estados";

const corDaAcao = (acao: string) =>
  acao.startsWith("REFORCAR") ? COR.FALTA : acao.startsWith("REDUZIR") ? COR.SOBRA : COR.ADEQUADO;
const textoDaAcao = (acao: string) =>
  acao.startsWith("REFORCAR") ? `Reforçar ${acao.split(" ")[1]}`
    : acao.startsWith("REDUZIR") ? `Reduzir ${acao.split(" ")[1]}`
      : acao === "MANTER" ? "Manter" : "Sem referência";

export default function AbaPrevisao() {
  const [semanas, setSemanas] = useState(12);
  const { dados, erro, carregando } = useCarga(() => obterPrevisao({ semanas }), String(semanas));

  if (carregando) return <Carregando texto="Calculando a previsão…" />;
  if (erro || !dados) return <Erro mensagem={erro ?? "sem dados"} />;

  const s = dados.semanas;
  const proxima = s[0];
  const maximo = Math.max(1, ...s.map((x) => Math.max(x.chapas_recomendados_faixa[1], x.equipe_atual ?? 0)));
  const custoPrevisto = s.reduce((t, x) => t + x.custo_previsto, 0);
  const custoAtual = s.reduce((t, x) => t + x.custo_com_equipe_atual, 0);
  const prec = dados.precisao;

  return (
    <div className="space-y-5">
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi destaque rotulo={`Semana de ${proxima ? diaMes(proxima.semana) : "—"}`}
          valor={proxima ? textoDaAcao(proxima.acao) : "—"}
          nota={proxima ? `${proxima.chapas_recomendados} chapas recomendados` : undefined} />
        <Kpi rotulo="Equipe atual" valor={dados.equipe_atual != null ? `${decimal(dados.equipe_atual)} chapas` : "—"}
          nota={dados.referencia ?? "sem folha registrada"} />
        <Kpi rotulo="Custo previsto" valor={moeda(custoPrevisto)}
          nota={`${s.length} semanas • com a equipe atual: ${moeda(custoAtual)}`} />
        <Kpi rotulo="Precisão do modelo"
          valor={prec.erro_medio_percentual != null ? `±${decimal(prec.erro_medio_percentual)}%` : "—"}
          nota={`erro médio medido em ${prec.meses_testados} meses reais`} />
      </dl>

      <figure className="rounded-3xl bg-white p-5 shadow-sm">
        <figcaption className="mb-3 flex flex-wrap items-end justify-between gap-2 border-b-[3px] border-site-amarelo pb-2">
          <span className="titulo-secao text-lg">Chapas por semana: recomendado x equipe atual</span>
          <label className="text-xs font-semibold text-gray-700">
            Horizonte{" "}
            <select value={semanas} onChange={(e) => setSemanas(Number(e.target.value))}
              className="ml-1 rounded-full border border-gray-300 bg-white px-3 py-1 text-sm">
              {[4, 8, 12, 26].map((n) => <option key={n} value={n}>{n} semanas</option>)}
            </select>
          </label>
        </figcaption>
        <p className="mb-3 text-xs text-gray-500">
          Barra = chapas recomendados (traço claro = faixa de incerteza) • linha preta = equipe atual.
        </p>
        <ul className="space-y-1">
          {s.map((x) => <LinhaSemana key={x.semana} x={x} maximo={maximo} />)}
        </ul>
      </figure>

      <Premissas itens={[...dados.premissas, prec.como_ler]} />
    </div>
  );
}

function LinhaSemana({ x, maximo }: { x: SemanaPrevista; maximo: number }) {
  const pct = (v: number) => `${(v / maximo) * 100}%`;
  const cor = corDaAcao(x.acao);
  return (
    <li className="grid grid-cols-[52px_minmax(0,1fr)_96px] items-center gap-2 rounded-lg px-1 py-1.5 hover:bg-gray-50 sm:grid-cols-[60px_minmax(0,1fr)_130px_110px] sm:gap-3"
      aria-label={`Semana de ${diaMes(x.semana)}: ${decimal(x.caminhoes_dia_previsto)} caminhões por dia, ${x.chapas_recomendados} chapas recomendados, ${textoDaAcao(x.acao)}, custo ${moeda(x.custo_previsto)}`}>
      <span className="text-xs font-semibold text-gray-700 sm:text-sm">{diaMes(x.semana)}</span>
      <div className="relative h-6" aria-hidden>
        <span className="absolute top-2.5 h-1 rounded bg-gray-200"
          style={{ left: pct(x.chapas_recomendados_faixa[0]), width: pct(x.chapas_recomendados_faixa[1] - x.chapas_recomendados_faixa[0]) }} />
        <span className="absolute top-0.5 h-5 rounded-r opacity-90" style={{ width: pct(x.chapas_recomendados), background: cor }} />
        <span className="absolute top-0.5 h-5 rounded-r pl-1 text-[11px] font-semibold leading-5 text-white"
          style={{ width: pct(x.chapas_recomendados) }}>{x.chapas_recomendados}</span>
        {x.equipe_atual != null && (
          <span className="absolute -top-0.5 h-7 w-0.5 bg-gray-900" style={{ left: pct(x.equipe_atual) }} />
        )}
      </div>
      <span className="hidden text-right text-xs text-gray-600 sm:block">
        {decimal(x.caminhoes_dia_previsto)} cam/dia
        {x.caminhoes_ja_agendados > 0 && <span className="block text-[10px] text-gray-400">{x.caminhoes_ja_agendados} já agendados</span>}
      </span>
      <span className="text-right text-xs">
        <span className="block font-semibold" style={{ color: cor }}>{textoDaAcao(x.acao)}</span>
        <span className="block tabular-nums text-gray-500">{moeda(x.custo_previsto)}</span>
      </span>
    </li>
  );
}
