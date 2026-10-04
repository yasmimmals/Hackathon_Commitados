import type { Agendamento, MotivoNaoRecebimento, StatusAgendamento } from "@/shared/services";
import { ROTULO_ACONDICIONAMENTO } from "@/shared/utils/acondicionamento";
import { ROTULO_LOCAL } from "@/shared/utils/locais";
import type { Appointment, AppointmentAction, AppointmentStatus, ListedAppointment } from "../types";

type Aba = ListedAppointment["tab"];

const ABA_POR_STATUS: Record<StatusAgendamento, Aba> = {
  PENDENTE: "validacao",
  APROVADO: "autorizados",
  DESTINO_DEFINIDO: "autorizados",
  NA_FILA: "autorizados",
  EM_DESCARGA: "autorizados",
  REJEITADO: "recusados",
  CANCELADO: "historico",
  CONCLUIDO: "historico",
  NAO_COMPARECEU: "historico",
  REAGENDADO: "historico",
};

const VISUAL_POR_ABA: Record<Aba, AppointmentStatus> = {
  autorizados: "active",
  validacao: "review",
  recusados: "adjustment",
  historico: "done",
};

const TEXTO_STATUS: Record<StatusAgendamento, string> = {
  PENDENTE: "Em Análise",
  APROVADO: "Aprovado",
  DESTINO_DEFINIDO: "Doca Definida",
  NA_FILA: "Na Fila",
  EM_DESCARGA: "Em Descarga",
  REJEITADO: "Recusado",
  CANCELADO: "Cancelado",
  CONCLUIDO: "Concluído",
  NAO_COMPARECEU: "Não Compareceu",
  REAGENDADO: "Reagendado",
};

const ROTULO_MOTIVO: Record<MotivoNaoRecebimento, string> = {
  SEM_VAGA: "Sem vaga no horário",
  CHUVA: "Chuva no dia da descarga",
  DIVERGENCIA_NF_PEDIDO: "Divergência entre a nota fiscal e o pedido de compra",
  REJEITADO_COMPRAS: "Recusado pela Mesa de Compras",
  NAO_COMPARECEU: "Veículo não compareceu",
  CANCELADO_FORNECEDOR: "Cancelado pelo fornecedor",
  OUTRO: "Outro motivo",
};


const CANCELAVEIS = new Set<StatusAgendamento>(["PENDENTE", "APROVADO", "DESTINO_DEFINIDO"]);

const ANTES_DA_CHEGADA = new Set<StatusAgendamento>(["APROVADO", "DESTINO_DEFINIDO"]);

const hojeIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const formatarDataIso = (iso: string) => iso.slice(0, 10).split("-").reverse().join("/");

const formatarHora = (isoDataHora: string) =>
  new Date(isoDataHora).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

const formatarToneladas = (pesoKg: string) =>
  (Number(pesoKg) / 1000).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function rotuloData(ag: Agendamento) {
  const hora = `${ag.horario}h`;
  return ag.data === hojeIso() ? `Hoje às ${hora}` : `${formatarDataIso(ag.data)} • ${hora}`;
}

function rodape(ag: Agendamento): Pick<Appointment, "footerInfo" | "footerTone"> {
  if (ag.aviso_chuva) return { footerInfo: ag.aviso_chuva, footerTone: "warning" };
  switch (ag.status) {
    case "PENDENTE": return { footerInfo: "Aguardando validação da Mesa de Compras", footerTone: "warning" };
    case "APROVADO": return { footerInfo: "Aprovado • aguardando definição da doca", footerTone: "success" };
    case "DESTINO_DEFINIDO": return { footerInfo: "Doca definida • portaria informada", footerTone: "success" };
    case "NA_FILA":
      return {
        footerInfo: ag.horario_chegada ? `Na fila desde ${formatarHora(ag.horario_chegada)}` : "Na fila",
        footerTone: "success",
      };
    case "EM_DESCARGA": return { footerInfo: "Descarga em andamento", footerTone: "success" };
    case "REJEITADO": return { footerInfo: "Envie uma nova nota fiscal para reagendar", footerTone: "warning" };
    case "CANCELADO":
      return {
        footerInfo: ag.cancelado_em ? `Cancelado em ${formatarDataIso(ag.cancelado_em)}` : "Cancelado",
        footerTone: "muted",
      };
    case "NAO_COMPARECEU": return { footerInfo: "Veículo não compareceu no horário", footerTone: "muted" };
    case "REAGENDADO": return { footerInfo: "Substituído por um novo agendamento", footerTone: "muted" };
    case "CONCLUIDO": return { footerInfo: "Descarga concluída", footerTone: "muted" };
  }
}

function acoes(ag: Agendamento): AppointmentAction[] {
  const lista: AppointmentAction[] = [];
  if (ANTES_DA_CHEGADA.has(ag.status)) {
    lista.push({ label: "Avisar Atraso", icon: "alert", variant: "outline", kind: "delay" });
  }
  if (CANCELAVEIS.has(ag.status)) {
    lista.push({ label: "Cancelar", icon: "x", variant: "danger", kind: "cancel" });
  }
  if (ag.status === "REJEITADO") {
    lista.push({ label: "Reagendar", icon: "calendar", variant: "primary", kind: "reschedule" });
  }
  return lista;
}


export function mapearAgendamento(ag: Agendamento): ListedAppointment {
  const tab = ABA_POR_STATUS[ag.status];

  const destinos = ag.descargas.map((d) => d.baia?.nome ?? ROTULO_LOCAL[d.local]);
  const subtitulo = [
    destinos.join(" + "),
    ag.origem === "BALCAO" && "Encaixe de pátio",
    ag.origem === "CHUVA" && "Reagendado por chuva",
    ag.prioritario && "Prioritário",
  ].filter(Boolean).join(" • ");

  const meta = [
    ROTULO_ACONDICIONAMENTO[ag.acondicionamento],
    ag.carga_adubo && "Carga de adubo",
    ag.pedido_compra && `Pedido ${ag.pedido_compra}`,
    ag.chapas_norma && `${ag.chapas_norma} chapas`,
  ].filter(Boolean).join(" • ");

  const nf = ag.nf_numero ? `NF-e ${ag.nf_numero}` : undefined;

  return {
    id: String(ag.id),
    tab,
    code: `#AG-${ag.id}`,
    dateLabel: rotuloData(ag),
    status: VISUAL_POR_ABA[tab],
    statusText: TEXTO_STATUS[ag.status],
    subtitle: subtitulo || undefined,
    product: `${nf ?? "Nota fiscal"}${ag.peso_kg ? ` (${formatarToneladas(ag.peso_kg)} t)` : ""}`,
    meta,
    notice:
      ag.status === "REJEITADO"
        ? {
            author: `Mesa de Compras${ag.analisado_por ? ` (${ag.analisado_por})` : ""}`,
            reference: nf,
            message:
              ag.observacao_compras ??
              (ag.motivo_nao_recebimento ? ROTULO_MOTIVO[ag.motivo_nao_recebimento] : "Agendamento recusado."),
          }
        : undefined,
    ...rodape(ag),
    actions: acoes(ag),
  };
}


export const ordenarPorData = (a: Agendamento, b: Agendamento) =>
  `${b.data} ${b.horario}`.localeCompare(`${a.data} ${a.horario}`);
