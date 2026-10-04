import { api } from "../api";
import type { DataISO } from "../types";
import type { Agendamento, AgendamentoCreate, FiltrosAgendamento, Notificacao, SlotDisponibilidade } from "./types";

const BASE = "/agendamentos";

export async function consultarDisponibilidade(
  data: DataISO,
  notaFiscalId?: number,
): Promise<SlotDisponibilidade[]> {
  const { data: slots } = await api.get<SlotDisponibilidade[]>(`${BASE}/disponibilidade`, {
    params: { data, nota_fiscal_id: notaFiscalId },
  });
  return slots;
}

export async function criarAgendamento(dados: AgendamentoCreate): Promise<Agendamento> {
  const { data } = await api.post<Agendamento>(BASE, dados);
  return data;
}

export async function listarAgendamentos(filtros: FiltrosAgendamento = {}): Promise<Agendamento[]> {
  const { data } = await api.get<Agendamento[]>(BASE, { params: filtros });
  return data;
}

export async function buscarAgendamento(id: number): Promise<Agendamento> {
  const { data } = await api.get<Agendamento>(`${BASE}/${id}`);
  return data;
}

export async function cancelarAgendamento(id: number): Promise<Agendamento> {
  const { data } = await api.post<Agendamento>(`${BASE}/${id}/cancelar`);
  return data;
}

export async function listarNotificacoes(id: number): Promise<Notificacao[]> {
  const { data } = await api.get<Notificacao[]>(`${BASE}/${id}/notificacoes`);
  return data;
}
