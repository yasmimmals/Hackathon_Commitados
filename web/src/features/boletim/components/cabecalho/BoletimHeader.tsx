import { CloudSun, Radio } from "lucide-react";
import BoletimAcoes from "./BoletimAcoes";
import Breadcrumb from "./Breadcrumb";

export default function BoletimHeader({ atualizadoEm }: { atualizadoEm: string }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <Breadcrumb />
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 md:text-3xl">
            Boletim Agrometeorológico &amp; Impacto Operacional
          </h1>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
            <Radio className="h-3 w-3" aria-hidden /> Atualizado às {atualizadoEm} • Open-Meteo
          </span>
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-600">
          <CloudSun className="h-4 w-4 text-marca" aria-hidden />
          Estação Meteorológica Integrada COCAPEC — Complexo Logístico Franca/SP (Alta Mogiana)
        </p>
      </div>
      <BoletimAcoes />
    </div>
  );
}
