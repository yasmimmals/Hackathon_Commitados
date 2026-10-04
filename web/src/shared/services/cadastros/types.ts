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
