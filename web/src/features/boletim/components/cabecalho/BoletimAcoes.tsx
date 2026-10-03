import { FileDown } from "lucide-react";

export default function BoletimAcoes() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="sr-only" htmlFor="unidade">Unidade</label>
      <select
        id="unidade"
        defaultValue="matriz"
        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca"
      >
        <option value="matriz">Complexo Logístico Franca - Matriz</option>
        <option value="pedregulho">Unidade Pedregulho</option>
        <option value="patrocinio">Unidade Patrocínio Paulista</option>
      </select>
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca focus-visible:ring-offset-2"
      >
        <FileDown className="h-4 w-4" aria-hidden /> Exportar PDF
      </button>
    </div>
  );
}
