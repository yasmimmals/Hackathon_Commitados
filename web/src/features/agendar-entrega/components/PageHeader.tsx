import { Info, Truck } from "lucide-react";
import { Link } from "react-router-dom";

export default function PageHeader() {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <nav aria-label="Você está em" className="mb-1 flex items-center gap-1.5 text-xs text-gray-500">
          <Truck className="h-3.5 w-3.5" aria-hidden />
          <Link to="/fornecedor/agendamentos" className="hover:text-gray-700 hover:underline">Meus Agendamentos</Link>
          <span aria-hidden>›</span>
          <span>Nova Entrega</span>
        </nav>
        <h1 className="titulo-pagina">Agendar Entrega</h1>
        <p className="mt-1 max-w-prose text-sm text-gray-600">
          Reserve uma janela de descarga no Terminal Franca/SP. A Mesa de Compras valida a nota fiscal antes da liberação.
        </p>
      </div>

      <p className="inline-flex items-center gap-2 self-start rounded-full bg-sky-50 px-3 py-1.5 text-xs text-sky-800 ring-1 ring-sky-200 md:self-auto">
        <Info className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Veículo já na portaria?{" "}
        <Link to="/fornecedor/agendar-na-hora" className="font-semibold underline underline-offset-2">Agendar na Hora</Link>
      </p>
    </div>
  );
}
