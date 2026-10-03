import { listarAgendamentos, listarFornecedores, type Agendamento } from "@/shared/services";
import type { Appointment } from "../types";

/** "Empresa Ltda (14.285.390/0001-44)" → "14285390000144" */
export function cnpjDaEmpresa(empresa?: string) {
  const encontrado = empresa?.match(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/)?.[0];
  return encontrado?.replace(/\D/g, "");
}

/**
 * Agendamentos do fornecedor logado. O fornecedor é cadastrado pelo backend
 * ao ler a primeira nota fiscal; sem cadastro ainda, não há agendamentos.
 */
export async function listarDoFornecedor(cnpj: string): Promise<Agendamento[]> {
  const fornecedor = (await listarFornecedores({ q: cnpj })).find((f) => f.cnpj === cnpj);
  return fornecedor ? listarAgendamentos({ fornecedor_id: fornecedor.id }) : [];
}

/** Texto pesquisável de um agendamento (código, produto, NF, placa, motorista...). */
function textoPesquisavel(a: Appointment) {
  return [
    a.code, a.product, a.subtitle, a.meta, a.notice?.reference,
    a.transport?.driver, a.transport?.plate, a.transport?.vehicle, a.transport?.destination,
  ].filter(Boolean).join(" ").toLowerCase();
}

export function correspondeBusca(a: Appointment, busca: string) {
  const termo = busca.trim().toLowerCase();
  return !termo || textoPesquisavel(a).includes(termo);
}

/** Gera e baixa um CSV (separador ";" e BOM para abrir corretamente no Excel). */
export function exportarCsv(agendamentos: Appointment[]) {
  const cabecalho = ["Código", "Data", "Status", "Produto", "Detalhes", "Motorista", "Placa", "Destino"];
  const linhas = agendamentos.map((a) => [
    a.code, a.dateLabel, a.statusText, a.product, a.subtitle ?? "",
    a.transport?.driver ?? "", a.transport?.plate ?? "", a.transport?.destination ?? "",
  ]);
  const csv = [cabecalho, ...linhas]
    .map((linha) => linha.map((v) => `"${v.replace(/"/g, '""')}"`).join(";"))
    .join("\n");

  const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "agendamentos-cocapec.csv";
  link.click();
  URL.revokeObjectURL(url);
}
