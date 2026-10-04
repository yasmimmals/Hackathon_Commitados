import { obterCustoMensal, type MesCusto } from "@/shared/services";
import { decimal, moeda } from "@/shared/utils/formatacao";
import { COR, rotuloMes, useCarga } from "../utils/carga";
import { Carregando, Erro, Kpi, Premissas } from "./Estados";

export default function AbaCusto() {
  const { dados, erro, carregando } = useCarga(obterCustoMensal, "custo");
  if (carregando) return <Carregando texto="Somando a folha…" />;
  if (erro || !dados) return <Erro mensagem={erro ?? "sem dados"} />;

  const m = dados.mensal;
  const maxPago = Math.max(1, ...m.map((x) => x.valor_pago));
  const maxCpc = Math.max(1, ...m.map((x) => x.custo_por_caminhao ?? 0));
  const r = dados.reajuste_da_diaria;

  return (
    <div className="space-y-5">
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi destaque rotulo="Pago aos chapas" valor={moeda(dados.total_pago)}
          nota={m.length ? `${rotuloMes(m[0].mes)} a ${rotuloMes(m[m.length - 1].mes)}` : undefined} />
        <Kpi rotulo="Custo por caminhão" valor={dados.custo_medio_por_caminhao != null ? moeda(dados.custo_medio_por_caminhao) : "—"}
          nota="média mensal (equipe ÷ caminhões)" />
        <Kpi rotulo="Reajuste da diária" valor={r ? `${r.variacao_percentual > 0 ? "+" : ""}${decimal(r.variacao_percentual)}%` : "—"}
          nota={r ? `${moeda(r.de)} → ${moeda(r.para)}` : "histórico curto"} />
        <Kpi rotulo="Meses sem folha" valor={String(dados.meses_sem_folha.length)}
          nota={dados.meses_sem_folha.map(rotuloMes).join(", ") || "nenhum"} />
      </dl>

      <Grafico titulo="Valor pago por mês" nota="Folha diária (diária base, sem encargos). Meses parciais em cinza."
        meses={m} valor={(x) => x.valor_pago} maximo={maxPago} rotulo={(v) => moeda(v)} cor={(x) => (x.parcial ? COR.NEUTRO : "#1f4e79")} />

      <Grafico titulo="Custo da equipe por caminhão recebido"
        nota="Cai no pico (mesma equipe, mais caminhões) e sobe fora dele: é onde a escala fixa pesa no bolso."
        meses={m} valor={(x) => x.custo_por_caminhao ?? 0} maximo={maxCpc} rotulo={(v) => moeda(v)}
        cor={(x) => ((x.custo_por_caminhao ?? 0) > (dados.custo_medio_por_caminhao ?? 0) ? COR.SOBRA : COR.ADEQUADO)} />

      <section className="rounded-3xl bg-white p-5 shadow-sm">
        <h2 className="titulo-secao mb-3 border-b-[3px] border-site-amarelo pb-2 text-lg">Equipe média x necessária</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs text-gray-600">
              <tr className="border-b border-gray-200">
                <th className="py-2 pr-3 font-semibold">Mês</th>
                <th className="px-2 py-2 text-right font-semibold">Caminhões</th>
                <th className="px-2 py-2 text-right font-semibold">Equipe média</th>
                <th className="px-2 py-2 text-right font-semibold">Necessária (est.)</th>
                <th className="px-2 py-2 text-right font-semibold">Diária média</th>
                <th className="py-2 pl-2 text-right font-semibold">Pago</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 tabular-nums">
              {m.map((x) => (
                <tr key={x.mes} className={x.parcial ? "text-gray-400" : ""}>
                  <th scope="row" className="py-2 pr-3 font-medium">{rotuloMes(x.mes)}{x.parcial && " (parcial)"}</th>
                  <td className="px-2 py-2 text-right">{x.caminhoes_recebidos}</td>
                  <td className="px-2 py-2 text-right">{x.equipe_media != null ? decimal(x.equipe_media) : "—"}</td>
                  <td className="px-2 py-2 text-right">{x.equipe_necessaria_estimada != null ? decimal(x.equipe_necessaria_estimada) : "—"}</td>
                  <td className="px-2 py-2 text-right">{x.valor_por_diaria != null ? moeda(x.valor_por_diaria) : "—"}</td>
                  <td className="py-2 pl-2 text-right">{moeda(x.valor_pago)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Premissas itens={dados.premissas} />
    </div>
  );
}

function Grafico({ titulo, nota, meses, valor, maximo, rotulo, cor }: {
  titulo: string; nota: string; meses: MesCusto[]; maximo: number;
  valor: (m: MesCusto) => number; rotulo: (v: number) => string; cor: (m: MesCusto) => string;
}) {
  return (
    <figure className="rounded-3xl bg-white p-5 shadow-sm">
      <figcaption className="mb-1 border-b-[3px] border-site-amarelo pb-2"><span className="titulo-secao text-lg">{titulo}</span></figcaption>
      <p className="mb-4 text-xs text-gray-500">{nota}</p>
      <div className="overflow-x-auto">
        <div className="flex min-w-[640px] items-end gap-1.5" style={{ height: 190 }}>
          {meses.map((m) => {
            const v = valor(m);
            return (
              <div key={m.mes} className="group flex flex-1 flex-col items-center gap-1" aria-label={`${rotuloMes(m.mes)}: ${rotulo(v)}`}>
                <span className="invisible text-[10px] font-semibold tabular-nums text-gray-700 group-hover:visible">{rotulo(v)}</span>
                <span className="w-full max-w-[28px] rounded-t" style={{ height: `${(v / maximo) * 140}px`, background: cor(m) }} aria-hidden />
                <span className="text-[10px] text-gray-600">{rotuloMes(m.mes)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </figure>
  );
}
