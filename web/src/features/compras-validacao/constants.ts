import type { MotivoNaoRecebimento } from "@/shared/services";

export const MOTIVOS_REPROVA: { valor: MotivoNaoRecebimento; rotulo: string }[] = [
  { valor: "DIVERGENCIA_NF_PEDIDO", rotulo: "Divergência entre a nota fiscal e o pedido de compra" },
  { valor: "REJEITADO_COMPRAS", rotulo: "Recusado pela Mesa de Compras" },
  { valor: "SEM_VAGA", rotulo: "Sem vaga no horário" },
  { valor: "OUTRO", rotulo: "Outro motivo" },
];

export const MIN_CARACTERES_MOTIVO = 10;
