import { api } from "../api";
import type { CadastroIn, LoginIn, SessaoApi, UsuarioApi } from "./types";

/** Login e cadastro. O token devolvido vai em todo request (ver definirToken em api.ts). */
const BASE = "/auth";

/** POST /auth/login — 401 CREDENCIAIS_INVALIDAS ou USUARIO_INATIVO. */
export async function entrar(dados: LoginIn): Promise<SessaoApi> {
  const { data } = await api.post<SessaoApi>(`${BASE}/login`, dados);
  return data;
}

/** POST /auth/cadastro — já devolve a sessão. 409 EMAIL_JA_CADASTRADO ou CODIGO_INTERNO_INVALIDO. */
export async function cadastrar(dados: CadastroIn): Promise<SessaoApi> {
  const { data } = await api.post<SessaoApi>(`${BASE}/cadastro`, dados);
  return data;
}

/** GET /auth/me — confere se o token salvo ainda vale. */
export async function buscarUsuarioAtual(): Promise<UsuarioApi> {
  const { data } = await api.get<UsuarioApi>(`${BASE}/me`);
  return data;
}
