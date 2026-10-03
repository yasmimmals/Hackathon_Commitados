import type { FormEvent } from "react";
import {
  Ban, Boxes, Car, FileText, LoaderCircle, MessageCircle, Package,
  Upload, User, UserCheck, Warehouse as WarehouseIcon, Zap, type LucideIcon,
} from "lucide-react";
import Campo, { CLASSE_CAMPO, tomCampo } from "@/shared/components/ui/Campo";
import { mascararPlaca } from "@/shared/utils/placa";
import type { Packaging, Warehouse, WarehouseId, YardEntry, YardEntryErrors } from "../types";
import { mascararTelefone } from "../utils/entradaPatio";

const PACKAGING: { key: Packaging; label: string; icon: LucideIcon }[] = [
  { key: "paletizado", label: "Paletizado", icon: Package },
  { key: "bigbag",     label: "Big Bag",    icon: Boxes },
  { key: "batido",     label: "Batido",     icon: Ban },
];

interface YardEntryFormProps {
  value: YardEntry;
  errors: YardEntryErrors;
  warehouses: Warehouse[];
  lendoNota: boolean;
  enviando: boolean;
  onSelectNota: (arquivo: File | null) => void;
  onChange: (patch: Partial<YardEntry>) => void;
  onSelectWarehouse: (id: WarehouseId) => void;
  onSelectPackaging: (key: Packaging) => void;
  onReceipt: () => void;
  onSubmit: () => void;
}

export default function YardEntryForm({
  value, errors, warehouses, lendoNota, enviando, onSelectNota, onChange, onSelectWarehouse, onSelectPackaging, onReceipt, onSubmit,
}: YardEntryFormProps) {
  const packagingAvailable = (key: Packaging) => warehouses.some((w) => w.slots > 0 && w.accepts.includes(key));

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <section aria-labelledby="formulario-titulo" className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
      <header className="mb-5 flex items-center justify-between gap-2 border-b border-gray-100 pb-4">
        <h2 id="formulario-titulo" className="flex items-center gap-2 text-lg font-bold text-gray-900">
          <Zap className="h-5 w-5 text-marca" aria-hidden />
          Formulário Ágil de Entrada de Pátio
        </h2>
        <span className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Triagem expressa</span>
      </header>

      <form noValidate onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-xl bg-sky-50/70 p-4 ring-1 ring-sky-100">
          <div className="mb-2 flex items-center justify-between gap-3">
            <label htmlFor="notaFiscal" className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
              <FileText className="h-4 w-4 text-sky-700" aria-hidden /> Nota Fiscal (XML ou PDF)
            </label>
            <span className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Obrigatório</span>
          </div>

          <label
            className={`group flex cursor-pointer items-center justify-between gap-3 rounded-lg border bg-white px-3 py-2.5 shadow-sm transition hover:border-marca hover:bg-emerald-50 focus-within:border-marca focus-within:ring-2 focus-within:ring-emerald-100 ${
              errors.notaFiscal ? "border-red-300" : "border-gray-200"
            }`}
          >
            <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Upload className="h-4 w-4 text-marca" aria-hidden />
              {value.notaFiscal ? "Trocar arquivo" : "Escolher arquivo"}
            </span>
            <span className="rounded-lg bg-marca px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition group-hover:bg-marca-escuro">
              Selecionar
            </span>
            <input
              id="notaFiscal"
              type="file"
              accept=".pdf,.xml,application/pdf,application/xml,text/xml"
              aria-invalid={!!errors.notaFiscal}
              aria-describedby={errors.notaFiscal ? "notaFiscal-erro" : "notaFiscal-situacao"}
              className="sr-only"
              onChange={(e) => {
                onSelectNota(e.target.files?.[0] ?? null);
                e.target.value = ""; // permite escolher o mesmo arquivo de novo
              }}
            />
          </label>

          <p id="notaFiscal-situacao" role="status" className="mt-2 flex items-center gap-1.5 truncate text-xs text-gray-600">
            {lendoNota ? (
              <><LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden /> Lendo a nota fiscal…</>
            ) : value.notaFiscal ? (
              <>NF-e {value.notaFiscal.numero ?? "s/ nº"} • {value.notaFiscal.fornecedor.nome}</>
            ) : (
              "Nenhum arquivo selecionado"
            )}
          </p>
          {value.notaFiscal && (
            <p className="mt-1 break-all font-mono text-[11px] tracking-wider text-gray-500">
              Chave {value.notaFiscal.chave}
            </p>
          )}
          {errors.notaFiscal && <p id="notaFiscal-erro" className="mt-1 text-xs text-red-600">{errors.notaFiscal}</p>}
        </div>

        {/* Veículo e motorista */}
        <div className="grid gap-4 md:grid-cols-3">
          <Campo id="plate" rotulo="Placa do Veículo" icone={Car} erro={errors.plate}>
            <input
              id="plate"
              autoComplete="off"
              value={value.plate}
              onChange={(e) => onChange({ plate: mascararPlaca(e.target.value) })}
              placeholder="BRA2E19"
              aria-invalid={!!errors.plate}
              aria-describedby={errors.plate ? "plate-erro" : undefined}
              className={`${CLASSE_CAMPO} ${tomCampo(errors.plate)} font-mono uppercase tracking-widest`}
            />
          </Campo>
          <Campo id="driver" rotulo="Nome do Motorista" icone={User} erro={errors.driver}>
            <input
              id="driver"
              autoComplete="name"
              value={value.driver}
              onChange={(e) => onChange({ driver: e.target.value })}
              placeholder="Nome do motorista"
              aria-invalid={!!errors.driver}
              aria-describedby={errors.driver ? "driver-erro" : undefined}
              className={`${CLASSE_CAMPO} ${tomCampo(errors.driver)}`}
            />
          </Campo>
          <Campo id="whatsapp" rotulo="WhatsApp (Chamada)" icone={MessageCircle} erro={errors.whatsapp}>
            <input
              id="whatsapp"
              type="tel"
              autoComplete="tel"
              value={value.whatsapp}
              onChange={(e) => onChange({ whatsapp: mascararTelefone(e.target.value) })}
              placeholder="(16) 99876-5432"
              aria-invalid={!!errors.whatsapp}
              aria-describedby={errors.whatsapp ? "whatsapp-erro" : undefined}
              className={`${CLASSE_CAMPO} ${tomCampo(errors.whatsapp)}`}
            />
          </Campo>
        </div>

        {/* Acondicionamento e armazém */}
        <div className="grid gap-4 md:grid-cols-2">
          <fieldset>
            <legend className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-gray-700">
              <Package className="h-3.5 w-3.5 text-marca" aria-hidden /> Tipo de Acondicionamento
            </legend>
            <div className="grid grid-cols-3 gap-2">
              {PACKAGING.map(({ key, label, icon: Icon }) => {
                const enabled = packagingAvailable(key);
                const active = value.packaging === key;
                return (
                  <label
                    key={key}
                    className={[
                      "flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-semibold transition-colors",
                      "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-marca",
                      active
                        ? "border-marca bg-emerald-50 text-marca"
                        : enabled
                          ? "cursor-pointer border-gray-200 text-gray-700 hover:bg-gray-50"
                          : "cursor-not-allowed border-gray-200 text-gray-400",
                    ].join(" ")}
                    title={enabled ? undefined : "Nenhum armazém com vaga recebe este tipo agora"}
                  >
                    <input
                      type="radio"
                      name="packaging"
                      value={key}
                      checked={active}
                      disabled={!enabled}
                      onChange={() => onSelectPackaging(key)}
                      className="sr-only"
                    />
                    <Icon className="h-4 w-4" aria-hidden /> {label}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <Campo id="warehouse" rotulo="Armazém Sugerido" icone={WarehouseIcon}>
            <select
              id="warehouse"
              value={value.warehouse}
              onChange={(e) => onSelectWarehouse(e.target.value as WarehouseId)}
              className={`${CLASSE_CAMPO} ${tomCampo()} bg-white`}
            >
              {warehouses.map((w) => (
                <option key={w.id} value={w.id} disabled={w.slots === 0}>
                  Armazém de {w.name} ({w.dock}){w.slots === 0 ? " — indisponível" : ""}
                </option>
              ))}
            </select>
          </Campo>
        </div>

        {/* Declaração */}
        <div>
          <label className="flex items-start gap-2 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={value.acknowledged}
              onChange={(e) => onChange({ acknowledged: e.target.checked })}
              aria-invalid={!!errors.acknowledged}
              aria-describedby={errors.acknowledged ? "acknowledged-erro" : undefined}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 accent-marca"
            />
            Declaro estar ciente de que agendamentos programados têm prioridade sobre encaixes de pátio.
          </label>
          {errors.acknowledged && <p id="acknowledged-erro" className="mt-1 text-xs text-red-600">{errors.acknowledged}</p>}
        </div>

        {/* Rodapé */}
        <footer className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onReceipt}
            className="self-start text-xs font-medium text-gray-600 underline underline-offset-2 hover:text-marca focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca sm:self-auto"
          >
            Emitir comprovante de não recebimento
          </button>
          <button
            type="submit"
            disabled={enviando}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-marca px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-marca-escuro focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
          >
            {enviando ? (
              <><LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> Registrando…</>
            ) : (
              <><UserCheck className="h-4 w-4" aria-hidden /> Confirmar Entrada na Fila</>
            )}
          </button>
        </footer>
      </form>
    </section>
  );
}
