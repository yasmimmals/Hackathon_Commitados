import type { CoresGrafico } from "@/shared/components/graficos";

/** Acabamento comum dos gráficos: eixos discretos, grade horizontal leve, números em pt-BR. */
export const eixoX = (c: CoresGrafico) => ({
  tick: { fill: c.eixo, fontSize: 11 },
  axisLine: { stroke: c.grade },
  tickLine: false,
  interval: "preserveStartEnd" as const,
  minTickGap: 8,
});

export const eixoY = (c: CoresGrafico, formatar?: (v: number) => string, largura = 44) => ({
  tick: { fill: c.eixo, fontSize: 11 },
  axisLine: false,
  tickLine: false,
  width: largura,
  tickFormatter: formatar,
});

export const grade = (c: CoresGrafico) => ({ stroke: c.grade, strokeDasharray: "3 3", vertical: false });

export const margem = { top: 10, right: 12, bottom: 0, left: 0 };

export const num = (v: number, casas = 1) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: casas });

export const moedaCurta = (v: number) =>
  Math.abs(v) >= 1000
    ? `R$ ${(v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`
    : `R$ ${Math.round(v)}`;

export const moedaInteira = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
