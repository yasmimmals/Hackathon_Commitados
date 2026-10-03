import { SELOS_JANELA, STATUS_JANELA } from "../../constants";
import type { DiaPrevisao } from "../../types";
import IconeClima from "../IconeClima";

export default function CardDiaPrevisao({ dia }: { dia: DiaPrevisao }) {
  const selo = SELOS_JANELA[dia.selo];
  const hoje = dia.dia === "Hoje";

  return (
    <li
      className={`flex flex-col rounded-xl border bg-white p-3 shadow-sm ${STATUS_JANELA[dia.status].borda} ${hoje ? "ring-1 ring-amber-300" : ""}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase text-gray-700">
          {dia.dia} <span className="font-medium text-gray-400">({dia.data})</span>
        </p>
        <IconeClima tipo={dia.icone} />
      </div>
      <p className="mt-2 text-lg font-extrabold text-gray-900">
        {dia.max}° <span className="text-sm font-medium text-gray-400">/ {dia.min}°</span>
      </p>
      <p className="text-[11px] text-gray-500">
        {dia.chuvaMm} mm • {dia.probabilidade}%
      </p>
      <p className="mt-2 text-[11px] font-semibold text-gray-700">Janela sugerida:</p>
      <p className="flex-1 text-[11px] text-gray-600">{dia.janela}</p>
      <span className={`mt-3 rounded-full px-2 py-1 text-center text-[11px] font-semibold ${selo.classe}`}>{selo.rotulo}</span>
    </li>
  );
}
