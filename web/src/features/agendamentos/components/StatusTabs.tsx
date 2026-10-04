import type { KeyboardEvent } from "react";
import { Search } from "lucide-react";
import type { Tab, TabKey } from "../types";

interface StatusTabsProps {
  tabs: Tab[];
  active: TabKey;
  onChange: (key: TabKey) => void;
  search: string;
  onSearch: (value: string) => void;
}

export default function StatusTabs({ tabs, active, onChange, search, onSearch }: StatusTabsProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const index = tabs.findIndex((t) => t.key === active);
    const next = {
      ArrowRight: (index + 1) % tabs.length,
      ArrowLeft: (index - 1 + tabs.length) % tabs.length,
      Home: 0,
      End: tabs.length - 1,
    }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    onChange(tabs[next].key);
    document.getElementById(`tab-${tabs[next].key}`)?.focus();
  };

  return (
    <div className="mb-5 flex min-w-0 flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div role="tablist" aria-label="Filtrar agendamentos" onKeyDown={handleKeyDown} className="flex min-w-0 gap-1 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const isActive = tab.key === active;
          return (
            <button
              key={tab.key}
              id={`tab-${tab.key}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls="agendamentos-panel"
              tabIndex={isActive ? 0 : -1}
              onClick={() => onChange(tab.key)}
              className={[
                "inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca",
                isActive
                  ? "bg-emerald-50 text-marca ring-1 ring-emerald-200"
                  : tab.danger
                    ? "text-red-600 hover:bg-red-50"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
              ].join(" ")}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={`text-xs ${isActive ? "text-marca" : tab.danger ? "text-red-500" : "text-gray-400"}`}>
                  ({tab.count})
                </span>
              )}
            </button>
          );
        })}
      </div>

      <label className="relative block md:w-64">
        <span className="sr-only">Buscar agendamento ou NF</span>
        <input
          type="search"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Buscar agendamento ou NF..."
          className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-9 text-sm text-gray-700 placeholder:text-gray-400 focus:border-marca focus:outline-none focus:ring-2 focus:ring-emerald-100"
        />
        <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden />
      </label>
    </div>
  );
}