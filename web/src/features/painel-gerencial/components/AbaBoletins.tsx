import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Info, LoaderCircle, ServerCrash } from "lucide-react";
import { listarBoletins, mensagemDeErro, type Boletim } from "@/shared/services";
import { dataBr, decimal, moeda } from "@/shared/utils/formatacao";
import { dataLocalIso } from "@/shared/utils/janelas";
import GraficoSaldo from "./GraficoSaldo";
import { indicadorDoBoletim, resumirPorGrupo } from "../utils/indicadores";

const sinal = (v: number) => (v > 0 ? `+${moeda(v)}` : v < 0 ? `−${moeda(-v)}` : moeda(0));

type Carga = { chave: string; boletins?: Boletim[]; erro?: string };

export default function AbaBoletins() {
  const [inicio, setInicio] = useState(() => dataLocalIso(-30));
  const [fim, setFim] = useState(() => dataLocalIso(-1));
  const [grupo, setGrupo] = useState("");
  const [incluirRascunhos, setIncluirRascunhos] = useState(false);
  const [carga, setCarga] = useState<Carga>({ chave: "" });

  const chave = `${inicio}|${fim}`;
  useEffect(() => {
    let ativo = true;
    listarBoletins({ inicio, fim }).then(
      (boletins) => ativo && setCarga({ chave, boletins }),
      (erro) => ativo && setCarga({ chave, erro: mensagemDeErro(erro) }),
    );
    return () => {
      ativo = false;
    };
  }, [chave, inicio, fim]);

  const atual = carga.chave === chave ? carga : undefined;
  const boletins = useMemo(() => atual?.boletins ?? [], [atual]);

  const todos = useMemo(() => boletins.map(indicadorDoBoletim), [boletins]);
  const grupos = useMemo(() => [...new Map(todos.map((i) => [i.chave, i.rotulo])).entries()], [todos]);
  const indicadores = useMemo(
    () =>
      todos
        .filter((i) => incluirRascunhos || i.fechado)
        .filter((i) => !grupo || i.chave === grupo)
        .sort((a, b) => b.data.localeCompare(a.data) || a.rotulo.localeCompare(b.rotulo)),
    [todos, incluirRascunhos, grupo],
  );
  const porGrupo = useMemo(() => resumirPorGrupo(indicadores), [indicadores]);

  const total = porGrupo.reduce(
    (t, r) => ({ sobra: t.sobra + r.sobraReais, falta: t.falta + r.faltaReais, saldo: t.saldo + r.saldoReais }),
    { sobra: 0, falta: 0, saldo: 0 },
  );
  const rascunhosFora = incluirRascunhos ? 0 : todos.filter((i) => !i.fechado).length;
  const piso = boletins[0] ? Number(boletins[0].calculo.piso_diaria) : null;

  const kpis = [
    { rotulo: "Sobra no período", valor: moeda(total.sobra), nota: "pago em complemento" },
    { rotulo: "Falta no período", valor: moeda(total.falta), nota: "produção acima do piso da equipe" },
    { rotulo: "Saldo", valor: sinal(total.saldo), nota: total.saldo > 0 ? "sobra de chapas" : total.saldo < 0 ? "falta de chapas" : "equipe ajustada" },
    { rotulo: "Boletins considerados", valor: String(indicadores.length), nota: incluirRascunhos ? "fechados e rascunhos" : "somente fechados" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <p className="max-w-prose text-sm text-gray-600">
          Sobra ou falta de chapas por armazém e período, em R$, calculada a partir dos boletins de produção do sistema.
        </p>
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
            <select value={grupo} onChange={(e) => setGrupo(e.target.value)} className="mt-1 block rounded-full border border-gray-300 bg-white px-3 py-2 text-sm">
              <option value="">Todos</option>
              {grupos.map(([c, r]) => (
                <option key={c} value={c}>{r}</option>
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
          Diárias necessárias = produção ÷ piso{piso != null && ` (${piso.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 4 })} por diária)`}.
          Diárias escaladas acima disso são <strong>sobra</strong> (a cooperativa paga complemento); abaixo, <strong>falta</strong> de
          chapas. Valores em R$ = diferença × piso. A Cocapec lança um boletim geral por dia; com boletins por armazém, o painel separa cada um.
          {rascunhosFora > 0 && ` ${rascunhosFora} boletim(ns) em rascunho no período não entram no cálculo.`}
        </span>
      </p>

      {!atual && (
        <p role="status" className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> Carregando os boletins…
        </p>
      )}

      {atual?.erro && (
        <div role="alert" className="flex flex-col items-center gap-2 rounded-3xl bg-white px-4 py-10 text-center shadow-sm">
          <ServerCrash className="h-6 w-6 text-gray-400" aria-hidden />
          <p className="text-sm text-gray-700">Não foi possível carregar os boletins.</p>
          <p className="text-xs text-gray-500">{atual.erro}</p>
        </div>
      )}

      {atual?.boletins && (
        <>
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
              <GraficoSaldo resumo={porGrupo} />

              <section aria-labelledby="tabela-grupo" className="rounded-3xl bg-white p-5 shadow-sm">
                <h2 id="tabela-grupo" className="titulo-secao mb-3 border-b-[3px] border-site-amarelo pb-2 text-lg">Por armazém</h2>
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
                      {porGrupo.map((r) => (
                        <tr key={r.chave}>
                          <th scope="row" className="py-2 pr-3 font-medium text-gray-900">{r.rotulo}</th>
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
                        <tr key={i.id}>
                          <td className="py-2 pr-3">
                            {dataBr(i.data)}
                            {!i.fechado && <span className="ml-1 rounded bg-amber-50 px-1 text-[10px] font-semibold text-amber-800">rascunho</span>}
                          </td>
                          <td className="px-2 py-2">{i.rotulo}</td>
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
        </>
      )}
    </div>
  );
}
