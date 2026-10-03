import { BookOpen, ChevronDown, SearchX } from "lucide-react";
import type { FaqGrupo } from "../types";

interface FaqSectionProps {
  grupos: FaqGrupo[];
  abertos: Set<string>;
  onAlternar: (id: string) => void;
  onExpandirTodos: () => void;
  onRecolher: () => void;
}

export default function FaqSection({ grupos, abertos, onAlternar, onExpandirTodos, onRecolher }: FaqSectionProps) {
  return (
    <section aria-labelledby="faq-titulo" className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
      <header className="mb-5 flex flex-col gap-3 border-b border-gray-100 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="faq-titulo" className="flex items-center gap-2 text-lg font-bold text-gray-900">
            <BookOpen className="h-5 w-5 text-marca" aria-hidden />
            FAQ Operacional da Balança &amp; Descarga
          </h2>
          <p className="text-xs text-gray-500">Respostas detalhadas de principais situações enfrentadas na portaria rodoviária.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onExpandirTodos} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50">
            Expandir Todos
          </button>
          <button type="button" onClick={onRecolher} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50">
            Recolher
          </button>
        </div>
      </header>

      {grupos.length === 0 ? (
        <p className="flex items-center justify-center gap-2 py-8 text-sm text-gray-500">
          <SearchX className="h-4 w-4" aria-hidden /> Nenhuma dúvida encontrada. Tente outro termo ou abra um chamado abaixo.
        </p>
      ) : (
        <div className="space-y-6">
          {grupos.map((grupo, i) => (
            <div key={grupo.id}>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-marca">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-marca text-[11px] text-white">{i + 1}</span>
                {grupo.titulo}
              </h3>
              <ul className="divide-y divide-gray-100 rounded-lg border border-gray-100">
                {grupo.itens.map((item) => {
                  const aberto = abertos.has(item.id);
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => onAlternar(item.id)}
                        aria-expanded={aberto}
                        aria-controls={`faq-${item.id}`}
                        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm text-gray-800 hover:bg-gray-50"
                      >
                        {item.pergunta}
                        <ChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${aberto ? "rotate-180" : ""}`} aria-hidden />
                      </button>
                      {aberto && (
                        <p id={`faq-${item.id}`} className="border-l-2 border-marca bg-emerald-50/40 px-4 py-3 text-sm text-gray-600">
                          {item.resposta}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
