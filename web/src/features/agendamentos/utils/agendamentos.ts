import type { Appointment } from "../types";

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
