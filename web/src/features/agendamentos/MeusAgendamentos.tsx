import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { LoaderCircle, ServerCrash } from "lucide-react";
import MensagemStatus from "@/shared/components/ui/MensagemStatus";
import { useMensagemTemporaria } from "@/shared/hooks/useMensagemTemporaria";
import { cancelarAgendamento, listarAgendamentos, mensagemDeErro } from "@/shared/services";
import AlertBanner from "./components/AlertBanner";
import AppointmentCard from "./components/AppointmentCard";
import EmptyState from "./components/EmptyState";
import PageHeader from "./components/PageHeader";
import SidebarWidgets from "./components/SidebarWidgets";
import StatusTabs from "./components/StatusTabs";
import { TAB_LABELS } from "./constants";
import type { AppointmentAction, ListedAppointment, Tab, TabKey } from "./types";
import { correspondeBusca, exportarCsv } from "./utils/agendamentos";
import { mapearAgendamento, ordenarPorData } from "./utils/mapearAgendamento";

type Carga = { tipo: "carregando" } | { tipo: "erro"; mensagem: string } | { tipo: "ok" };

export default function MeusAgendamentos() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const [appointments, setAppointments] = useState<ListedAppointment[]>([]);
  const [carga, setCarga] = useState<Carga>({ tipo: "carregando" });
  const [tab, setTab] = useState<TabKey>("todos");
  const [search, setSearch] = useState(query);
  const [feedback, setFeedback] = useMensagemTemporaria(5000);
  const [erroAcao, setErroAcao] = useMensagemTemporaria(8000);

  const [lastQuery, setLastQuery] = useState(query);
  if (query !== lastQuery) {
    setLastQuery(query);
    setSearch(query);
    setTab("todos");
  }

  const carregar = useCallback(() => {
    let ativo = true;
    // O backend devolve só os agendamentos da empresa do fornecedor logado.
    listarAgendamentos().then(
      (lista) => {
        if (!ativo) return;
        setAppointments([...lista].sort(ordenarPorData).map(mapearAgendamento));
        setCarga({ tipo: "ok" });
      },
      (erro) => ativo && setCarga({ tipo: "erro", mensagem: mensagemDeErro(erro) }),
    );
    return () => {
      ativo = false;
    };
  }, []);

  useEffect(carregar, [carregar]);

  const tabs = useMemo<Tab[]>(
    () =>
      (Object.keys(TAB_LABELS) as TabKey[]).map((key) => ({
        key,
        label: TAB_LABELS[key],
        count: key === "todos" ? appointments.length : appointments.filter((a) => a.tab === key).length,
        danger: key === "recusados",
      })),
    [appointments],
  );

  const visible = useMemo(
    () => appointments.filter((a) => (tab === "todos" || a.tab === tab) && correspondeBusca(a, search)),
    [appointments, tab, search],
  );

  const replace = (atualizado: ListedAppointment) =>
    setAppointments((list) => list.map((a) => (a.id === atualizado.id ? atualizado : a)));

  const reportDelay = (appointment: ListedAppointment) => {
    replace({
      ...appointment,
      footerInfo: "Atraso informado à portaria",
      footerTone: "warning",
      actions: appointment.actions?.filter((a) => a.kind !== "delay"),
    });
    setFeedback(`Atraso do agendamento ${appointment.code} informado à portaria.`);
  };

  const cancel = async (appointment: ListedAppointment) => {
    if (!window.confirm(`Cancelar o agendamento ${appointment.code}? Esta ação não pode ser desfeita.`)) return;
    try {
      replace(mapearAgendamento(await cancelarAgendamento(Number(appointment.id))));
      setFeedback(`Agendamento ${appointment.code} cancelado e movido para o histórico.`);
    } catch (erro) {
      setErroAcao(`Não foi possível cancelar ${appointment.code}: ${mensagemDeErro(erro)}`);
    }
  };

  const handleAction = (appointment: ListedAppointment, action: AppointmentAction) => {
    if (action.kind === "delay") reportDelay(appointment);
    else if (action.kind === "cancel") cancel(appointment);
    else if (action.kind === "reschedule") navigate("/fornecedor/agendar");
    else setFeedback(`"${action.label}" estará disponível em breve.`);
  };

  const handleExport = () => {
    if (visible.length === 0) {
      setFeedback("Nenhum agendamento na lista atual para exportar.");
      return;
    }
    exportarCsv(visible);
    setFeedback(`${visible.length} agendamento(s) exportado(s) para CSV.`);
  };

  const hasFilters = tab !== "todos" || search !== "";
  const clearFilters = () => {
    setTab("todos");
    setSearch("");
  };

  return (
    <div>
      <div className="-mx-4 -mt-6 mb-6">
        <AlertBanner />
      </div>
      <PageHeader onExport={handleExport} />
      <MensagemStatus mensagem={feedback} />
      <MensagemStatus mensagem={erroAcao} tom="erro" />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section aria-label="Lista de agendamentos" aria-busy={carga.tipo === "carregando"}>
          <StatusTabs tabs={tabs} active={tab} onChange={setTab} search={search} onSearch={setSearch} />
          <div id="agendamentos-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="space-y-4">
            {carga.tipo === "carregando" ? (
              <p role="status" className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> Carregando agendamentos…
              </p>
            ) : carga.tipo === "erro" ? (
              <div role="alert" className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-10 text-center">
                <ServerCrash className="h-6 w-6 text-gray-400" aria-hidden />
                <p className="text-sm text-gray-700">Não foi possível carregar seus agendamentos.</p>
                <p className="text-xs text-gray-500">{carga.mensagem}</p>
                <button
                  type="button"
                  onClick={() => {
                    setCarga({ tipo: "carregando" });
                    carregar();
                  }}
                  className="mt-1 text-sm font-semibold text-marca hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca"
                >
                  Tentar novamente
                </button>
              </div>
            ) : visible.length > 0 ? (
              visible.map((a) => (
                <AppointmentCard key={a.id} appointment={a} onAction={(action) => handleAction(a, action)} />
              ))
            ) : (
              <EmptyState onClearFilters={hasFilters ? clearFilters : undefined} />
            )}
          </div>
        </section>
        <div className="lg:pt-[52px]">
          <SidebarWidgets />
        </div>
      </div>
    </div>
  );
}
