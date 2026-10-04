import { ROTULO_LOCAL } from "@/shared/utils/locais";
import { TIPOS_ITEM } from "../constants";
import type { Boletim, ResumoBoletim } from "../types";
import { linhaDe, pagamentoChapa, quantidadeLinha } from "./calculo";

/** Número no padrão do Excel em português (vírgula decimal, sem separador de milhar). */
const num = (v: number, casas = 2) => v.toFixed(casas).replace(".", ",");
const celula = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;

/**
 * Gera o boletim em CSV (separador ";" e BOM UTF-8), que o Excel abre direto
 * com acentos e colunas corretos, e dispara o download.
 */
export function exportarBoletimExcel(b: Boletim, r: ResumoBoletim) {
  const dataBr = b.data.split("-").reverse().join("/");
  const linhas: (string | number)[][] = [
    ["Boletim de Produção - COCAPEC"],
    ["Data", dataBr],
    ["Armazém", ROTULO_LOCAL[b.local]],
    ["Status", b.status === "FECHADO" ? "Fechado" : "Rascunho"],
    [],
    ["PRODUÇÃO"],
    ["Tipo de item", "Descarga", "Remoção", "Transferência", "Quantidade", "Preço unitário (R$)", "Valor (R$)"],
    ...TIPOS_ITEM.map((t) => {
      const l = linhaDe(b, t.id);
      const qtd = quantidadeLinha(l);
      return [t.descricao, l.descarga, l.remocao, l.transferencia, qtd, num(t.preco, 4), num(qtd * t.preco)];
    }),
    ["Total da produção", "", "", "", "", "", num(r.producaoTotal)],
    [],
    ["EQUIPE TEMPORÁRIA"],
    ["Matrícula", "Nome", "Diária", "Pagamento (R$)"],
    ...b.chapas.map((c) => [c.matricula, c.nome, c.meiaDiaria ? "Meia" : "Completa", num(pagamentoChapa(c, r))]),
    [],
    ["FECHAMENTO"],
    ["Diárias equivalentes", num(r.diariasEquivalentes, 1)],
    ["Valor por diária (R$)", num(r.valorPorDiaria)],
    ["Piso por diária (R$)", num(r.piso)],
    ["Complemento (R$)", num(r.complemento)],
    ["Total a pagar (R$)", num(r.totalPagar)],
  ];
  if (b.observacao) linhas.push([], ["Observação", b.observacao]);

  const csv = linhas.map((l) => l.map(celula).join(";")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `boletim-producao-${b.local.toLowerCase()}-${b.data}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
