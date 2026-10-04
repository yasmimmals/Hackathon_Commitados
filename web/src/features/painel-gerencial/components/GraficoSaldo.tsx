import { useState } from "react";
import type { LocalFisico } from "@/shared/services";
import { ROTULO_LOCAL } from "@/shared/utils/locais";
import { moeda } from "@/features/boletim-producao/utils/calculo";
import type { ResumoArmazem } from "../utils/indicadores";

/** Par divergente validado (dataviz: blue ↔ red, CVD ΔE 21.6, contraste ≥ 3:1). */
export const COR_SOBRA = "#e34948";
export const COR_FALTA = "#2a78d6";

const sinal = (v: number) => (v > 0 ? `+${moeda(v)}` : v < 0 ? `−${moeda(-v)}` : moeda(0));
const leitura = (v: number) => (v > 0 ? "sobra de chapas" : v < 0 ? "falta de chapas" : "equipe ajustada");

/** Saldo em R$ por armazém, em barras divergentes a partir do zero (sobra à direita, falta à esquerda). */
export default function GraficoSaldo({ resumo }: { resumo: ResumoArmazem[] }) {
  const [ativo, setAtivo] = useState<LocalFisico | null>(null);
  const maximo = Math.max(1, ...resumo.map((r) => Math.abs(r.saldoReais)));

  return (
    <figure className="rounded-3xl bg-white p-5 shadow-sm">
      <figcaption className="mb-1 flex flex-wrap items-end justify-between gap-2 border-b-[3px] border-site-amarelo pb-2">
        <span className="titulo-secao text-lg">Saldo de chapas por armazém (R$)</span>
        <span className="flex flex-wrap gap-4 text-xs text-gray-700">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm" style={{ background: COR_FALTA }} aria-hidden /> Falta de chapas
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm" style={{ background: COR_SOBRA }} aria-hidden /> Sobra de chapas (complemento)
          </span>
        </span>
      </figcaption>
      <p className="mb-3 text-xs text-gray-500">Positivo = sobra paga em complemento; negativo = produção acima do que a equipe cobriria no piso.</p>

      <ul className="space-y-1">
        {resumo.map((r) => {
          const largura = (Math.abs(r.saldoReais) / maximo) * 50;
          const positivo = r.saldoReais >= 0;
          const descricao = `${ROTULO_LOCAL[r.local]}: ${sinal(r.saldoReais)}, ${leitura(r.saldoReais)}. Sobra ${moeda(r.sobraReais)}, falta ${moeda(r.faltaReais)}, ${r.boletins} boletim(ns).`;
          return (
            <li
              key={r.local}
              tabIndex={0}
              aria-label={descricao}
              onPointerEnter={() => setAtivo(r.local)}
              onPointerLeave={() => setAtivo(null)}
              onFocus={() => setAtivo(r.local)}
              onBlur={() => setAtivo(null)}
              className="grid grid-cols-[90px_minmax(0,1fr)_88px] items-center gap-2 rounded-lg px-1 py-2 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-azul sm:grid-cols-[170px_minmax(0,1fr)_110px] sm:gap-3"
            >
              <span className="truncate text-xs text-gray-700 sm:text-sm">{ROTULO_LOCAL[r.local]}</span>
              <div className="relative h-6">
                {/* Linha do zero */}
                <span className="absolute inset-y-0 left-1/2 w-px bg-gray-300" aria-hidden />
                {r.saldoReais !== 0 && (
                  <span
                    aria-hidden
                    className={`absolute top-0.5 h-5 ${positivo ? "rounded-r" : "rounded-l"} ${ativo === r.local ? "brightness-110" : ""}`}
                    style={{
                      background: positivo ? COR_SOBRA : COR_FALTA,
                      width: `${largura}%`,
                      left: positivo ? "50%" : `${50 - largura}%`,
                    }}
                  />
                )}
                {ativo === r.local && (
                  <span
                    role="tooltip"
                    className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 w-max max-w-[260px] -translate-x-1/2 rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-lg"
                  >
                    <strong className="block text-sm">{sinal(r.saldoReais)}</strong>
                    <span className="block text-gray-300">{ROTULO_LOCAL[r.local]} • {leitura(r.saldoReais)}</span>
                    <span className="block text-gray-300">Sobra {moeda(r.sobraReais)} • Falta {moeda(r.faltaReais)}</span>
                  </span>
                )}
              </div>
              <span aria-hidden className="text-right text-xs font-semibold tabular-nums text-gray-900">
                {r.boletins ? sinal(r.saldoReais) : "sem boletins"}
              </span>
            </li>
          );
        })}
      </ul>
    </figure>
  );
}
