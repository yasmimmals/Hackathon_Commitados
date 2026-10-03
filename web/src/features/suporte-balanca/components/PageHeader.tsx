import type { FormEvent } from "react";
import { HelpCircle, MessageSquarePlus, Search, ShieldCheck } from "lucide-react";
import { TAGS_RAPIDAS } from "../data/faq";

interface PageHeaderProps {
  busca: string;
  onBusca: (valor: string) => void;
  onAbrirChamado: () => void;
}

export default function PageHeader({ busca, onBusca, onAbrirChamado }: PageHeaderProps) {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    document.getElementById("faq-titulo")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-marca">
            Terminal Central Franca/SP • Logística &amp; Recebimento
          </p>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-gray-900 md:text-3xl">
            <HelpCircle className="h-6 w-6 text-marca" aria-hidden />
            Dúvidas Frequentes &amp; Suporte Operacional da Balança
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Orientações para motoristas, transportadoras e fornecedores sobre pesagem, triagem de pátio e
            agendamentos operacionais na COCAPEC.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-marca ring-1 ring-emerald-200">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> Portaria Online
          </span>
          <button
            type="button"
            onClick={onAbrirChamado}
            className="inline-flex items-center gap-1.5 rounded-full bg-marca px-3 py-1.5 text-xs font-semibold text-white hover:bg-marca-escuro"
          >
            <MessageSquarePlus className="h-3.5 w-3.5" aria-hidden /> Abrir Chamado
          </button>
        </div>
      </div>

      <form role="search" onSubmit={handleSubmit} className="mt-5 flex gap-2">
        <label htmlFor="faq-busca" className="sr-only">Pesquisar dúvidas</label>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden />
          <input
            id="faq-busca"
            type="search"
            value={busca}
            onChange={(e) => onBusca(e.target.value)}
            placeholder="O que você precisa saber? (ex: tolerância de pesagem, cancelamento, NF-e, chuva...)"
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-marca focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />
        </div>
        <button type="submit" className="rounded-lg bg-marca px-5 text-sm font-semibold text-white hover:bg-marca-escuro">
          Buscar
        </button>
      </form>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-gray-500">Buscas rápidas:</span>
        {TAGS_RAPIDAS.map((tag) => (
          <button
            key={tag.rotulo}
            type="button"
            onClick={() => onBusca(tag.termo)}
            className="rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-marca ring-1 ring-emerald-100 hover:bg-emerald-100"
          >
            {tag.rotulo}
          </button>
        ))}
      </div>
    </section>
  );
}
