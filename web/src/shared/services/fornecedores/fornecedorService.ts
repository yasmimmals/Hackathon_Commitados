import { api } from "../api";
import type { FiltrosFornecedor, Fornecedor, FornecedorCreate } from "./types";

const BASE = "/fornecedores";

export async function criarFornecedor(dados: FornecedorCreate): Promise<Fornecedor> {
  const { data } = await api.post<Fornecedor>(BASE, dados);
  return data;
}

export async function listarFornecedores(filtros: FiltrosFornecedor = {}): Promise<Fornecedor[]> {
  const { data } = await api.get<Fornecedor[]>(BASE, { params: filtros });
  return data;
}
