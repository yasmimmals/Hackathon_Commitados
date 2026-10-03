import CardDiaPrevisao from "./CardDiaPrevisao";
import type { DiaPrevisao } from "../../types";
import LegendaJanelas from "./LegendaJanelas";

export default function PrevisaoSemanal({ previsao }: { previsao: DiaPrevisao[] }) {
  return (
    <section>
      <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            Planejamento de Cargas — <span className="text-marca">Previsão 7 Dias</span>
          </h2>
          <p className="text-xs text-gray-600">
            Cruze a escala dos caminhões com janelas climáticas favoráveis para evitar retenção no pátio e sobreestadia.
          </p>
        </div>
        <LegendaJanelas />
      </div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
        {previsao.map((d) => (
          <CardDiaPrevisao key={d.data} dia={d} />
        ))}
      </ul>
    </section>
  );
}
