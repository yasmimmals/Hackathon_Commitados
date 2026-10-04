import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, LoaderCircle, RefreshCw, ServerCrash, Warehouse } from "lucide-react";
import MensagemStatus from "@/shared/components/ui/MensagemStatus";
import { useMensagemTemporaria } from "@/shared/hooks/useMensagemTemporaria";
import {
  consultarDisponibilidade, listarAgendamentos, listarBaias, mensagemDeErro,
  type Agendamento, type Baia, type LocalFisico, type SlotDisponibilidade,
} from "@/shared/services";
import { dataLocalIso, JANELAS } from "@/shared/utils/janelas";
import { LOCAIS, ROTULO_LOCAL } from "@/shared/utils/locais";
import CardRecebimento from "./components/CardRecebimento";
import VagasLiberadas from "./components/VagasLiberadas";
import { autorizacao, candidatosAVaga, vagasLiberadas } from "./utils/agenda";

type Dados = { agenda: Agendamento[]; slots: SlotDisponibilidade[]; baias: Baia[] };
type Carga = { tipo: "carregando" } | { tipo: "erro"; mensagem: string } | { tipo: "ok"; dados: Dados };

const naAgenda = (a: Agendamento) => !(a.status === "REJEITADO" && a.motivo_nao_recebimento === "SEM_VAGA");

export default function AgendaDoDia() {
  const [data, setData] = useState(() => dataLocalIso());
  const [local, setLocal] = useState<LocalFisico | "">("");
  const [carga, setCarga] = useState<Carga>({ tipo: "carregando" });
  const [feedback, setFeedback] = useMensagemTemporaria(7000);

  const carregar = useCallback(() => {
    let ativo = true;
    Promise.all([
      listarAgendamentos({ data }),
      consultarDisponibilidade(data).catch(() => [] as SlotDisponibilidade[]),
      listarBaias(),
    ]).then(
      ([agenda, slots, baias]) => ativo && setCarga({ tipo: "ok", dados: { agenda, slots, baias } }),
      (erro) => ativo && setCarga({ tipo: "erro", mensagem: mensagemDeErro(erro) }),
    );
    return () => {
      ativo = false;
    };
  }, [data]);

  useEffect(carregar, [carregar]);

  const recarregar = () => {
    setCarga({ tipo: "carregando" });
    carregar();
  };

  const concluir = (mensagem: string) => {
    setFeedback(mensagem);
    carregar();
  };

  const dados = carga.tipo === "ok" ? carga.dados : undefined;

  const agenda = useMemo(
    () =>
      (dados?.agenda ?? [])
        .filter(naAgenda)
        .filter((a) => !local || a.descargas.length === 0 || a.descargas.some((d) => d.local === local)),
    [dados, local],
  );

  const resumo = useMemo(() => {
    const todos = (dados?.agenda ?? []).filter(naAgenda);
    return [
      { rotulo: "Agendados", valor: todos.length },
      { rotulo: "Autorizados", valor: todos.filter((a) => autorizacao(a).tom === "ok").length },
      { rotulo: "Aguardando Compras", valor: todos.filter((a) => a.status === "PENDENTE").length },
      { rotulo: "Compareceram", valor: todos.filter((a) => a.horario_chegada).length },
      { rotulo: "Não compareceram", valor: todos.filter((a) => a.status === "NAO_COMPARECEU").length },
    ];
  }, [dados]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-1 flex items-center gap-1.5 text-xs text-gray-500">
            <Warehouse className="h-3.5 w-3.5" aria-hidden /> Responsável pelo Armazém
          </p>
          <h1 className="titulo-pagina">Recebimento — Agenda do Dia</h1>
          <p className="mt-2 max-w-prose text-sm text-gray-600">
            Confira a autorização e o armazém de destino de cada caminhão, registre o comparecimento e reocupe as vagas liberadas.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-xs font-semibold text-gray-700">
            <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" aria-hidden /> Data</span>
            <input
              type="date"
              value={data}
              onChange={(e) => {
                if (!e.target.value) return;
                setData(e.target.value);
                setCarga({ tipo: "carregando" });
              }}
              className="mt-1 rounded-full border border-gray-300 bg-white px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs font-semibold text-gray-700">
            Armazém
            <select
              value={local}
              onChange={(e) => setLocal(e.target.value as LocalFisico | "")}
              className="mt-1 block rounded-full border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Todos</option>
              {LOCAIS.map((l) => (
                <option key={l} value={l}>{ROTULO_LOCAL[l]}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={recarregar}
            disabled={carga.tipo === "carregando"}
            className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-azul disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${carga.tipo === "carregando" ? "animate-spin" : ""}`} aria-hidden /> Atualizar
          </button>
        </div>
      </div>

      <MensagemStatus mensagem={feedback} />

      {carga.tipo === "carregando" && (
        <p role="status" className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> Carregando a agenda…
        </p>
      )}

      {carga.tipo === "erro" && (
        <div role="alert" className="flex flex-col items-center gap-2 rounded-3xl bg-white px-4 py-10 text-center shadow-sm">
          <ServerCrash className="h-6 w-6 text-gray-400" aria-hidden />
          <p className="text-sm text-gray-700">Não foi possível carregar a agenda do dia.</p>
          <p className="text-xs text-gray-500">{carga.mensagem}</p>
          <button type="button" onClick={recarregar} className="mt-1 text-sm font-semibold text-marca hover:underline">
            Tentar novamente
          </button>
        </div>
      )}

      {dados && (
        <>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {resumo.map(({ rotulo, valor }) => (
              <div key={rotulo} className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                <dt className="text-xs font-semibold text-gray-500">{rotulo}</dt>
                <dd className="text-2xl font-semibold text-gray-900">{valor}</dd>
              </div>
            ))}
          </dl>

          <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_400px] xl:items-start">
            <section aria-label="Agenda por horário" className="space-y-5">
              {JANELAS.map(({ horario, fim }) => {
                const doHorario = agenda.filter((a) => a.horario === horario);
                const slot = dados.slots.find((s) => s.horario === horario);
                return (
                  <div key={horario}>
                    <h2 className="mb-2 flex flex-wrap items-baseline gap-2">
                      <span className="titulo-secao text-lg">{horario}h – {fim}h</span>
                      {slot && (
                        <span className="text-xs font-semibold text-gray-500">
                          {slot.ocupados} ocupada(s) • {slot.vagas_restantes} livre(s){slot.tem_batido ? " • horário com carga batida" : ""}
                        </span>
                      )}
                    </h2>
                    {doHorario.length === 0 ? (
                      <p className="rounded-2xl border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-500">Nenhum caminhão nesta janela.</p>
                    ) : (
                      <ul className="space-y-3">
                        {doHorario.map((a) => (
                          <li key={a.id}>
                            <CardRecebimento agendamento={a} baias={dados.baias} onConcluido={concluir} />
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </section>

            <VagasLiberadas
              data={data}
              ehHoje={data === dataLocalIso()}
              vagas={vagasLiberadas(dados.agenda, dados.slots)}
              candidatos={candidatosAVaga(dados.agenda)}
              onConcluido={concluir}
            />
          </div>
        </>
      )}
    </div>
  );
}
