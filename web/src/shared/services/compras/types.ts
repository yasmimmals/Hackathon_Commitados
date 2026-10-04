import type { Agendamento, MotivoNaoRecebimento } from "../agendamentos/types";
import type { NotaFiscal } from "../nota-fiscal/types";

export type AprovacaoIn = {
  pedido_compra: number;
  analisado_por: string;
  observacao?: string | null;
};

export type RejeicaoIn = {
  motivo: MotivoNaoRecebimento;
  analisado_por: string;
  observacao: string;
};

export type Verificacao = { item: string; ok: boolean; detalhe: string };

export type Conferencia = {
  agendamento: Agendamento;
  nota: NotaFiscal;
  verificacoes: Verificacao[];
  pedido_compra: Record<string, unknown> | null;
};
