import type { Clima } from "../../types";
import CardMoegas from "./CardMoegas";
import CardPatio from "./CardPatio";
import CardPrecipitacao from "./CardPrecipitacao";
import CardUmidade from "./CardUmidade";

export default function CondicoesAtuais({ clima }: { clima: Clima }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <CardPatio atual={clima.atual} />
      <CardUmidade umidade={clima.atual.umidade} />
      <CardPrecipitacao chuva={clima.chuvaHoje} />
      <CardMoegas chuva={clima.chuvaHoje} />
    </div>
  );
}
