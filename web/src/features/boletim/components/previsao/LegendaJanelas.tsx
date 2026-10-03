import { STATUS_JANELA } from "../../constants";

export default function LegendaJanelas() {
  return (
    <ul className="flex items-center gap-3 text-[11px] text-gray-600">
      {Object.values(STATUS_JANELA).map((s) => (
        <li key={s.legenda} className="flex items-center gap-1">
          <span className={`h-2 w-2 rounded-full ${s.ponto}`} aria-hidden /> {s.legenda}
        </li>
      ))}
    </ul>
  );
}
