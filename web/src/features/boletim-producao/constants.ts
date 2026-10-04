/** Os 14 tipos do boletim com preço unitário (mesmo seed do backend: scripts/seed.py, TIPOS_ITEM). */
export const TIPOS_ITEM: { id: number; descricao: string; preco: number }[] = [
  { id: 1, descricao: "Sacaria malas c/ 25", preco: 0.1824 },
  { id: 2, descricao: "Sacaria malas c/ 40", preco: 0.2635 },
  { id: 3, descricao: "Sacaria malas c/ 50", preco: 0.3224 },
  { id: 4, descricao: "Sacaria fardo c/ 250", preco: 1.178 },
  { id: 5, descricao: "Sacaria fardo c/ 500", preco: 2.3561 },
  { id: 6, descricao: "Peças", preco: 0.3387 },
  { id: 7, descricao: "Máquinas / equipamentos", preco: 0.3224 },
  { id: 8, descricao: "Agroquímico", preco: 0.3224 },
  { id: 9, descricao: "Fertilizantes", preco: 0.3224 },
  { id: 10, descricao: "Sementes", preco: 0.3224 },
  { id: 11, descricao: "Medicamentos", preco: 0.3387 },
  { id: 12, descricao: "Alimentação animal", preco: 0.3387 },
  { id: 13, descricao: "Acessórios agropecuários", preco: 0.3224 },
  { id: 14, descricao: "Serviços diversos", preco: 0.3224 },
];

/**
 * Piso garantido por diária completa (meia diária = metade). Se a produção dividida
 * pelas diárias ficar abaixo dele, a cooperativa paga o complemento.
 * PARÂMETRO A CONFIRMAR com o RH: o backend ainda não define esse valor.
 */
export const PISO_DIARIA = 150;

/** Limite de chapas temporários por boletim. */
export const MAX_CHAPAS = 20;

/**
 * Cadastro de chapas temporários de demonstração (o backend tem a tabela `chapas`,
 * mas ainda sem rota). Nomes anonimizados como nos dados da Cocapec.
 */
export const CHAPAS_CADASTRO: { matricula: string; nome: string }[] = Array.from({ length: 30 }, (_, i) => {
  const n = String(i + 1).padStart(2, "0");
  return { matricula: `CH-0${n}`, nome: `CHAPA_${n}` };
});

/** Funcionários efetivos: não podem entrar no boletim de temporários. Lista de demonstração. */
export const EFETIVOS: { matricula: string; nome: string }[] = Array.from({ length: 8 }, (_, i) => {
  const n = String(i + 1).padStart(2, "0");
  return { matricula: `EF-0${n}`, nome: `EFETIVO_${n}` };
});
