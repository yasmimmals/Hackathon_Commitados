import { useState, type FormEvent } from "react";
import { Ban, LoaderCircle } from "lucide-react";
import { naoReceber, type Agendamento } from "@/shared/services";

type Motivo = "DIVERGENCIA_NF_PEDIDO" | "OUTRO";

type Props = {
  agendamento: Agendamento;
  enviando: boolean;
  executar: (acao: () => Promise<Agendamento>, sucesso: string) => Promise<void>;
  aoCancelar: () => void;
};

const MOTIVOS: { valor: Motivo; rotulo: string }[] = [
  { valor: "DIVERGENCIA_NF_PEDIDO", rotulo: "Divergência entre a nota fiscal e o pedido" },
  { valor: "OUTRO", rotulo: "Outro motivo" },
];

const CLASSE_CAMPO =
  "mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:border-site-azul focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-azul/30";
const CLASSE_BOTAO =
  "inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

export default function NaoReceber({ agendamento: ag, enviando, executar, aoCancelar }: Props) {
  const [motivo, setMotivo] = useState<Motivo>("DIVERGENCIA_NF_PEDIDO");
  const [descricao, setDescricao] = useState("");
  const [erro, setErro] = useState("");

  const enviar = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (descricao.trim().length < 5) {
      setErro("Descreva o que aconteceu (pelo menos 5 caracteres).");
      return;
    }
    setErro("");
    executar(
      () => naoReceber(ag.id, { motivo, descricao: descricao.trim() }),
      `#AG-${ag.id} registrado como não recebido. O motivo fica no painel de não recebimentos.`,
    );
  };

  return (
    <form noValidate onSubmit={enviar} className="mt-3 space-y-3 rounded-xl bg-red-50 p-3">
      <p className="flex items-start gap-2 text-xs text-red-900">
        <Ban className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <span>O caminhão não será recebido e a vaga é liberada. O fornecedor vê o motivo no agendamento.</span>
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-semibold text-gray-700">
          Motivo
          <select value={motivo} onChange={(e) => setMotivo(e.target.value as Motivo)} className={CLASSE_CAMPO}>
            {MOTIVOS.map((m) => (
              <option key={m.valor} value={m.valor}>{m.rotulo}</option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-gray-700">
          Descrição
          <input
            type="text" maxLength={300} value={descricao}
            onChange={(e) => { setDescricao(e.target.value); setErro(""); }}
            placeholder={motivo === "OUTRO" ? "Ex.: carga avariada, palete quebrado" : "Ex.: 2 itens a mais que o pedido"}
            aria-invalid={erro ? true : undefined}
            className={CLASSE_CAMPO}
          />
        </label>
      </div>
      {erro && <p role="alert" className="text-xs text-red-700">{erro}</p>}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" onClick={aoCancelar} className={`${CLASSE_BOTAO} text-gray-700 hover:bg-gray-200 focus-visible:ring-gray-400`}>
          Voltar
        </button>
        <button type="submit" disabled={enviando} className={`${CLASSE_BOTAO} bg-red-700 text-white hover:bg-red-800 focus-visible:ring-red-600`}>
          {enviando ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Ban className="h-3.5 w-3.5" aria-hidden />}
          Confirmar não recebimento
        </button>
      </div>
    </form>
  );
}
