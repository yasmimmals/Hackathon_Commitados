import type { FormEvent } from "react";
import { AlarmClock, CalendarClock, Car, FileWarning, Headset, Scale, Send, User, type LucideIcon } from "lucide-react";
import Campo, { CLASSE_CAMPO, tomCampo } from "@/shared/components/ui/Campo";
import { mascararPlaca } from "@/shared/utils/placa";
import type { Assunto, Chamado, ChamadoErros } from "../types";

const ASSUNTOS: { key: Assunto; label: string; icon: LucideIcon }[] = [
  { key: "pesagem",     label: "Dúvida de Pesagem", icon: Scale },
  { key: "agendamento", label: "Agendamento",       icon: CalendarClock },
  { key: "nfe",         label: "NF-e / Divergência", icon: FileWarning },
  { key: "atraso",      label: "Aviso de Atraso",   icon: AlarmClock },
];

interface SupportFormProps {
  value: Chamado;
  errors: ChamadoErros;
  onChange: (patch: Partial<Chamado>) => void;
  onLimpar: () => void;
  onSubmit: () => void;
}

export default function SupportForm({ value, errors, onChange, onLimpar, onSubmit }: SupportFormProps) {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <section id="abrir-chamado" aria-labelledby="chamado-titulo" className="mb-6 scroll-mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
      <header className="mb-5 border-b border-gray-100 pb-4">
        <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-marca">
          <Headset className="h-4 w-4" aria-hidden /> Atendimento direto à balança
        </p>
        <h2 id="chamado-titulo" className="text-lg font-bold text-gray-900">Abertura de Chamado Rápido para Balança</h2>
        <p className="text-xs text-gray-500">
          Precisa de suporte enquanto seu caminhão está a caminho ou aguarda no pátio? Envie os detalhes abaixo para
          acionar os operadores da balança.
        </p>
      </header>

      <form noValidate onSubmit={handleSubmit} className="space-y-4">
        <fieldset>
          <legend className="mb-2 text-xs font-semibold text-gray-700">Selecione o Assunto Operacional *</legend>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {ASSUNTOS.map(({ key, label, icon: Icon }) => {
              const ativo = value.assunto === key;
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={ativo}
                  onClick={() => onChange({ assunto: key })}
                  className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                    ativo ? "border-marca bg-marca text-white" : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden /> {label}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="grid gap-4 md:grid-cols-2">
          <Campo id="motorista" rotulo="Nome do Motorista ou Transportadora *" icone={User} erro={errors.motorista}>
            <input
              id="motorista"
              value={value.motorista}
              onChange={(e) => onChange({ motorista: e.target.value })}
              placeholder="Ex: João Oliveira Expresso Mogiana"
              aria-invalid={!!errors.motorista}
              aria-describedby={errors.motorista ? "motorista-erro" : undefined}
              className={`${CLASSE_CAMPO} ${tomCampo(errors.motorista)}`}
            />
          </Campo>
          <Campo id="placa" rotulo="Placa do Veículo (Cavalo/Carreta) *" icone={Car} erro={errors.placa}>
            <input
              id="placa"
              value={value.placa}
              onChange={(e) => onChange({ placa: mascararPlaca(e.target.value) })}
              placeholder="Ex: BRA2E19"
              aria-invalid={!!errors.placa}
              aria-describedby={errors.placa ? "placa-erro" : undefined}
              className={`${CLASSE_CAMPO} ${tomCampo(errors.placa)} uppercase`}
            />
          </Campo>
        </div>

        <Campo id="codigo" rotulo="Código do Agendamento ou Nº da Nota Fiscal" icone={FileWarning}>
          <input
            id="codigo"
            value={value.codigo}
            onChange={(e) => onChange({ codigo: e.target.value })}
            placeholder="Ex: AG-2026-1899 ou Chave NF-e"
            className={`${CLASSE_CAMPO} ${tomCampo()}`}
          />
        </Campo>

        <Campo id="descricao" rotulo="Descreva a Situação ou Dúvida *" erro={errors.descricao}>
          <textarea
            id="descricao"
            rows={4}
            value={value.descricao}
            onChange={(e) => onChange({ descricao: e.target.value })}
            placeholder="Informe detalhes para os operadores (horário previsto de chegada, sintoma do problema, divergência encontrada...)"
            aria-invalid={!!errors.descricao}
            aria-describedby={errors.descricao ? "descricao-erro" : undefined}
            className={`${CLASSE_CAMPO} ${tomCampo(errors.descricao)} resize-y`}
          />
        </Campo>

        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] text-gray-400">Mensagem enviada diretamente à equipe da Balança Central.</p>
          <div className="flex gap-2">
            <button type="button" onClick={onLimpar} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              Limpar
            </button>
            <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-marca px-4 py-2 text-sm font-semibold text-white hover:bg-marca-escuro">
              <Send className="h-4 w-4" aria-hidden /> Enviar Solicitação para a Balança
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
