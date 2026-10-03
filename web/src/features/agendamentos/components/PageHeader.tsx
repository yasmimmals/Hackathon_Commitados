import { Link } from "react-router-dom";
import { Download, Plus, Truck } from "lucide-react";

export default function PageHeader({ onExport }: { onExport?: () => void }) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <nav aria-label="Você está em" className="mb-1 flex items-center gap-1.5 text-xs text-gray-500">
          <Truck className="h-3.5 w-3.5" aria-hidden />
          <span>Logística</span>
          <span aria-hidden>›</span>
          <span>Terminal Franca/SP</span>
        </nav>
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 md:text-3xl">Meus Agendamentos</h1>
        <p className="mt-1 max-w-prose text-sm text-gray-600">
          Consulte e gerencie suas janelas de descarregamento na cooperativa de forma simples e pontual.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Link
          to="/fornecedor/agendar"
          className="inline-flex items-center gap-2 rounded-lg bg-marca px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-marca-escuro focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca focus-visible:ring-offset-2"
        >
          <Plus className="h-4 w-4" aria-hidden /> Nova Carga
        </Link>
        <button
          type="button"
          onClick={onExport}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca focus-visible:ring-offset-2"
        >
          <Download className="h-4 w-4" aria-hidden /> Exportar
        </button>
      </div>
    </div>
  );
}