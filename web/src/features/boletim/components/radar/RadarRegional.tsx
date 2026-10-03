import { Radar } from "lucide-react";
import LegendaRadar from "./LegendaRadar";
import MapaRadar from "./MapaRadar";
import Painel from "../Painel";

export default function RadarRegional() {
  return (
    <Painel
      titulo={<><Radar className="h-4 w-4 text-marca" aria-hidden /> Radar Meteorológico Alta Mogiana</>}
      descricao="Refletividade Doppler (dBZ) em raio de 120 km com localização dos centros logísticos COCAPEC."
      acao={
        <span className="shrink-0 rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
          Varredura contínua
        </span>
      }
    >
      <div className="relative overflow-hidden rounded-lg bg-[#0f1a24]">
        <MapaRadar />
        <LegendaRadar />
        <p className="absolute bottom-3 left-3 rounded-md bg-amber-500/90 px-2 py-1 text-[10px] font-semibold text-amber-950">
          Célula de chuva se deslocando para NE — chegada estimada em Franca às 14h30
        </p>
      </div>

      <footer className="mt-2 flex flex-wrap items-center justify-between gap-1 text-[11px] text-gray-500">
        <span>Dados validados via INMET e Estação Agrometeorológica COCAPEC Franca</span>
        <span className="font-semibold text-gray-700">Raio Operacional: 80 km</span>
      </footer>
    </Painel>
  );
}
