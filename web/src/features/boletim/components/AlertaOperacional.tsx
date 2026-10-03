import { Link } from "react-router-dom";
import { CalendarClock, TriangleAlert } from "lucide-react";

export default function AlertaOperacional({ hrefReagendar }: { hrefReagendar: string }) {
  return (
    <section
      role="alert"
      className="flex flex-col gap-4 rounded-xl border border-amber-300 bg-amber-50 p-4 md:flex-row md:items-center md:justify-between"
    >
      <div className="flex gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600" aria-hidden>
          <TriangleAlert className="h-5 w-5" />
        </span>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-amber-800">
            Regulamento Operacional COCAPEC • Norma Climática de Segurança
          </p>
          <p className="mt-1 text-sm text-amber-950">
            <strong>Atenção Fornecedor e Transportador:</strong> A descarga de adubos hidrossolúveis e fertilizantes a
            granel na Moega 03 (área descoberta) é pausada automaticamente caso a precipitação local supere{" "}
            <strong>5 mm/h</strong>. Cargas de café ensacado, paletizado e caminhões tipo Sider ou Basculante
            fechado terão prioridade contínua nas docas cobertas das Moegas 01 e 02.
          </p>
        </div>
      </div>
      <Link
        to={hrefReagendar}
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 focus-visible:ring-offset-2"
      >
        <CalendarClock className="h-4 w-4" aria-hidden /> Reagendar janela
      </Link>
    </section>
  );
}
