import { useState, type FormEvent } from "react";
import { CalendarClock, Check, CloudRain, LoaderCircle, X } from "lucide-react";
import {
  aprovarAgendamento, mensagemDeErro, rejeitarAgendamento,
  type Agendamento, type MotivoNaoRecebimento,
} from "@/shared/services";
import { ROTULO_ACONDICIONAMENTO } from "@/shared/utils/acondicionamento";
import { MIN_CARACTERES_MOTIVO, MOTIVOS_REPROVA } from "../constants";
import { formatarCnpj, formatarData } from "../utils/formatacao";
import DetalhesNota from "./DetalhesNota";

type Modo = "nenhum" | "aprovar" | "reprovar";

type CardValidacaoProps = {
  agendamento: Agendamento;
  analista: string;
  onConcluido: (atualizado: Agendamento, acao: "aprovado" | "reprovado") => void;
};

const CLASSE_CAMPO =
  "w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus-visible:border-site-azul focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-azul/30";

const CLASSE_BOTAO = "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70";

export default function CardValidacao({ agendamento: ag, analista, onConcluido }: CardValidacaoProps) {
  const [modo, setModo] = useState<Modo>("nenhum");
  const [pedido, setPedido] = useState("");
  const [motivo, setMotivo] = useState<MotivoNaoRecebimento | "">("");
  const [observacao, setObservacao] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const idBase = `validacao-${ag.id}`;

  const abrir = (novo: Modo) => {
    setModo(novo);
    setErro("");
    setObservacao("");
  };

  const aprovar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const numero = Number(pedido);
    if (!Number.isInteger(numero) || numero <= 0) {
      setErro("Informe o número do pedido de compra.");
      document.getElementById(`${idBase}-pedido`)?.focus();
      return;
    }
    setEnviando(true);
    setErro("");
    try {
      const atualizado = await aprovarAgendamento(ag.id, {
        pedido_compra: numero,
        analisado_por: analista,
        observacao: observacao.trim() || null,
      });
      onConcluido(atualizado, "aprovado");
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setEnviando(false);
    }
  };

  const reprovar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!motivo) {
      setErro("Escolha o motivo da reprovação.");
      document.getElementById(`${idBase}-motivo`)?.focus();
      return;
    }
    if (observacao.trim().length < MIN_CARACTERES_MOTIVO) {
      setErro(`Descreva o motivo para o fornecedor (mínimo ${MIN_CARACTERES_MOTIVO} caracteres).`);
      document.getElementById(`${idBase}-observacao`)?.focus();
      return;
    }
    setEnviando(true);
    setErro("");
    try {
      const atualizado = await rejeitarAgendamento(ag.id, {
        motivo,
        analisado_por: analista,
        observacao: observacao.trim(),
      });
      onConcluido(atualizado, "reprovado");
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <article aria-labelledby={`${idBase}-titulo`} className="overflow-hidden rounded-3xl bg-white shadow-sm">
      <header className="flex flex-col gap-3 border-b-[3px] border-site-amarelo px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-gray-500">#AG-{ag.id}</p>
          <h3 id={`${idBase}-titulo`} className="titulo-secao text-lg">{ag.fornecedor.nome}</h3>
          <p className="text-xs text-gray-600">CNPJ {formatarCnpj(ag.fornecedor.cnpj)}</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-site-azul ring-1 ring-sky-200">
            <CalendarClock className="h-3.5 w-3.5" aria-hidden /> {formatarData(ag.data)} às {ag.horario}h
          </span>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
            {ROTULO_ACONDICIONAMENTO[ag.acondicionamento]}
          </span>
          {ag.carga_adubo && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
              <CloudRain className="h-3.5 w-3.5" aria-hidden /> Adubo{ag.prob_chuva != null ? ` • ${ag.prob_chuva}% chuva` : ""}
            </span>
          )}
          {ag.origem === "BALCAO" && (
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">Encaixe de pátio</span>
          )}
        </div>
      </header>

      <div className="px-5 py-4">
        {ag.nota_fiscal_id ? (
          <DetalhesNota notaFiscalId={ag.nota_fiscal_id} />
        ) : (
          <p className="text-sm text-gray-600">
            Agendamento sem nota vinculada{ag.nf_numero ? ` (NF-e ${ag.nf_numero})` : ""}.
          </p>
        )}
      </div>

      <footer className="border-t border-gray-100 bg-gray-50/70 px-5 py-4">
        {modo === "nenhum" && (
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => abrir("reprovar")}
              className={`${CLASSE_BOTAO} border-2 border-red-600 bg-white text-red-700 hover:bg-red-50 focus-visible:ring-red-500`}
            >
              <X className="h-4 w-4" aria-hidden /> Reprovar
            </button>
            <button
              type="button"
              onClick={() => abrir("aprovar")}
              className={`${CLASSE_BOTAO} bg-site-verde text-white hover:bg-site-verde-escuro focus-visible:ring-site-verde`}
            >
              <Check className="h-4 w-4" aria-hidden /> Aprovar
            </button>
          </div>
        )}

        {modo === "aprovar" && (
          <form noValidate onSubmit={aprovar} className="space-y-3">
            <p className="font-bold text-site-azul">Aprovar agendamento</p>
            <div className="grid gap-3 sm:grid-cols-[200px_minmax(0,1fr)]">
              <div>
                <label htmlFor={`${idBase}-pedido`} className="mb-1 block text-xs font-semibold text-gray-700">
                  Nº do pedido de compra *
                </label>
                <input
                  id={`${idBase}-pedido`}
                  inputMode="numeric"
                  autoFocus
                  value={pedido}
                  onChange={(e) => setPedido(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className={CLASSE_CAMPO}
                />
              </div>
              <div>
                <label htmlFor={`${idBase}-observacao`} className="mb-1 block text-xs font-semibold text-gray-700">
                  Observação (opcional)
                </label>
                <input
                  id={`${idBase}-observacao`}
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  className={CLASSE_CAMPO}
                />
              </div>
            </div>
            {erro && <p role="alert" className="text-sm text-red-700">{erro}</p>}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => abrir("nenhum")} disabled={enviando} className={`${CLASSE_BOTAO} text-gray-700 hover:bg-gray-200 focus-visible:ring-gray-400`}>
                Cancelar
              </button>
              <button type="submit" disabled={enviando} className={`${CLASSE_BOTAO} bg-site-verde text-white hover:bg-site-verde-escuro focus-visible:ring-site-verde`}>
                {enviando ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> : <Check className="h-4 w-4" aria-hidden />}
                Confirmar aprovação
              </button>
            </div>
          </form>
        )}

        {modo === "reprovar" && (
          <form noValidate onSubmit={reprovar} className="space-y-3">
            <p className="font-bold text-red-700">Reprovar agendamento</p>
            <div>
              <label htmlFor={`${idBase}-motivo`} className="mb-1 block text-xs font-semibold text-gray-700">
                Motivo da reprovação *
              </label>
              <select
                id={`${idBase}-motivo`}
                autoFocus
                value={motivo}
                onChange={(e) => setMotivo(e.target.value as MotivoNaoRecebimento | "")}
                className={CLASSE_CAMPO}
              >
                <option value="">Selecione…</option>
                {MOTIVOS_REPROVA.map((m) => (
                  <option key={m.valor} value={m.valor}>{m.rotulo}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={`${idBase}-observacao`} className="mb-1 block text-xs font-semibold text-gray-700">
                Descreva o motivo para o fornecedor *
              </label>
              <textarea
                id={`${idBase}-observacao`}
                rows={3}
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Ex.: quantidade faturada ultrapassa o saldo do pedido; ajuste a nota para reagendar."
                className={CLASSE_CAMPO}
              />
              <p className="mt-1 text-[11px] text-gray-500">Esse texto aparece para o fornecedor em Meus Agendamentos.</p>
            </div>
            {erro && <p role="alert" className="text-sm text-red-700">{erro}</p>}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => abrir("nenhum")} disabled={enviando} className={`${CLASSE_BOTAO} text-gray-700 hover:bg-gray-200 focus-visible:ring-gray-400`}>
                Cancelar
              </button>
              <button type="submit" disabled={enviando} className={`${CLASSE_BOTAO} bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500`}>
                {enviando ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> : <X className="h-4 w-4" aria-hidden />}
                Confirmar reprovação
              </button>
            </div>
          </form>
        )}
      </footer>
    </article>
  );
}
