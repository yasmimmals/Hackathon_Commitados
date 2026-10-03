import { Clock, TriangleAlert } from "lucide-react";

export default function AlertBanner() {
  return (
    <div role="region" aria-label="Alerta meteorológico" className="w-full border-b border-amber-200 bg-amber-50">
      <div className="mx-auto flex max-w-[1300px] items-center justify-between gap-3 px-4 py-2 text-xs text-amber-900 md:text-sm">
        <p className="flex items-center gap-2">
          <TriangleAlert className="h-4 w-4 shrink-0 text-amber-600" aria-hidden />
          <span>
            <strong className="font-semibold">Terminal Logístico Franca/SP • Alerta Meteorológico:</strong>
            Monitoramento de chuva ativo para moega de adubo e fertilizante a granel.
          </span>
        </p>
        <span className="hidden shrink-0 items-center gap-1 text-xs text-amber-800/70 md:inline-flex">
          <Clock className="h-3.5 w-3.5" aria-hidden />
          Atualizado há 15 min
        </span>
      </div>
    </div>
  );
}