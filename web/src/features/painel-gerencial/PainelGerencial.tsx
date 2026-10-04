import { useMemo, useState } from "react";
import { BarChart3, Info } from "lucide-react";
import { Link } from "react-router-dom";
import type { LocalFisico } from "@/shared/services";
import { dataLocalIso } from "@/shared/utils/janelas";
import { LOCAIS, ROTULO_LOCAL } from "@/shared/utils/locais";
import { PISO_DIARIA } from "@/features/boletim-producao/constants";
import { listarBoletins } from "@/features/boletim-producao/services/boletimStore";
import { decimal, moeda } from "@/features/boletim-producao/utils/calculo";
import GraficoSaldo from "./components/GraficoSaldo";
import { indicadorDoBoletim, resumirPorArmazem } from "./utils/indicadores";

const formatarData = (iso: string) => iso.split("-").reverse().join("/");
const sinal = (v: number) => (v > 0 ? `+${moeda(v)}` : v < 0 ? `−${moeda(-v)}` : moeda(0));

/** Sobra ou falta de chapas por armazém e período, em R$, a partir dos boletins de produção. */
export default function PainelGerencial() {
  const [inicio, setInicio] = useState(() => dataLocalIso(-30));
  const [fim, setFim] = useState(() => dataLocalIso(-1));
  const [local, setLocal] = useState<LocalFisico | "">("");
  const [incluirRascunhos, setIncluirRascunhos] = useState(false);
  // Os boletins são lidos uma vez por montagem (ficam no navegador até existir rota no backend).
  const [boletins] = useState(listarBoletins);

  const indicadores = useMemo(
    () =>
      boletins
        .filter((b) => b.data >= inicio && b.data <= fim)
        .filter((b) => incluirRascunhos || b.status === "FECHADO")
        .filter((b) => !local || b.local === local)
        .map(indicadorDoBoletim)
        .sort((a, b) => b.data.localeCompare(a.data) || a.local.localeCompare(b.local)),
    [boletins, inicio, fim, local, incluirRascunhos],
  );

  const porArmazem = useMemo(
    () => resumirPorArmazem(indicadores).filter((r) => !local || r.local === local),
    [indicadores, local],
  );

  const total = porArmazem.reduce(
    (t, r) => ({ sobra: t.sobra + r.sobraReais, falta: t.falta + r.faltaReais, saldo: t.saldo + r.saldoReais }),
    { sobra: 0, falta: 0, saldo: 0 },
  );
  const rascunhosForaDoFiltro = boletins.filter((b) => b.status === "RASCUNHO" && b.data >= inicio && b.data <= fim).length;

  const kpis = [
    { rotulo: "Sobra no período", valor: moeda(total.sobra), nota: "pago em complemento" },
    { rotulo: "Falta no período", valor: moeda(total.falta), nota: "produção acima do piso da equipe" },
    { rotulo: "Saldo", valor: sinal(total.saldo), nota: total.saldo > 0 ? "sobra de chapas" : total.saldo < 0 ? "falta de chapas" : "equipe ajustada" },
    { rotulo: "Boletins considerados", valor: String(indicadores.length), nota: incluirRascunhos ? "fechados e rascunhos" : "somente fechados" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-1 flex items-center gap-1.5 text-xs text-gray-500">
            <BarChart3 className="h-3.5 w-3.5" aria-hidden /> Responsável pelo Armazém
          </p>
          <h1 className="titulo-pagina">Painel Gerencial</h1>
          <p className="mt-2 max-w-prose text-sm text-gray-600">
            Sobra ou falta de chapas por armazém e período, em R$, calculada a partir dos boletins de produção.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-xs font-semibold text-gray-700">
            De
            <input type="date" value={inicio} max={fim} onChange={(e) => e.target.value && setInicio(e.target.value)} className="mt-1 block rounded-full border border-gray-300 bg-white px-3 py-2 text-sm" />
          </label>
          <label className="text-xs font-semibold text-gray-700">
            Até
            <input type="date" value={fim} min={inicio} onChange={(e) => e.target.value && setFim(e.target.value)} className="mt-1 block rounded-full border border-gray-300 bg-white px-3 py-2 text-sm" />
          </label>
          <label className="text-xs font-semibold text-gray-700">
            Armazém
            <select value={local} onChange={(e) => setLocal(e.target.value as LocalFisico | "")} className="mt-1 block rounded-full border border-gray-300 bg-white px-3 py-2 text-sm">
              <option value="">Todos</option>
              {LOCAIS.map((l) => (
                <option key={l} value={l}>{ROTULO_LOCAL[l]}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700">
            <input type="checkbox" checked={incluirRascunhos} onChange={(e) => setIncluirRascunhos(e.target.checked)} className="accent-marca" />
            Incluir rascunhos
          </label>
        </div>
      </div>

      <p className="flex items-start gap-2 rounded-2xl bg-sky-50 px-4 py-3 text-xs text-sky-900 ring-1 ring-sky-100">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <span>
          Diárias necessárias = produção ÷ piso ({moeda(PISO_DIARIA)} por diária). Diárias escaladas acima disso são{" "}
          <strong>sobra</strong> (a cooperativa paga complemento); abaixo, <strong>falta</strong> de chapas. Valores em R$ = diferença × piso.
          {!incluirRascunhos && rascunhosForaDoFiltro > 0 && ` ${rascunhosForaDoFiltro} boletim(ns) em rascunho no período não entram no cálculo.`}
        </span>
      </p>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.rotulo} className="rounded-2xl bg-white px-4 py-3 shadow-sm">
            <dt className="text-xs font-semibold text-gray-500">{k.rotulo}</dt>
            <dd className="text-xl font-semibold text-gray-900 sm:text-2xl">{k.valor}</dd>
            <dd className="text-[11px] text-gray-500">{k.nota}</dd>
          </div>
        ))}
      </dl>

      {indicadores.length === 0 ? (
        <div className="rounded-3xl bg-white px-4 py-12 text-center shadow-sm">
          <p className="font-semibold text-gray-800">Nenhum boletim {incluirRascunhos ? "" : "fechado "}no período.</p>
          <p className="mt-1 text-sm text-gray-500">
            Feche os boletins em{" "}
            <Link to="/armazem/boletim" className="font-semibold text-site-azul hover:underline">Boletim de Produção</Link> para ver os indicadores.
          </p>
        </div>
      ) : (
        <>
          <GraficoSaldo resumo={porArmazem} />

          <section aria-labelledby="tabela-armazem" className="rounded-3xl bg-white p-5 shadow-sm">
            <h2 id="tabela-armazem" className="titulo-secao mb-3 border-b-[3px] border-site-amarelo pb-2 text-lg">Por armazém</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="text-xs text-gray-600">
                  <tr className="border-b border-gray-200">
                    <th scope="col" className="py-2 pr-3 font-semibold">Armazém</th>
                    <th scope="col" className="px-2 py-2 text-right font-semibold">Boletins</th>
                    <th scope="col" className="px-2 py-2 text-right font-semibold">Diárias escaladas</th>
                    <th scope="col" className="px-2 py-2 text-right font-semibold">Diárias necessárias</th>
                    <th scope="col" className="px-2 py-2 text-right font-semibold">Sobra (R$)</th>
                    <th scope="col" className="px-2 py-2 text-right font-semibold">Falta (R$)</th>
                    <th scope="col" className="py-2 pl-2 text-right font-semibold">Saldo (R$)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 tabular-nums">
                  {porArmazem.map((r) => (
                    <tr key={r.local}>
                      <th scope="row" className="py-2 pr-3 font-medium text-gray-900">{ROTULO_LOCAL[r.local]}</th>
                      <td className="px-2 py-2 text-right">{r.boletins}</td>
                      <td className="px-2 py-2 text-right">{decimal(r.diarias)}</td>
                      <td className="px-2 py-2 text-right">{decimal(r.necessarias)}</td>
                      <td className="px-2 py-2 text-right">{moeda(r.sobraReais)}</td>
                      <td className="px-2 py-2 text-right">{moeda(r.faltaReais)}</td>
                      <td className="py-2 pl-2 text-right font-semibold text-gray-900">{sinal(r.saldoReais)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section aria-labelledby="tabela-boletins" className="rounded-3xl bg-white p-5 shadow-sm">
            <h2 id="tabela-boletins" className="titulo-secao mb-3 border-b-[3px] border-site-amarelo pb-2 text-lg">Por boletim</h2>
            <div className="max-h-[420px] overflow-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="sticky top-0 bg-white text-xs text-gray-600">
                  <tr className="border-b border-gray-200">
                    <th scope="col" className="py-2 pr-3 font-semibold">Data</th>
                    <th scope="col" className="px-2 py-2 font-semibold">Armazém</th>
                    <th scope="col" className="px-2 py-2 text-right font-semibold">Produção</th>
                    <th scope="col" className="px-2 py-2 text-right font-semibold">Diárias</th>
                    <th scope="col" className="px-2 py-2 text-right font-semibold">Necessárias</th>
                    <th scope="col" className="py-2 pl-2 text-right font-semibold">Saldo (R$)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 tabular-nums">
                  {indicadores.map((i) => (
                    <tr key={`${i.data}-${i.local}`}>
                      <td className="py-2 pr-3">
                        {formatarData(i.data)}
                        {!i.fechado && <span className="ml-1 rounded bg-amber-50 px-1 text-[10px] font-semibold text-amber-800">rascunho</span>}
                      </td>
                      <td className="px-2 py-2">{ROTULO_LOCAL[i.local]}</td>
                      <td className="px-2 py-2 text-right">{moeda(i.producao)}</td>
                      <td className="px-2 py-2 text-right">{decimal(i.diarias)}</td>
                      <td className="px-2 py-2 text-right">{decimal(i.necessarias)}</td>
                      <td className="py-2 pl-2 text-right font-semibold text-gray-900">{sinal(i.saldoReais)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
