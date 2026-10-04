import type { Decimal } from "@/shared/services";

export const formatarMoeda = (valor: Decimal | null) =>
  valor ? Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—";

export const formatarKg = (valor: Decimal | null) =>
  valor ? `${Number(valor).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} kg` : "—";

/** "2026-10-05" ou ISO completo → "05/10/2026" */
export const formatarData = (iso: string | null) => (iso ? iso.slice(0, 10).split("-").reverse().join("/") : "—");

/** "14285390000144" → "14.285.390/0001-44" */
export const formatarCnpj = (cnpj: string) =>
  cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
