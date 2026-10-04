import type { DataHoraISO, DataISO, Decimal, LocalFisico, Origem } from "../types";

export type StatusBoletim = "RASCUNHO" | "FECHADO";

export type BoletimCreate = {
  data: DataISO;
  local?: LocalFisico | null;
  observacao?: string | null;
};

export type LinhaProducaoIn = {
  tipo_item_id: number;
  descarga: number;
  remocao: number;
  transferencia: number;
};

export type ChapaNoBoletimIn = { matricula: string; meia_diaria: boolean };

export type LinhaProducao = LinhaProducaoIn & {
  tipo_item: string;
  quantidade_total: number;
  preco_unitario: Decimal;
  valor_linha: Decimal;
};

export type ChapaNoBoletim = ChapaNoBoletimIn & { nome: string };

export type CalculoBoletim = {
  producao_total: Decimal;
  chapas: number;
  meias_diarias: number;
  diarias_equivalentes: Decimal;
  valor_por_diaria: Decimal | null;
  piso_diaria: Decimal;
  piso_total: Decimal;
  total_pagar: Decimal;
  complemento: Decimal;
  abaixo_do_piso: boolean;
};

export type Boletim = {
  id: number;
  data: DataISO;
  local: LocalFisico | null;
  status: StatusBoletim;
  origem_dado: Origem;
  observacao: string | null;
  linhas: LinhaProducao[];
  equipe: ChapaNoBoletim[];
  calculo: CalculoBoletim;
  avisos: string[];
  criado_em: DataHoraISO;
  fechado_em: DataHoraISO | null;
  fechado_por: string | null;
};

export type FiltrosBoletim = {
  inicio?: DataISO;
  fim?: DataISO;
  local?: LocalFisico;
  status?: StatusBoletim;
};
