import { useState } from "react";
import { BarChart3 } from "lucide-react";
import AbaBoletins from "./components/AbaBoletins";
import AbaCusto from "./components/AbaCusto";
import AbaHistorico from "./components/AbaHistorico";
import AbaPlano from "./components/AbaPlano";
import AbaPrevisao from "./components/AbaPrevisao";

/* Painel gerencial: o que fazer (previsão e plano), quanto custa (custo do chapeiro),
   o que aconteceu (histórico) e o dia a dia (boletins). Todos os cálculos vêm do backend. */

const ABAS = [
  { id: "previsao", rotulo: "Próximas semanas", Componente: AbaPrevisao },
  { id: "plano", rotulo: "Plano de escala", Componente: AbaPlano },
  { id: "custo", rotulo: "Custo do chapeiro", Componente: AbaCusto },
  { id: "historico", rotulo: "Sobra ou falta", Componente: AbaHistorico },
  { id: "boletins", rotulo: "Boletins", Componente: AbaBoletins },
] as const;

type IdAba = (typeof ABAS)[number]["id"];

export default function PainelGerencial() {
  const [aba, setAba] = useState<IdAba>("previsao");
  const Ativa = ABAS.find((a) => a.id === aba)!.Componente;

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-1 flex items-center gap-1.5 text-xs text-gray-500">
          <BarChart3 className="h-3.5 w-3.5" aria-hidden /> Gestão
        </p>
        <h1 className="titulo-pagina">Painel Gerencial</h1>
        <p className="mt-2 max-w-prose text-sm text-gray-600">
          Quantos chapas escalar, quanto isso custa e se sobra ou falta equipe, com previsão para as próximas semanas e meses.
        </p>
      </div>

      <div role="tablist" aria-label="Seções do painel" className="flex gap-1 overflow-x-auto rounded-full bg-white p-1 shadow-sm">
        {ABAS.map((a) => (
          <button key={a.id} type="button" role="tab" aria-selected={aba === a.id} onClick={() => setAba(a.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
              aba === a.id ? "bg-site-azul text-white" : "text-gray-600 hover:bg-gray-100"}`}>
            {a.rotulo}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        <Ativa />
      </div>
    </div>
  );
}
