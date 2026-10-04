import type { Origem } from "../types";

export type FornecedorCreate = {
  nome: string;
  /** Pode vir com máscara; o backend guarda só os 14 dígitos. */
  cnpj: string;
  codigo?: string | null;
  email?: string | null;
};

export type Fornecedor = {
  id: number;
  nome: string;
  cnpj: string;
  codigo: string | null;
  origem_dado: Origem;
};

export type FiltrosFornecedor = {
  q?: string;
  limite?: number;
};
