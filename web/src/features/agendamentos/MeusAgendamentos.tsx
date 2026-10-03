import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import MensagemStatus from "@/shared/components/ui/MensagemStatus";
import { useMensagemTemporaria } from "@/shared/hooks/useMensagemTemporaria";
import AlertBanner from "./components/AlertBanner";
import AppointmentCard from "./components/AppointmentCard";
import EmptyState from "./components/EmptyState";
import PageHeader from "./components/PageHeader";
import SidebarWidgets from "./components/SidebarWidgets";
import StatusTabs from "./components/StatusTabs";
import { AGENDAMENTOS_MOCK, TAB_LABELS } from "./data/agendamentosMock";
import type { AppointmentAction, ListedAppointment, Tab, TabKey } from "./types";
import { correspondeBusca, exportarCsv } from "./utils/agendamentos";

export default function MeusAgendamentos() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const [appointments, setAppointments] = useState(AGENDAMENTOS_MOCK);
  const [tab, setTab] = useState<TabKey>("todos");
  const [search, setSearch] = useState(query);
  const [feedback, setFeedback] = useMensagemTemporaria(5000);

  // Nova busca vinda do cabeçalho (?q=) substitui o filtro local.
  const [lastQuery, setLastQuery] = useState(query);
  if (query !== lastQuery) {
    setLastQuery(query);
    setSearch(query);
    setTab("todos");
  }

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

  const update = (id: string, patch: Partial<ListedAppointment>) =>
    setAppointments((list) => list.map((a) => (a.id === id ? { ...a, ...patch } : a)));

  const reportDelay = (appointment: ListedAppointment) => {
    update(appointment.id, {
      footerInfo: "Atraso informado à portaria",
      footerTone: "warning",
      actions: appointment.actions?.filter((a) => a.kind !== "delay"),
    });
    setFeedback(`Atraso do agendamento ${appointment.code} informado à portaria.`);
  };

  const cancel = (appointment: ListedAppointment) => {
    if (!window.confirm(`Cancelar o agendamento ${appointment.code}? Esta ação não pode ser desfeita.`)) return;
    update(appointment.id, {
      tab: "historico", status: "done", statusText: "Cancelado",
      footerInfo: "Cancelado pelo fornecedor", footerTone: "muted", actions: [],
    });
    setFeedback(`Agendamento ${appointment.code} cancelado e movido para o histórico.`);
  };

  const handleAction = (appointment: ListedAppointment, action: AppointmentAction) => {
    if (action.kind === "delay") reportDelay(appointment);
    else if (action.kind === "cancel") cancel(appointment);
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
      <div className="-mx-4 -mt-6 mb-6 sm:-mx-[22px]">
        <AlertBanner />
      </div>
      <PageHeader onExport={handleExport} />
      <MensagemStatus mensagem={feedback} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section aria-label="Lista de agendamentos">
          <StatusTabs tabs={tabs} active={tab} onChange={setTab} search={search} onSearch={setSearch} />
          <div id="agendamentos-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="space-y-4">
            {visible.length > 0 ? (
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
