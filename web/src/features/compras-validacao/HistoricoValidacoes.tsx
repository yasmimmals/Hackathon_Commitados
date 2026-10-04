import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, History, LoaderCircle, RefreshCw, Search, ServerCrash, XCircle } from "lucide-react";
import { listarAgendamentos, mensagemDeErro, type Agendamento } from "@/shared/services";
import { dataBr } from "@/shared/utils/formatacao";
import { dataLocalIso } from "@/shared/utils/janelas";
import { MOTIVOS_REPROVA } from "./constants";
import { formatarCnpj } from "./utils/formatacao";

type Decisao = "todas" | "aprovadas" | "recusadas";
type Carga = { tipo: "carregando" } | { tipo: "erro"; mensagem: string } | { tipo: "ok"; lista: Agendamento[] };

const recusada = (a: Agendamento) => a.status === "REJEITADO";
const rotuloMotivo = (a: Agendamento) =>
  MOTIVOS_REPROVA.find((m) => m.valor === a.motivo_nao_recebimento)?.rotulo ?? a.motivo_nao_recebimento ?? "—";
const diaDaAnalise = (a: Agendamento) => dataLocalIso(0, new Date(a.analisado_em!));

export default function HistoricoValidacoes() {
  const [carga, setCarga] = useState<Carga>({ tipo: "carregando" });
  const [decisao, setDecisao] = useState<Decisao>("todas");
  const [inicio, setInicio] = useState(() => dataLocalIso(-30));
  const [fim, setFim] = useState(() => dataLocalIso());
  const [busca, setBusca] = useState("");

  const carregar = useCallback(() => {
    let ativo = true;
    listarAgendamentos().then(
      (todos) => ativo && setCarga({ tipo: "ok", lista: todos.filter((a) => a.analisado_em) }),
      (erro) => ativo && setCarga({ tipo: "erro", mensagem: mensagemDeErro(erro) }),
    );
    return () => {
      ativo = false;
    };
  }, []);

  useEffect(carregar, [carregar]);

  const validadas = useMemo(() => (carga.tipo === "ok" ? carga.lista : []), [carga]);
  const noPeriodo = useMemo(
    () => validadas.filter((a) => diaDaAnalise(a) >= inicio && diaDaAnalise(a) <= fim),
    [validadas, inicio, fim],
  );

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return noPeriodo
      .filter((a) => decisao === "todas" || (decisao === "recusadas") === recusada(a))
      .filter(
        (a) =>
          !termo ||
          [a.fornecedor.nome, a.fornecedor.cnpj, a.nf_numero, a.pedido_compra, a.analisado_por, `#AG-${a.id}`]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(termo),
      )
      .sort((a, b) => b.analisado_em!.localeCompare(a.analisado_em!));
  }, [noPeriodo, decisao, busca]);

  const aprovadas = noPeriodo.filter((a) => !recusada(a)).length;
  const recusadas = noPeriodo.length - aprovadas;

  const recarregar = () => {
    setCarga({ tipo: "carregando" });
    carregar();
  };

  const filtroDecisao: { valor: Decisao; rotulo: string; total: number }[] = [
    { valor: "todas", rotulo: "Todas", total: noPeriodo.length },
    { valor: "aprovadas", rotulo: "Aprovadas", total: aprovadas },
    { valor: "recusadas", rotulo: "Recusadas", total: recusadas },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-1 flex items-center gap-1.5 text-xs text-gray-500">
            <History className="h-3.5 w-3.5" aria-hidden /> Mesa de Compras
          </p>
          <h1 className="titulo-pagina">Histórico de Validações</h1>
          <p className="mt-2 max-w-prose text-sm text-gray-600">
            Consulte os agendamentos já aprovados e recusados, com o pedido de compra, o motivo e quem analisou.
          </p>
        </div>
        <button
          type="button"
          onClick={recarregar}
          disabled={carga.tipo === "carregando"}
          className="inline-flex w-fit items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-azul disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${carga.tipo === "carregando" ? "animate-spin" : ""}`} aria-hidden /> Atualizar
        </button>
      </div>

      <div className="flex flex-col gap-3 rounded-3xl bg-white p-4 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div role="group" aria-label="Filtrar por decisão" className="flex flex-wrap gap-1">
          {filtroDecisao.map((f) => (
            <button
              key={f.valor}
              type="button"
              aria-pressed={decisao === f.valor}
              onClick={() => setDecisao(f.valor)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-azul ${
                decisao === f.valor ? "bg-site-azul text-white" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {f.rotulo} <span className={decisao === f.valor ? "text-white/80" : "text-gray-400"}>({f.total})</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-xs font-semibold text-gray-700">
            Analisado de
            <input type="date" value={inicio} max={fim} onChange={(e) => e.target.value && setInicio(e.target.value)} className="mt-1 block rounded-full border border-gray-300 bg-white px-3 py-2 text-sm" />
          </label>
          <label className="text-xs font-semibold text-gray-700">
            até
            <input type="date" value={fim} min={inicio} onChange={(e) => e.target.value && setFim(e.target.value)} className="mt-1 block rounded-full border border-gray-300 bg-white px-3 py-2 text-sm" />
          </label>
          <label className="relative block text-xs font-semibold text-gray-700">
            Buscar
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Fornecedor, NF, pedido, analista…"
              className="mt-1 block w-64 rounded-full border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm font-normal"
            />
            <Search className="pointer-events-none absolute bottom-2.5 left-3 h-4 w-4 text-gray-400" aria-hidden />
          </label>
        </div>
      </div>

      {carga.tipo === "carregando" && (
        <p role="status" className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> Carregando o histórico…
        </p>
      )}

      {carga.tipo === "erro" && (
        <div role="alert" className="flex flex-col items-center gap-2 rounded-3xl bg-white px-4 py-10 text-center shadow-sm">
          <ServerCrash className="h-6 w-6 text-gray-400" aria-hidden />
          <p className="text-sm text-gray-700">Não foi possível carregar o histórico.</p>
          <p className="text-xs text-gray-500">{carga.mensagem}</p>
          <button type="button" onClick={recarregar} className="mt-1 text-sm font-semibold text-marca hover:underline">
            Tentar novamente
          </button>
        </div>
      )}

      {carga.tipo === "ok" &&
        (visiveis.length === 0 ? (
          <div className="rounded-3xl bg-white px-4 py-12 text-center shadow-sm">
            <p className="font-semibold text-gray-800">Nenhuma validação encontrada.</p>
            <p className="mt-1 text-sm text-gray-500">Ajuste o período, a decisão ou a busca.</p>
          </div>
        ) : (
          <section aria-label="Validações" className="overflow-hidden rounded-3xl bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-gray-50 text-xs text-gray-600">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">Analisado em</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Decisão</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Fornecedor</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Entrega</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Pedido / motivo</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Analista e observação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 align-top">
                  {visiveis.map((a) => (
                    <tr key={a.id}>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                        {new Date(a.analisado_em!).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                        <span className="block text-xs text-gray-400">#AG-{a.id}</span>
                      </td>
                      <td className="px-3 py-3">
                        {recusada(a) ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-800 ring-1 ring-red-200">
                            <XCircle className="h-3.5 w-3.5" aria-hidden /> Recusada
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
                            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Aprovada
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <span className="font-semibold text-gray-900">{a.fornecedor.nome}</span>
                        <span className="block text-xs text-gray-500">
                          CNPJ {formatarCnpj(a.fornecedor.cnpj)} • NF-e {a.nf_numero ?? "—"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-gray-700">
                        {dataBr(a.data)} às {a.horario}h
                      </td>
                      <td className="px-3 py-3 text-gray-700">
                        {recusada(a) ? rotuloMotivo(a) : a.pedido_compra ? `Pedido ${a.pedido_compra}` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-gray-800">{a.analisado_por ?? "—"}</span>
                        {a.observacao_compras && <span className="block max-w-sm text-xs text-gray-600">{a.observacao_compras}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
    </div>
  );
}
