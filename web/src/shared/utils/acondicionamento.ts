import type { Acondicionamento } from "@/shared/services";

/** Acondicionamento como as telas usam (valor dos radios). */
export type AcondicionamentoTela = "paletizado" | "bigbag" | "batido";

export const ACONDICIONAMENTO_API: Record<AcondicionamentoTela, Acondicionamento> = {
  paletizado: "PALETIZADO",
  bigbag: "BIG_BAG",
  batido: "BATIDO",
};

export const ROTULO_ACONDICIONAMENTO: Record<Acondicionamento, string> = {
  PALETIZADO: "Paletizado",
  BIG_BAG: "Big Bag",
  BATIDO: "Granel (Batido)",
};
