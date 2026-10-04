/** Formatação de números no padrão brasileiro. Aceita number ou Decimal da API (string). */
const n = (v: number | string | null | undefined) => Number(v ?? 0);

export const moeda = (v: number | string | null | undefined) =>
  n(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const decimal = (v: number | string | null | undefined, casas = 1) =>
  n(v).toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });

/** "2026-10-05" → "05/10/2026" */
export const dataBr = (iso: string) => iso.slice(0, 10).split("-").reverse().join("/");
