import type { ReactNode } from "react";
import { useCores } from "./cores";

type Item = { name?: string | number; value?: unknown; color?: string; dataKey?: unknown; payload?: Record<string, unknown> };

export function TooltipGrafico({ active, payload, label, formatarValor, formatarRotulo, rodape }: {
  active?: boolean;
  payload?: readonly Item[];
  label?: string | number;
  formatarValor?: (valor: unknown, nome: string) => string;
  formatarRotulo?: (rotulo: string | number | undefined, linha?: Record<string, unknown>) => ReactNode;
  rodape?: (linha: Record<string, unknown>) => ReactNode;
}) {
  const c = useCores();
  if (!active || !payload?.length) return null;
  const linha = payload[0]?.payload ?? {};
  return (
    <div className="min-w-[180px] rounded-xl px-3 py-2 text-xs shadow-xl"
      style={{ background: c.fundoTooltip, border: `1px solid ${c.bordaTooltip}`, color: c.texto }}>
      <p className="mb-1.5 font-semibold">{formatarRotulo ? formatarRotulo(label, linha) : label}</p>
      <ul className="space-y-1">
        {payload.filter((p) => p.value != null && !Array.isArray(p.value)).map((p) => (
          <li key={String(p.dataKey ?? p.name)} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: p.color }} aria-hidden />
            <span className="flex-1 opacity-80">{p.name}</span>
            <span className="font-semibold tabular-nums">
              {formatarValor ? formatarValor(p.value, String(p.name)) : String(p.value)}
            </span>
          </li>
        ))}
      </ul>
      {rodape && <div className="mt-1.5 border-t pt-1.5 opacity-80" style={{ borderColor: c.bordaTooltip }}>{rodape(linha)}</div>}
    </div>
  );
}
