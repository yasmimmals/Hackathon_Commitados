import type { ListedAppointment, TabKey } from "../types";

export const TAB_LABELS: Record<TabKey, string> = {
  todos: "Todos",
  validacao: "Aguardando Validação",
  autorizados: "Autorizados",
  recusados: "Recusados",
  historico: "Histórico",
};

/** Dados de exemplo até a integração com o backend. */
export const AGENDAMENTOS_MOCK: ListedAppointment[] = [
  {
    id: "1", tab: "autorizados", code: "#AG-88190", status: "active", statusText: "Janela Ativa",
    dateLabel: "Hoje às 13:00h",
    subtitle: "Tolerância até 13:30h • Doca Coberta Setor 2",
    product: "Fertilizante Foliar Especial Quelatado (28,00 t)",
    meta: "Big Bag 1.000kg • Pedido PC-2026-750",
    transport: { driver: "Valdir S. Camargo", plate: "BRA-4F29 / SP", vehicle: "Carreta Sider", destination: "Armazém 04" },
    footerInfo: "Portaria informada • QR Pass liberado", footerTone: "success",
    actions: [
      { label: "Avisar Atraso", icon: "alert", variant: "outline", kind: "delay" },
      { label: "Cancelar", icon: "x", variant: "danger", kind: "cancel" },
    ],
  },
  {
    id: "2", tab: "recusados", code: "#AG-88219", status: "adjustment", statusText: "Ajuste Solicitado",
    dateLabel: "15/10/2026 • 10:00h",
    subtitle: "Doca 02 Moega • Pedido PC-2026-881",
    product: "Adubo NPK 04-14-08 Granulado a Granel (24,00 t)",
    notice: {
      author: "Mesa de Compras (Analista Carlos Eduardo)",
      reference: "NF-e 004.891",
      message: "Quantidade faturada (24,00 t) ultrapassa o saldo restante de 18,00 t do pedido. Solicite aditivo contratual ou ajuste a nota fiscal para reagendamento.",
    },
    footerInfo: "Falar com Comprador (R. 6120)", footerTone: "warning",
    actions: [
      { label: "Editar NF", icon: "edit" },
      { label: "Reagendar", icon: "calendar", variant: "primary" },
    ],
  },
  {
    id: "3", tab: "validacao", code: "#AG-88240", status: "review", statusText: "Em Análise",
    dateLabel: "16/10/2026 • 08:00h",
    subtitle: "Doca de Ensacados 01 • Pedido PC-2026-902",
    product: "Calcário Agrícola Ensacado (18,00 t)",
    meta: "Documentos transmitidos • Previsão média de resposta: 45 min",
    footerInfo: "2º na fila de validação", footerTone: "warning",
    actions: [{ label: "Ver Detalhes", icon: "eye" }],
  },
  {
    id: "4", tab: "historico", code: "#AG-88852", status: "done", statusText: "Concluído",
    dateLabel: "12/10/2026 • 16:42h",
    subtitle: "Doca Moega Principal • Ticket #TK-441829",
    product: "Sulfato de Amônio Granulado (30,48 t aferidas)",
    actions: [
      { label: "Ticket Balança", icon: "ticket" },
      { label: "Comprovante", icon: "receipt" },
    ],
  },
];
