import type { LocalFisico } from "@/shared/services";

export const LOCAIS: LocalFisico[] = ["INSUMOS", "ADUBO", "MAQUINAS", "LOJA"];

export const ROTULO_LOCAL: Record<LocalFisico, string> = {
  INSUMOS: "Armazém de Insumos",
  ADUBO: "Pátio de Adubo",
  MAQUINAS: "Armazém de Máquinas",
  LOJA: "Loja",
};
