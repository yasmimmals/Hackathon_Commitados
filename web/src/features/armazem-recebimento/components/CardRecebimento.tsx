import { useState, type FormEvent } from "react";
import { AlarmClock, Ban, CheckCircle2, CloudRain, LoaderCircle, MapPin, ShieldAlert, ShieldCheck, ShieldQuestion, Zap } from "lucide-react";
import {
  definirDestinos, marcarNaoCompareceu, mensagemDeErro, registrarChegada,
  type Agendamento, type Baia, type Equipamento, type LocalFisico,
} from "@/shared/services";
import { ROTULO_ACONDICIONAMENTO } from "@/shared/utils/acondicionamento";
import { duracaoMin } from "@/shared/utils/formatacao";
import { janelaTerminou } from "@/shared/utils/janelas";
import { LOCAIS, ROTULO_LOCAL } from "@/shared/utils/locais";
import { autorizacao, TEXTO_STATUS, type Autorizacao } from "../utils/agenda";
import EtapasDescarga from "./EtapasDescarga";
import ReagendarChuva from "./ReagendarChuva";

type CardRecebimentoProps = {
  agendamento: Agendamento;
  baias: Baia[];
  equipamentos: Equipamento[];
  onConcluido: (mensagem: string) => void;
};

const ICONE_AUTORIZACAO = { ok: ShieldCheck, aguardando: ShieldQuestion, negada: ShieldAlert, neutra: Ban };
const COR_AUTORIZACAO: Record<Autorizacao["tom"], string> = {
  ok: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  aguardando: "bg-amber-50 text-amber-800 ring-amber-200",
  negada: "bg-red-50 text-red-800 ring-red-200",
  neutra: "bg-gray-100 text-gray-600 ring-gray-200",
};

const CLASSE_BOTAO =
  "inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";
const CLASSE_CAMPO =
  "w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:border-site-azul focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-azul/30";

export default function CardRecebimento({ agendamento: ag, baias, equipamentos, onConcluido }: CardRecebimentoProps) {
  const [editandoDestino, setEditandoDestino] = useState(false);
  const [reagendando, setReagendando] = useState(false);
  const [local, setLocal] = useState<LocalFisico | "">(ag.descargas[0]?.local ?? (ag.carga_adubo ? "ADUBO" : ""));
  const [baiaId, setBaiaId] = useState<string>(ag.descargas[0]?.baia?.id ? String(ag.descargas[0].baia.id) : "");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  const aut = autorizacao(ag);
  const IconeAut = ICONE_AUTORIZACAO[aut.tom];
  const antesDaChegada = ag.status === "APROVADO" || ag.status === "DESTINO_DEFINIDO";
  const podeReagendarChuva = ag.status === "APROVADO" || ag.status === "DESTINO_DEFINIDO" || ag.status === "NA_FILA";
  const podeMarcarAusencia = antesDaChegada && janelaTerminou(ag.data, ag.horario);
  const baiasDoLocal = baias.filter((b) => b.local === local && b.ativa);

  const executar = async <T,>(acao: () => Promise<T>, sucesso: string | ((resultado: T) => string)) => {
    setEnviando(true);
    setErro("");
    try {
      const resultado = await acao();
      setEditandoDestino(false);
      setReagendando(false);
      onConcluido(typeof sucesso === "function" ? sucesso(resultado) : sucesso);
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setEnviando(false);
    }
  };

  const salvarDestino = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!local) {
      setErro("Escolha o armazém de destino.");
      return;
    }
    executar(
      () => definirDestinos(ag.id, [{ local, baia_id: baiaId ? Number(baiaId) : null }]),
      `Destino de #AG-${ag.id} definido: ${ROTULO_LOCAL[local]}.`,
    );
  };

  const naoCompareceu = () => {
    if (!window.confirm(`Registrar que #AG-${ag.id} (${ag.fornecedor.nome}) não compareceu? A vaga será liberada.`)) return;
    executar(() => marcarNaoCompareceu(ag.id), `#AG-${ag.id} registrado como não comparecimento. A vaga das ${ag.horario}h foi liberada.`);
  };

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-gray-500">
            #AG-{ag.id} • {TEXTO_STATUS[ag.status]}
            {ag.origem === "BALCAO" && " • Encaixe de pátio"}
            {ag.origem === "CHUVA" && " • Reagendado por chuva"}
          </p>
          {ag.prioritario && (
            <p className="mb-1 inline-flex items-center gap-1 rounded-full bg-site-azul px-2.5 py-0.5 text-[11px] font-bold text-white">
              <Zap className="h-3 w-3" aria-hidden /> Prioridade na fila{ag.origem === "CHUVA" ? " • reagendado por chuva" : ""}
            </p>
          )}
          <h3 className="truncate font-bold text-site-azul">{ag.fornecedor.nome}</h3>
          <p className="text-xs text-gray-600">
            {ag.nf_numero ? `NF-e ${ag.nf_numero}` : "Sem NF"} • {ROTULO_ACONDICIONAMENTO[ag.acondicionamento]}
            {ag.peso_kg && ` • ${(Number(ag.peso_kg) / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} t`}
            {ag.chapas_norma != null && ` • ${ag.chapas_norma} chapas`}
          </p>
          {ag.carga_adubo && (
            <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-amber-800">
              <CloudRain className="h-3.5 w-3.5" aria-hidden /> Adubo{ag.prob_chuva != null ? ` • ${ag.prob_chuva}% de chuva` : ""}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 md:items-end">
          <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${COR_AUTORIZACAO[aut.tom]}`}>
            <IconeAut className="h-3.5 w-3.5" aria-hidden /> {aut.rotulo}
          </span>
          {aut.detalhe && <span className="text-[11px] text-gray-500 md:text-right">{aut.detalhe}</span>}
          <span className="inline-flex items-center gap-1 text-xs text-gray-700">
            <MapPin className="h-3.5 w-3.5 text-site-azul" aria-hidden />
            {ag.descargas.length
              ? ag.descargas.map((d) => `${ROTULO_LOCAL[d.local]}${d.baia ? ` • ${d.baia.nome}` : ""}`).join(" + ")
              : "Destino não definido"}
          </span>
        </div>
      </div>

      {ag.atraso_informado_em && !ag.horario_chegada && (
        <p role="status" className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-amber-200">
          <AlarmClock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>
            <strong>Fornecedor avisou atraso de {duracaoMin(ag.atraso_minutos)}</strong>
            {" "}às {new Date(ag.atraso_informado_em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            {ag.atraso_motivo && <> • {ag.atraso_motivo}</>}
          </span>
        </p>
      )}

      {editandoDestino ? (
        <form noValidate onSubmit={salvarDestino} className="mt-3 grid gap-2 rounded-xl bg-gray-50 p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="text-xs font-semibold text-gray-700">
            Armazém de destino
            <select
              value={local}
              onChange={(e) => {
                setLocal(e.target.value as LocalFisico | "");
                setBaiaId("");
              }}
              className={`${CLASSE_CAMPO} mt-1`}
            >
              <option value="">Selecione…</option>
              {LOCAIS.map((l) => (
                <option key={l} value={l}>{ROTULO_LOCAL[l]}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-gray-700">
            Baia / doca
            <select value={baiaId} onChange={(e) => setBaiaId(e.target.value)} disabled={!local} className={`${CLASSE_CAMPO} mt-1`}>
              <option value="">{baiasDoLocal.length === 1 ? "Única doca ativa (automático)" : "Selecione…"}</option>
              {baiasDoLocal.map((b) => (
                <option key={b.id} value={b.id}>{b.nome}</option>
              ))}
            </select>
          </label>
          <div className="flex gap-2">
            <button type="button" onClick={() => setEditandoDestino(false)} className={`${CLASSE_BOTAO} text-gray-700 hover:bg-gray-200 focus-visible:ring-gray-400`}>
              Cancelar
            </button>
            <button type="submit" disabled={enviando} className={`${CLASSE_BOTAO} bg-site-azul text-white hover:bg-site-azul-escuro focus-visible:ring-site-azul`}>
              {enviando && <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden />} Salvar destino
            </button>
          </div>
        </form>
      ) : (
        antesDaChegada && (
          <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-3">
            <button
              type="button"
              onClick={() => setEditandoDestino(true)}
              className={`${CLASSE_BOTAO} border border-site-azul text-site-azul hover:bg-sky-50 focus-visible:ring-site-azul`}
            >
              <MapPin className="h-3.5 w-3.5" aria-hidden /> {ag.status === "APROVADO" ? "Definir destino" : "Alterar destino"}
            </button>
            <button
              type="button"
              onClick={naoCompareceu}
              disabled={enviando || !podeMarcarAusencia}
              title={podeMarcarAusencia ? undefined : `Disponível após o fim da janela das ${ag.horario}h`}
              className={`${CLASSE_BOTAO} border border-red-600 text-red-700 hover:bg-red-50 focus-visible:ring-red-500`}
            >
              <Ban className="h-3.5 w-3.5" aria-hidden /> Não compareceu
            </button>
            {ag.status === "DESTINO_DEFINIDO" && (
              <button
                type="button"
                onClick={() => executar(() => registrarChegada(ag.id), `Comparecimento de #AG-${ag.id} registrado. Caminhão na fila.`)}
                disabled={enviando}
                className={`${CLASSE_BOTAO} bg-site-verde text-white hover:bg-site-verde-escuro focus-visible:ring-site-verde`}
              >
                {enviando ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />}
                Caminhão chegou
              </button>
            )}
          </div>
        )
      )}

      {ag.status === "APROVADO" && !editandoDestino && (
        <p className="mt-2 text-[11px] text-gray-500">Defina o destino para poder registrar o comparecimento.</p>
      )}
      {(ag.status === "NA_FILA" || ag.status === "EM_DESCARGA" || ag.status === "CONCLUIDO") && (
        <EtapasDescarga agendamento={ag} equipamentos={equipamentos} executar={executar} enviando={enviando} />
      )}
      {podeReagendarChuva && !editandoDestino && (
        reagendando ? (
          <ReagendarChuva agendamento={ag} enviando={enviando} executar={executar} aoCancelar={() => setReagendando(false)} />
        ) : (
          <div className="mt-2 flex justify-end">
            <button type="button" onClick={() => setReagendando(true)} disabled={enviando}
              className="inline-flex items-center gap-1.5 rounded-full border border-sky-700 px-4 py-2 text-xs font-bold text-sky-800 hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 disabled:opacity-60">
              <CloudRain className="h-3.5 w-3.5" aria-hidden /> Reagendar (chuva)
            </button>
          </div>
        )
      )}
      {erro && <p role="alert" className="mt-2 text-sm text-red-700">{erro}</p>}
    </article>
  );
}
