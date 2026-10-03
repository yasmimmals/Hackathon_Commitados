import type { CondicaoAtual } from "../../types";
import IconeClima from "../IconeClima";
import CardCondicao, { LinhaInfo } from "./CardCondicao";

export default function CardPatio({ atual }: { atual: CondicaoAtual }) {
  return (
    <CardCondicao titulo="Condição no Pátio" icone={<IconeClima tipo={atual.icone} />}>
      <p className="text-3xl font-extrabold text-gray-900">{atual.temperatura}°C</p>
      <p className="mt-3 text-sm font-medium text-gray-700">{atual.descricao}</p>
      <div className="mt-2 space-y-1 border-t border-gray-100 pt-2">
        <LinhaInfo rotulo="Sensação térmica" valor={`${atual.sensacao}°C`} />
        <LinhaInfo rotulo="Vento predom." valor={`${atual.ventoKmh} km/h ${atual.ventoDirecao}`} />
      </div>
    </CardCondicao>
  );
}
