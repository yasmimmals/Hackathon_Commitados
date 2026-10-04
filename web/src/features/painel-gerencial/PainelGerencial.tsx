import { useRef, useState, type KeyboardEvent } from "react";
import { BarChart3, CalendarRange, ClipboardList, Scale, Timer, TrendingUp, Wallet } from "lucide-react";
import AbaBoletins from "./components/AbaBoletins";
import AbaCusto from "./components/AbaCusto";
import AbaHistorico from "./components/AbaHistorico";
import AbaPlano from "./components/AbaPlano";
import AbaPrevisao from "./components/AbaPrevisao";
import AbaTempos from "./components/AbaTempos";

const ABAS = [
  { id: "previsao", rotulo: "Próximas semanas", Icone: TrendingUp, Componente: AbaPrevisao },
  { id: "plano", rotulo: "Plano de escala", Icone: CalendarRange, Componente: AbaPlano },
  { id: "custo", rotulo: "Custo do chapeiro", Icone: Wallet, Componente: AbaCusto },
  { id: "historico", rotulo: "Sobra ou falta", Icone: Scale, Componente: AbaHistorico },
  { id: "tempos", rotulo: "Tempo do caminhão", Icone: Timer, Componente: AbaTempos },
  { id: "boletins", rotulo: "Boletins", Icone: ClipboardList, Componente: AbaBoletins },
] as const;

type IdAba = (typeof ABAS)[number]["id"];

export default function PainelGerencial() {
  const [aba, setAba] = useState<IdAba>("previsao");
  const botoes = useRef<(HTMLButtonElement | null)[]>([]);
  const indice = ABAS.findIndex((a) => a.id === aba);
  const { Componente: Ativa } = ABAS[indice];

  const teclado = (e: KeyboardEvent) => {
    const passos: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, Home: -indice, End: ABAS.length - 1 - indice };
    if (!(e.key in passos)) return;
    e.preventDefault();
    const novo = (indice + passos[e.key] + ABAS.length) % ABAS.length;
    setAba(ABAS[novo].id);
    botoes.current[novo]?.focus();
  };

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

      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div role="tablist" aria-label="Seções do painel" onKeyDown={teclado}
          className="inline-flex min-w-full gap-1 rounded-2xl bg-white p-1.5 shadow-sm sm:min-w-0">
          {ABAS.map((a, i) => (
            <button key={a.id} ref={(el) => { botoes.current[i] = el; }} type="button" role="tab"
              id={`aba-${a.id}`} aria-controls={`painel-${a.id}`} aria-selected={aba === a.id} tabIndex={aba === a.id ? 0 : -1}
              onClick={() => setAba(a.id)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                aba === a.id ? "bg-site-azul text-white shadow" : "text-gray-600 hover:bg-gray-100"}`}>
              <a.Icone className="h-4 w-4" aria-hidden /> {a.rotulo}
            </button>
          ))}
        </div>
      </div>

      <div role="tabpanel" id={`painel-${aba}`} aria-labelledby={`aba-${aba}`} tabIndex={-1}>
        <Ativa />
      </div>
    </div>
  );
}
