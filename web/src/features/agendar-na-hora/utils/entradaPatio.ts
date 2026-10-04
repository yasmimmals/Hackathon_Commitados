import { placaValida } from "@/shared/utils/placa";
import type { YardEntry, YardEntryErrors } from "../types";

export { janelaAtual } from "@/shared/utils/janelas";

export function validarEntrada(entry: YardEntry): YardEntryErrors {
  const errors: YardEntryErrors = {};
  if (!entry.notaFiscal) errors.notaFiscal = "Anexe a nota fiscal (XML ou PDF) para entrar na fila.";
  if (!placaValida(entry.plate)) errors.plate = "Informe uma placa válida, ex.: BRA2E19.";
  if (entry.driver.trim().length < 3) errors.driver = "Informe o nome do motorista.";
  if (entry.whatsapp.replace(/\D/g, "").length < 10) errors.whatsapp = "Informe um WhatsApp com DDD.";
  if (!entry.acknowledged) errors.acknowledged = "Confirme a declaração para entrar na fila.";
  return errors;
}

/** Formata como (16) 99876-5432. */
export function mascararTelefone(valor: string) {
  const d = valor.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
