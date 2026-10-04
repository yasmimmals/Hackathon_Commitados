import { api } from "../api";
import type { Baia, BaiaCreate, Chapa, ChapaCreate, Equipamento, FiltrosBaia, TipoItem } from "./types";

/** Cadastros de apoio: baias (onde o caminhão encosta), equipamentos, chapas e tipos de item do boletim. */
const BASE = "/cadastros";

/** GET /cadastros/baias */
export async function listarBaias(filtros: FiltrosBaia = {}): Promise<Baia[]> {
  const { data } = await api.get<Baia[]>(`${BASE}/baias`, { params: filtros });
  return data;
}

/** POST /cadastros/baias — 409 BAIA_DUPLICADA se o código já existir no armazém. */
export async function criarBaia(dados: BaiaCreate): Promise<Baia> {
  const { data } = await api.post<Baia>(`${BASE}/baias`, dados);
  return data;
}

/** PATCH /cadastros/baias/{id}/ativa?ativa=true|false */
export async function definirBaiaAtiva(id: number, ativa: boolean): Promise<Baia> {
  const { data } = await api.patch<Baia>(`${BASE}/baias/${id}/ativa`, null, { params: { ativa } });
  return data;
}

/** GET /cadastros/equipamentos */
export async function listarEquipamentos(): Promise<Equipamento[]> {
  const { data } = await api.get<Equipamento[]>(`${BASE}/equipamentos`);
  return data;
}

/** GET /cadastros/chapas — chapas temporários que podem entrar no boletim. */
export async function listarChapas(incluirInativos = false): Promise<Chapa[]> {
  const { data } = await api.get<Chapa[]>(`${BASE}/chapas`, { params: { incluir_inativos: incluirInativos } });
  return data;
}

/** POST /cadastros/chapas — 409 se a matrícula já existir. */
export async function criarChapa(dados: ChapaCreate): Promise<Chapa> {
  const { data } = await api.post<Chapa>(`${BASE}/chapas`, dados);
  return data;
}

/** GET /cadastros/tipos-item — os tipos do boletim com o preço unitário. */
export async function listarTiposItem(): Promise<TipoItem[]> {
  const { data } = await api.get<TipoItem[]>(`${BASE}/tipos-item`);
  return data;
}
