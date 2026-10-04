import { useEffect, useState } from "react";
import { AlertTriangle, FileText, LoaderCircle } from "lucide-react";
import { buscarNotaFiscal, mensagemDeErro, type NotaFiscal } from "@/shared/services";
import { formatarData, formatarKg, formatarMoeda } from "../utils/formatacao";

type Estado = { tipo: "carregando" } | { tipo: "erro"; mensagem: string } | { tipo: "ok"; nota: NotaFiscal };

function Dado({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{rotulo}</dt>
      <dd className="text-sm font-semibold text-gray-900">{valor}</dd>
    </div>
  );
}

export default function DetalhesNota({ notaFiscalId }: { notaFiscalId: number }) {
  const [estado, setEstado] = useState<Estado>({ tipo: "carregando" });

  useEffect(() => {
    let ativo = true;
    buscarNotaFiscal(notaFiscalId).then(
      (nota) => ativo && setEstado({ tipo: "ok", nota }),
      (erro) => ativo && setEstado({ tipo: "erro", mensagem: mensagemDeErro(erro) }),
    );
    return () => {
      ativo = false;
    };
  }, [notaFiscalId]);

  if (estado.tipo === "carregando") {
    return (
      <p role="status" className="flex items-center gap-2 text-sm text-gray-500">
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> Carregando a nota fiscal…
      </p>
    );
  }
  if (estado.tipo === "erro") {
    return <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">Não foi possível carregar a nota: {estado.mensagem}</p>;
  }

  const { nota } = estado;
  return (
    <div className="space-y-4">
      <h4 className="flex items-center gap-2 text-sm font-bold text-site-azul">
        <FileText className="h-4 w-4" aria-hidden />
        NF-e {nota.numero ?? "s/ nº"}
        {nota.serie && <span className="font-medium text-gray-500">• Série {nota.serie}</span>}
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold uppercase text-gray-600">{nota.formato}</span>
      </h4>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-6">
        <Dado rotulo="Emissão" valor={formatarData(nota.data_emissao)} />
        <Dado rotulo="Valor total" valor={formatarMoeda(nota.valor_total)} />
        <Dado rotulo="Peso bruto" valor={formatarKg(nota.peso_bruto_kg)} />
        <Dado rotulo="Peso líquido" valor={formatarKg(nota.peso_liquido_kg)} />
        <Dado rotulo="Volumes" valor={nota.volumes != null ? `${nota.volumes}${nota.especie ? ` ${nota.especie}` : ""}` : "—"} />
        <Dado rotulo="Carga de adubo" valor={nota.carga_adubo ? "Sim" : "Não"} />
      </dl>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Chave de acesso</p>
        <p className="break-all font-mono text-xs tracking-wider text-gray-800">{nota.chave}</p>
      </div>

      {nota.alertas.length > 0 && (
        <ul className="space-y-1 rounded-lg border border-amber-200 bg-amber-50 p-3">
          {nota.alertas.map((alerta) => (
            <li key={alerta} className="flex items-start gap-2 text-xs text-amber-900">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden /> {alerta}
            </li>
          ))}
        </ul>
      )}

      <div>
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Itens ({nota.itens.length})</p>
        {nota.itens.length === 0 ? (
          <p className="text-xs text-gray-500">A nota não trouxe itens.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full min-w-[520px] text-left text-xs">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th scope="col" className="px-3 py-2 font-semibold">Código</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Descrição</th>
                  <th scope="col" className="px-3 py-2 font-semibold">NCM</th>
                  <th scope="col" className="px-3 py-2 text-right font-semibold">Quantidade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {nota.itens.map((item, i) => (
                  <tr key={`${item.codigo_fornecedor ?? ""}-${i}`}>
                    <td className="px-3 py-2 font-mono text-gray-600">{item.codigo_fornecedor ?? "—"}</td>
                    <td className="px-3 py-2 text-gray-900">{item.descricao ?? "—"}</td>
                    <td className="px-3 py-2 text-gray-600">{item.ncm ?? "—"}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-right text-gray-900">
                      {item.quantidade ? Number(item.quantidade).toLocaleString("pt-BR") : "—"} {item.unidade ?? ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
