import { useEffect, useState } from "react";
import { Area, AreaChart, Bar, CartesianGrid, Cell, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { obterPlanoEscala } from "@/shared/services";
import { CartaoGrafico, CartaoKpi, Legenda, TooltipGrafico, useCores } from "@/shared/components/graficos";
import { decimal, moeda } from "@/shared/utils/formatacao";
import { ROTULO_SITUACAO, rotuloMes, useCarga } from "../utils/carga";
import { eixoX, eixoY, grade, margem, moedaCurta, num } from "../utils/graficos";
import { Carregando, Erro, LegendaSituacao, Premissas } from "./Estados";

/** Espera o usuário parar de arrastar o controle antes de recalcular no backend. */
function useAtrasado<T>(valor: T, ms = 350) {
  const [v, setV] = useState(valor);
  useEffect(() => {
    const t = window.setTimeout(() => setV(valor), ms);
    return () => window.clearTimeout(t);
  }, [valor, ms]);
  return v;
}

export default function AbaPlano() {
  const c = useCores();
  const [reserva, setReserva] = useState(2);
  const [simular, setSimular] = useState(false);
  const [equipe, setEquipe] = useState(8);
  const r = useAtrasado(reserva);
  const e = useAtrasado(equipe);
  const { dados, erro, carregando } = useCarga(
    () => obterPlanoEscala({ meses: 12, reserva: r, equipe_fixa: simular ? e : undefined }),
    `${r}|${simular ? e : "-"}`,
  );

  const controles = (
    <section aria-label="Ajustes do plano" className="grid gap-4 rounded-3xl bg-white p-4 shadow-sm sm:grid-cols-2 sm:p-5">
      <label className="block">
        <span className="flex justify-between text-sm font-semibold text-gray-800">
          Reserva para carregamento e organização <span className="tabular-nums text-site-azul">{reserva} chapas</span>
        </span>
        <input type="range" min={0} max={6} value={reserva} onChange={(ev) => setReserva(Number(ev.target.value))}
          aria-valuetext={`${reserva} chapas`} className="mt-2 h-10 w-full accent-site-azul" />
        <span className="text-[11px] text-gray-500">Atividades que não estão nos dados, como carregar cooperados.</span>
      </label>
      <div>
        <button type="button" role="switch" aria-checked={simular} onClick={() => setSimular(!simular)}
          className="flex w-full items-center justify-between text-sm font-semibold text-gray-800">
          Simular equipe fixa
          <span aria-hidden className={`relative h-7 w-12 rounded-full transition ${simular ? "bg-site-azul" : "bg-gray-300"}`}>
            <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${simular ? "left-6" : "left-1"}`} />
          </span>
        </button>
        <label className={`mt-2 block ${simular ? "" : "opacity-40"}`}>
          <span className="flex justify-between text-xs font-semibold text-gray-700">
            Chapas o ano todo <span className="tabular-nums text-site-azul">{equipe}</span>
          </span>
          <input type="range" min={4} max={20} value={equipe} disabled={!simular} onChange={(ev) => setEquipe(Number(ev.target.value))}
            aria-valuetext={`${equipe} chapas`} className="mt-1 h-10 w-full accent-site-azul" />
        </label>
      </div>
    </section>
  );

  if (carregando && !dados) return <div className="space-y-5">{controles}<Carregando texto="Montando o plano de escala…" /></div>;
  if (erro || !dados) return <div className="space-y-5">{controles}<Erro mensagem={erro ?? "sem dados"} /></div>;

  const res = dados.resumo;
  const linhas = dados.meses.map((m) => ({
    rotulo: m.rotulo, caminhoes: m.caminhoes_dia_previsto, atual: m.equipe_pratica_atual ?? 0,
    recomendada: m.equipe_recomendada, simulada: m.equipe_simulada, situacao: m.situacao_pratica_atual ?? "NEUTRO",
    situacaoSim: m.situacao_simulada, custoAtual: m.custo_pratica_atual, custoRec: m.custo_recomendado, custoSim: m.custo_simulado,
  }));
  let a = 0, p = 0, s = 0;
  const acumulado = linhas.map((l) => ({ rotulo: l.rotulo, atual: (a += l.custoAtual), plano: (p += l.custoRec),
    ...(l.custoSim != null ? { simulado: (s += l.custoSim) } : {}) }));
  const precisao = dados.precisao.detalhe.map((d) => ({ rotulo: rotuloMes(d.mes), real: d.real, previsto: d.previsto, erro: d.erro_percentual }));
  const corSit = (x: string) => c.situacao[(x in c.situacao ? x : "NEUTRO") as keyof typeof c.situacao];
  const foco = (dadosX: { rotulo: string }[]) => (f: number | null) =>
    f != null ? <ReferenceLine x={dadosX[f]?.rotulo} stroke={c.destaque} strokeWidth={2} /> : null;
  const economia = res.diferenca;

  return (
    <div className="space-y-5">
      {controles}

      <p className={`rounded-3xl bg-site-azul px-5 py-4 text-sm font-semibold text-white shadow-sm transition-opacity sm:text-base ${carregando ? "opacity-70" : ""}`}
        aria-live="polite" aria-busy={carregando}>
        {res.frase}{carregando && <span className="ml-2 text-xs font-normal">recalculando…</span>}
      </p>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <CartaoKpi rotulo="Prática atual (12 meses)" valor={moeda(res.custo_pratica_atual)} nota="mesma escala do ano passado"
          tendencia={acumulado.map((x) => x.atual)} corTendencia={c.series[3]} />
        <CartaoKpi rotulo="Plano recomendado" valor={moeda(res.custo_plano_recomendado)} nota="escala acompanha a demanda"
          tendencia={acumulado.map((x) => x.plano)} corTendencia={c.series[1]} />
        <CartaoKpi destaque rotulo={economia >= 0 ? "Economia" : "Investimento a mais"} valor={moeda(Math.abs(economia))}
          nota={economia >= 0 ? "com o mesmo serviço" : "para cobrir o pico"} />
        {res.custo_simulado != null ? (
          <CartaoKpi rotulo={`Simulação: ${e} chapas fixos`} valor={moeda(res.custo_simulado)}
            nota={res.meses_com_falta_simulada?.length ? `falta em ${res.meses_com_falta_simulada.join(", ")}` : "sem falta prevista"} />
        ) : (
          <CartaoKpi rotulo="Meses com risco hoje" valor={String(res.meses_com_risco_na_pratica_atual.length)}
            nota={res.meses_com_risco_na_pratica_atual.join(", ") || "nenhum"} />
        )}
      </dl>

      <CartaoGrafico
        titulo="Escala mês a mês: hoje x recomendada"
        subtitulo="Barras = equipe de hoje (cor = situação) • degraus = equipe recomendada"
        resumo={`${res.frase} ${res.meses_com_risco_na_pratica_atual.length ? `Meses com risco de falta mantendo a escala de hoje: ${res.meses_com_risco_na_pratica_atual.join(", ")}.` : ""}`}
        serieSonora={linhas.map((l) => l.recomendada)}
        pontos={linhas.map((l) => `${l.rotulo}: hoje ${decimal(l.atual)} chapas, recomendado ${l.recomendada}, ${ROTULO_SITUACAO[l.situacao] ?? "sem dados"}${l.simulada != null ? `, simulação ${l.simulada}` : ""}`)}
        tabela={{ linhas, colunas: [
          { rotulo: "Mês", valor: (l) => l.rotulo },
          { rotulo: "Caminhões/dia", valor: (l) => num(l.caminhoes), alinhar: "direita" },
          { rotulo: "Hoje", valor: (l) => decimal(l.atual), alinhar: "direita" },
          { rotulo: "Recomendado", valor: (l) => l.recomendada, alinhar: "direita" },
          { rotulo: "Situação hoje", valor: (l) => ROTULO_SITUACAO[l.situacao] ?? "—" },
          { rotulo: "Custo hoje", valor: (l) => moeda(l.custoAtual), alinhar: "direita" },
          { rotulo: "Custo recomendado", valor: (l) => moeda(l.custoRec), alinhar: "direita" },
        ] }}
        arquivo="plano-de-escala"
        legenda={<div className="flex flex-wrap gap-4"><LegendaSituacao situacoes={["SOBRA", "ADEQUADO", "RISCO_DE_FALTA", "FALTA"]} />
          <Legenda itens={[{ cor: c.texto, rotulo: "Recomendado" }, ...(simular ? [{ cor: c.series[4], rotulo: "Simulação", tracejado: true }] : [])]} /></div>}
      >
        {(f) => (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={linhas} margin={margem}>
              <CartesianGrid {...grade(c)} />
              <XAxis dataKey="rotulo" {...eixoX(c)} />
              <YAxis {...eixoY(c, (v) => num(v, 0))} allowDecimals={false} />
              <Tooltip cursor={{ fill: c.grade, opacity: 0.35 }}
                content={(pp) => <TooltipGrafico active={pp.active} payload={pp.payload} label={pp.label}
                  formatarValor={(v) => `${num(Number(v))} chapas`}
                  rodape={(l) => <>{num(Number(l.caminhoes))} caminhões/dia • hoje: <strong>{ROTULO_SITUACAO[String(l.situacao)] ?? "—"}</strong></>} />} />
              <Bar dataKey="atual" name="Hoje" radius={[6, 6, 0, 0]} maxBarSize={34} isAnimationActive={c.animar}>
                {linhas.map((l, i) => <Cell key={l.rotulo} fill={corSit(l.situacao)} fillOpacity={f == null || f === i ? 1 : 0.45} />)}
              </Bar>
              <Line dataKey="recomendada" name="Recomendado" type="step" stroke={c.texto} strokeWidth={2.5} dot={false} isAnimationActive={c.animar} />
              {simular && <Line dataKey="simulada" name="Simulação" type="step" stroke={c.series[4]} strokeWidth={2.5}
                strokeDasharray="6 4" dot={false} isAnimationActive={c.animar} />}
              {foco(linhas)(f)}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </CartaoGrafico>

      <div className="grid gap-5 xl:grid-cols-2">
        <CartaoGrafico
          titulo="Custo acumulado em 12 meses"
          subtitulo="A distância entre as curvas é a economia (ou o investimento) do plano"
          resumo={`Em 12 meses, mantendo a escala de hoje, o custo acumulado chega a ${moeda(res.custo_pratica_atual)}. Com o plano, ${moeda(res.custo_plano_recomendado)}.${res.custo_simulado != null ? ` Com ${e} chapas fixos, ${moeda(res.custo_simulado)}.` : ""}`}
          serieSonora={acumulado.map((x) => x.atual - x.plano)}
          pontos={acumulado.map((x) => `Até ${x.rotulo}: hoje ${moeda(x.atual)}, plano ${moeda(x.plano)}, diferença ${moeda(x.atual - x.plano)}`)}
          tabela={{ linhas: acumulado, colunas: [
            { rotulo: "Até", valor: (x) => x.rotulo },
            { rotulo: "Escala de hoje", valor: (x) => moeda(x.atual), alinhar: "direita" },
            { rotulo: "Plano", valor: (x) => moeda(x.plano), alinhar: "direita" },
            { rotulo: "Diferença", valor: (x) => moeda(x.atual - x.plano), alinhar: "direita" },
          ] }}
          arquivo="custo-acumulado"
          legenda={<Legenda itens={[{ cor: c.series[3], rotulo: "Escala de hoje" }, { cor: c.series[1], rotulo: "Plano" },
            ...(simular ? [{ cor: c.series[4], rotulo: "Simulação", tracejado: true }] : [])]} />}
        >
          {(f) => (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={acumulado} margin={margem}>
                <defs>
                  <linearGradient id="grad-acum-atual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={c.series[3]} stopOpacity={0.35} /><stop offset="100%" stopColor={c.series[3]} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="grad-acum-plano" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={c.series[1]} stopOpacity={0.45} /><stop offset="100%" stopColor={c.series[1]} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...grade(c)} />
                <XAxis dataKey="rotulo" {...eixoX(c)} />
                <YAxis {...eixoY(c, moedaCurta, 68)} />
                <Tooltip content={(pp) => <TooltipGrafico active={pp.active} payload={pp.payload} label={pp.label}
                  formatarRotulo={(r) => `Acumulado até ${r}`} formatarValor={(v) => moeda(Number(v))}
                  rodape={(l) => <>Diferença: <strong>{moeda(Number(l.atual) - Number(l.plano))}</strong></>} />} />
                <Area dataKey="atual" name="Escala de hoje" type="monotone" stroke={c.series[3]} strokeWidth={2.5} fill="url(#grad-acum-atual)" isAnimationActive={c.animar} />
                <Area dataKey="plano" name="Plano" type="monotone" stroke={c.series[1]} strokeWidth={2.5} fill="url(#grad-acum-plano)" isAnimationActive={c.animar} />
                {simular && <Area dataKey="simulado" name="Simulação" type="monotone" stroke={c.series[4]} strokeWidth={2}
                  strokeDasharray="6 4" fill="none" isAnimationActive={c.animar} />}
                {foco(acumulado)(f)}
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CartaoGrafico>

        <CartaoGrafico
          titulo="A previsão funciona?"
          subtitulo="Cada mês foi previsto só com os dados anteriores a ele e comparado com o real"
          resumo={`Testado em ${precisao.length} meses reais, o modelo errou em média ${decimal(dados.precisao.erro_medio_percentual ?? 0)} por cento. ${dados.precisao.como_ler}`}
          serieSonora={precisao.map((x) => x.real)}
          pontos={precisao.map((x) => `${x.rotulo}: previsto ${num(x.previsto)}, real ${num(x.real)}, erro ${num(x.erro)} por cento`)}
          tabela={{ linhas: precisao, colunas: [
            { rotulo: "Mês", valor: (x) => x.rotulo },
            { rotulo: "Previsto", valor: (x) => num(x.previsto), alinhar: "direita" },
            { rotulo: "Real", valor: (x) => num(x.real), alinhar: "direita" },
            { rotulo: "Erro", valor: (x) => `${num(x.erro)}%`, alinhar: "direita" },
          ] }}
          arquivo="precisao-do-modelo"
          legenda={<Legenda itens={[{ cor: c.series[0], rotulo: "Real" }, { cor: c.series[2], rotulo: "Previsto", tracejado: true }]} />}
        >
          {(f) => (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={precisao} margin={margem}>
                <CartesianGrid {...grade(c)} />
                <XAxis dataKey="rotulo" {...eixoX(c)} />
                <YAxis {...eixoY(c, (v) => num(v, 0))} />
                <Tooltip content={(pp) => <TooltipGrafico active={pp.active} payload={pp.payload} label={pp.label}
                  formatarValor={(v) => `${num(Number(v))} cam/dia`} rodape={(l) => <>Erro: <strong>{num(Number(l.erro))}%</strong></>} />} />
                <Line dataKey="real" name="Real" type="monotone" stroke={c.series[0]} strokeWidth={3} dot={{ r: 3 }} isAnimationActive={c.animar} />
                <Line dataKey="previsto" name="Previsto" type="monotone" stroke={c.series[2]} strokeWidth={2.5} strokeDasharray="6 4"
                  dot={{ r: 3 }} isAnimationActive={c.animar} />
                {foco(precisao)(f)}
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </CartaoGrafico>
      </div>

      <Premissas itens={dados.premissas} />
    </div>
  );
}
