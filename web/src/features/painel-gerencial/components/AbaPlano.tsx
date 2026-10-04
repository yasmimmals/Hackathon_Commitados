import { useState } from "react";
import { obterPlanoEscala, type MesPlano } from "@/shared/services";
import { decimal, moeda } from "@/shared/utils/formatacao";
import { COR, corDaSituacao, rotuloMes, useCarga } from "../utils/carga";
import { Carregando, Erro, Kpi, LegendaSituacao, Premissas, SeloSituacao } from "./Estados";

export default function AbaPlano() {
  const [reserva, setReserva] = useState(2);
  const [simular, setSimular] = useState("");
  const equipeFixa = simular === "" ? undefined : Number(simular);
  const { dados, erro, carregando } = useCarga(
    () => obterPlanoEscala({ meses: 12, reserva, equipe_fixa: equipeFixa }),
    `${reserva}|${simular}`,
  );

  const controles = (
    <div className="flex flex-wrap items-end gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm">
      <label className="text-xs font-semibold text-gray-700">
        Reserva p/ carregamento e organização
        <input type="number" min={0} max={8} value={reserva}
          onChange={(e) => setReserva(Math.max(0, Math.min(8, Number(e.target.value) || 0)))}
          className="mt-1 block w-28 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm" />
      </label>
      <label className="text-xs font-semibold text-gray-700">
        Simular equipe fixa de
        <input type="number" min={1} max={30} placeholder="ex.: 8" value={simular}
          onChange={(e) => setSimular(e.target.value)}
          className="mt-1 block w-28 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm" />
      </label>
      {simular !== "" && (
        <button type="button" onClick={() => setSimular("")} className="pb-1.5 text-xs font-semibold text-site-azul hover:underline">
          limpar simulação
        </button>
      )}
      <p className="basis-full text-[11px] text-gray-500 sm:basis-auto sm:pb-1.5">
        Mude os valores e o plano é recalculado na hora pelo sistema.
      </p>
    </div>
  );

  if (carregando) return <div className="space-y-4">{controles}<Carregando texto="Montando o plano de escala…" /></div>;
  if (erro || !dados) return <div className="space-y-4">{controles}<Erro mensagem={erro ?? "sem dados"} /></div>;

  const r = dados.resumo;
  const maximo = Math.max(1, ...dados.meses.map((m) => Math.max(m.equipe_recomendada, m.equipe_pratica_atual ?? 0, m.equipe_simulada ?? 0)));
  const economia = r.diferenca;

  return (
    <div className="space-y-5">
      {controles}

      <p className="rounded-3xl bg-site-azul px-5 py-4 text-sm font-semibold text-white shadow-sm sm:text-base">{r.frase}</p>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi rotulo="Prática atual (12 meses)" valor={moeda(r.custo_pratica_atual)} nota="mesma equipe do ano passado" />
        <Kpi rotulo="Plano recomendado" valor={moeda(r.custo_plano_recomendado)} nota="escala acompanhando a demanda" />
        <Kpi rotulo={economia >= 0 ? "Economia" : "Investimento a mais"} valor={moeda(Math.abs(economia))}
          nota={economia >= 0 ? "com o mesmo serviço" : "para cobrir o pico"} />
        {r.custo_simulado != null ? (
          <Kpi rotulo={`Simulação: ${equipeFixa} chapas fixos`} valor={moeda(r.custo_simulado)}
            nota={r.meses_com_falta_simulada?.length ? `falta em ${r.meses_com_falta_simulada.join(", ")}` : "sem falta prevista"} />
        ) : (
          <Kpi rotulo="Meses com risco hoje" valor={String(r.meses_com_risco_na_pratica_atual.length)}
            nota={r.meses_com_risco_na_pratica_atual.join(", ") || "nenhum"} />
        )}
      </dl>

      <figure className="rounded-3xl bg-white p-5 shadow-sm">
        <figcaption className="mb-3 flex flex-wrap items-end justify-between gap-2 border-b-[3px] border-site-amarelo pb-2">
          <span className="titulo-secao text-lg">Escala mês a mês: prática atual x recomendada</span>
          <LegendaSituacao situacoes={["SOBRA", "ADEQUADO", "RISCO_DE_FALTA", "FALTA"]} />
        </figcaption>
        <p className="mb-4 text-xs text-gray-500">
          Barra colorida = equipe de hoje (cor = situação) • barra cinza = recomendada
          {equipeFixa != null && " • barra tracejada = simulação"}.
        </p>
        <div className="overflow-x-auto">
          <div className="flex min-w-[640px] items-end gap-2" style={{ height: 220 }}>
            {dados.meses.map((m) => <ColunaMes key={m.mes} m={m} maximo={maximo} />)}
          </div>
        </div>
      </figure>

      <section className="rounded-3xl bg-white p-5 shadow-sm">
        <h2 className="titulo-secao mb-3 border-b-[3px] border-site-amarelo pb-2 text-lg">Detalhe do plano</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs text-gray-600">
              <tr className="border-b border-gray-200">
                <th className="py-2 pr-3 font-semibold">Mês</th>
                <th className="px-2 py-2 text-right font-semibold">Caminhões/dia</th>
                <th className="px-2 py-2 text-right font-semibold">Hoje</th>
                <th className="px-2 py-2 text-right font-semibold">Recomendado</th>
                <th className="px-2 py-2 font-semibold">Situação hoje</th>
                <th className="px-2 py-2 text-right font-semibold">Custo hoje</th>
                <th className="py-2 pl-2 text-right font-semibold">Custo recomendado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 tabular-nums">
              {dados.meses.map((m) => (
                <tr key={m.mes}>
                  <th scope="row" className="py-2 pr-3 font-medium text-gray-900">{m.rotulo}</th>
                  <td className="px-2 py-2 text-right">{decimal(m.caminhoes_dia_previsto)}</td>
                  <td className="px-2 py-2 text-right">{m.equipe_pratica_atual != null ? decimal(m.equipe_pratica_atual) : "—"}</td>
                  <td className="px-2 py-2 text-right font-semibold">{m.equipe_recomendada}</td>
                  <td className="px-2 py-2"><SeloSituacao situacao={m.situacao_pratica_atual} /></td>
                  <td className="px-2 py-2 text-right">{moeda(m.custo_pratica_atual)}</td>
                  <td className="py-2 pl-2 text-right">{moeda(m.custo_recomendado)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-sm">
        <h2 className="titulo-secao mb-1 border-b-[3px] border-site-amarelo pb-2 text-lg">A previsão funciona?</h2>
        <p className="mb-3 text-xs text-gray-500">{dados.precisao.como_ler} Erro médio: <strong>±{decimal(dados.precisao.erro_medio_percentual ?? 0)}%</strong>.</p>
        <ul className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs sm:grid-cols-3">
          {dados.precisao.detalhe.map((d) => (
            <li key={d.mes} className="flex justify-between gap-2 tabular-nums">
              <span className="text-gray-600">{rotuloMes(d.mes)}</span>
              <span>prev. {decimal(d.previsto)} • real {decimal(d.real)}</span>
              <span className="font-semibold" style={{ color: d.erro_percentual > 25 ? COR.SOBRA : COR.ADEQUADO }}>{decimal(d.erro_percentual)}%</span>
            </li>
          ))}
        </ul>
      </section>

      <Premissas itens={dados.premissas} />
    </div>
  );
}

function ColunaMes({ m, maximo }: { m: MesPlano; maximo: number }) {
  const h = (v: number) => `${(v / maximo) * 170}px`;
  const atual = m.equipe_pratica_atual ?? 0;
  return (
    <div className="flex flex-1 flex-col items-center gap-1"
      aria-label={`${m.rotulo}: hoje ${decimal(atual)}, recomendado ${m.equipe_recomendada}`}>
      <div className="flex items-end gap-0.5" aria-hidden>
        <span className="w-3 rounded-t sm:w-4" title={`Hoje: ${decimal(atual)}`}
          style={{ height: h(atual), background: corDaSituacao(m.situacao_pratica_atual) }} />
        <span className="w-3 rounded-t bg-gray-400 sm:w-4" title={`Recomendado: ${m.equipe_recomendada}`}
          style={{ height: h(m.equipe_recomendada) }} />
        {m.equipe_simulada != null && (
          <span className="w-3 rounded-t border-2 border-dashed sm:w-4" title={`Simulação: ${m.equipe_simulada}`}
            style={{ height: h(m.equipe_simulada), borderColor: corDaSituacao(m.situacao_simulada) }} />
        )}
      </div>
      <span className="text-[11px] text-gray-600">{m.rotulo}</span>
    </div>
  );
}
