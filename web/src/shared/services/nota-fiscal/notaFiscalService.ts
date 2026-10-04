import { api } from "../api";
import type { NotaFiscal } from "./types";

/** Primeiro passo do fornecedor: envia XML ou PDF e o sistema lê tudo. */
const BASE = "/agendamentos/nota-fiscal";

/** POST /agendamentos/nota-fiscal (multipart, campo `arquivo`). */
export async function enviarNotaFiscal(arquivo: File | Blob): Promise<NotaFiscal> {
  const form = new FormData();
  form.append("arquivo", arquivo);
  const { data } = await api.post<NotaFiscal>(BASE, form);
  return data;
}

/** GET /agendamentos/nota-fiscal/{id} */
export async function buscarNotaFiscal(notaId: number): Promise<NotaFiscal> {
  const { data } = await api.get<NotaFiscal>(`${BASE}/${notaId}`);
  return data;
}
