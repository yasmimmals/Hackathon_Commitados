import { useState } from "react";
import { LoaderCircle, UserPlus } from "lucide-react";
import {
  agendarBalcao, enviarNotaFiscal, mensagemDeErro,
  type Acondicionamento, type Agendamento, type NotaFiscal, type SlotDisponibilidade,
} from "@/shared/services";
import { ROTULO_ACONDICIONAMENTO } from "@/shared/utils/acondicionamento";
import { ehDiaUtil, JANELAS, janelaTerminou } from "@/shared/utils/janelas";
import { cabeNaVaga, type VagaLiberada } from "../utils/agenda";

type VagasLiberadasProps = {
  data: string;
  slots: SlotDisponibilidade[];
  vagas: VagaLiberada[];
  candidatos: Agendamento[];
  ehHoje: boolean;
  onConcluido: (mensagem: string) => void;
};

const NOVO = "novo";

function Vaga({ vaga, candidatos, onConcluido }: { vaga: VagaLiberada; candidatos: Agendamento[]; onConcluido: (m: string) => void }) {
  const [escolha, setEscolha] = useState("");
  const [nota, setNota] = useState<NotaFiscal | null>(null);
  const [acond, setAcond] = useState<Acondicionamento>("PALETIZADO");
  const [lendo, setLendo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  const lerNota = async (arquivo: File | null) => {
    setNota(null);
    setErro("");
    if (!arquivo) return;
    setLendo(true);
    try {
      setNota(await enviarNotaFiscal(arquivo));
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setLendo(false);
    }
  };

  const confirmar = async () => {
    const candidato = candidatos.find((c) => String(c.id) === escolha);
    const notaId = escolha === NOVO ? nota?.id : candidato?.nota_fiscal_id;
    const acondicionamento = escolha === NOVO ? acond : candidato?.acondicionamento;
    if (!notaId || !acondicionamento) {
      setErro(escolha === NOVO ? "Envie a nota fiscal do veículo." : "Escolha quem ocupa a vaga.");
      return;
    }
    setEnviando(true);
    setErro("");
    try {
      const ag = await agendarBalcao({ nota_fiscal_id: notaId, horario: vaga.horario, acondicionamento });
      onConcluido(`Vaga das ${vaga.horario} ocupada por ${ag.fornecedor.nome} (#AG-${ag.id}). Aguardando autorização de Compras.`);
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setEnviando(false);
    }
  };

  const nome = `vaga-${vaga.horario}`;
  const naoPreenchida = vaga.liberadaPor.length === 0;
  const livres = vaga.slot.vagas_restantes;
  return (
    <li className={`rounded-2xl border bg-white p-4 ${naoPreenchida ? "border-dashed border-gray-300" : "border-emerald-200"}`}>
      <p className="font-bold text-site-azul">
        {naoPreenchida ? "Vaga não preenchida" : "Vaga liberada"} às {vaga.horario}
        <span className="ml-2 text-xs font-semibold text-emerald-700">
          {livres} {livres === 1 ? "vaga livre" : "vagas livres"}
          {vaga.slot.aceita_batido ? " • aceita batido" : ""}
        </span>
      </p>
      <p className="text-xs text-gray-600">
        {naoPreenchida
          ? vaga.slot.ocupados === 0
            ? "Ninguém agendado neste horário."
            : `${vaga.slot.ocupados} de ${vaga.slot.ocupados + livres} vaga(s) já ocupada(s) neste horário.`
          : `Liberada por: ${vaga.liberadaPor.map((a) => `#AG-${a.id} ${a.fornecedor.nome} (${a.status === "CANCELADO" ? "cancelou" : "não compareceu"})`).join("; ")}`}
      </p>

      <fieldset className="mt-3">
        <legend className="mb-1 text-xs font-semibold text-gray-700">Quem ocupa a vaga?</legend>
        <ul className="space-y-1">
          {candidatos.map((c) => {
            const cabe = cabeNaVaga(c, vaga.slot);
            return (
              <li key={c.id}>
                <label className={`flex items-start gap-2 rounded-lg px-2 py-1.5 text-sm ${cabe ? "cursor-pointer hover:bg-gray-50" : "opacity-50"}`}>
                  <input type="radio" name={nome} value={c.id} checked={escolha === String(c.id)} disabled={!cabe} onChange={(e) => setEscolha(e.target.value)} className="mt-1 accent-marca" />
                  <span>
                    <span className="font-semibold text-gray-900">{c.fornecedor.nome}</span>
                    <span className="block text-xs text-gray-500">
                      Recusado por falta de vaga às {c.horario}h • NF-e {c.nf_numero ?? "—"} • {ROTULO_ACONDICIONAMENTO[c.acondicionamento]}
                      {!cabe && " • não cabe nesta vaga"}
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
          <li>
            <label className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-gray-50">
              <input type="radio" name={nome} value={NOVO} checked={escolha === NOVO} onChange={(e) => setEscolha(e.target.value)} className="mt-1 accent-marca" />
              <span className="font-semibold text-gray-900">Outro veículo na portaria (enviar a NF)</span>
            </label>
          </li>
        </ul>
      </fieldset>

      {escolha === NOVO && (
        <div className="mt-2 grid gap-2 rounded-xl bg-gray-50 p-3 sm:grid-cols-2">
          <label className="text-xs font-semibold text-gray-700">
            Nota fiscal (XML ou PDF)
            <input
              type="file"
              accept=".pdf,.xml,application/pdf,application/xml,text/xml"
              onChange={(e) => lerNota(e.target.files?.[0] ?? null)}
              className="mt-1 block w-full text-xs file:mr-2 file:rounded-full file:border-0 file:bg-marca file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
            />
            <span role="status" className="mt-1 block font-normal text-gray-500">
              {lendo ? "Lendo a nota…" : nota ? `NF-e ${nota.numero ?? "s/ nº"} • ${nota.fornecedor.nome}` : ""}
            </span>
          </label>
          <label className="text-xs font-semibold text-gray-700">
            Acondicionamento
            <select
              value={acond}
              onChange={(e) => setAcond(e.target.value as Acondicionamento)}
              className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              {(Object.keys(ROTULO_ACONDICIONAMENTO) as Acondicionamento[]).map((a) => (
                <option key={a} value={a} disabled={a === "BATIDO" ? !vaga.slot.aceita_batido : !vaga.slot.aceita_unitizado}>
                  {ROTULO_ACONDICIONAMENTO[a]}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {erro && <p role="alert" className="mt-2 text-sm text-red-700">{erro}</p>}
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={confirmar}
          disabled={!escolha || enviando || lendo}
          className="inline-flex items-center gap-1.5 rounded-full bg-site-verde px-4 py-2 text-xs font-bold text-white hover:bg-site-verde-escuro focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-verde focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {enviando ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <UserPlus className="h-3.5 w-3.5" aria-hidden />}
          Ocupar vaga
        </button>
      </div>
    </li>
  );
}

type SituacaoJanela = { rotulo: string; detalhe: string; tom: "livre" | "lotada" | "encerrada" };

function situacaoDaJanela(data: string, horario: SlotDisponibilidade["horario"], slot?: SlotDisponibilidade): SituacaoJanela {
  if (janelaTerminou(data, horario)) return { rotulo: "Encerrada", detalhe: "janela já terminou", tom: "encerrada" };
  if (!slot) return { rotulo: "—", detalhe: "sem grade", tom: "encerrada" };
  const total = slot.ocupados + slot.vagas_restantes;
  if (slot.vagas_restantes > 0) {
    return { rotulo: `${slot.vagas_restantes} livre${slot.vagas_restantes === 1 ? "" : "s"}`, detalhe: `${slot.ocupados} de ${total} ocupada(s)`, tom: "livre" };
  }
  return { rotulo: "Lotada", detalhe: slot.tem_batido ? "carga batida (horário inteiro)" : `${slot.ocupados} de ${slot.ocupados} ocupada(s)`, tom: "lotada" };
}

const TOM_JANELA = {
  livre: "border-emerald-200 bg-emerald-50 text-emerald-800",
  lotada: "border-red-200 bg-red-50 text-red-700",
  encerrada: "border-gray-200 bg-gray-50 text-gray-500",
} satisfies Record<SituacaoJanela["tom"], string>;

export default function VagasLiberadas({ data, slots, vagas, candidatos, ehHoje, onConcluido }: VagasLiberadasProps) {
  const diaUtil = ehDiaUtil(data) && slots.length > 0;
  const abertas = diaUtil ? vagas.filter((v) => !janelaTerminou(data, v.horario)) : [];
  const totalLivre = abertas.reduce((soma, v) => soma + v.slot.vagas_restantes, 0);

  return (
    <section aria-labelledby="vagas-titulo" className="rounded-3xl bg-white p-5 shadow-sm">
      <div className="flex items-baseline justify-between gap-2 border-b-[3px] border-site-amarelo pb-2">
        <h2 id="vagas-titulo" className="titulo-secao text-lg">Vagas liberadas</h2>
        {diaUtil && (
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${totalLivre ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"}`}>
            {totalLivre} {totalLivre === 1 ? "vaga disponível" : "vagas disponíveis"}
          </span>
        )}
      </div>

      {!diaUtil ? (
        <p className="mt-3 text-sm text-gray-600">Não há recebimento nesta data (fim de semana ou feriado).</p>
      ) : (
        <>
          <ul aria-label="Vagas por janela" className="mt-3 grid grid-cols-2 gap-2">
            {JANELAS.map(({ horario, fim }) => {
              const s = situacaoDaJanela(data, horario, slots.find((x) => x.horario === horario));
              return (
                <li key={horario} className={`rounded-xl border px-3 py-2 ${TOM_JANELA[s.tom]}`}>
                  <p className="text-xs font-semibold text-gray-700">{horario} – {fim}</p>
                  <p className="text-sm font-bold">{s.rotulo}</p>
                  <p className="text-[11px] opacity-80">{s.detalhe}</p>
                </li>
              );
            })}
          </ul>

          {!ehHoje ? (
            <p className="mt-3 text-sm text-gray-600">As vagas só podem ser ocupadas no próprio dia. Selecione a data de hoje para fazer um encaixe.</p>
          ) : abertas.length === 0 ? (
            <p className="mt-3 text-sm text-gray-600">Nenhuma vaga disponível nas janelas que ainda estão abertas hoje.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {abertas.map((v) => (
                <Vaga key={`${v.horario}-${v.slot.ocupados}`} vaga={v} candidatos={candidatos} onConcluido={onConcluido} />
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
