import { Info, MapPin, Zap } from "lucide-react";

export default function PageHeader() {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-marca ring-1 ring-emerald-200">
            <Zap className="h-3 w-3" aria-hidden /> Triagem Imediata
          </span>
          <span className="inline-flex items-center gap-1 text-gray-500">
            <MapPin className="h-3.5 w-3.5" aria-hidden /> Portaria &amp; Balança 01
          </span>
        </div>
        <h1 className="titulo-pagina">
          Agendamento na Hora{" "}
          <span className="text-base font-medium text-gray-500 md:text-lg">(Encaixe de Pátio)</span>
        </h1>
      </div>

      <p className="inline-flex items-center gap-2 self-start rounded-full bg-sky-50 px-3 py-1.5 text-xs text-sky-800 ring-1 ring-sky-200 md:self-auto">
        <Info className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Exclusivo para veículos já presentes na portaria ou balcão externo.
      </p>
    </div>
  );
}
