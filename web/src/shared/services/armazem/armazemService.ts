import { api } from "../api";
import type { Agendamento } from "../agendamentos/types";
import type { DataISO, LocalFisico } from "../types";
import type {
  BalcaoCreate,
  DestinoIn,
  FiltrosProgramacao,
  Programacao,
  ReagendamentoChuvaIn,
  SaidaIn,
} from "./types";

/**
 * Rotas do responsável pelo armazém / operador do pátio.
 *
 * Fluxo: Compras aprova -> aguardando destino -> definirDestinos (baia)
 * -> registrarChegada -> iniciarDescarga (entrada) -> finalizarDescarga (saída).
 */
const BASE = "/armazem";

/** GET /armazem/programacao — o que vai chegar nos próximos dias, com a equipe estimada. */
export async function buscarProgramacao(filtros: FiltrosProgramacao = {}): Promise<Programacao> {
  const { data } = await api.get<Programacao>(`${BASE}/programacao`, { params: filtros });
  return data;
}

/** GET /armazem/aguardando-destino — aprovados por Compras que ainda não têm baia. */
export async function listarAguardandoDestino(data?: DataISO): Promise<Agendamento[]> {
  const { data: lista } = await api.get<Agendamento[]>(`${BASE}/aguardando-destino`, {
    params: { data },
  });
  return lista;
}

/** GET /armazem/fila — fila do dia. */
export async function listarFila(data: DataISO, local?: LocalFisico): Promise<Agendamento[]> {
  const { data: lista } = await api.get<Agendamento[]>(`${BASE}/fila`, { params: { data, local } });
  return lista;
}

/** POST /armazem/balcao — caminhão chegou sem agendamento e há vaga. */
export async function agendarBalcao(dados: BalcaoCreate): Promise<Agendamento> {
  const { data } = await api.post<Agendamento>(`${BASE}/balcao`, dados);
  return data;
}

/** PUT /armazem/agendamentos/{id}/destinos — pode ser mais de um armazém. */
export async function definirDestinos(id: number, destinos: DestinoIn[]): Promise<Agendamento> {
  const { data } = await api.put<Agendamento>(`${BASE}/agendamentos/${id}/destinos`, { destinos });
  return data;
}

/** POST /armazem/agendamentos/{id}/chegada */
export async function registrarChegada(id: number): Promise<Agendamento> {
  const { data } = await api.post<Agendamento>(`${BASE}/agendamentos/${id}/chegada`);
  return data;
}

/** POST /armazem/agendamentos/{id}/entrada — inicia a descarga no armazém informado. */
export async function iniciarDescarga(id: number, local: LocalFisico): Promise<Agendamento> {
  const { data } = await api.post<Agendamento>(`${BASE}/agendamentos/${id}/entrada`, { local });
  return data;
}

/** POST /armazem/agendamentos/{id}/saida — finaliza com chapas e equipamentos usados. */
export async function finalizarDescarga(id: number, dados: SaidaIn): Promise<Agendamento> {
  const { data } = await api.post<Agendamento>(`${BASE}/agendamentos/${id}/saida`, dados);
  return data;
}

/** POST /armazem/agendamentos/{id}/nao-compareceu */
export async function marcarNaoCompareceu(id: number): Promise<Agendamento> {
  const { data } = await api.post<Agendamento>(`${BASE}/agendamentos/${id}/nao-compareceu`);
  return data;
}

/** POST /armazem/agendamentos/{id}/reagendar-chuva — padrão: próximo dia útil às 08:00, com prioridade. */
export async function reagendarPorChuva(id: number, dados: ReagendamentoChuvaIn = {}): Promise<Agendamento> {
  const { data } = await api.post<Agendamento>(`${BASE}/agendamentos/${id}/reagendar-chuva`, dados);
  return data;
}
