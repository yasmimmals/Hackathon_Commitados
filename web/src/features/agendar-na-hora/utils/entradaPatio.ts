import { placaValida } from "@/shared/utils/placa";
import type { YardEntry, YardEntryErrors } from "../types";

const DIGITOS_CHAVE_NFE = 44;

export function validarEntrada(entry: YardEntry): YardEntryErrors {
  const errors: YardEntryErrors = {};
  if (entry.nfeKey.length !== DIGITOS_CHAVE_NFE) {
    errors.nfeKey = `A chave precisa ter ${DIGITOS_CHAVE_NFE} dígitos (faltam ${DIGITOS_CHAVE_NFE - entry.nfeKey.length}).`;
  }
  if (!placaValida(entry.plate)) errors.plate = "Informe uma placa válida, ex.: BRA2E19.";
  if (entry.driver.trim().length < 3) errors.driver = "Informe o nome do motorista.";
  if (entry.whatsapp.replace(/\D/g, "").length < 10) errors.whatsapp = "Informe um WhatsApp com DDD.";
  if (!entry.acknowledged) errors.acknowledged = "Confirme a declaração para entrar na fila.";
  return errors;
}

export const mascararChaveNfe = (valor: string) => valor.replace(/\D/g, "").slice(0, DIGITOS_CHAVE_NFE);

/** Formata como (16) 99876-5432. */
export function mascararTelefone(valor: string) {
  const d = valor.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** Simula a leitura do código de barras da NF-e. */
export const gerarChaveNfeAleatoria = () =>
  Array.from({ length: DIGITOS_CHAVE_NFE }, () => Math.floor(Math.random() * 10)).join("");
