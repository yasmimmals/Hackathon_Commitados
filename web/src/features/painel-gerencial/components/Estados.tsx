import { useState } from "react";
import { Info, LoaderCircle, ServerCrash } from "lucide-react";
import { COR, ROTULO_SITUACAO } from "../utils/carga";

export function Carregando({ texto = "Calculando…" }: { texto?: string }) {
  return (
    <p role="status" className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
      <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> {texto}
    </p>
  );
}

export function Erro({ mensagem }: { mensagem: string }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-2 rounded-3xl bg-white px-4 py-10 text-center shadow-sm">
      <ServerCrash className="h-6 w-6 text-gray-400" aria-hidden />
      <p className="text-sm text-gray-700">Não foi possível carregar os indicadores.</p>
      <p className="text-xs text-gray-500">{mensagem}</p>
    </div>
  );
}

export function Kpi({ rotulo, valor, nota, destaque }: { rotulo: string; valor: string; nota?: string; destaque?: boolean }) {
  return (
    <div className={`rounded-2xl px-4 py-3 shadow-sm ${destaque ? "bg-site-azul text-white" : "bg-white"}`}>
      <dt className={`text-xs font-semibold ${destaque ? "text-white/80" : "text-gray-500"}`}>{rotulo}</dt>
      <dd className={`text-xl font-semibold sm:text-2xl ${destaque ? "text-white" : "text-gray-900"}`}>{valor}</dd>
      {nota && <dd className={`text-[11px] ${destaque ? "text-white/80" : "text-gray-500"}`}>{nota}</dd>}
    </div>
  );
}

/** Explica de onde vem cada número: o júri e o gestor precisam saber o que é estimativa. */
export function Premissas({ itens, titulo = "Como este número é calculado" }: { itens: string[]; titulo?: string }) {
  const [aberto, setAberto] = useState(false);
  return (
    <div className="rounded-2xl bg-sky-50 px-4 py-3 text-xs text-sky-900 ring-1 ring-sky-100">
      <button type="button" onClick={() => setAberto(!aberto)} aria-expanded={aberto}
        className="flex w-full items-center gap-2 text-left font-semibold">
        <Info className="h-4 w-4 shrink-0" aria-hidden /> {titulo}
        <span className="ml-auto text-sky-700">{aberto ? "ocultar" : "ver"}</span>
      </button>
      {aberto && (
        <ul className="mt-2 list-disc space-y-1 pl-6">
          {itens.map((p) => <li key={p}>{p}</li>)}
        </ul>
      )}
    </div>
  );
}

export function LegendaSituacao({ situacoes }: { situacoes: string[] }) {
  return (
    <span className="flex flex-wrap gap-3 text-xs text-gray-700">
      {situacoes.map((s) => (
        <span key={s} className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm" style={{ background: COR[s as keyof typeof COR] }} aria-hidden />
          {ROTULO_SITUACAO[s] ?? s}
        </span>
      ))}
    </span>
  );
}

export function SeloSituacao({ situacao }: { situacao?: string | null }) {
  if (!situacao) return <span className="text-gray-400">—</span>;
  return (
    <span className="inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold text-white"
      style={{ background: COR[situacao as keyof typeof COR] ?? COR.NEUTRO }}>
      {ROTULO_SITUACAO[situacao] ?? situacao}
    </span>
  );
}
