import type { Boletim } from "@/shared/services";
import { dataBr } from "@/shared/utils/formatacao";
import { ROTULO_LOCAL } from "@/shared/utils/locais";
import { pagamentoChapa } from "./boletim";

/** Número no padrão do Excel em português (vírgula decimal, sem separador de milhar). */
const num = (v: number | string | null, casas = 2) => Number(v ?? 0).toFixed(casas).replace(".", ",");
const celula = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;

/**
 * Gera o boletim em CSV (separador ";" e BOM UTF-8), que o Excel abre direto
 * com acentos e colunas corretos, e dispara o download.
 */
export function exportarBoletimExcel(b: Boletim) {
  const c = b.calculo;
  const linhas: (string | number)[][] = [
    ["Boletim Diário de Serviços - COCAPEC"],
    ["Data", dataBr(b.data)],
    ["Armazém", b.local ? ROTULO_LOCAL[b.local] : "Geral (Franca)"],
    ["Status", b.status === "FECHADO" ? `Fechado por ${b.fechado_por ?? "-"}` : "Rascunho"],
    [],
    ["PRODUÇÃO"],
    ["Tipo de item", "Descarga", "Remoção", "Transferência", "Quantidade", "Preço unitário (R$)", "Valor (R$)"],
    ...b.linhas.map((l) => [
      l.tipo_item, l.descarga, l.remocao, l.transferencia, l.quantidade_total, num(l.preco_unitario, 4), num(l.valor_linha),
    ]),
    ["Total da produção", "", "", "", "", "", num(c.producao_total)],
    [],
    ["EQUIPE TEMPORÁRIA"],
    ["Matrícula", "Nome", "Diária", "Pagamento (R$)"],
    ...b.equipe.map((ch) => [ch.matricula, ch.nome, ch.meia_diaria ? "Meia" : "Completa", num(pagamentoChapa(ch, b))]),
    [],
    ["FECHAMENTO"],
    ["Chapas", c.chapas],
    ["Meias diárias", c.meias_diarias],
    ["Diárias equivalentes", num(c.diarias_equivalentes, 1)],
    ["Valor por diária (R$)", num(c.valor_por_diaria)],
    ["Piso por diária (R$)", num(c.piso_diaria, 4)],
    ["Piso total (R$)", num(c.piso_total)],
    ["Complemento (R$)", num(c.complemento)],
    ["Total a pagar (R$)", num(c.total_pagar)],
  ];
  if (b.avisos.length) linhas.push([], ["AVISOS"], ...b.avisos.map((a) => [a]));
  if (b.observacao) linhas.push([], ["Observação", b.observacao]);

  const csv = linhas.map((l) => l.map(celula).join(";")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `boletim-producao-${b.data}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
