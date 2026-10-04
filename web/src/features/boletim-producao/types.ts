import type { LocalFisico } from "@/shared/services";

export type LinhaProducao = { descarga: number; remocao: number; transferencia: number };

export type ChapaEscalado = { matricula: string; nome: string; meiaDiaria: boolean };

/** Totais congelados no fechamento (espelha os campos de `boletins_diarios` no backend). */
export type ResumoBoletim = {
  producaoTotal: number;
  diariasEquivalentes: number;
  valorPorDiaria: number;
  piso: number;
  complemento: number;
  totalPagar: number;
};

/** Um boletim por data + armazém (mesma chave única do backend). */
export type Boletim = {
  data: string;
  local: LocalFisico;
  status: "RASCUNHO" | "FECHADO";
  /** Por id de TIPOS_ITEM. */
  producoes: Record<number, LinhaProducao>;
  chapas: ChapaEscalado[];
  observacao: string;
  criadoEm: string;
  fechadoEm?: string;
  resumo?: ResumoBoletim;
};
