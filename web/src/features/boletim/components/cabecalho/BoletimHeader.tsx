import { CloudSun, Radio } from "lucide-react";
import { UNIDADES, type Unidade } from "../../services/clima";
import BoletimAcoes from "./BoletimAcoes";
import Breadcrumb from "./Breadcrumb";

type BoletimHeaderProps = {
  atualizadoEm: string;
  unidade: Unidade;
  onUnidade: (unidade: Unidade) => void;
  onExportarPdf: () => void;
};

export default function BoletimHeader({ atualizadoEm, unidade, onUnidade, onExportarPdf }: BoletimHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <Breadcrumb />
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="titulo-pagina">
            Boletim Agrometeorológico &amp; Impacto Operacional
          </h1>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
            <Radio className="h-3 w-3" aria-hidden /> Atualizado às {atualizadoEm} • Open-Meteo
          </span>
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-600">
          <CloudSun className="h-4 w-4 text-marca" aria-hidden />
          Estação Meteorológica Integrada COCAPEC — {UNIDADES[unidade].nome} ({UNIDADES[unidade].cidade})
        </p>
      </div>
      <BoletimAcoes unidade={unidade} onUnidade={onUnidade} onExportarPdf={onExportarPdf} />
    </div>
  );
}
