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
  /** Opcional: com uma única doca ativa, o sistema escolhe. */
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
  /** Padrão: próximo dia útil. */
  nova_data?: DataISO | null;
  /** Padrão: 08:00. */
  novo_horario?: Horario;
};

// ---------- Programação antecipada ----------

export type FiltrosProgramacao = {
  /** Padrão no backend: hoje. */
  inicio?: DataISO;
  /** Padrão no backend: hoje + 6. */
  fim?: DataISO;
  local?: LocalFisico;
};

export type CaminhaoPrevisto = {
  agendamento_id: number;
  data: DataISO;
  horario: Horario;
  status: StatusAgendamento;
  /** false = Compras ainda não aprovou (previsão). */
  confirmado: boolean;
  prioritario: boolean;
  fornecedor: string;
  nf_numero: string | null;
  acondicionamento: Acondicionamento;
  peso_kg: Decimal | null;
  volumes_estimados: number | null;
  locais: LocalFisico[];
  /** true = armazém sugerido pelo sistema, ainda não definido. */
  locais_sugeridos: boolean;
  doca: string | null;
  chapas_norma: number | null;
  equipamento_sugerido: string | null;
  /** Até liberar o caminhão. */
  minutos_caminhao: number;
  /** Até a equipe ficar livre (ciclo completo). */
  minutos_equipe: number;
  carga_adubo: boolean;
  prob_chuva: number | null;
  situacao_chuva: SituacaoChuva | null;
};

export type ResumoDiaLocal = {
  data: DataISO;
  /** null = armazém ainda não definido nem sugerido. */
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
