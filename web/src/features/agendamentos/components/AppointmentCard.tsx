import {
  AlertCircle,
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Hourglass,
  Pencil,
  Receipt,
  X,
  type LucideIcon,
} from "lucide-react";
import type {
  Appointment,
  AppointmentAction,
  AppointmentStatus,
} from "../types";

const STATUS: Record<
  AppointmentStatus,
  { icon: LucideIcon; ring: string; badge: string; title: string }
> = {
  active: {
    icon: Clock,
    ring: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    title: "text-gray-900",
  },
  adjustment: {
    icon: AlertCircle,
    ring: "bg-red-50 text-red-600 ring-red-100",
    badge: "bg-red-50 text-red-700 ring-red-200",
    title: "text-gray-900",
  },
  review: {
    icon: Hourglass,
    ring: "bg-amber-50 text-amber-600 ring-amber-100",
    badge: "bg-amber-50 text-amber-700 ring-amber-200",
    title: "text-gray-900",
  },
  done: {
    icon: CheckCircle2,
    ring: "bg-gray-100 text-gray-500 ring-gray-200",
    badge: "bg-gray-100 text-gray-600 ring-gray-200",
    title: "text-gray-600",
  },
};

const ACTION_ICONS = {
  alert: AlertTriangle,
  x: X,
  edit: Pencil,
  calendar: CalendarClock,
  eye: Eye,
  ticket: FileText,
  receipt: Receipt,
} satisfies Record<NonNullable<AppointmentAction["icon"]>, LucideIcon>;

const ACTION_VARIANTS = {
  ghost: "text-gray-700 hover:bg-gray-100",
  outline: "border border-gray-200 text-gray-700 hover:bg-gray-50",
  danger: "text-red-600 hover:bg-red-50",
  primary: "bg-sky-50 text-sky-800 ring-1 ring-sky-200 hover:bg-sky-100",
};

const FOOTER_TONE = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  muted: "bg-gray-300",
};

interface AppointmentCardProps {
  appointment: Appointment;
  onAction?: (action: AppointmentAction) => void;
}

export default function AppointmentCard({
  appointment,
  onAction,
}: AppointmentCardProps) {
  const {
    code,
    dateLabel,
    status,
    statusText,
    subtitle,
    product,
    meta,
    transport,
    notice,
    footerInfo,
    footerTone = "muted",
    actions = [],
  } = appointment;
  const s = STATUS[status];
  const Icon = s.icon;

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <header className="flex items-start gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-4 ${s.ring}`}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={`text-lg font-bold leading-tight ${s.title}`}>
              {dateLabel}
            </h3>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${s.badge}`}
            >
              {statusText}
            </span>
          </div>
          {subtitle && (
            <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>
          )}
        </div>

        <span className="shrink-0 text-xs font-medium text-gray-400">
          {code}
        </span>
      </header>

      <div className="mt-4">
        <p className="text-[15px] font-semibold text-gray-900">{product}</p>
        {meta && <p className="mt-0.5 text-xs text-gray-500">{meta}</p>}
      </div>

      {transport && (
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
          {[
            ["Motorista", transport.driver],
            ["Placa", transport.plate],
            ["Tipo de veículo", transport.vehicle],
            ["Destino", transport.destination],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-[11px] text-gray-500">{label}</dt>
              <dd className="text-xs font-medium text-gray-800">{value}</dd>
            </div>
          ))}
        </dl>
      )}

      {notice && (
        <div
          role="note"
          className="mt-4 rounded-lg border border-red-200 border-l-4 border-l-red-500 bg-red-50/70 p-3 text-xs"
        >
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
            <strong className="font-semibold text-red-700">
              {notice.author}
            </strong>
            {notice.reference && (
              <span className="text-red-600">{notice.reference}</span>
            )}
          </div>
          <p className="leading-relaxed text-red-700">{notice.message}</p>
        </div>
      )}

      {(footerInfo || actions.length > 0) && (
        <footer className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
          {footerInfo ? (
            <p className="flex items-center gap-2 text-xs text-gray-600">
              <span
                className={`h-2 w-2 rounded-full ${FOOTER_TONE[footerTone]}`}
                aria-hidden
              />
              {footerInfo}
            </p>
          ) : (
            <span />
          )}

          {actions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {actions.map((action) => {
                const ActionIcon = action.icon
                  ? ACTION_ICONS[action.icon]
                  : null;
                return (
                  <button
                    key={action.label}
                    type="button"
                    onClick={action.onClick ?? (() => onAction?.(action))}
                    className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-1 ${ACTION_VARIANTS[action.variant ?? "ghost"]}`}
                  >
                    {ActionIcon && (
                      <ActionIcon className="h-3.5 w-3.5" aria-hidden />
                    )}
                    {action.label}
                  </button>
                );
              })}
            </div>
          )}
        </footer>
      )}
    </article>
  );
}
