import { api } from "../api";
import type { Boletim, BoletimCreate, ChapaNoBoletimIn, FiltrosBoletim, LinhaProducaoIn } from "./types";

/**
 * Boletim diário dos chapas (responsável pelo armazém).
 * Ordem: abrirBoletim -> lancarProducao / definirEquipe (quantas vezes quiser) -> fecharBoletim.
 */
const BASE = "/boletins";

/** POST /boletins — 409 BOLETIM_JA_EXISTE (detalhes.boletim_id) se o dia já tem boletim. */
export async function abrirBoletim(dados: BoletimCreate): Promise<Boletim> {
  const { data } = await api.post<Boletim>(BASE, dados);
  return data;
}

/** GET /boletins */
export async function listarBoletins(filtros: FiltrosBoletim = {}): Promise<Boletim[]> {
  const { data } = await api.get<Boletim[]>(BASE, { params: filtros });
  return data;
}

/** GET /boletins/{id} */
export async function buscarBoletim(id: number): Promise<Boletim> {
  const { data } = await api.get<Boletim>(`${BASE}/${id}`);
  return data;
}

/** PUT /boletins/{id}/producao — substitui a produção inteira (o que não vier, sai). */
export async function lancarProducao(id: number, linhas: LinhaProducaoIn[]): Promise<Boletim> {
  const { data } = await api.put<Boletim>(`${BASE}/${id}/producao`, { linhas });
  return data;
}

/** PUT /boletins/{id}/equipe — até 20 chapas, sem repetir matrícula; 409 CHAPA_NAO_CADASTRADA. */
export async function definirEquipe(id: number, equipe: ChapaNoBoletimIn[]): Promise<Boletim> {
  const { data } = await api.put<Boletim>(`${BASE}/${id}/equipe`, { equipe });
  return data;
}

/** POST /boletins/{id}/fechar — congela o custo do dia; 409 BOLETIM_SEM_EQUIPE. */
export async function fecharBoletim(id: number, fechadoPor: string): Promise<Boletim> {
  const { data } = await api.post<Boletim>(`${BASE}/${id}/fechar`, { fechado_por: fechadoPor });
  return data;
}

/** POST /boletins/{id}/reabrir */
export async function reabrirBoletim(id: number): Promise<Boletim> {
  const { data } = await api.post<Boletim>(`${BASE}/${id}/reabrir`);
  return data;
}
