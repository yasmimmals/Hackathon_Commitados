import { api } from "../api";
import type { Baia, BaiaCreate, Equipamento, FiltrosBaia } from "./types";

/** Cadastros de apoio: baias (onde o caminhão encosta) e catálogo de equipamentos. */
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
