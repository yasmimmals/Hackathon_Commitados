import { CalendarDays, Clock, CloudRain, LoaderCircle } from "lucide-react";
import Campo, { CLASSE_CAMPO, tomCampo } from "@/shared/components/ui/Campo";
import type { SlotDisponibilidade } from "@/shared/services";
import { HORARIOS } from "../constants";
import type { ErrosEntrega, Horario, NovaEntrega } from "../types";
import { dataMaxima, dataMinima, formatarData, vagasNoHorario } from "../utils/agendamento";
import Secao from "./Secao";

type EscolhaHorarioProps = {
  data: string;
  horario: NovaEntrega["horario"];
  acondicionamento: NovaEntrega["acondicionamento"];
  disponibilidade: { slots: SlotDisponibilidade[]; carregando: boolean; erro?: string };
  erros: Pick<ErrosEntrega, "data" | "horario">;
  onData: (data: string) => void;
  onHorario: (horario: Horario) => void;
};

export default function EscolhaHorario({
  data, horario, acondicionamento, disponibilidade, erros, onData, onHorario,
}: EscolhaHorarioProps) {
  const { slots, carregando, erro: erroDisponibilidade } = disponibilidade;
  const vagas = HORARIOS.map((h) => ({
    horario: h,
    vagas: data ? vagasNoHorario(slots, data, h, acondicionamento) : 0,
    chuva: slots.find((s) => s.horario === h)?.prob_chuva ?? null,
  }));
  const semVagas = data && !carregando && !erroDisponibilidade && vagas.every((v) => v.vagas === 0);

  return (
    <Secao numero={1} titulo="Data e horário" descricao="Janelas de descarga: 08h, 10h, 13h e 15h, de segunda a sexta.">
      <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
        <Campo id="data" rotulo="Data da entrega" icone={CalendarDays} erro={erros.data}>
          <input
            id="data"
            type="date"
            min={dataMinima()}
            max={dataMaxima()}
            value={data}
            onChange={(e) => onData(e.target.value)}
            aria-invalid={!!erros.data}
            aria-describedby={erros.data ? "data-erro" : undefined}
            className={`${CLASSE_CAMPO} ${tomCampo(erros.data)}`}
          />
        </Campo>

        <fieldset
          id="horario"
          tabIndex={-1}
          aria-invalid={!!erros.horario}
          aria-describedby={erros.horario ? "horario-erro" : undefined}
          className="focus:outline-none"
        >
          <legend className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-gray-700">
            <Clock className="h-3.5 w-3.5 text-marca" aria-hidden /> Horário
            {data && <span className="font-normal text-gray-500">• {formatarData(data)}</span>}
          </legend>

          {!data ? (
            <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-2.5 text-xs text-gray-500">
              Escolha uma data para ver os horários disponíveis.
            </p>
          ) : carregando ? (
            <p role="status" className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2.5 text-xs text-gray-500">
              <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden /> Consultando vagas…
            </p>
          ) : erroDisponibilidade ? (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2.5 text-xs text-red-700">
              Não foi possível consultar as vagas: {erroDisponibilidade}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {vagas.map(({ horario: h, vagas: livres, chuva }) => {
                const ativo = horario === h;
                const disponivel = livres > 0;
                return (
                  <label
                    key={h}
                    className={[
                      "flex flex-col items-center rounded-lg border px-2 py-2 text-center transition-colors",
                      "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-marca",
                      ativo
                        ? "border-marca bg-emerald-50 ring-1 ring-marca"
                        : disponivel
                          ? "cursor-pointer border-gray-200 hover:border-emerald-300 hover:bg-gray-50"
                          : "cursor-not-allowed border-gray-200 bg-gray-50 opacity-60",
                    ].join(" ")}
                  >
                    <input
                      type="radio"
                      name="horario"
                      value={h}
                      checked={ativo}
                      disabled={!disponivel}
                      onChange={() => onHorario(h)}
                      className="sr-only"
                    />
                    <span className={`text-sm font-bold ${ativo ? "text-marca" : "text-gray-900"}`}>{h.replace(":00", "h")}</span>
                    <span className={`text-[11px] ${disponivel ? "text-emerald-700" : "text-gray-500"}`}>
                      {disponivel ? `${livres} ${livres === 1 ? "vaga" : "vagas"}` : "Esgotado"}
                    </span>
                    {chuva !== null && (
                      <span className="mt-0.5 flex items-center gap-1 text-[10px] text-sky-700">
                        <CloudRain className="h-3 w-3" aria-hidden /> {chuva}% chuva
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          )}

          {semVagas && <p className="mt-1 text-xs text-amber-700">Nenhuma janela livre nesta data. Escolha outro dia.</p>}
          {erros.horario && <p id="horario-erro" className="mt-1 text-xs text-red-600">{erros.horario}</p>}
        </fieldset>
      </div>
    </Secao>
  );
}
