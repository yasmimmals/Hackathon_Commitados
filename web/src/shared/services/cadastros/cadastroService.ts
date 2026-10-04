import { api } from "../api";
import type { Baia, BaiaCreate, Chapa, ChapaCreate, Equipamento, FiltrosBaia, TipoItem } from "./types";

const BASE = "/cadastros";

export async function listarBaias(filtros: FiltrosBaia = {}): Promise<Baia[]> {
  const { data } = await api.get<Baia[]>(`${BASE}/baias`, { params: filtros });
  return data;
}

export async function criarBaia(dados: BaiaCreate): Promise<Baia> {
  const { data } = await api.post<Baia>(`${BASE}/baias`, dados);
  return data;
}

export async function definirBaiaAtiva(id: number, ativa: boolean): Promise<Baia> {
  const { data } = await api.patch<Baia>(`${BASE}/baias/${id}/ativa`, null, { params: { ativa } });
  return data;
}

export async function listarEquipamentos(): Promise<Equipamento[]> {
  const { data } = await api.get<Equipamento[]>(`${BASE}/equipamentos`);
  return data;
}

export async function listarChapas(incluirInativos = false): Promise<Chapa[]> {
  const { data } = await api.get<Chapa[]>(`${BASE}/chapas`, { params: { incluir_inativos: incluirInativos } });
  return data;
}

export async function criarChapa(dados: ChapaCreate): Promise<Chapa> {
  const { data } = await api.post<Chapa>(`${BASE}/chapas`, dados);
  return data;
}

export async function listarTiposItem(): Promise<TipoItem[]> {
  const { data } = await api.get<TipoItem[]>(`${BASE}/tipos-item`);
  return data;
}
