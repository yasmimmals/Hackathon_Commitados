import { Coffee, Wifi } from "lucide-react";

export default function BannerEspacoMotorista() {
  return (
    <aside className="flex flex-col gap-3 rounded-xl bg-gradient-to-r from-marca-profundo to-marca p-5 text-white shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/15">
          <Coffee className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <p className="text-sm font-bold">Espaço do Motorista &amp; Pátio COCAPEC</p>
          <p className="text-xs text-emerald-100">
            Disponibilizamos sala de descanso climatizada, café fresco COCAPEC, sanitários e rede Wi-Fi gratuita na portaria central.
          </p>
        </div>
      </div>
      <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold sm:self-auto">
        <Wifi className="h-3.5 w-3.5" aria-hidden /> Wi-Fi: COCAPEC_MOTORISTA
      </span>
    </aside>
  );
}
