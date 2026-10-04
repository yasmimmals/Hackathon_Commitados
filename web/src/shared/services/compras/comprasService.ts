import { api } from "../api";
import type { Agendamento } from "../agendamentos/types";
import type { AprovacaoIn, RejeicaoIn } from "./types";

/** Rotas de Compras: analisa os agendamentos pendentes do fornecedor. */
const BASE = "/agendamentos";

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
