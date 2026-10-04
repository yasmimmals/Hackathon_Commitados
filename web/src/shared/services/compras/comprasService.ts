import { api } from "../api";
import type { Agendamento } from "../agendamentos/types";
import type { AprovacaoIn, Conferencia, RejeicaoIn } from "./types";

const BASE = "/agendamentos";

export async function buscarConferencia(id: number): Promise<Conferencia> {
  const { data } = await api.get<Conferencia>(`${BASE}/${id}/conferencia`);
  return data;
}

export async function aprovarAgendamento(id: number, dados: AprovacaoIn): Promise<Agendamento> {
  const { data } = await api.post<Agendamento>(`${BASE}/${id}/aprovar`, dados);
  return data;
}

export async function rejeitarAgendamento(id: number, dados: RejeicaoIn): Promise<Agendamento> {
  const { data } = await api.post<Agendamento>(`${BASE}/${id}/rejeitar`, dados);
  return data;
}
