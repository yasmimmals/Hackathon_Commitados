import { useEffect, useId, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Droplets } from "lucide-react";
import { SELOS_JANELA, STATUS_JANELA } from "../../constants";
import type { DiaPrevisao } from "../../types";
import IconeClima from "../IconeClima";
import LegendaJanelas from "./LegendaJanelas";

const DIAS_CURTOS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const diaCurto = (iso: string) => DIAS_CURTOS[new Date(`${iso}T12:00:00`).getDay()];

const CLASSE_SETA =
  "flex h-8 w-8 items-center justify-center rounded-full border-2 border-site-azul text-site-azul transition-colors hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-azul focus-visible:ring-offset-2 disabled:cursor-default disabled:border-gray-300 disabled:text-gray-300 disabled:hover:bg-transparent";

type PrevisaoSemanalProps = {
  previsao: DiaPrevisao[];
  cidade?: string;
  /** Versão para colunas estreitas: sem o detalhe da janela de descarga. */
  compacto?: boolean;
};

/** Previsão dos próximos dias no modelo do site COCAPEC (cards azuis com rolagem por setas). */
export default function PrevisaoSemanal({ previsao, cidade = "Franca/SP", compacto = false }: PrevisaoSemanalProps) {
  const idTitulo = useId();
  const trilho = useRef<HTMLUListElement>(null);
  const [limites, setLimites] = useState({ inicio: true, fim: false });
  const [selecionado, setSelecionado] = useState(previsao[0]?.iso);
  const dia = previsao.find((d) => d.iso === selecionado) ?? previsao[0];

  const atualizarLimites = () => {
    const el = trilho.current;
    if (!el) return;
    setLimites({ inicio: el.scrollLeft <= 1, fim: el.scrollLeft + el.clientWidth >= el.scrollWidth - 1 });
  };

  useEffect(() => {
    atualizarLimites();
    window.addEventListener("resize", atualizarLimites);
    return () => window.removeEventListener("resize", atualizarLimites);
  }, []);

  const rolar = (sentido: 1 | -1) => {
    const el = trilho.current;
    el?.scrollBy({ left: sentido * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <section aria-labelledby={idTitulo} className={`rounded-3xl bg-white shadow-sm ${compacto ? "p-4" : "p-4 sm:p-5 md:p-6"}`}>
      <header className="flex items-center justify-between gap-3 border-b-[3px] border-site-amarelo pb-2">
        <h2 id={idTitulo} className={`titulo-secao ${compacto ? "text-lg" : ""}`}>Previsão do tempo</h2>
        <div className="flex gap-2">
          <button type="button" onClick={() => rolar(-1)} disabled={limites.inicio} aria-label="Dias anteriores" className={CLASSE_SETA}>
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
          <button type="button" onClick={() => rolar(1)} disabled={limites.fim} aria-label="Próximos dias" className={CLASSE_SETA}>
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </header>

      <div className="mb-3 mt-3 flex flex-wrap items-end justify-between gap-2">
        <p className={`font-black italic text-site-verde ${compacto ? "text-2xl" : "text-2xl sm:text-3xl"}`}>{cidade}</p>
        <p className="text-xs font-semibold text-gray-500">Clima para os próximos dias</p>
      </div>

      <ul
        ref={trilho}
        onScroll={atualizarLimites}
        aria-label="Previsão diária"
        className="flex snap-x gap-3 overflow-x-auto p-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {previsao.map((d) => {
          const ativo = d.iso === dia?.iso;
          return (
            <li key={d.iso} className="min-w-[100px] flex-1 snap-start">
              <button
                type="button"
                onClick={() => setSelecionado(d.iso)}
                aria-pressed={ativo}
                aria-label={`${d.dia}, ${d.data}: máxima ${d.max}°, mínima ${d.min}°, ${d.probabilidade}% de chuva`}
                className={[
                  "flex w-full flex-col items-center gap-1 rounded-2xl bg-[linear-gradient(180deg,#1b6fbf_0%,#0a5aa4_55%,#084a87_100%)] px-2 py-3 text-white shadow-sm transition",
                  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-site-amarelo/70",
                  ativo ? "ring-4 ring-site-amarelo" : "hover:brightness-110",
                ].join(" ")}
              >
                <span className="text-base font-bold leading-none">{diaCurto(d.iso)}</span>
                <span className="text-xs text-white/85">{d.data}</span>
                <IconeClima tipo={d.icone} claro className="my-1 h-9 w-9" />
                <span className="text-2xl font-black leading-none">{d.max}°</span>
                <span className="text-sm font-bold leading-none text-white/85">{d.min}°</span>
                <span className="mt-1 flex items-center gap-1 text-[11px] font-semibold">
                  <span className={`h-2 w-2 rounded-full ${STATUS_JANELA[d.status].ponto}`} aria-hidden />
                  <Droplets className="h-3 w-3" aria-hidden /> {d.probabilidade}%
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {dia && !compacto && (
        <div className="mt-3 flex flex-col gap-3 rounded-2xl bg-fundo/60 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Janela de descarga • {dia.dia} ({dia.data})
            </p>
            <p className="mt-0.5 font-bold text-site-azul">{dia.janela}</p>
            <p className="text-xs text-gray-600">
              {dia.chuvaMm} mm previstos • {dia.probabilidade}% de chance de chuva
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 md:items-end">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${SELOS_JANELA[dia.selo].classe}`}>
              {SELOS_JANELA[dia.selo].rotulo}
            </span>
            <LegendaJanelas />
          </div>
        </div>
      )}
    </section>
  );
}
