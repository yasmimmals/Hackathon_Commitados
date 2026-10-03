import type { Horario } from "@/shared/services";
import { placaValida } from "@/shared/utils/placa";
import type { YardEntry, YardEntryErrors } from "../types";

/** Fim de cada janela de descarga (mesma grade do backend). */
const FIM_DA_JANELA: [Horario, string][] = [
  ["08:00", "10:00"],
  ["10:00", "13:00"],
  ["13:00", "15:00"],
  ["15:00", "17:30"],
];

/** Janela em que o encaixe entra agora; `undefined` se o recebimento do dia já terminou. */
export function janelaAtual(agora = new Date()): Horario | undefined {
  const hhmm = agora.toTimeString().slice(0, 5);
  return FIM_DA_JANELA.find(([, fim]) => hhmm < fim)?.[0];
}

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
