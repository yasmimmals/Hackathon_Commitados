import { useState, useEffect, useMemo } from "react";
import { Search, Server, Shield, FileText, ChevronRight, ChevronDown } from "lucide-react";

type OperacaoApi = {
  metodo: string;
  caminho: string;
  tags: string[];
  summary?: string;
  description?: string;
  parameters?: Array<{
    name: string;
    in: string;
    required?: boolean;
    description?: string;
    schema?: Record<string, unknown>;
  }>;
  requestBody?: {
    description?: string;
    required?: boolean;
    content?: Record<string, { schema?: Record<string, unknown> }>;
  };
  responses?: Record<string, {
    description?: string;
    content?: Record<string, { schema?: Record<string, unknown> }>;
  }>;
};

const COR_METODO: Record<string, string> = {
  GET: "bg-blue-100 text-blue-800 border-blue-300",
  POST: "bg-emerald-100 text-emerald-800 border-emerald-300",
  PUT: "bg-amber-100 text-amber-800 border-amber-300",
  PATCH: "bg-orange-100 text-orange-800 border-orange-300",
  DELETE: "bg-red-100 text-red-800 border-red-300",
};

export default function ReferenciaApi() {
  const [dadosOpenApi, setDadosOpenApi] = useState<Record<string, unknown> | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [endpointAberto, setEndpointAberto] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/documentacao/fontes/openapi.json")
      .then((res) => {
        if (!res.ok) throw new Error("Não encontrado");
        return res.json();
      })
      .then((data) => {
        setDadosOpenApi(data);
        setCarregando(false);
      })
      .catch(() => {
        setDadosOpenApi(null);
        setCarregando(false);
      });
  }, []);

  const operacoes = useMemo<OperacaoApi[]>(() => {
    if (!dadosOpenApi || typeof dadosOpenApi.paths !== "object") return [];
    const lista: OperacaoApi[] = [];
    const paths = dadosOpenApi.paths as Record<string, Record<string, unknown>>;

    for (const [caminho, metodos] of Object.entries(paths)) {
      for (const [metodo, info] of Object.entries(metodos)) {
        if (typeof info === "object" && info !== null) {
          const det = info as Record<string, unknown>;
          lista.push({
            metodo: metodo.toUpperCase(),
            caminho,
            tags: (det.tags as string[]) || ["Geral"],
            summary: det.summary as string,
            description: det.description as string,
            parameters: det.parameters as OperacaoApi["parameters"],
            requestBody: det.requestBody as OperacaoApi["requestBody"],
            responses: det.responses as OperacaoApi["responses"],
          });
        }
      }
    }
    return lista;
  }, [dadosOpenApi]);

  const filtrados = useMemo(() => {
    const q = busca.toLowerCase().trim();
    if (!q) return operacoes;
    return operacoes.filter(
      (op) =>
        op.caminho.toLowerCase().includes(q) ||
        op.metodo.toLowerCase().includes(q) ||
        (op.summary && op.summary.toLowerCase().includes(q)) ||
        op.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [operacoes, busca]);

  const agrupadosPorTag = useMemo(() => {
    const grupos: Record<string, OperacaoApi[]> = {};
    for (const op of filtrados) {
      const tag = op.tags[0] || "Outros";
      if (!grupos[tag]) grupos[tag] = [];
      grupos[tag].push(op);
    }
    return grupos;
  }, [filtrados]);

  const toggleEndpoint = (chave: string) => {
    setEndpointAberto((prev) => ({ ...prev, [chave]: !prev[chave] }));
  };

  if (carregando) {
    return (
      <div className="py-12 text-center text-sm text-gray-500">
        Carregando especificação OpenAPI...
      </div>
    );
  }

  if (!dadosOpenApi) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
        <Server className="mx-auto h-8 w-8 text-gray-400" />
        <h3 className="mt-3 text-base font-semibold text-gray-800">
          Especificação da API em construção
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          O arquivo <code>docs/fontes/openapi.json</code> ainda não foi disponibilizado pela equipe de backend.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar endpoint por método, rota, tag ou descrição..."
          className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm focus:border-site-azul focus:outline-none focus:ring-2 focus:ring-site-azul/20"
        />
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
      </div>

      <div className="space-y-8">
        {Object.entries(agrupadosPorTag).map(([tag, ops]) => (
          <section key={tag} className="space-y-3">
            <h3 className="flex items-center gap-2 border-b border-gray-200 pb-2 text-lg font-bold text-site-azul">
              <Shield className="h-5 w-5 text-site-verde" />
              {tag}
              <span className="text-xs font-normal text-gray-500">
                ({ops.length} {ops.length === 1 ? "rota" : "rotas"})
              </span>
            </h3>

            <div className="space-y-2">
              {ops.map((op) => {
                const chave = `${op.metodo}-${op.caminho}`;
                const aberto = !!endpointAberto[chave];

                return (
                  <div
                    key={chave}
                    className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
                  >
                    <button
                      type="button"
                      onClick={() => toggleEndpoint(chave)}
                      className="flex w-full items-center justify-between p-3 text-left transition-colors hover:bg-gray-50"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          className={`rounded border px-2.5 py-0.5 text-xs font-black uppercase ${
                            COR_METODO[op.metodo] || "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {op.metodo}
                        </span>
                        <code className="text-sm font-semibold text-gray-900">
                          {op.caminho}
                        </code>
                        {op.summary && (
                          <span className="text-xs text-gray-600 sm:inline">
                            — {op.summary}
                          </span>
                        )}
                      </div>
                      {aberto ? (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      )}
                    </button>

                    {aberto && (
                      <div className="border-t border-gray-100 bg-gray-50/70 p-4 text-xs space-y-4">
                        {op.description && (
                          <p className="text-gray-700 whitespace-pre-line">{op.description}</p>
                        )}

                        {op.parameters && op.parameters.length > 0 && (
                          <div>
                            <h5 className="font-bold text-gray-800">Parâmetros:</h5>
                            <div className="mt-1 overflow-x-auto">
                              <table className="w-full text-left border border-gray-200 bg-white text-xs">
                                <thead>
                                  <tr className="bg-gray-100 text-gray-700">
                                    <th className="p-2">Nome</th>
                                    <th className="p-2">Tipo</th>
                                    <th className="p-2">Obrigatório</th>
                                    <th className="p-2">Descrição</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {op.parameters.map((p) => (
                                    <tr key={p.name} className="border-t border-gray-100">
                                      <td className="p-2 font-mono font-semibold">{p.name} ({p.in})</td>
                                      <td className="p-2 font-mono text-gray-600">
                                        {String(p.schema?.type || "string")}
                                      </td>
                                      <td className="p-2">
                                        {p.required ? (
                                          <span className="font-bold text-red-600">Sim</span>
                                        ) : (
                                          <span className="text-gray-500">Não</span>
                                        )}
                                      </td>
                                      <td className="p-2 text-gray-600">{p.description || "-"}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {op.requestBody && (
                          <div>
                            <h5 className="font-bold text-gray-800">Corpo da Requisição (Request Body):</h5>
                            {op.requestBody.description && (
                              <p className="text-gray-600 mb-1">{op.requestBody.description}</p>
                            )}
                            <pre className="mt-1 max-h-40 overflow-auto rounded bg-gray-900 p-2 text-gray-100 font-mono text-[11px]">
                              {JSON.stringify(op.requestBody.content, null, 2)}
                            </pre>
                          </div>
                        )}

                        {op.responses && (
                          <div>
                            <h5 className="font-bold text-gray-800">Respostas:</h5>
                            <div className="mt-1 space-y-1">
                              {Object.entries(op.responses).map(([code, resp]) => (
                                <div key={code} className="rounded border border-gray-200 bg-white p-2">
                                  <span className="font-mono font-bold text-site-azul">{code}</span>
                                  <span className="ml-2 text-gray-700">{resp.description || ""}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
