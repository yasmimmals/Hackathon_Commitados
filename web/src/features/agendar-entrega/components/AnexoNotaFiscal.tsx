import { useEffect, useMemo, useState, type DragEvent } from "react";
import { AlertTriangle, Eye, FileCheck2, LoaderCircle, Trash2, Upload } from "lucide-react";
import type { NotaFiscal } from "@/shared/services";
import { TAMANHO_MAXIMO_NF_MB } from "../constants";
import { formatarTamanho } from "../utils/agendamento";
import Secao from "./Secao";

type AnexoNotaFiscalProps = {
  numero: number;
  arquivo: File | null;
  nota: NotaFiscal | null;
  lendo: boolean;
  erro?: string;
  onSelecionar: (arquivo: File | null) => void;
};

export default function AnexoNotaFiscal({ numero, arquivo, nota, lendo, erro, onSelecionar }: AnexoNotaFiscalProps) {
  const [arrastando, setArrastando] = useState(false);
  const ehPdf = arquivo?.name.toLowerCase().endsWith(".pdf") ?? false;

  const urlPdf = useMemo(() => (arquivo && ehPdf ? URL.createObjectURL(arquivo) : null), [arquivo, ehPdf]);
  useEffect(() => () => {
    if (urlPdf) URL.revokeObjectURL(urlPdf);
  }, [urlPdf]);

  const soltar = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setArrastando(false);
    const solto = e.dataTransfer.files[0];
    if (solto) onSelecionar(solto);
  };

  return (
    <Secao numero={numero} titulo="Nota fiscal" descricao="A Mesa de Compras confere a NF contra o pedido de compra.">
      {arquivo && !erro ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2.5">
          <div className="flex flex-wrap items-center gap-3">
            {lendo ? (
              <LoaderCircle className="h-5 w-5 shrink-0 animate-spin text-marca" aria-hidden />
            ) : (
              <FileCheck2 className="h-5 w-5 shrink-0 text-marca" aria-hidden />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-900">{arquivo.name}</p>
              <p role="status" className="text-[11px] text-gray-500">
                {ehPdf ? "PDF" : "XML"} • {formatarTamanho(arquivo.size)}
                {lendo && " • Lendo a nota…"}
                {nota && ` • NF-e ${nota.numero ?? "s/ nº"} de ${nota.fornecedor.nome}`}
              </p>
            </div>
            {urlPdf && (
              <a
                href={urlPdf}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-marca hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca"
              >
                <Eye className="h-3.5 w-3.5" aria-hidden /> Visualizar
              </a>
            )}
            <button
              type="button"
              onClick={() => onSelecionar(null)}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden /> Remover
            </button>
          </div>
          {nota && nota.alertas.length > 0 && (
            <ul className="mt-2 space-y-1 border-t border-emerald-200 pt-2">
              {nota.alertas.map((alerta) => (
                <li key={alerta} className="flex items-start gap-1.5 text-xs text-amber-800">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden /> {alerta}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <label
          htmlFor="notaFiscal"
          onDragOver={(e) => {
            e.preventDefault();
            setArrastando(true);
          }}
          onDragLeave={() => setArrastando(false)}
          onDrop={soltar}
          className={[
            "flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors",
            "focus-within:ring-2 focus-within:ring-marca",
            erro ? "border-red-300 bg-red-50/40" : arrastando ? "border-marca bg-emerald-50" : "border-gray-200 bg-gray-50 hover:border-marca hover:bg-emerald-50",
          ].join(" ")}
        >
          <Upload className="h-6 w-6 text-marca" aria-hidden />
          <span className="text-sm font-semibold text-gray-800">Arraste a NF aqui ou clique para selecionar</span>
          <span className="text-xs text-gray-500">PDF ou XML • até {TAMANHO_MAXIMO_NF_MB} MB</span>
          <input
            id="notaFiscal"
            type="file"
            accept=".pdf,.xml,application/pdf,application/xml,text/xml"
            aria-invalid={!!erro}
            aria-describedby={erro ? "notaFiscal-erro" : undefined}
            onChange={(e) => {
              onSelecionar(e.target.files?.[0] ?? null);
              e.target.value = ""; 
            }}
            className="sr-only"
          />
        </label>
      )}
      {erro && <p id="notaFiscal-erro" className="mt-1 text-xs text-red-600">{erro}</p>}
    </Secao>
  );
}
