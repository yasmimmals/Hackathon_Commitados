import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Plus } from "lucide-react";
import type { EntregaConfirmada } from "../types";
import { ListaResumo } from "./ResumoAgendamento";

type ConfirmacaoAgendamentoProps = {
  confirmada: EntregaConfirmada;
  onNovo: () => void;
};

export default function ConfirmacaoAgendamento({ confirmada, onNovo }: ConfirmacaoAgendamentoProps) {
  const titulo = useRef<HTMLHeadingElement>(null);
  useEffect(() => titulo.current?.focus(), []);

  return (
    <section className="mx-auto max-w-lg rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
      <CheckCircle2 className="mx-auto h-12 w-12 text-marca" aria-hidden />
      <h1 ref={titulo} tabIndex={-1} className="mt-3 text-xl font-extrabold text-gray-900 focus:outline-none">
        Agendamento enviado para validação
      </h1>
      <p className="mt-1 text-sm text-gray-600">
        Protocolo <strong className="font-mono text-gray-900">{confirmada.protocolo}</strong>. Você será avisado quando a
        Mesa de Compras validar a nota fiscal.
      </p>

      <div className="mt-5 rounded-lg bg-gray-50 px-4 py-2 text-left">
        <ListaResumo entrega={confirmada.entrega} />
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Link
          to="/fornecedor/agendamentos"
          className="inline-flex items-center justify-center rounded-lg bg-marca px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-marca-escuro focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca focus-visible:ring-offset-2"
        >
          Ver meus agendamentos
        </Link>
        <button
          type="button"
          onClick={onNovo}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca focus-visible:ring-offset-2"
        >
          <Plus className="h-4 w-4" aria-hidden /> Agendar outra entrega
        </button>
      </div>
    </section>
  );
}
