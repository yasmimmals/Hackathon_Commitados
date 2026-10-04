import { LoaderCircle, Save } from "lucide-react";
import type { LinhaProducaoIn, TipoItem } from "@/shared/services";
import { moeda } from "@/shared/utils/formatacao";

export type Rascunho = Record<number, LinhaProducaoIn>;

type TabelaProducaoProps = {
  tipos: TipoItem[];
  rascunho: Rascunho;
  bloqueado: boolean;
  alterado: boolean;
  salvando: boolean;
  onChange: (linha: LinhaProducaoIn) => void;
  onSalvar: () => void;
};

const CAMPOS: { chave: "descarga" | "remocao" | "transferencia"; rotulo: string }[] = [
  { chave: "descarga", rotulo: "Descarga" },
  { chave: "remocao", rotulo: "Remoção" },
  { chave: "transferencia", rotulo: "Transferência" },
];

const precoUnitario = (v: string) =>
  Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 4 });

const vazia = (tipoId: number): LinhaProducaoIn => ({ tipo_item_id: tipoId, descarga: 0, remocao: 0, transferencia: 0 });

/** Uma linha por tipo de item (preços do cadastro), igual ao formulário de papel do boletim. */
export default function TabelaProducao({ tipos, rascunho, bloqueado, alterado, salvando, onChange, onSalvar }: TabelaProducaoProps) {
  const total = tipos.reduce((t, tipo) => {
    const l = rascunho[tipo.id];
    return t + (l ? (l.descarga + l.remocao + l.transferencia) * Number(tipo.preco_unitario) : 0);
  }, 0);

  return (
    <section aria-labelledby="producao-titulo" className="rounded-3xl bg-white p-5 shadow-sm">
      <header className="mb-3 flex flex-wrap items-end justify-between gap-2 border-b-[3px] border-site-amarelo pb-2">
        <h2 id="producao-titulo" className="titulo-secao text-lg">1. Produção do dia</h2>
        {!bloqueado && (
          <div className="flex items-center gap-3">
            {alterado && <span className="text-xs font-semibold text-amber-700">Alterações não salvas</span>}
            <button
              type="button"
              onClick={onSalvar}
              disabled={!alterado || salvando}
              className="inline-flex items-center gap-1.5 rounded-full bg-site-azul px-4 py-2 text-xs font-bold text-white hover:bg-site-azul-escuro focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-azul focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {salvando ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Save className="h-3.5 w-3.5" aria-hidden />}
              Salvar produção
            </button>
          </div>
        )}
      </header>
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
            {tipos.map((tipo) => {
              const linha = rascunho[tipo.id] ?? vazia(tipo.id);
              const qtd = linha.descarga + linha.remocao + linha.transferencia;
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
                        onChange={(e) => onChange({ ...linha, [c.chave]: Math.max(0, Math.floor(Number(e.target.value) || 0)) })}
                        className="w-20 rounded-lg border border-gray-300 px-2 py-1 text-right tabular-nums disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </td>
                  ))}
                  <td className="px-2 py-1.5 text-right tabular-nums text-gray-900">{qtd.toLocaleString("pt-BR")}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums text-gray-500">{precoUnitario(tipo.preco_unitario)}</td>
                  <td className="py-1.5 pl-2 text-right font-semibold tabular-nums text-gray-900">{moeda(qtd * Number(tipo.preco_unitario))}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-200">
              <th scope="row" colSpan={6} className="py-2 pr-3 text-right text-sm font-bold text-gray-900">Total da produção</th>
              <td className="py-2 pl-2 text-right text-base font-bold tabular-nums text-site-azul">{moeda(total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
