import { MEDIA_HISTORICA_SEMANAL_MM } from "../../constants";
import type { Clima } from "../../types";
import Painel from "../Painel";

export default function AcumuladoSemanal({ clima }: { clima: Clima }) {
  const acumulado = [
    { rotulo: "Chuva Observada (Últimos 7 dias)", valor: clima.chuvaUltimos7Dias, cor: "bg-sky-600" },
    { rotulo: "Média Histórica do Período (Alta Mogiana)", valor: MEDIA_HISTORICA_SEMANAL_MM, cor: "bg-emerald-700" },
    { rotulo: "Previsão Acumulada Próximos 7 dias", valor: clima.chuvaProximos7Dias, cor: "bg-amber-500" },
  ];
  const max = Math.max(100, ...acumulado.map((a) => a.valor));

  return (
    <Painel
      titulo="Acumulado Semanal"
      descricao="Precipitação real vs. Média histórica regional"
      acao={<span className="rounded-md bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700">{clima.mes}</span>}
    >
      <ul className="space-y-3">
        {acumulado.map((a) => (
          <li key={a.rotulo}>
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-gray-600">{a.rotulo}</span>
              <span className="font-semibold text-gray-800">{a.valor} mm</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100">
              <div className={`h-2 rounded-full ${a.cor}`} style={{ width: `${(a.valor / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-4 flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-xs text-gray-700">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden /> Capacidade Hídrica do Solo na Região:
        </span>
        <strong className="text-emerald-700">74% (Ótimo)</strong>
      </p>
    </Painel>
  );
}
