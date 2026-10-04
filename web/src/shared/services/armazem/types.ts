import type { EquipamentoUsado, SituacaoChuva, StatusAgendamento } from "../agendamentos/types";
import type { Acondicionamento, DataISO, Decimal, Horario, LocalFisico } from "../types";

export type BalcaoCreate = {
  nota_fiscal_id: number;
  horario: Horario;
  acondicionamento: Acondicionamento;
  email_contato?: string | null;
};

export type DestinoIn = {
  local: LocalFisico;
  baia_id?: number | null;
};

export type DestinosIn = {
  destinos: DestinoIn[];
};

export type EntradaIn = {
  local: LocalFisico;
};

export type SaidaIn = {
  local: LocalFisico;
  qtd_chapas: number;
  equipamentos?: EquipamentoUsado[];
};

export type ReagendamentoChuvaIn = {
  nova_data?: DataISO | null;
  novo_horario?: Horario;
};

export type FiltrosProgramacao = {
  inicio?: DataISO;
  fim?: DataISO;
  local?: LocalFisico;
};

export type CaminhaoPrevisto = {
  agendamento_id: number;
  data: DataISO;
  horario: Horario;
  status: StatusAgendamento;
  confirmado: boolean;
  prioritario: boolean;
  fornecedor: string;
  nf_numero: string | null;
  acondicionamento: Acondicionamento;
  peso_kg: Decimal | null;
  volumes_estimados: number | null;
  locais: LocalFisico[];
  locais_sugeridos: boolean;
  doca: string | null;
  chapas_norma: number | null;
  equipamento_sugerido: string | null;
  minutos_caminhao: number;
  minutos_equipe: number;
  carga_adubo: boolean;
  prob_chuva: number | null;
  situacao_chuva: SituacaoChuva | null;
};

export type ResumoDiaLocal = {
  data: DataISO;
  local: LocalFisico | null;
  caminhoes: number;
  confirmados: number;
  peso_total_kg: Decimal;
  chapa_minutos: number;
  tem_batido: boolean;
  chapas_recomendados: number;
  caminhoes_com_risco_chuva: number;
};

export type Programacao = {
  inicio: DataISO;
  fim: DataISO;
  premissas: string[];
  resumo: ResumoDiaLocal[];
  caminhoes: CaminhaoPrevisto[];
};
