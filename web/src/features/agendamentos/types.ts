export type AppointmentStatus = "active" | "adjustment" | "review" | "done";

export interface AppointmentAction {
  label: string;
  variant?: "ghost" | "outline" | "danger" | "primary";
  icon?: "alert" | "x" | "edit" | "calendar" | "eye" | "ticket" | "receipt";
  kind?: "delay" | "cancel";  // ações tratadas pela lista (MeusAgendamentos)
  onClick?: () => void;
}

export interface Appointment {
  id: string;
  code: string;               // ex.: #AG-88190
  dateLabel: string;          // ex.: "Hoje às 13:00h" ou "15/10/2026 • 10:00h"
  status: AppointmentStatus;
  statusText: string;         // ex.: "Janela Ativa"
  subtitle?: string;          // ex.: "Tolerância até 13:30h • Doca Coberta Setor 2"
  product: string;            // ex.: "Fertilizante Foliar Especial Quelatado (28,00 t)"
  meta?: string;              // ex.: "Big Bag 1.000kg • Pedido PC-2026-750"
  transport?: {
    driver: string;
    plate: string;
    vehicle: string;
    destination: string;
  };
  notice?: {
    author: string;
    reference?: string;       // ex.: "NF-e 004.891"
    message: string;
  };
  footerInfo?: string;
  footerTone?: "success" | "warning" | "muted";
  actions?: AppointmentAction[];
}

export type TabKey = "todos" | "validacao" | "autorizados" | "recusados" | "historico";

/** Agendamento já classificado na aba em que aparece. */
export type ListedAppointment = Appointment & { tab: Exclude<TabKey, "todos"> };

export interface Tab {
  key: TabKey;
  label: string;
  count?: number;
  danger?: boolean;
}