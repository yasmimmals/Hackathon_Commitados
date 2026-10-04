import { api } from "../api";
import type { Agendamento } from "../agendamentos/types";
import type { AprovacaoIn, Conferencia, RejeicaoIn } from "./types";

/** Rotas de Compras: analisa os agendamentos pendentes do fornecedor. */
const BASE = "/agendamentos";

/** GET /agendamentos/{id}/conferencia — nota lida + checagens automáticas. */
export async function buscarConferencia(id: number): Promise<Conferencia> {
  const { data } = await api.get<Conferencia>(`${BASE}/${id}/conferencia`);
  return data;
}

/** POST /agendamentos/{id}/aprovar */
export async function aprovarAgendamento(id: number, dados: AprovacaoIn): Promise<Agendamento> {
  const { data } = await api.post<Agendamento>(`${BASE}/${id}/aprovar`, dados);
  return data;
}

/** POST /agendamentos/{id}/rejeitar */
export async function rejeitarAgendamento(id: number, dados: RejeicaoIn): Promise<Agendamento> {
  const { data } = await api.post<Agendamento>(`${BASE}/${id}/rejeitar`, dados);
  return data;
}
