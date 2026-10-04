export type AppointmentStatus = "active" | "adjustment" | "review" | "done";

export interface AppointmentAction {
  label: string;
  variant?: "ghost" | "outline" | "danger" | "primary";
  icon?: "alert" | "x" | "edit" | "calendar" | "eye" | "ticket" | "receipt";
  kind?: "delay" | "cancel" | "reschedule";
  onClick?: () => void;
}

export interface Appointment {
  id: string;
  code: string;
  dateLabel: string;
  status: AppointmentStatus;
  statusText: string;
  subtitle?: string;
  product: string;
  meta?: string;
  transport?: {
    driver: string;
    plate: string;
    vehicle: string;
    destination: string;
  };
  notice?: {
    author: string;
    reference?: string;
    message: string;
  };
  footerInfo?: string;
  footerTone?: "success" | "warning" | "muted";
  actions?: AppointmentAction[];
}

export type TabKey = "todos" | "validacao" | "autorizados" | "recusados" | "historico";

export type ListedAppointment = Appointment & { tab: Exclude<TabKey, "todos"> };

export interface Tab {
  key: TabKey;
  label: string;
  count?: number;
  danger?: boolean;
}