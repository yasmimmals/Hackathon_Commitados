import type { LocalFisico } from "@/shared/services";
import { LOCAIS } from "@/shared/utils/locais";
import type { Boletim, ResumoBoletim } from "@/features/boletim-producao/types";
import { calcularResumo } from "@/features/boletim-producao/utils/calculo";

/**
 * Sobra ou falta de chapas de um boletim, em diárias e em R$.
 * Diárias necessárias = produção ÷ piso (a equipe "paga" pela própria produção).
 * Saldo > 0: sobra de chapas (a cooperativa paga complemento).
 * Saldo < 0: falta de chapas (produção acima do que a equipe escalada cobriria no piso).
 */
export type IndicadorBoletim = {
  data: string;
  local: LocalFisico;
  fechado: boolean;
  producao: number;
  diarias: number;
  necessarias: number;
  saldoDiarias: number;
  saldoReais: number;
};

export function indicadorDoBoletim(b: Boletim): IndicadorBoletim {
  const r: ResumoBoletim = b.status === "FECHADO" && b.resumo ? b.resumo : calcularResumo(b);
  const necessarias = r.piso ? r.producaoTotal / r.piso : 0;
  return {
    data: b.data,
    local: b.local,
    fechado: b.status === "FECHADO",
    producao: r.producaoTotal,
    diarias: r.diariasEquivalentes,
    necessarias,
    saldoDiarias: r.diariasEquivalentes - necessarias,
    saldoReais: r.diariasEquivalentes * r.piso - r.producaoTotal,
  };
}

export type ResumoArmazem = {
  local: LocalFisico;
  boletins: number;
  diarias: number;
  necessarias: number;
  sobraReais: number;
  faltaReais: number;
  saldoReais: number;
};

/** Agrega por armazém. Sobra e falta são somadas separadamente (dias diferentes não se anulam na leitura). */
export function resumirPorArmazem(indicadores: IndicadorBoletim[]): ResumoArmazem[] {
  return LOCAIS.map((local) => {
    const doLocal = indicadores.filter((i) => i.local === local);
    const soma = (f: (i: IndicadorBoletim) => number) => doLocal.reduce((t, i) => t + f(i), 0);
    return {
      local,
      boletins: doLocal.length,
      diarias: soma((i) => i.diarias),
      necessarias: soma((i) => i.necessarias),
      sobraReais: soma((i) => Math.max(0, i.saldoReais)),
      faltaReais: soma((i) => Math.max(0, -i.saldoReais)),
      saldoReais: soma((i) => i.saldoReais),
    };
  });
}
