import { CloudRain } from "lucide-react";
import type { ChuvaHoje } from "../../types";
import CardCondicao, { LinhaInfo } from "./CardCondicao";

export default function CardPrecipitacao({ chuva }: { chuva: ChuvaHoje }) {
  return (
    <CardCondicao titulo="Precipitação Hoje" icone={<CloudRain className="h-4 w-4 text-sky-600" />}>
      <p className="text-3xl font-extrabold text-gray-900">
        {chuva.mm} <span className="text-base font-semibold text-gray-500">mm</span>
      </p>
      <div className="mt-3 space-y-1 border-t border-gray-100 pt-2">
        <LinhaInfo
          rotulo="Probabilidade"
          valor={<span className={chuva.probabilidade >= 40 ? "text-amber-600" : undefined}>{chuva.probabilidade}% de chuva</span>}
        />
        <LinhaInfo
          rotulo="Início estimado"
          valor={chuva.inicioEstimado ? `A partir de ${chuva.inicioEstimado}` : "Sem chuva prevista"}
        />
        <p className="text-[11px] text-gray-500">Pico previsto: {chuva.picoMmH} mm/h</p>
      </div>
    </CardCondicao>
  );
}
