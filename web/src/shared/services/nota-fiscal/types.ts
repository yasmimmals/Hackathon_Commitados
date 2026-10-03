import type { Fornecedor } from "../fornecedores/types";
import type { DataISO, Decimal } from "../types";

export type ItemNotaFiscal = {
  codigo_fornecedor: string | null;
  descricao: string | null;
  ncm: string | null;
  quantidade: string | null;
  unidade: string | null;
};

export type NotaFiscal = {
  id: number;
  chave: string;
  numero: string | null;
  serie: string | null;
  data_emissao: DataISO | null;
  fornecedor: Fornecedor;
  valor_total: Decimal | null;
  peso_bruto_kg: Decimal | null;
  peso_liquido_kg: Decimal | null;
  volumes: number | null;
  especie: string | null;
  carga_adubo: boolean;
  itens: ItemNotaFiscal[];
  alertas: string[];
  formato: string;
};
