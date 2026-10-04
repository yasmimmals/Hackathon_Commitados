import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { AlarmClock, LoaderCircle, X } from "lucide-react";
import Campo, { CLASSE_CAMPO, tomCampo } from "@/shared/components/ui/Campo";
import { duracaoMin } from "@/shared/utils/formatacao";

type Props = {
  codigo: string;
  fornecedor?: string;
  janela?: string;
  aoFechar: () => void;
  aoConfirmar: (dados: { minutos: number; motivo?: string }) => Promise<void>;
};

const RAPIDOS = [15, 30, 45, 60, 90, 120];

const porExtenso = (total: number) => {
  const h = Math.floor(total / 60);
  const m = total % 60;
  const partes = [h && `${h} ${h === 1 ? "hora" : "horas"}`, m && `${m} ${m === 1 ? "minuto" : "minutos"}`].filter(Boolean);
  return partes.join(" e ");
};

export default function ModalAtraso({ codigo, fornecedor, janela, aoFechar, aoConfirmar }: Props) {
  const [horas, setHoras] = useState("0");
  const [minutosParte, setMinutosParte] = useState("30");
  const [motivo, setMotivo] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const painel = useRef<HTMLDivElement>(null);
  const tituloId = useId();

  useEffect(() => {
    const el = painel.current;
    el?.querySelector<HTMLElement>("button[aria-pressed='true'], input")?.focus();
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !enviando) aoFechar();
      if (e.key !== "Tab" || !el) return;
      const focaveis = [...el.querySelectorAll<HTMLElement>("button:not([disabled]), input, textarea")];
      const [primeiro, ultimo] = [focaveis[0], focaveis[focaveis.length - 1]];
      if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
    };
    document.addEventListener("keydown", tecla);
    return () => document.removeEventListener("keydown", tecla);
  }, [aoFechar, enviando]);

  const h = Number(horas || 0);
  const m = Number(minutosParte || 0);
  const camposValidos = Number.isInteger(h) && Number.isInteger(m) && h >= 0 && m >= 0 && m <= 59;
  const total = camposValidos ? h * 60 + m : NaN;
  const escolher = (valor: number) => {
    setHoras(String(Math.floor(valor / 60)));
    setMinutosParte(String(valor % 60));
    setErro("");
  };

  const enviar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const valor = total;
    if (!camposValidos) {
      setErro("Use números inteiros: horas a partir de 0 e minutos de 0 a 59.");
      return;
    }
    if (valor < 5 || valor > 600) {
      setErro("O atraso deve ficar entre 5 minutos e 10 horas.");
      return;
    }
    setErro("");
    setEnviando(true);
    try {
      await aoConfirmar({ minutos: valor, motivo: motivo.trim() || undefined });
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : String(falha));
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4" role="presentation">
      <button type="button" aria-label="Fechar" tabIndex={-1} onClick={() => !enviando && aoFechar()}
        className="absolute inset-0 cursor-default bg-[rgba(0,0,0,0.5)] backdrop-blur-[2px]" />

      <div ref={painel} role="dialog" aria-modal="true" aria-labelledby={tituloId}
        className="relative w-full max-w-md rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <header className="flex items-start gap-3 border-b border-gray-200 px-5 py-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800">
            <AlarmClock className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id={tituloId} className="titulo-secao text-lg">Avisar atraso</h2>
            <p className="truncate text-xs text-gray-600">
              {codigo}{fornecedor ? ` • ${fornecedor}` : ""}{janela ? ` • ${janela}` : ""}
            </p>
          </div>
          <button type="button" onClick={aoFechar} disabled={enviando} aria-label="Fechar"
            className="flex h-10 w-10 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 disabled:opacity-50">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </header>

        <form noValidate onSubmit={enviar} className="space-y-4 px-5 py-5">
          <fieldset>
            <legend className="mb-2 text-xs font-semibold text-gray-700">Quanto tempo de atraso?</legend>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {RAPIDOS.map((r) => (
                <button key={r} type="button" aria-pressed={total === r} onClick={() => escolher(r)}
                  className={`min-h-[40px] w-full whitespace-nowrap rounded-full border-2 px-2 text-sm font-semibold transition ${
                    total === r ? "border-site-azul bg-site-azul text-white" : "border-gray-200 text-gray-700 hover:border-gray-400"}`}>
                  {duracaoMin(r)}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset aria-describedby={erro ? "atraso-erro" : "atraso-total"}>
            <legend className="mb-1 text-xs font-semibold text-gray-700">Ou informe outro tempo</legend>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs text-gray-600">
                Horas
                <input type="number" inputMode="numeric" min={0} max={10} step={1}
                  value={horas} onChange={(e) => { setHoras(e.target.value); setErro(""); }}
                  aria-invalid={erro ? true : undefined}
                  className={`${CLASSE_CAMPO} ${tomCampo(erro)} mt-1`} />
              </label>
              <label className="text-xs text-gray-600">
                Minutos
                <input type="number" inputMode="numeric" min={0} max={59} step={5}
                  value={minutosParte} onChange={(e) => { setMinutosParte(e.target.value); setErro(""); }}
                  aria-invalid={erro ? true : undefined}
                  className={`${CLASSE_CAMPO} ${tomCampo(erro)} mt-1`} />
              </label>
            </div>
            {erro ? (
              <p id="atraso-erro" role="alert" className="mt-1 text-xs text-red-600">{erro}</p>
            ) : (
              <p id="atraso-total" aria-live="polite" className="mt-1.5 text-xs text-gray-700">
                Atraso total: <strong>{Number.isNaN(total) || total === 0 ? "—" : `${duracaoMin(total)} (${porExtenso(total)})`}</strong>
              </p>
            )}
          </fieldset>

          <Campo id="atraso-motivo" rotulo="Motivo (opcional)">
            <textarea id="atraso-motivo" rows={3} maxLength={300} value={motivo} onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex.: trânsito na rodovia, fila na balança do fornecedor…"
              className={`${CLASSE_CAMPO} ${tomCampo()} resize-none`} />
          </Campo>

          <p className="rounded-xl bg-sky-50 px-3 py-2 text-xs text-sky-900">
            O aviso aparece na hora para a equipe do armazém, na agenda do dia.
          </p>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={aoFechar} disabled={enviando}
              className="min-h-[44px] rounded-full px-5 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50">
              Cancelar
            </button>
            <button type="submit" disabled={enviando}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-marca px-5 text-sm font-bold text-white hover:bg-marca-escuro disabled:opacity-60">
              {enviando && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />}
              Avisar equipe do armazém
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
