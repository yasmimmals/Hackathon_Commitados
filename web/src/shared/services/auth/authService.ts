import { api } from "../api";
import type { CadastroIn, LoginIn, SessaoApi, UsuarioApi } from "./types";

const BASE = "/auth";

export async function entrar(dados: LoginIn): Promise<SessaoApi> {
  const { data } = await api.post<SessaoApi>(`${BASE}/login`, dados);
  return data;
}

export async function cadastrar(dados: CadastroIn): Promise<SessaoApi> {
  const { data } = await api.post<SessaoApi>(`${BASE}/cadastro`, dados);
  return data;
}

export async function buscarUsuarioAtual(): Promise<UsuarioApi> {
  const { data } = await api.get<UsuarioApi>(`${BASE}/me`);
  return data;
}
