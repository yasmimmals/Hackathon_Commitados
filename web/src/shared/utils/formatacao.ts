const n = (v: number | string | null | undefined) => Number(v ?? 0);

export const moeda = (v: number | string | null | undefined) =>
  n(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const decimal = (v: number | string | null | undefined, casas = 1) =>
  n(v).toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });

export const dataBr = (iso: string) => iso.slice(0, 10).split("-").reverse().join("/");

export const duracaoMin = (min: number | null | undefined) => {
  if (min == null) return "—";
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${m} min`;
  return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
};
