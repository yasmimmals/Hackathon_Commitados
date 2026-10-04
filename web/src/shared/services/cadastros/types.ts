import type { LocalFisico } from "../types";

export type BaiaCreate = {
  local: LocalFisico;
  codigo: string;
  nome: string;
};

export type Baia = {
  id: number;
  local: LocalFisico;
  codigo: string;
  nome: string;
  ativa: boolean;
};

export type FiltrosBaia = {
  local?: LocalFisico;
  incluir_inativas?: boolean;
};

export type Equipamento = {
  id: number;
  codigo: string;
  nome: string;
  quantidade: number | null;
  observacao: string | null;
};

// ---------- Chapas e tipos de item (boletim) ----------

export type Chapa = {
  id: number;
  matricula: string;
  nome: string;
  ativo: boolean;
};

export type ChapaCreate = { matricula: string; nome: string };

export type TipoItem = {
  id: number;
  descricao: string;
  /** Preço por unidade movimentada (Decimal em string). */
  preco_unitario: string;
  ativo: boolean;
};
