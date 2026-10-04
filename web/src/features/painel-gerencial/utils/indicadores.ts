import type { Boletim } from "@/shared/services";
import { ROTULO_LOCAL } from "@/shared/utils/locais";

/**
 * Sobra ou falta de chapas de um boletim, em diárias e em R$ (valores do backend).
 * Diárias necessárias = produção ÷ piso (a equipe "paga" pela própria produção).
 * Saldo > 0: sobra de chapas (a cooperativa paga complemento).
 * Saldo < 0: falta de chapas (produção acima do que a equipe escalada cobriria no piso).
 */
export type IndicadorBoletim = {
  id: number;
  data: string;
  chave: string;
  rotulo: string;
  fechado: boolean;
  producao: number;
  diarias: number;
  necessarias: number;
  saldoReais: number;
};

const rotuloDoGrupo = (b: Pick<Boletim, "local">) => (b.local ? ROTULO_LOCAL[b.local] : "Geral (Franca)");

export function indicadorDoBoletim(b: Boletim): IndicadorBoletim {
  const producao = Number(b.calculo.producao_total);
  const diarias = Number(b.calculo.diarias_equivalentes);
  const piso = Number(b.calculo.piso_diaria);
  return {
    id: b.id,
    data: b.data,
    chave: b.local ?? "GERAL",
    rotulo: rotuloDoGrupo(b),
    fechado: b.status === "FECHADO",
    producao,
    diarias,
    necessarias: piso ? producao / piso : 0,
    saldoReais: diarias * piso - producao,
  };
}

export type ResumoGrupo = {
  chave: string;
  rotulo: string;
  boletins: number;
  diarias: number;
  necessarias: number;
  sobraReais: number;
  faltaReais: number;
  saldoReais: number;
};

export function resumirPorGrupo(indicadores: IndicadorBoletim[]): ResumoGrupo[] {
  const grupos = new Map<string, IndicadorBoletim[]>();
  indicadores.forEach((i) => grupos.set(i.chave, [...(grupos.get(i.chave) ?? []), i]));
  return [...grupos.entries()].map(([chave, lista]) => {
    const soma = (f: (i: IndicadorBoletim) => number) => lista.reduce((t, i) => t + f(i), 0);
    return {
      chave,
      rotulo: lista[0].rotulo,
      boletins: lista.length,
      diarias: soma((i) => i.diarias),
      necessarias: soma((i) => i.necessarias),
      sobraReais: soma((i) => Math.max(0, i.saldoReais)),
      faltaReais: soma((i) => Math.max(0, -i.saldoReais)),
      saldoReais: soma((i) => i.saldoReais),
    };
  });
}
