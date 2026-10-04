import type { Baia } from "../cadastros/types";
import type { Fornecedor } from "../fornecedores/types";
import type { Acondicionamento, DataHoraISO, DataISO, Decimal, Horario, LocalFisico, Origem } from "../types";

export type StatusAgendamento =
  | "PENDENTE"
  | "APROVADO"
  | "DESTINO_DEFINIDO"
  | "REJEITADO"
  | "CANCELADO"
  | "NA_FILA"
  | "EM_DESCARGA"
  | "CONCLUIDO"
  | "NAO_COMPARECEU"
  | "REAGENDADO";

/** Como o agendamento nasceu. */
export type OrigemAgendamento = "NORMAL" | "BALCAO" | "CHUVA";

export type MotivoNaoRecebimento =
  | "SEM_VAGA"
  | "CHUVA"
  | "DIVERGENCIA_NF_PEDIDO"
  | "SEM_PEDIDO"
  | "REJEITADO_COMPRAS"
  | "NAO_COMPARECEU"
  | "CANCELADO_FORNECEDOR"
  | "OUTRO";

export type SituacaoChuva = "BLOQUEADO" | "RISCO" | "SEM_RISCO";

export type AgendamentoCreate = {
  nota_fiscal_id: number;
  data: DataISO;
  horario: Horario;
  acondicionamento: Acondicionamento;
  /** Obrigatório para adubo com risco de chuva. */
  ciente_risco_chuva?: boolean;
  /** Para onde vão os avisos (aprovação, reprovação, doca definida). */
  email_contato?: string | null;
};

export type FiltrosAgendamento = {
  data?: DataISO;
  status?: StatusAgendamento;
  fornecedor_id?: number;
};

export type EquipamentoUsado = {
  /** Código do catálogo GET /cadastros/equipamentos (ex.: EMPILHADEIRA_GAS). */
  codigo: string;
  qtd?: number;
};

export type Descarga = {
  id: number;
  local: LocalFisico;
  baia: Baia | null;
  horario_entrada: DataHoraISO | null;
  horario_saida: DataHoraISO | null;
  qtd_chapas: number | null;
  equipamentos: EquipamentoUsado[];
};

export type Agendamento = {
  id: number;
  fornecedor_id: number;
  fornecedor: Fornecedor;
  origem_dado: Origem;
  nota_fiscal_id: number | null;
  data: DataISO;
  horario: Horario;
  acondicionamento: Acondicionamento;
  peso_kg: Decimal | null;
  carga_adubo: boolean;
  prob_chuva: number | null;
  nf_numero: string | null;
  nf_chave: string | null;
  pedido_compra: number | null;
  analisado_por: string | null;
  analisado_em: DataHoraISO | null;
  observacao_compras: string | null;
  status: StatusAgendamento;
  origem: OrigemAgendamento;
  prioritario: boolean;
  ciente_risco_chuva: boolean;
  motivo_nao_recebimento: MotivoNaoRecebimento | null;
  reagendado_de_id: number | null;
  horario_chegada: DataHoraISO | null;
  criado_em: DataHoraISO;
  cancelado_em: DataHoraISO | null;
  descargas: Descarga[];
  /** Quantos chapas a norma exige. */
  chapas_norma: number | null;
  aviso_chuva: string | null;
};

export type SlotDisponibilidade = {
  horario: Horario;
  ocupados: number;
  tem_batido: boolean;
  aceita_batido: boolean;
  aceita_unitizado: boolean;
  vagas_restantes: number;
  encaixes_chuva: number;
  /** Preenchidos quando a consulta é para uma nota de adubo. */
  prob_chuva: number | null;
  situacao_chuva: SituacaoChuva | null;
};

// ---------- Notificações ao fornecedor ----------

export type TipoNotificacao = "APROVADO" | "REPROVADO" | "DESTINO_DEFINIDO" | "REAGENDADO_CHUVA";

export type StatusNotificacao = "ENVIADA" | "SIMULADA" | "SEM_DESTINATARIO" | "FALHOU";

export type Notificacao = {
  id: number;
  tipo: TipoNotificacao;
  destinatario: string | null;
  assunto: string;
  corpo: string;
  status: StatusNotificacao;
  erro: string | null;
  criado_em: DataHoraISO;
};
