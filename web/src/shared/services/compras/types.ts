import type { Agendamento, MotivoNaoRecebimento } from "../agendamentos/types";
import type { NotaFiscal } from "../nota-fiscal/types";

export type AprovacaoIn = {
  pedido_compra: number;
  analisado_por: string;
  observacao?: string | null;
};

/** Reprovar exige motivo e explicação (mín. 5 caracteres): o texto vai no e-mail ao fornecedor. */
export type RejeicaoIn = {
  motivo: MotivoNaoRecebimento;
  analisado_por: string;
  observacao: string;
};

/** Checagem automática da conferência (ex.: CNPJ, peso, pedido). */
export type Verificacao = { item: string; ok: boolean; detalhe: string };

/** Tudo o que o Compras precisa para aprovar ou reprovar. */
export type Conferencia = {
  agendamento: Agendamento;
  nota: NotaFiscal;
  verificacoes: Verificacao[];
  pedido_compra: Record<string, unknown> | null;
};
