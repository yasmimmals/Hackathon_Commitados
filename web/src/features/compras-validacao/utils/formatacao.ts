import type { Decimal } from "@/shared/services";

export const formatarMoeda = (valor: Decimal | null) =>
  valor ? Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—";

export const formatarKg = (valor: Decimal | null) =>
  valor ? `${Number(valor).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} kg` : "—";

export const formatarData = (iso: string | null) => (iso ? iso.slice(0, 10).split("-").reverse().join("/") : "—");

export const formatarCnpj = (cnpj: string) =>
  cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
