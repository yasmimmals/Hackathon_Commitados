import { Bar, BarChart, CartesianGrid, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { obterTemposPorMes } from "@/shared/services";
import { CartaoGrafico, CartaoKpi, Legenda, TooltipGrafico, useCores } from "@/shared/components/graficos";
import { rotuloMes, useCarga } from "../utils/carga";
import { eixoX, eixoY, grade, margem, num } from "../utils/graficos";
import { Carregando, Erro, Premissas } from "./Estados";

const MESES = 12;

const duracao = (min: number | null) => {
  if (min == null) return "—";
  const m = Math.round(min);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}`;
};

const mediaPonderada = (itens: { valor: number | null; peso: number }[]) => {
  const validos = itens.filter((i) => i.valor != null && i.peso > 0);
  const peso = validos.reduce((s, i) => s + i.peso, 0);
  return peso ? validos.reduce((s, i) => s + (i.valor as number) * i.peso, 0) / peso : null;
};

export default function AbaTempos() {
  const c = useCores();
  const { dados, erro, carregando } = useCarga(() => obterTemposPorMes(MESES), "tempos");
  if (carregando && !dados) return <Carregando texto="Medindo os tempos…" />;
  if (erro || !dados) return <Erro mensagem={erro ?? "sem dados"} />;

  const linhas = dados.map((m) => {
    const espera = m.espera_media_min;
    const descarga = m.descarga_media_min;
    const total = espera == null && descarga == null ? null : (espera ?? 0) + (descarga ?? 0);
    return { rotulo: rotuloMes(m.mes), espera, descarga, total, caminhoes: m.caminhoes_medidos, descargas: m.descargas_medidas };
  });
  const medidos = linhas.filter((l) => l.total != null);

  const esperaMedia = mediaPonderada(linhas.map((l) => ({ valor: l.espera, peso: l.caminhoes })));
  const descargaMedia = mediaPonderada(linhas.map((l) => ({ valor: l.descarga, peso: l.descargas })));
  const totalMedio = esperaMedia == null && descargaMedia == null ? null : (esperaMedia ?? 0) + (descargaMedia ?? 0);
  const caminhoes = linhas.reduce((s, l) => s + l.caminhoes, 0);
  const maisLento = medidos.reduce<(typeof linhas)[number] | null>((m, l) => (!m || (l.total ?? 0) > (m.total ?? 0) ? l : m), null);
  const periodo = `${linhas[0].rotulo} a ${linhas[linhas.length - 1].rotulo}`;
  const premissa = dados[0]?.premissa;

  if (!medidos.length) {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
          <h2 className="titulo-secao">Tempo do caminhão por mês</h2>
          <p className="mx-auto mt-2 max-w-prose text-sm text-gray-600">
            Ainda não há caminhões com chegada, entrada e saída registradas de {periodo}. O gráfico aparece assim que o
            armazém registrar esses três momentos na tela de Recebimento.
          </p>
        </div>
        {premissa && <Premissas itens={[premissa]} />}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <CartaoKpi destaque rotulo="Tempo total médio" valor={duracao(totalMedio)} nota="da chegada à saída"
          tendencia={medidos.map((l) => l.total ?? 0)} />
        <CartaoKpi rotulo="Espera média" valor={duracao(esperaMedia)} nota="chegada → entrada na doca"
          tendencia={medidos.map((l) => l.espera ?? 0)} corTendencia={c.series[2]} />
        <CartaoKpi rotulo="Descarga média" valor={duracao(descargaMedia)} nota="entrada na doca → saída"
          tendencia={medidos.map((l) => l.descarga ?? 0)} corTendencia={c.series[0]} />
        <CartaoKpi rotulo="Caminhões medidos" valor={String(caminhoes)} nota={periodo} />
      </dl>

      <CartaoGrafico
        titulo="Tempo médio do caminhão por mês"
        subtitulo="Espera (chegada → entrada na doca) + descarga (entrada → saída) • total no topo da barra"
        resumo={`De ${periodo}, o caminhão levou em média ${duracao(totalMedio)} da chegada à saída: ${duracao(esperaMedia)} esperando e ${duracao(descargaMedia)} na doca.${maisLento ? ` O mês mais lento foi ${maisLento.rotulo}, com ${duracao(maisLento.total)}.` : ""}`}
        serieSonora={linhas.map((l) => l.total ?? 0)}
        pontos={linhas.map((l) => (l.total == null ? `${l.rotulo}: sem medição`
          : `${l.rotulo}: ${duracao(l.total)} no total, ${duracao(l.espera)} de espera e ${duracao(l.descarga)} de descarga, ${l.caminhoes} caminhões`))}
        tabela={{ linhas, colunas: [
          { rotulo: "Mês", valor: (l) => l.rotulo },
          { rotulo: "Espera", valor: (l) => duracao(l.espera), alinhar: "direita" },
          { rotulo: "Descarga", valor: (l) => duracao(l.descarga), alinhar: "direita" },
          { rotulo: "Total", valor: (l) => duracao(l.total), alinhar: "direita" },
          { rotulo: "Caminhões", valor: (l) => l.caminhoes, alinhar: "direita" },
        ] }}
        arquivo="tempo-caminhao-mensal"
        legenda={<Legenda itens={[
          { cor: c.series[2], rotulo: "Espera" },
          { cor: c.series[0], rotulo: "Descarga" },
          { cor: c.texto, rotulo: "Média do período", tracejado: true },
        ]} />}
      >
        {(f) => (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={linhas} margin={{ ...margem, top: 24 }}>
              <CartesianGrid {...grade(c)} />
              <XAxis dataKey="rotulo" {...eixoX(c)} />
              <YAxis {...eixoY(c, (v) => `${num(v, 0)} min`, 56)} />
              <Tooltip cursor={{ fill: c.grade, opacity: 0.35 }}
                content={(p) => <TooltipGrafico active={p.active} payload={p.payload} label={p.label} formatarValor={(v) => duracao(Number(v))}
                  rodape={(l) => <>Total {duracao(l.total as number | null)} • {String(l.caminhoes)} caminhões</>} />} />
              <Bar dataKey="espera" name="Espera" stackId="t" fill={c.series[2]} maxBarSize={40} isAnimationActive={c.animar}
                fillOpacity={1} />
              <Bar dataKey="descarga" name="Descarga" stackId="t" fill={c.series[0]} radius={[6, 6, 0, 0]} maxBarSize={40} isAnimationActive={c.animar}>
                <LabelList dataKey="total" position="top" fill={c.texto} fontSize={11}
                  formatter={(v: unknown) => (v == null ? "" : duracao(Number(v)))} />
              </Bar>
              {totalMedio != null && (
                <ReferenceLine y={totalMedio} stroke={c.texto} strokeDasharray="6 4"
                  label={{ value: `média ${duracao(totalMedio)}`, position: "insideTopLeft", fill: c.texto, fontSize: 11 }} />
              )}
              {f != null && <ReferenceLine x={linhas[f]?.rotulo} stroke={c.destaque} strokeWidth={2} />}
            </BarChart>
          </ResponsiveContainer>
        )}
      </CartaoGrafico>

      <Premissas itens={[
        "Espera: da chegada do caminhão até a primeira entrada em uma doca. Descarga: da entrada até a saída, por armazém.",
        "O total soma as duas médias. Caminhão que descarrega em mais de um armazém tem mais de uma descarga, então o total é uma aproximação por caminhão.",
        "Só entram descargas concluídas (com entrada e saída registradas). Meses sem medição aparecem vazios.",
        ...(premissa ? [premissa] : []),
      ]} />
    </div>
  );
}
