import type { Clima } from "../../types";
import AcumuladoSemanal from "./AcumuladoSemanal";
import InstrucoesMotoristas from "./InstrucoesMotoristas";

export default function PainelLateral({ clima }: { clima: Clima }) {
  return (
    <aside className="space-y-4">
      <AcumuladoSemanal clima={clima} />
      <InstrucoesMotoristas />
    </aside>
  );
}
