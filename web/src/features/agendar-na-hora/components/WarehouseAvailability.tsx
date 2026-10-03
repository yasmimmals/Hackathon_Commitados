import { Ban, FlaskConical, Radio, Tractor, Wheat, type LucideIcon } from "lucide-react";
import type { Warehouse, WarehouseId } from "../types";

const ICONS = {
  tractor: Tractor,
  flask: FlaskConical,
  wheat: Wheat,
} satisfies Record<Warehouse["icon"], LucideIcon>;

interface WarehouseAvailabilityProps {
  warehouses: Warehouse[];
  selected: WarehouseId;
  onSelect: (id: WarehouseId) => void;
}

export default function WarehouseAvailability({ warehouses, selected, onSelect }: WarehouseAvailabilityProps) {
  return (
    <section aria-labelledby="disponibilidade-titulo" className="mb-6">
      <header className="mb-3 flex items-center justify-between gap-2">
        <h2 id="disponibilidade-titulo" className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-600">
          <Radio className="h-4 w-4 text-marca" aria-hidden />
          Disponibilidade instantânea por armazém
        </h2>
        <span className="text-xs font-medium text-marca">Atualizado em tempo real</span>
      </header>

      <div role="radiogroup" aria-label="Escolher armazém" className="grid gap-3 md:grid-cols-3">
        {warehouses.map((w) => {
          const Icon = ICONS[w.icon];
          const available = w.slots > 0;
          const isSelected = w.id === selected;
          return (
            <button
              key={w.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={!available}
              onClick={() => onSelect(w.id)}
              className={[
                "flex items-center gap-3 rounded-xl border bg-white p-4 text-left shadow-sm transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca focus-visible:ring-offset-2",
                isSelected ? "border-marca ring-1 ring-marca" : "border-gray-200 hover:border-emerald-300",
                available ? "" : "cursor-not-allowed opacity-70",
              ].join(" ")}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                  available ? "bg-emerald-50 text-marca" : "bg-gray-100 text-gray-400"
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-gray-900">{w.name}</span>
                <span className="block text-xs text-gray-500">{w.detail}</span>
              </span>

              {available ? (
                <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                  {w.slots} {w.slots === 1 ? "Vaga Disponível" : "Vagas Disponíveis"}
                </span>
              ) : (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700 ring-1 ring-red-200">
                  <Ban className="h-3 w-3" aria-hidden /> {w.unavailableText ?? "Indisponível"}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
