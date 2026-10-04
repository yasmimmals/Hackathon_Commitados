import { Area, Bar, CartesianGrid, Cell, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { obterSobraFalta } from "@/shared/services";
import { CartaoGrafico, CartaoKpi, Legenda, TooltipGrafico, useCores } from "@/shared/components/graficos";
import { decimal, moeda } from "@/shared/utils/formatacao";
import { ROTULO_SITUACAO, rotuloMes, useCarga } from "../utils/carga";
import { eixoX, eixoY, grade, margem, num } from "../utils/graficos";
import { Carregando, Erro, LegendaSituacao, Premissas } from "./Estados";

export default function AbaHistorico() {
  const c = useCores();
  const { dados, erro, carregando } = useCarga(obterSobraFalta, "sobra-falta");
  if (carregando && !dados) return <Carregando texto="Cruzando folha e caminhões…" />;
  if (erro || !dados) return <Erro mensagem={erro ?? "sem dados"} />;

  const h = dados.historico;
  const linhas = h.mensal.map((m) => ({
    rotulo: rotuloMes(m.mes), presentes: m.chapas_presentes_media, necessarios: [m.chapas_necessarios_leve, m.chapas_necessarios_pesado] as [number, number],
    caminhoes: m.caminhoes_dia_media, situacao: m.situacao, saldo: m.saldo_pesado, custo: m.custo_sobra_estimado, dias: m.dias_uteis,
  }));
  const corSit = (s: string) => c.situacao[(s in c.situacao ? s : "NEUTRO") as keyof typeof c.situacao];

  return (
    <div className="space-y-5">
      <p className="rounded-3xl bg-site-azul px-5 py-4 text-sm font-semibold text-white shadow-sm sm:text-base">{h.resposta}</p>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <CartaoKpi rotulo="Meses com sobra" valor={String(h.meses_com_sobra.length)} nota="sobra até no cenário pesado"
          tendencia={linhas.map((l) => l.saldo)} corTendencia={c.situacao.SOBRA} />
        <CartaoKpi rotulo="Meses com risco de falta" valor={String(h.meses_com_risco_de_falta.length)}
          nota={h.meses_com_risco_de_falta.map(rotuloMes).join(", ") || "nenhum"} />
        <CartaoKpi destaque rotulo="Custo da sobra (estimado)" valor={moeda(h.custo_sobra_estimado_total)} nota="estimativa conservadora"
          tendencia={linhas.map((l) => l.custo)} />
        <CartaoKpi rotulo="Complemento pago (sistema)" valor={moeda(Number(dados.sistema.complemento_total))}
          nota={`${dados.sistema.boletins_fechados} boletim(ns) fechados no sistema`} />
      </dl>

      <CartaoGrafico
        titulo="Chapas presentes x necessários no recebimento"
        subtitulo="Barras = presentes (cor = situação) • faixa = necessários do cenário leve ao pesado • linha = caminhões/dia"
        resumo={h.resposta}
        serieSonora={linhas.map((l) => l.saldo)}
        pontos={linhas.map((l) => `${l.rotulo}: ${decimal(l.presentes)} presentes, necessários de ${decimal(l.necessarios[0])} a ${decimal(l.necessarios[1])}, ${num(l.caminhoes)} caminhões por dia, ${ROTULO_SITUACAO[l.situacao] ?? l.situacao}`)}
        tabela={{ linhas, colunas: [
          { rotulo: "Mês", valor: (l) => l.rotulo },
          { rotulo: "Caminhões/dia", valor: (l) => num(l.caminhoes), alinhar: "direita" },
          { rotulo: "Presentes", valor: (l) => decimal(l.presentes), alinhar: "direita" },
          { rotulo: "Necessários", valor: (l) => `${decimal(l.necessarios[0])} a ${decimal(l.necessarios[1])}`, alinhar: "direita" },
          { rotulo: "Situação", valor: (l) => ROTULO_SITUACAO[l.situacao] ?? l.situacao },
          { rotulo: "Custo da sobra", valor: (l) => moeda(l.custo), alinhar: "direita" },
        ] }}
        arquivo="sobra-ou-falta"
        altura="h-[300px] sm:h-[380px]"
        legenda={<div className="flex flex-wrap gap-4"><LegendaSituacao situacoes={["SOBRA", "EQUILIBRIO", "RISCO_DE_FALTA", "FALTA"]} />
          <Legenda itens={[{ cor: c.texto, rotulo: "Necessários (faixa)", faixa: true }, { cor: c.series[2], rotulo: "Caminhões/dia" }]} /></div>}
      >
        {(f) => (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={linhas} margin={{ ...margem, right: 4 }}>
              <CartesianGrid {...grade(c)} />
              <XAxis dataKey="rotulo" {...eixoX(c)} />
              <YAxis yAxisId="chapas" {...eixoY(c, (v) => num(v, 0), 32)} />
              <YAxis yAxisId="caminhoes" orientation="right" {...eixoY(c, (v) => num(v, 0), 32)} />
              <Tooltip cursor={{ fill: c.grade, opacity: 0.35 }}
                content={(p) => <TooltipGrafico active={p.active} payload={p.payload} label={p.label}
                  formatarValor={(v, nome) => (nome === "Caminhões/dia" ? `${num(Number(v))}` : `${decimal(Number(v))} chapas`)}
                  rodape={(l) => <>Necessários: {decimal((l.necessarios as number[])[0])} a {decimal((l.necessarios as number[])[1])} •{" "}
                    <strong>{ROTULO_SITUACAO[String(l.situacao)] ?? String(l.situacao)}</strong></>} />} />
              <Area yAxisId="chapas" dataKey="necessarios" name="Necessários" fill={c.texto} fillOpacity={0.12} stroke="none" isAnimationActive={c.animar} />
              <Bar yAxisId="chapas" dataKey="presentes" name="Presentes" radius={[6, 6, 0, 0]} maxBarSize={30} isAnimationActive={c.animar}>
                {linhas.map((l, i) => <Cell key={l.rotulo} fill={corSit(l.situacao)} fillOpacity={f == null || f === i ? 1 : 0.45} />)}
              </Bar>
              <Line yAxisId="caminhoes" dataKey="caminhoes" name="Caminhões/dia" type="monotone" stroke={c.series[2]} strokeWidth={2.5}
                dot={false} isAnimationActive={c.animar} />
              {f != null && <ReferenceLine yAxisId="chapas" x={linhas[f]?.rotulo} stroke={c.destaque} strokeWidth={2} />}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </CartaoGrafico>

      <Premissas itens={[...h.premissas, ...dados.sistema.premissas]} />
    </div>
  );
}
