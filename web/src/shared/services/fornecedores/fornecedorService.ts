import { api } from "../api";
import type { FiltrosFornecedor, Fornecedor, FornecedorCreate } from "./types";

const BASE = "/fornecedores";

/** POST /fornecedores — 409 FORNECEDOR_DUPLICADO se o código já existir. */
export async function criarFornecedor(dados: FornecedorCreate): Promise<Fornecedor> {
  const { data } = await api.post<Fornecedor>(BASE, dados);
  return data;
}

/** GET /fornecedores — `q` busca por nome ou CNPJ. */
export async function listarFornecedores(filtros: FiltrosFornecedor = {}): Promise<Fornecedor[]> {
  const { data } = await api.get<Fornecedor[]>(BASE, { params: filtros });
  return data;
}
