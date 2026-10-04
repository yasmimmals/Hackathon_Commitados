import type { Agendamento, Horario, SlotDisponibilidade, StatusAgendamento } from "@/shared/services";

export type Autorizacao = { tom: "ok" | "aguardando" | "negada" | "neutra"; rotulo: string; detalhe?: string };

export const TEXTO_STATUS: Record<StatusAgendamento, string> = {
  PENDENTE: "Aguardando Compras",
  APROVADO: "Aprovado • sem destino",
  DESTINO_DEFINIDO: "Destino definido",
  NA_FILA: "Na fila",
  EM_DESCARGA: "Em descarga",
  CONCLUIDO: "Concluído",
  REJEITADO: "Recusado",
  CANCELADO: "Cancelado",
  NAO_COMPARECEU: "Não compareceu",
  REAGENDADO: "Reagendado",
};

export function autorizacao(ag: Agendamento): Autorizacao {
  if (ag.status === "PENDENTE") return { tom: "aguardando", rotulo: "Aguardando autorização de Compras" };
  if (ag.status === "REJEITADO") {
    return { tom: "negada", rotulo: "Não autorizado", detalhe: ag.observacao_compras ?? undefined };
  }
  if (ag.status === "CANCELADO") return { tom: "neutra", rotulo: "Cancelado pelo fornecedor" };
  if (ag.pedido_compra) {
    return {
      tom: "ok",
      rotulo: `Autorizado • Pedido ${ag.pedido_compra}`,
      detalhe: ag.analisado_por ? `por ${ag.analisado_por}` : undefined,
    };
  }
  return { tom: "ok", rotulo: ag.origem === "BALCAO" ? "Encaixe de pátio" : "Autorizado" };
}

const OCUPAM_VAGA = new Set<StatusAgendamento>(["PENDENTE", "APROVADO", "DESTINO_DEFINIDO", "NA_FILA", "EM_DESCARGA", "CONCLUIDO"]);

const ocupaVaga = (ag: Agendamento) => OCUPAM_VAGA.has(ag.status);

export function candidatosAVaga(agenda: Agendamento[]): Agendamento[] {
  const notasAtivas = new Set(agenda.filter(ocupaVaga).map((a) => a.nota_fiscal_id));
  return agenda.filter(
    (a) =>
      a.status === "REJEITADO" &&
      a.motivo_nao_recebimento === "SEM_VAGA" &&
      a.nota_fiscal_id != null &&
      !notasAtivas.has(a.nota_fiscal_id),
  );
}

export type VagaLiberada = {
  horario: Horario;
  slot: SlotDisponibilidade;
  liberadaPor: Agendamento[];
};

/** Janelas com capacidade livre: desocupadas (não comparecimento/cancelamento) ou nunca preenchidas. */
export function vagasLiberadas(agenda: Agendamento[], slots: SlotDisponibilidade[]): VagaLiberada[] {
  return slots
    .filter((slot) => slot.aceita_unitizado || slot.aceita_batido)
    .map((slot) => ({
      horario: slot.horario,
      slot,
      liberadaPor: agenda.filter(
        (a) => a.horario === slot.horario && (a.status === "NAO_COMPARECEU" || a.status === "CANCELADO"),
      ),
    }));
}

export const cabeNaVaga = (ag: Agendamento, slot: SlotDisponibilidade) =>
  ag.acondicionamento === "BATIDO" ? slot.aceita_batido : slot.aceita_unitizado;
