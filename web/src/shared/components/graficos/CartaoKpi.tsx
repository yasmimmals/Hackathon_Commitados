import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { TrendingDown, TrendingUp } from "lucide-react";
import { useCores } from "./cores";

/** Número principal + variação + mini-gráfico de tendência (sparkline). */
export default function CartaoKpi({ rotulo, valor, nota, tendencia, variacao, destaque, corTendencia }: {
  rotulo: string;
  valor: string;
  nota?: string;
  tendencia?: number[];
  variacao?: { texto: string; boa: boolean } | null;
  destaque?: boolean;
  corTendencia?: string;
}) {
  const c = useCores();
  const cor = corTendencia ?? (destaque ? "#ffffff" : c.series[0]);
  const dados = (tendencia ?? []).map((v, i) => ({ i, v }));
  return (
    <div className={`flex flex-col overflow-hidden rounded-2xl shadow-sm ${destaque ? "bg-site-azul text-white" : "bg-white"}`}>
      <div className="px-4 pt-3">
        <dt className={`text-xs font-semibold ${destaque ? "text-white/85" : "text-gray-500"}`}>{rotulo}</dt>
        <dd className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
          <span className={`text-xl font-bold tabular-nums sm:text-2xl ${destaque ? "text-white" : "text-gray-900"}`}>{valor}</span>
          {variacao && (
            <span className={`flex items-center gap-0.5 text-xs font-semibold ${
              destaque ? "text-white" : variacao.boa ? "text-emerald-700" : "text-red-700"}`}>
              {variacao.boa ? <TrendingDown className="h-3.5 w-3.5" aria-hidden /> : <TrendingUp className="h-3.5 w-3.5" aria-hidden />}
              {variacao.texto}
            </span>
          )}
        </dd>
        {nota && <dd className={`text-[11px] leading-snug ${destaque ? "text-white/85" : "text-gray-500"}`}>{nota}</dd>}
      </div>
      {dados.length > 1 ? (
        <div className="mt-auto h-12 w-full" aria-hidden>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dados} margin={{ top: 6, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={`kpi-${rotulo.replace(/\W/g, "")}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={cor} stopOpacity={0.45} />
                  <stop offset="100%" stopColor={cor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke={cor} strokeWidth={2}
                fill={`url(#kpi-${rotulo.replace(/\W/g, "")})`} isAnimationActive={c.animar} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-3" />
      )}
    </div>
  );
}
