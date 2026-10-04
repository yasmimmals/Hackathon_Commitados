import { obterSobraFalta, type MesSobraFalta } from "@/shared/services";
import { decimal, moeda } from "@/shared/utils/formatacao";
import { corDaSituacao, rotuloMes, useCarga } from "../utils/carga";
import { Carregando, Erro, Kpi, LegendaSituacao, Premissas, SeloSituacao } from "./Estados";

export default function AbaHistorico() {
  const { dados, erro, carregando } = useCarga(obterSobraFalta, "sobra-falta");
  if (carregando) return <Carregando texto="Cruzando folha e caminhões…" />;
  if (erro || !dados) return <Erro mensagem={erro ?? "sem dados"} />;

  const h = dados.historico;
  const maximo = Math.max(1, ...h.mensal.map((m) => Math.max(m.chapas_presentes_media, m.chapas_necessarios_pesado)));

  return (
    <div className="space-y-5">
      <p className="rounded-3xl bg-site-azul px-5 py-4 text-sm font-semibold text-white shadow-sm sm:text-base">{h.resposta}</p>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi rotulo="Meses com sobra" valor={String(h.meses_com_sobra.length)} nota="sobra até no cenário pesado" />
        <Kpi rotulo="Meses com risco de falta" valor={String(h.meses_com_risco_de_falta.length)}
          nota={h.meses_com_risco_de_falta.map(rotuloMes).join(", ") || "nenhum"} />
        <Kpi rotulo="Custo da sobra (estimado)" valor={moeda(h.custo_sobra_estimado_total)} nota="estimativa conservadora" />
        <Kpi rotulo="Complemento pago (sistema)" valor={moeda(Number(dados.sistema.complemento_total))}
          nota={`${dados.sistema.boletins_fechados} boletim(ns) fechados no sistema`} />
      </dl>

      <figure className="rounded-3xl bg-white p-5 shadow-sm">
        <figcaption className="mb-3 flex flex-wrap items-end justify-between gap-2 border-b-[3px] border-site-amarelo pb-2">
          <span className="titulo-secao text-lg">Chapas presentes x necessários no recebimento</span>
          <LegendaSituacao situacoes={["SOBRA", "EQUILIBRIO", "RISCO_DE_FALTA", "FALTA"]} />
        </figcaption>
        <p className="mb-3 text-xs text-gray-500">Barra = chapas presentes (média do mês) • faixa escura = necessários, do cenário leve ao pesado.</p>
        <ul className="space-y-1">
          {h.mensal.map((m) => <LinhaMes key={m.mes} m={m} maximo={maximo} />)}
        </ul>
      </figure>

      <Premissas itens={[...h.premissas, ...dados.sistema.premissas]} />
    </div>
  );
}

function LinhaMes({ m, maximo }: { m: MesSobraFalta; maximo: number }) {
  const pct = (v: number) => `${(v / maximo) * 100}%`;
  return (
    <li className="grid grid-cols-[52px_minmax(0,1fr)_110px] items-center gap-2 rounded-lg px-1 py-1 hover:bg-gray-50 sm:grid-cols-[60px_minmax(0,1fr)_150px] sm:gap-3"
      aria-label={`${rotuloMes(m.mes)}: ${decimal(m.chapas_presentes_media)} presentes, necessários de ${decimal(m.chapas_necessarios_leve)} a ${decimal(m.chapas_necessarios_pesado)}, ${decimal(m.caminhoes_dia_media)} caminhões por dia`}>
      <span className="text-xs font-semibold text-gray-700 sm:text-sm">{rotuloMes(m.mes)}</span>
      <div className="relative h-6" aria-hidden>
        <span className="absolute top-0.5 h-5 rounded-r opacity-85" style={{ width: pct(m.chapas_presentes_media), background: corDaSituacao(m.situacao) }} />
        <span className="absolute top-2 h-2 rounded bg-gray-900/70"
          style={{ left: pct(m.chapas_necessarios_leve), width: pct(Math.max(0.15, m.chapas_necessarios_pesado - m.chapas_necessarios_leve)) }} />
      </div>
      <span className="flex items-center justify-end gap-2 text-xs">
        <span className="hidden tabular-nums text-gray-500 sm:inline">{decimal(m.caminhoes_dia_media)} cam/dia</span>
        <SeloSituacao situacao={m.situacao} />
      </span>
    </li>
  );
}
