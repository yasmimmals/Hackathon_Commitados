import { Warehouse } from "lucide-react";
import { LIMITE_MOEGA_DESCOBERTA_MM_H } from "../../constants";
import type { ChuvaHoje } from "../../types";
import CardCondicao from "./CardCondicao";

export default function CardMoegas({ chuva }: { chuva: ChuvaHoje }) {
  const pausada = chuva.picoMmH > LIMITE_MOEGA_DESCOBERTA_MM_H;
  const risco = pausada || chuva.probabilidade >= 40;
  const moegas = [
    { nome: "Moega 01 e 02 (Cobertas)", status: "Normal", risco: false },
    {
      nome: "Moega 03 (Granel Descoberta)",
      status: pausada ? "Pausa Prevista" : risco ? `Risco a partir de ${chuva.inicioEstimado ?? "hoje"}` : "Normal",
      risco,
    },
  ];

  return (
    <CardCondicao titulo="Status das Moegas" icone={<Warehouse className="h-4 w-4 text-marca" />}>
      <p className="text-lg font-bold text-gray-900">{pausada ? "Pátio Parcial" : "Pátio Ativo"}</p>
      <ul className="mt-3 space-y-1.5">
        {moegas.map((m) => (
          <li
            key={m.nome}
            className={`flex items-center justify-between gap-2 rounded-md px-2 py-1 text-xs ${m.risco ? "bg-amber-50" : "bg-emerald-50"}`}
          >
            <span className="text-gray-700">{m.nome}</span>
            <span className={`shrink-0 font-semibold ${m.risco ? "text-amber-700" : "text-emerald-700"}`}>{m.status}</span>
          </li>
        ))}
      </ul>
    </CardCondicao>
  );
}
