import { FileDown } from "lucide-react";
import { UNIDADES, type Unidade } from "../../services/clima";

type BoletimAcoesProps = {
  unidade: Unidade;
  onUnidade: (unidade: Unidade) => void;
  onExportarPdf: () => void;
};

export default function BoletimAcoes({ unidade, onUnidade, onExportarPdf }: BoletimAcoesProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      <label className="sr-only" htmlFor="unidade">Unidade</label>
      <select
        id="unidade"
        value={unidade}
        onChange={(e) => onUnidade(e.target.value as Unidade)}
        className="rounded-full border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-azul"
      >
        {(Object.keys(UNIDADES) as Unidade[]).map((u) => (
          <option key={u} value={u}>{UNIDADES[u].nome}</option>
        ))}
      </select>
      <button
        type="button"
        onClick={onExportarPdf}
        className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-azul focus-visible:ring-offset-2"
      >
        <FileDown className="h-4 w-4" aria-hidden /> Exportar PDF
      </button>
    </div>
  );
}
