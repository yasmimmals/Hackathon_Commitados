import { type FormEvent, useState } from "react";
import {
  Ban, Boxes, Car, FileText, MessageCircle, Package, ScanBarcode,
  Upload, User, UserCheck, Warehouse as WarehouseIcon, Zap, type LucideIcon,
} from "lucide-react";
import Campo, { CLASSE_CAMPO, tomCampo } from "@/shared/components/ui/Campo";
import { mascararPlaca } from "@/shared/utils/placa";
import type { Packaging, Warehouse, WarehouseId, YardEntry, YardEntryErrors } from "../types";
import { mascararChaveNfe, mascararTelefone } from "../utils/entradaPatio";

const PACKAGING: { key: Packaging; label: string; icon: LucideIcon }[] = [
  { key: "paletizado", label: "Paletizado", icon: Package },
  { key: "bigbag",     label: "Big Bag",    icon: Boxes },
  { key: "batido",     label: "Batido",     icon: Ban },
];

const NENHUM_ARQUIVO = "Nenhum arquivo selecionado";

interface YardEntryFormProps {
  value: YardEntry;
  errors: YardEntryErrors;
  warehouses: Warehouse[];
  onChange: (patch: Partial<YardEntry>) => void;
  onSelectWarehouse: (id: WarehouseId) => void;
  onSelectPackaging: (key: Packaging) => void;
  onSimulateScan: () => void;
  onReceipt: () => void;
  onSubmit: () => void;
}

export default function YardEntryForm({
  value, errors, warehouses, onChange, onSelectWarehouse, onSelectPackaging, onSimulateScan, onReceipt, onSubmit,
}: YardEntryFormProps) {
  const [selectedFileName, setSelectedFileName] = useState(NENHUM_ARQUIVO);

  const packagingAvailable = (key: Packaging) => warehouses.some((w) => w.slots > 0 && w.accepts.includes(key));

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <section aria-labelledby="formulario-titulo" className="mx-auto max-w-4xl rounded-xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
      <header className="mb-5 flex items-center justify-between gap-2 border-b border-gray-100 pb-4">
        <h2 id="formulario-titulo" className="flex items-center gap-2 text-lg font-bold text-gray-900">
          <Zap className="h-5 w-5 text-marca" aria-hidden />
          Formulário Ágil de Entrada de Pátio
        </h2>
        <span className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Triagem expressa</span>
      </header>

      <form noValidate onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <label htmlFor="document-upload" className="flex items-center gap-2 text-sm font-semibold text-gray-800">
              <FileText className="h-4 w-4 text-marca" aria-hidden />
              Anexar documento
            </label>
            <span className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Opcional</span>
          </div>

          <label
            htmlFor="document-upload"
            className="group flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5 shadow-sm transition hover:border-marca hover:bg-emerald-50 focus-within:border-marca focus-within:ring-2 focus-within:ring-emerald-100"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Upload className="h-4 w-4 text-marca" aria-hidden />
              Escolher arquivo
            </span>
            <span className="rounded-lg bg-marca px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition group-hover:bg-marca-escuro">
              Selecionar
            </span>
            <input
              id="document-upload"
              type="file"
              className="sr-only"
              onChange={(e) => setSelectedFileName(e.target.files?.[0]?.name ?? NENHUM_ARQUIVO)}
            />
          </label>

          <p className="mt-2 truncate text-xs text-gray-500">{selectedFileName}</p>
        </div>

        <div className="rounded-xl bg-sky-50/70 p-4 ring-1 ring-sky-100">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="nfeKey" className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
              <FileText className="h-4 w-4 text-sky-700" aria-hidden /> Chave de Acesso da NF-e (44 Dígitos)
            </label>
            <button
              type="button"
              onClick={onSimulateScan}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-marca hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca"
            >
              <ScanBarcode className="h-4 w-4" aria-hidden /> Simular / Ler Código
            </button>
          </div>
          <div className="relative">
            <input
              id="nfeKey"
              inputMode="numeric"
              autoComplete="off"
              value={value.nfeKey}
              onChange={(e) => onChange({ nfeKey: mascararChaveNfe(e.target.value) })}
              placeholder="Digite ou bipe os 44 dígitos da NF-e"
              aria-invalid={!!errors.nfeKey}
              aria-describedby={errors.nfeKey ? "nfeKey-erro" : "nfeKey-contador"}
              className={`${CLASSE_CAMPO} ${tomCampo(errors.nfeKey)} bg-white py-3 pr-14 font-mono tracking-wider`}
            />
            <span id="nfeKey-contador" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">
              {value.nfeKey.length}/44
            </span>
          </div>
          {errors.nfeKey && <p id="nfeKey-erro" className="mt-1 text-xs text-red-600">{errors.nfeKey}</p>}
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
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-marca px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-marca-escuro focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca focus-visible:ring-offset-2"
          >
            <UserCheck className="h-4 w-4" aria-hidden /> Confirmar Entrada na Fila
          </button>
        </footer>
      </form>
    </section>
  );
}
