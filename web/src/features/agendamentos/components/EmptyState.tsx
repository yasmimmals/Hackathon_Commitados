export default function EmptyState({ onClearFilters }: { onClearFilters?: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
      <p className="text-sm font-medium text-gray-700">Nenhum agendamento encontrado.</p>
      <p className="mt-1 text-xs text-gray-500">
        Mude o filtro ou busque por número do agendamento, NF, placa ou motorista.
      </p>
      {onClearFilters && (
        <button
          type="button"
          onClick={onClearFilters}
          className="mt-4 rounded-md px-3 py-1.5 text-xs font-semibold text-marca ring-1 ring-emerald-200 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca"
        >
          Limpar filtros
        </button>
      )}
    </div>
  );
}
