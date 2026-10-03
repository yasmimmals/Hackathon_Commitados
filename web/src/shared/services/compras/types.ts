import type { MotivoNaoRecebimento } from "../agendamentos/types";

export type AprovacaoIn = {
  pedido_compra: number;
  analisado_por: string;
  observacao?: string | null;
};

export type RejeicaoIn = {
  /** Padrão no backend: REJEITADO_COMPRAS. */
  motivo?: MotivoNaoRecebimento;
  analisado_por: string;
  observacao?: string | null;
};
