import { Droplets } from "lucide-react";
import CardCondicao from "./CardCondicao";

export default function CardUmidade({ umidade }: { umidade: number }) {
  const elevada = umidade >= 85;

  return (
    <CardCondicao titulo="Umidade Relativa" icone={<Droplets className="h-4 w-4 text-sky-500" />}>
      <p className="text-3xl font-extrabold text-gray-900">{umidade}%</p>
      {elevada ? (
        <>
          <p className="mt-3 flex items-center gap-1.5 text-xs font-bold uppercase text-amber-700">
            <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden /> Umidade elevada
          </p>
          <p className="mt-1 text-xs text-gray-600">
            Priorize docas cobertas para café ensacado, silos verticais e big bags.
          </p>
        </>
      ) : (
        <>
          <p className="mt-3 flex items-center gap-1.5 text-xs font-bold uppercase text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden /> Nível operacional seguro
          </p>
          <p className="mt-1 text-xs text-gray-600">
            Estabilizado para descarregamento de grãos ensacados, silos verticais e big bags.
          </p>
        </>
      )}
    </CardCondicao>
  );
}
