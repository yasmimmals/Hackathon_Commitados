import { useState, type FormEvent } from "react";
import { CloudRain, LoaderCircle } from "lucide-react";
import { reagendarPorChuva, type Agendamento, type Horario } from "@/shared/services";
import { dataBr } from "@/shared/utils/formatacao";
import { JANELAS } from "@/shared/utils/janelas";

type Props = {
  agendamento: Agendamento;
  enviando: boolean;
  executar: (acao: () => Promise<Agendamento>, sucesso: (novo: Agendamento) => string) => Promise<void>;
  aoCancelar: () => void;
};

const CLASSE_CAMPO =
  "mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:border-site-azul focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-azul/30";
const CLASSE_BOTAO =
  "inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

export default function ReagendarChuva({ agendamento: ag, enviando, executar, aoCancelar }: Props) {
  const [data, setData] = useState("");
  const [horario, setHorario] = useState<Horario>("08:00");

  const enviar = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    executar(
      () => reagendarPorChuva(ag.id, { nova_data: data || null, novo_horario: horario }),
      (novo) => `#AG-${ag.id} reagendado por chuva para ${dataBr(novo.data)} às ${novo.horario}h (novo #AG-${novo.id}), com prioridade na fila.`,
    );
  };

  return (
    <form noValidate onSubmit={enviar} className="mt-3 space-y-3 rounded-xl bg-sky-50 p-3">
      <p className="flex items-start gap-2 text-xs text-sky-900">
        <CloudRain className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <span>
          Caso fortuito de natureza: o caminhão volta em outro dia útil <strong>com prioridade na fila</strong>, na frente de quem já
          estiver esperando, e não conta no limite de caminhões do horário. A aprovação do Compras e o destino são mantidos.
        </span>
      </p>
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className="text-xs font-semibold text-gray-700">
          Nova data
          <input type="date" value={data} onChange={(e) => setData(e.target.value)} className={CLASSE_CAMPO} />
          <span className="mt-1 block text-[11px] font-normal text-gray-500">
            Em branco = próximo dia útil (sem sábado, domingo e feriado)
          </span>
        </label>
        <label className="text-xs font-semibold text-gray-700">
          Horário
          <select value={horario} onChange={(e) => setHorario(e.target.value as Horario)} className={CLASSE_CAMPO}>
            {JANELAS.map((j) => (
              <option key={j.horario} value={j.horario}>{j.horario}h</option>
            ))}
          </select>
          <span className="mt-1 block text-[11px] font-normal text-transparent" aria-hidden>.</span>
        </label>
        <div className="flex gap-2 sm:pb-5">
          <button type="button" onClick={aoCancelar} className={`${CLASSE_BOTAO} text-gray-700 hover:bg-gray-200 focus-visible:ring-gray-400`}>
            Voltar
          </button>
          <button type="submit" disabled={enviando} className={`${CLASSE_BOTAO} bg-site-azul text-white hover:bg-site-azul-escuro focus-visible:ring-site-azul`}>
            {enviando ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <CloudRain className="h-3.5 w-3.5" aria-hidden />}
            Confirmar reagendamento
          </button>
        </div>
      </div>
    </form>
  );
}
