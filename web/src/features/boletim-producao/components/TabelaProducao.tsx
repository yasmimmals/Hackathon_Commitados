import { TIPOS_ITEM } from "../constants";
import type { Boletim, LinhaProducao } from "../types";
import { linhaDe, moeda, quantidadeLinha } from "../utils/calculo";

type TabelaProducaoProps = {
  boletim: Boletim;
  bloqueado: boolean;
  producaoTotal: number;
  onChange: (tipoId: number, linha: LinhaProducao) => void;
};

const CAMPOS: { chave: keyof LinhaProducao; rotulo: string }[] = [
  { chave: "descarga", rotulo: "Descarga" },
  { chave: "remocao", rotulo: "Remoção" },
  { chave: "transferencia", rotulo: "Transferência" },
];

const precoUnitario = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 4 });

/** Uma linha por tipo de item, igual ao formulário de papel do boletim. */
export default function TabelaProducao({ boletim, bloqueado, producaoTotal, onChange }: TabelaProducaoProps) {
  return (
    <section aria-labelledby="producao-titulo" className="rounded-3xl bg-white p-5 shadow-sm">
      <h2 id="producao-titulo" className="titulo-secao mb-3 border-b-[3px] border-site-amarelo pb-2 text-lg">1. Produção do dia</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-xs text-gray-600">
            <tr className="border-b border-gray-200">
              <th scope="col" className="py-2 pr-3 font-semibold">Tipo de item</th>
              {CAMPOS.map((c) => (
                <th key={c.chave} scope="col" className="px-2 py-2 text-right font-semibold">{c.rotulo}</th>
              ))}
              <th scope="col" className="px-2 py-2 text-right font-semibold">Qtd.</th>
              <th scope="col" className="px-2 py-2 text-right font-semibold">Preço un.</th>
              <th scope="col" className="py-2 pl-2 text-right font-semibold">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {TIPOS_ITEM.map((tipo) => {
              const linha = linhaDe(boletim, tipo.id);
              const qtd = quantidadeLinha(linha);
              return (
                <tr key={tipo.id}>
                  <th scope="row" className="py-1.5 pr-3 font-medium text-gray-900">{tipo.descricao}</th>
                  {CAMPOS.map((c) => (
                    <td key={c.chave} className="px-2 py-1.5 text-right">
                      <input
                        type="number"
                        min={0}
                        step={1}
                        inputMode="numeric"
                        value={linha[c.chave] || ""}
                        placeholder="0"
                        disabled={bloqueado}
                        aria-label={`${c.rotulo} de ${tipo.descricao}`}
                        onChange={(e) => onChange(tipo.id, { ...linha, [c.chave]: Math.max(0, Math.floor(Number(e.target.value) || 0)) })}
                        className="w-20 rounded-lg border border-gray-300 px-2 py-1 text-right tabular-nums disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </td>
                  ))}
                  <td className="px-2 py-1.5 text-right tabular-nums text-gray-900">{qtd.toLocaleString("pt-BR")}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums text-gray-500">{precoUnitario(tipo.preco)}</td>
                  <td className="py-1.5 pl-2 text-right font-semibold tabular-nums text-gray-900">{moeda(qtd * tipo.preco)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-200">
              <th scope="row" colSpan={6} className="py-2 pr-3 text-right text-sm font-bold text-gray-900">Total da produção</th>
              <td className="py-2 pl-2 text-right text-base font-bold tabular-nums text-site-azul">{moeda(producaoTotal)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
