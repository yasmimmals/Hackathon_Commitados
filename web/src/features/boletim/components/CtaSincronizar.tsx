import { Link } from "react-router-dom";
import { CalendarClock } from "lucide-react";

export default function CtaSincronizar() {
  return (
    <section className="flex flex-col gap-4 rounded-xl bg-[#1e3a8a] p-5 text-white shadow-sm md:flex-row md:items-center md:justify-between">
      <div className="flex gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/15" aria-hidden>
          <CalendarClock className="h-5 w-5" />
        </span>
        <div>
          <p className="font-bold">Deseja sincronizar a entrega de café com a melhor janela de tempo?</p>
          <p className="mt-0.5 text-sm text-blue-100">
            Nosso algoritmo de agendamento reserva automaticamente docas cobertas caso haja risco de chuva no seu horário.
          </p>
        </div>
      </div>
      <Link
        to="/fornecedor/agendar"
        className="inline-flex shrink-0 items-center justify-center rounded-lg bg-marca px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-marca-escuro focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1e3a8a]"
      >
        Agendar Descarga Inteligente
      </Link>
    </section>
  );
}
