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

const BASE = "/armazem";

export async function buscarProgramacao(filtros: FiltrosProgramacao = {}): Promise<Programacao> {
  const { data } = await api.get<Programacao>(`${BASE}/programacao`, { params: filtros });
  return data;
}

export async function listarAguardandoDestino(data?: DataISO): Promise<Agendamento[]> {
  const { data: lista } = await api.get<Agendamento[]>(`${BASE}/aguardando-destino`, {
    params: { data },
  });
  return lista;
}

export async function listarFila(data: DataISO, local?: LocalFisico): Promise<Agendamento[]> {
  const { data: lista } = await api.get<Agendamento[]>(`${BASE}/fila`, { params: { data, local } });
  return lista;
}

export async function agendarBalcao(dados: BalcaoCreate): Promise<Agendamento> {
  const { data } = await api.post<Agendamento>(`${BASE}/balcao`, dados);
  return data;
}

export async function definirDestinos(id: number, destinos: DestinoIn[]): Promise<Agendamento> {
  const { data } = await api.put<Agendamento>(`${BASE}/agendamentos/${id}/destinos`, { destinos });
  return data;
}

export async function registrarChegada(id: number): Promise<Agendamento> {
  const { data } = await api.post<Agendamento>(`${BASE}/agendamentos/${id}/chegada`);
  return data;
}

export async function iniciarDescarga(id: number, local: LocalFisico): Promise<Agendamento> {
  const { data } = await api.post<Agendamento>(`${BASE}/agendamentos/${id}/entrada`, { local });
  return data;
}

export async function finalizarDescarga(id: number, dados: SaidaIn): Promise<Agendamento> {
  const { data } = await api.post<Agendamento>(`${BASE}/agendamentos/${id}/saida`, dados);
  return data;
}

export async function marcarNaoCompareceu(id: number): Promise<Agendamento> {
  const { data } = await api.post<Agendamento>(`${BASE}/agendamentos/${id}/nao-compareceu`);
  return data;
}

export async function reagendarPorChuva(id: number, dados: ReagendamentoChuvaIn = {}): Promise<Agendamento> {
  const { data } = await api.post<Agendamento>(`${BASE}/agendamentos/${id}/reagendar-chuva`, dados);
  return data;
}
