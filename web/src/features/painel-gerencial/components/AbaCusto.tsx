import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { obterCustoMensal } from "@/shared/services";
import { CartaoGrafico, CartaoKpi, Legenda, TooltipGrafico, useCores } from "@/shared/components/graficos";
import { decimal, moeda } from "@/shared/utils/formatacao";
import { rotuloMes, useCarga } from "../utils/carga";
import { eixoX, eixoY, grade, margem, moedaCurta, num } from "../utils/graficos";
import { Carregando, Erro, Premissas } from "./Estados";

export default function AbaCusto() {
  const c = useCores();
  const { dados, erro, carregando } = useCarga(obterCustoMensal, "custo");
  if (carregando && !dados) return <Carregando texto="Somando a folha…" />;
  if (erro || !dados) return <Erro mensagem={erro ?? "sem dados"} />;

  const linhas = dados.mensal.map((m) => ({
    rotulo: rotuloMes(m.mes), pago: m.valor_pago, parcial: m.parcial, diaria: m.valor_por_diaria ?? null,
    cpc: m.custo_por_caminhao ?? null, caminhoes: m.caminhoes_recebidos, equipe: m.equipe_media ?? null,
    necessaria: m.equipe_necessaria_estimada ?? null, dias: m.dias_com_folha,
  }));
  const r = dados.reajuste_da_diaria;
  const media = dados.custo_medio_por_caminhao ?? 0;
  const completos = linhas.filter((l) => !l.parcial);
  const maisCaro = completos.reduce((m, l) => ((l.cpc ?? 0) > (m.cpc ?? 0) ? l : m), completos[0] ?? linhas[0]);
  const maisBarato = completos.reduce((m, l) => ((l.cpc ?? Infinity) < (m.cpc ?? Infinity) ? l : m), completos[0] ?? linhas[0]);
  const foco = (f: number | null) => (f != null ? <ReferenceLine x={linhas[f]?.rotulo} stroke={c.destaque} strokeWidth={2} /> : null);
  const periodo = linhas.length ? `${linhas[0].rotulo} a ${linhas[linhas.length - 1].rotulo}` : "";

  return (
    <div className="space-y-5">
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <CartaoKpi destaque rotulo="Pago aos chapas" valor={moeda(dados.total_pago)} nota={periodo} tendencia={linhas.map((l) => l.pago)} />
        <CartaoKpi rotulo="Custo por caminhão" valor={media ? moeda(media) : "—"} nota="média mensal (equipe ÷ caminhões)"
          tendencia={completos.map((l) => l.cpc ?? 0)} corTendencia={c.series[3]} />
        <CartaoKpi rotulo="Reajuste da diária" valor={r ? `${r.variacao_percentual > 0 ? "+" : ""}${decimal(r.variacao_percentual)}%` : "—"}
          nota={r ? `${moeda(r.de)} → ${moeda(r.para)}` : "histórico curto"}
          variacao={r ? { texto: r.periodo.replace(" a ", " → "), boa: r.variacao_percentual <= 0 } : null}
          tendencia={completos.map((l) => l.diaria ?? 0)} corTendencia={c.series[4]} />
        <CartaoKpi rotulo="Meses sem folha" valor={String(dados.meses_sem_folha.length)}
          nota={dados.meses_sem_folha.map(rotuloMes).join(", ") || "nenhum"} />
      </dl>

      <CartaoGrafico
        titulo="Valor pago aos chapas por mês"
        subtitulo="Folha diária (diária base, sem encargos) • meses incompletos em cinza"
        resumo={`De ${periodo}, foram pagos ${moeda(dados.total_pago)} aos chapas. ${r ? `A diária média subiu ${decimal(r.variacao_percentual)} por cento no período.` : ""}`}
        serieSonora={linhas.map((l) => l.pago)}
        pontos={linhas.map((l) => `${l.rotulo}: ${moeda(l.pago)} em ${l.dias} dias${l.parcial ? ", mês incompleto" : ""}`)}
        tabela={{ linhas, colunas: [
          { rotulo: "Mês", valor: (l) => l.rotulo + (l.parcial ? " (parcial)" : "") },
          { rotulo: "Dias", valor: (l) => l.dias, alinhar: "direita" },
          { rotulo: "Valor pago", valor: (l) => moeda(l.pago), alinhar: "direita" },
          { rotulo: "Diária média", valor: (l) => (l.diaria != null ? moeda(l.diaria) : "—"), alinhar: "direita" },
          { rotulo: "Caminhões", valor: (l) => l.caminhoes, alinhar: "direita" },
          { rotulo: "Custo/caminhão", valor: (l) => (l.cpc != null ? moeda(l.cpc) : "—"), alinhar: "direita" },
        ] }}
        arquivo="custo-mensal-chapas"
        legenda={<Legenda itens={[{ cor: c.series[0], rotulo: "Mês completo" }, { cor: c.situacao.NEUTRO, rotulo: "Mês incompleto" }]} />}
      >
        {(f) => (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={linhas} margin={margem}>
              <CartesianGrid {...grade(c)} />
              <XAxis dataKey="rotulo" {...eixoX(c)} />
              <YAxis {...eixoY(c, moedaCurta, 68)} />
              <Tooltip cursor={{ fill: c.grade, opacity: 0.35 }}
                content={(p) => <TooltipGrafico active={p.active} payload={p.payload} label={p.label} formatarValor={(v) => moeda(Number(v))}
                  rodape={(l) => <>{String(l.dias)} dias de folha • {String(l.caminhoes)} caminhões{l.parcial ? " • incompleto" : ""}</>} />} />
              <Bar dataKey="pago" name="Valor pago" radius={[6, 6, 0, 0]} maxBarSize={40} isAnimationActive={c.animar}>
                {linhas.map((l, i) => <Cell key={l.rotulo} fill={l.parcial ? c.situacao.NEUTRO : c.series[0]} fillOpacity={f == null || f === i ? 1 : 0.45} />)}
              </Bar>
              {foco(f)}
            </BarChart>
          </ResponsiveContainer>
        )}
      </CartaoGrafico>

      <div className="grid gap-5 xl:grid-cols-2">
        <CartaoGrafico
          titulo="Custo da equipe por caminhão recebido"
          subtitulo="Cai no pico (mesma equipe, mais caminhões) e sobe fora dele"
          resumo={`O custo médio é de ${moeda(media)} por caminhão. O mês mais caro foi ${maisCaro?.rotulo}, com ${moeda(maisCaro?.cpc ?? 0)}; o mais barato, ${maisBarato?.rotulo}, com ${moeda(maisBarato?.cpc ?? 0)}. Fora do pico a equipe fica cara por caminhão: é a sobra.`}
          serieSonora={linhas.map((l) => l.cpc ?? 0)}
          pontos={linhas.map((l) => `${l.rotulo}: ${l.cpc != null ? moeda(l.cpc) : "sem dado"} por caminhão`)}
          tabela={{ linhas, colunas: [
            { rotulo: "Mês", valor: (l) => l.rotulo },
            { rotulo: "Caminhões", valor: (l) => l.caminhoes, alinhar: "direita" },
            { rotulo: "Custo/caminhão", valor: (l) => (l.cpc != null ? moeda(l.cpc) : "—"), alinhar: "direita" },
          ] }}
          arquivo="custo-por-caminhao"
          legenda={<Legenda itens={[{ cor: c.series[3], rotulo: "Custo por caminhão" }, { cor: c.texto, rotulo: "Média", tracejado: true }]} />}
        >
          {(f) => (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={linhas} margin={margem}>
                <defs>
                  <linearGradient id="grad-cpc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={c.series[3]} stopOpacity={0.4} /><stop offset="100%" stopColor={c.series[3]} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...grade(c)} />
                <XAxis dataKey="rotulo" {...eixoX(c)} />
                <YAxis {...eixoY(c, (v) => `R$ ${num(v, 0)}`, 56)} />
                <Tooltip content={(p) => <TooltipGrafico active={p.active} payload={p.payload} label={p.label} formatarValor={(v) => moeda(Number(v))}
                  rodape={(l) => <>{String(l.caminhoes)} caminhões no mês</>} />} />
                <Area dataKey="cpc" name="Custo por caminhão" type="monotone" stroke={c.series[3]} strokeWidth={2.5}
                  fill="url(#grad-cpc)" connectNulls isAnimationActive={c.animar} dot={{ r: 2.5 }} />
                <ReferenceLine y={media} stroke={c.texto} strokeDasharray="6 4"
                  label={{ value: `média ${moeda(media)}`, position: "insideTopLeft", fill: c.texto, fontSize: 11 }} />
                {foco(f)}
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CartaoGrafico>

        <CartaoGrafico
          titulo="Equipe média x necessária"
          subtitulo="Barras = chapas presentes • linha = necessários (recebimento + reserva)"
          resumo={`Em ${completos.filter((l) => (l.equipe ?? 0) > (l.necessaria ?? 0) + 2).length} meses a equipe ficou mais de 2 chapas acima do necessário; em ${completos.filter((l) => (l.equipe ?? 0) < (l.necessaria ?? 0)).length} meses ficou abaixo.`}
          serieSonora={linhas.map((l) => (l.equipe ?? 0) - (l.necessaria ?? 0))}
          pontos={linhas.map((l) => `${l.rotulo}: equipe ${l.equipe != null ? decimal(l.equipe) : "—"}, necessária ${l.necessaria != null ? decimal(l.necessaria) : "—"}`)}
          tabela={{ linhas, colunas: [
            { rotulo: "Mês", valor: (l) => l.rotulo },
            { rotulo: "Equipe média", valor: (l) => (l.equipe != null ? decimal(l.equipe) : "—"), alinhar: "direita" },
            { rotulo: "Necessária", valor: (l) => (l.necessaria != null ? decimal(l.necessaria) : "—"), alinhar: "direita" },
          ] }}
          arquivo="equipe-x-necessaria"
          legenda={<Legenda itens={[{ cor: c.series[0], rotulo: "Equipe média" }, { cor: c.series[2], rotulo: "Necessária" }]} />}
        >
          {(f) => (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={linhas} margin={margem}>
                <CartesianGrid {...grade(c)} />
                <XAxis dataKey="rotulo" {...eixoX(c)} />
                <YAxis {...eixoY(c, (v) => num(v, 0))} />
                <Tooltip cursor={{ fill: c.grade, opacity: 0.35 }}
                  content={(p) => <TooltipGrafico active={p.active} payload={p.payload} label={p.label} formatarValor={(v) => `${decimal(Number(v))} chapas`} />} />
                <Bar dataKey="equipe" name="Equipe média" fill={c.series[0]} radius={[6, 6, 0, 0]} maxBarSize={30} isAnimationActive={c.animar} />
                <Line dataKey="necessaria" name="Necessária" type="monotone" stroke={c.series[2]} strokeWidth={3} dot={{ r: 3 }} isAnimationActive={c.animar} />
                {foco(f)}
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </CartaoGrafico>
      </div>

      <Premissas itens={dados.premissas} />
    </div>
  );
}
