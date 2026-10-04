import { useState } from "react";
import { Area, Bar, CartesianGrid, Cell, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { obterPrevisao } from "@/shared/services";
import { CartaoGrafico, CartaoKpi, Legenda, TooltipGrafico, useCores } from "@/shared/components/graficos";
import { decimal, moeda } from "@/shared/utils/formatacao";
import { diaMes, useCarga } from "../utils/carga";
import { eixoX, eixoY, grade, margem, moedaCurta, num } from "../utils/graficos";
import { Carregando, Erro, Premissas } from "./Estados";

const textoDaAcao = (acao: string) =>
  acao.startsWith("REFORCAR") ? `Reforçar ${acao.split(" ")[1]}`
    : acao.startsWith("REDUZIR") ? `Reduzir ${acao.split(" ")[1]}`
      : acao === "MANTER" ? "Manter" : "Sem referência";

export default function AbaPrevisao() {
  const c = useCores();
  const [semanas, setSemanas] = useState(12);
  const { dados, erro, carregando } = useCarga(() => obterPrevisao({ semanas }), String(semanas));

  if (carregando) return <Carregando texto="Calculando a previsão…" />;
  if (erro || !dados) return <Erro mensagem={erro ?? "sem dados"} />;

  const linhas = dados.semanas.map((s) => ({
    rotulo: diaMes(s.semana),
    previsto: s.caminhoes_dia_previsto,
    faixa: s.caminhoes_dia_faixa,
    agendados: s.caminhoes_ja_agendados,
    recomendado: s.chapas_recomendados,
    faixaChapas: s.chapas_recomendados_faixa,
    custo: s.custo_previsto,
    custoAtual: s.custo_com_equipe_atual,
    acao: s.acao,
  }));
  const corAcao = (a: string) => a.startsWith("REFORCAR") ? c.situacao.FALTA : a.startsWith("REDUZIR") ? c.situacao.SOBRA : c.situacao.ADEQUADO;
  const prox = linhas[0];
  const pico = linhas.reduce((m, l) => (l.previsto > m.previsto ? l : m), linhas[0]);
  const custo = linhas.reduce((t, l) => t + l.custo, 0);
  const custoAtual = linhas.reduce((t, l) => t + l.custoAtual, 0);
  const prec = dados.precisao;
  const atual = dados.equipe_atual;
  const reforcos = linhas.filter((l) => l.acao.startsWith("REFORCAR"));
  const foco = (f: number | null) => (f != null ? <ReferenceLine x={linhas[f]?.rotulo} stroke={c.destaque} strokeWidth={2} /> : null);
  const tooltipMoeda = (v: unknown) => moeda(Number(v));

  return (
    <div className="space-y-5">
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <CartaoKpi destaque rotulo={`Semana de ${prox?.rotulo ?? "—"}`} valor={prox ? textoDaAcao(prox.acao) : "—"}
          nota={prox ? `${prox.recomendado} chapas recomendados` : undefined} tendencia={linhas.map((l) => l.recomendado)} />
        <CartaoKpi rotulo="Equipe atual" valor={atual != null ? `${decimal(atual)} chapas` : "—"}
          nota={dados.referencia ?? "sem folha registrada"} />
        <CartaoKpi rotulo={`Custo previsto (${linhas.length} sem.)`} valor={moeda(custo)}
          nota={`Com a equipe atual: ${moeda(custoAtual)}`} tendencia={linhas.map((l) => l.custo)} corTendencia={c.series[1]} />
        <CartaoKpi rotulo="Precisão do modelo" valor={prec.erro_medio_percentual != null ? `±${decimal(prec.erro_medio_percentual)}%` : "—"}
          nota={`erro médio medido em ${prec.meses_testados} meses reais`}
          tendencia={prec.detalhe.map((d) => d.erro_percentual)} corTendencia={c.series[3]} />
      </dl>

      <div className="grid gap-5 xl:grid-cols-2">
        <CartaoGrafico
          titulo="Caminhões por dia: previsão"
          subtitulo="Linha = previsão • faixa = margem de erro • barras = já agendados no sistema"
          resumo={`Pico previsto na semana de ${pico.rotulo}, com cerca de ${num(pico.previsto)} caminhões por dia. A margem de erro do modelo é de ${decimal(prec.erro_medio_percentual ?? 0)} por cento.`}
          serieSonora={linhas.map((l) => l.previsto)}
          pontos={linhas.map((l) => `Semana de ${l.rotulo}: ${num(l.previsto)} caminhões por dia, de ${num(l.faixa[0])} a ${num(l.faixa[1])}${l.agendados ? `, ${l.agendados} já agendados` : ""}`)}
          tabela={{ linhas, colunas: [
            { rotulo: "Semana", valor: (l) => l.rotulo },
            { rotulo: "Caminhões/dia", valor: (l) => num(l.previsto), alinhar: "direita" },
            { rotulo: "Faixa", valor: (l) => `${num(l.faixa[0])} a ${num(l.faixa[1])}`, alinhar: "direita" },
            { rotulo: "Já agendados", valor: (l) => l.agendados, alinhar: "direita" },
          ] }}
          arquivo="previsao-caminhoes"
          legenda={<Legenda itens={[{ cor: c.series[0], rotulo: "Previsão" }, { cor: c.series[0], rotulo: "Margem de erro", faixa: true }, { cor: c.series[2], rotulo: "Já agendados" }]} />}
          controles={
            <label className="mb-2 flex items-center gap-2 self-end text-xs font-semibold text-gray-700">
              Horizonte
              <select value={semanas} onChange={(e) => setSemanas(Number(e.target.value))}
                className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm">
                {[4, 8, 12, 26].map((n) => <option key={n} value={n}>{n} semanas</option>)}
              </select>
            </label>
          }
        >
          {(f) => (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={linhas} margin={margem}>
                <CartesianGrid {...grade(c)} />
                <XAxis dataKey="rotulo" {...eixoX(c)} />
                <YAxis {...eixoY(c, (v) => num(v, 0))} />
                <Tooltip cursor={{ fill: c.grade, opacity: 0.35 }}
                  content={(p) => <TooltipGrafico active={p.active} payload={p.payload} label={p.label}
                    formatarRotulo={(r) => `Semana de ${r}`} formatarValor={(v) => num(Number(v))}
                    rodape={(l) => `Faixa: ${num((l.faixa as number[])[0])} a ${num((l.faixa as number[])[1])} caminhões/dia`} />} />
                <Area dataKey="faixa" name="Margem de erro" fill={c.series[0]} fillOpacity={0.14} stroke="none" isAnimationActive={c.animar} />
                <Bar dataKey="agendados" name="Já agendados" fill={c.series[2]} barSize={14} radius={[4, 4, 0, 0]} isAnimationActive={c.animar} />
                <Line dataKey="previsto" name="Caminhões/dia" stroke={c.series[0]} strokeWidth={3} type="monotone"
                  dot={{ r: 3, fill: c.series[0] }} activeDot={{ r: 6 }} isAnimationActive={c.animar} />
                {foco(f)}
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </CartaoGrafico>

        <CartaoGrafico
          titulo="Chapas: recomendado x equipe atual"
          subtitulo="Barra = recomendado (cor = ação) • linha tracejada = equipe de hoje"
          resumo={reforcos.length
            ? `Reforço necessário em ${reforcos.length} das ${linhas.length} semanas, começando em ${reforcos[0].rotulo}, com até ${Math.max(...reforcos.map((l) => l.recomendado))} chapas. Hoje a equipe tem ${decimal(atual ?? 0)}.`
            : `A equipe atual de ${decimal(atual ?? 0)} chapas cobre todas as semanas previstas.`}
          serieSonora={linhas.map((l) => l.recomendado)}
          pontos={linhas.map((l) => `Semana de ${l.rotulo}: ${l.recomendado} chapas recomendados, ${textoDaAcao(l.acao)}`)}
          tabela={{ linhas, colunas: [
            { rotulo: "Semana", valor: (l) => l.rotulo },
            { rotulo: "Recomendado", valor: (l) => l.recomendado, alinhar: "direita" },
            { rotulo: "Faixa", valor: (l) => `${l.faixaChapas[0]} a ${l.faixaChapas[1]}`, alinhar: "direita" },
            { rotulo: "Ação", valor: (l) => textoDaAcao(l.acao) },
            { rotulo: "Custo previsto", valor: (l) => moeda(l.custo), alinhar: "direita" },
          ] }}
          arquivo="previsao-chapas"
          legenda={<Legenda itens={[{ cor: c.situacao.FALTA, rotulo: "Reforçar" }, { cor: c.situacao.ADEQUADO, rotulo: "Manter" },
            { cor: c.situacao.SOBRA, rotulo: "Reduzir" }, { cor: c.texto, rotulo: "Equipe atual", tracejado: true }]} />}
        >
          {(f) => (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={linhas} margin={margem}>
                <CartesianGrid {...grade(c)} />
                <XAxis dataKey="rotulo" {...eixoX(c)} />
                <YAxis {...eixoY(c, (v) => num(v, 0))} allowDecimals={false} />
                <Tooltip cursor={{ fill: c.grade, opacity: 0.35 }}
                  content={(p) => <TooltipGrafico active={p.active} payload={p.payload} label={p.label}
                    formatarRotulo={(r) => `Semana de ${r}`} formatarValor={(v) => `${v} chapas`}
                    rodape={(l) => <><strong>{textoDaAcao(String(l.acao))}</strong> • custo {moeda(Number(l.custo))}</>} />} />
                <Area dataKey="faixaChapas" name="Faixa" fill={c.series[6]} fillOpacity={0.15} stroke="none" isAnimationActive={c.animar} />
                <Bar dataKey="recomendado" name="Recomendado" radius={[6, 6, 0, 0]} maxBarSize={36} isAnimationActive={c.animar}>
                  {linhas.map((l, i) => <Cell key={l.rotulo} fill={corAcao(l.acao)} fillOpacity={f == null || f === i ? 1 : 0.45} />)}
                </Bar>
                {atual != null && (
                  <ReferenceLine y={atual} stroke={c.texto} strokeDasharray="6 4" strokeWidth={2}
                    label={{ value: `hoje: ${decimal(atual)}`, position: "insideTopRight", fill: c.texto, fontSize: 11 }} />
                )}
                {foco(f)}
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </CartaoGrafico>
      </div>

      <CartaoGrafico
        titulo="Custo semanal: plano recomendado x equipe atual"
        subtitulo="Área = custo escalando pela previsão • linha tracejada = custo mantendo a equipe de hoje"
        resumo={`Nas próximas ${linhas.length} semanas, escalar pela previsão custa ${moeda(custo)}, contra ${moeda(custoAtual)} mantendo a equipe atual. Diferença de ${moeda(Math.abs(custo - custoAtual))} ${custo > custoAtual ? "a mais, para cobrir o pico" : "a menos"}.`}
        serieSonora={linhas.map((l) => l.custo)}
        pontos={linhas.map((l) => `Semana de ${l.rotulo}: plano ${moeda(l.custo)}, equipe atual ${moeda(l.custoAtual)}`)}
        tabela={{ linhas, colunas: [
          { rotulo: "Semana", valor: (l) => l.rotulo },
          { rotulo: "Plano", valor: (l) => moeda(l.custo), alinhar: "direita" },
          { rotulo: "Equipe atual", valor: (l) => moeda(l.custoAtual), alinhar: "direita" },
        ] }}
        arquivo="previsao-custo"
        altura="h-[220px] sm:h-[260px]"
        legenda={<Legenda itens={[{ cor: c.series[1], rotulo: "Plano recomendado" }, { cor: c.series[3], rotulo: "Equipe atual", tracejado: true }]} />}
      >
        {(f) => (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={linhas} margin={margem}>
              <defs>
                <linearGradient id="grad-custo-semana" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={c.series[1]} stopOpacity={0.45} />
                  <stop offset="100%" stopColor={c.series[1]} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid {...grade(c)} />
              <XAxis dataKey="rotulo" {...eixoX(c)} />
              <YAxis {...eixoY(c, moedaCurta, 64)} />
              <Tooltip content={(p) => <TooltipGrafico active={p.active} payload={p.payload} label={p.label}
                formatarRotulo={(r) => `Semana de ${r}`} formatarValor={tooltipMoeda} />} />
              <Area dataKey="custo" name="Plano recomendado" type="monotone" stroke={c.series[1]} strokeWidth={2.5}
                fill="url(#grad-custo-semana)" isAnimationActive={c.animar} />
              <Line dataKey="custoAtual" name="Equipe atual" type="monotone" stroke={c.series[3]} strokeWidth={2}
                strokeDasharray="6 4" dot={false} isAnimationActive={c.animar} />
              {foco(f)}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </CartaoGrafico>

      <Premissas itens={[...dados.premissas, prec.como_ler]} />
    </div>
  );
}
