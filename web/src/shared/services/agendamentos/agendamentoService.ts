import { api } from "../api";
import type { DataISO } from "../types";
import type { Agendamento, AgendamentoCreate, FiltrosAgendamento, Notificacao, SlotDisponibilidade } from "./types";

/**
 * Rotas do fornecedor.
 *
 * Fluxo:
 *  1. enviarNotaFiscal         -> ver nota-fiscal/notaFiscalService.ts
 *  2. consultarDisponibilidade -> vagas + previsão de chuva (se adubo)
 *  3. criarAgendamento         -> escolhe acondicionamento, dia e horário
 */
const BASE = "/agendamentos";

/** GET /agendamentos/disponibilidade — informe a nota para receber a previsão de chuva (adubo). */
export async function consultarDisponibilidade(
  data: DataISO,
  notaFiscalId?: number,
): Promise<SlotDisponibilidade[]> {
  const { data: slots } = await api.get<SlotDisponibilidade[]>(`${BASE}/disponibilidade`, {
    params: { data, nota_fiscal_id: notaFiscalId },
  });
  return slots;
}

/** POST /agendamentos — 409 com `codigo` (ex.: VAGA_OCUPADA) quando a regra não permite. */
export async function criarAgendamento(dados: AgendamentoCreate): Promise<Agendamento> {
  const { data } = await api.post<Agendamento>(BASE, dados);
  return data;
}

/** GET /agendamentos */
export async function listarAgendamentos(filtros: FiltrosAgendamento = {}): Promise<Agendamento[]> {
  const { data } = await api.get<Agendamento[]>(BASE, { params: filtros });
  return data;
}

/** GET /agendamentos/{id} */
export async function buscarAgendamento(id: number): Promise<Agendamento> {
  const { data } = await api.get<Agendamento>(`${BASE}/${id}`);
  return data;
}

/** POST /agendamentos/{id}/cancelar — exige antecedência mínima de 24h. */
export async function cancelarAgendamento(id: number): Promise<Agendamento> {
  const { data } = await api.post<Agendamento>(`${BASE}/${id}/cancelar`);
  return data;
}

/** GET /agendamentos/{id}/notificacoes — avisos enviados ao fornecedor sobre o agendamento. */
export async function listarNotificacoes(id: number): Promise<Notificacao[]> {
  const { data } = await api.get<Notificacao[]>(`${BASE}/${id}/notificacoes`);
  return data;
}
