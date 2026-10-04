import { api } from "../api";
import type { NotaFiscal } from "./types";

const BASE = "/agendamentos/nota-fiscal";

export async function enviarNotaFiscal(arquivo: File | Blob): Promise<NotaFiscal> {
  const form = new FormData();
  form.append("arquivo", arquivo);
  const { data } = await api.post<NotaFiscal>(BASE, form);
  return data;
}

export async function buscarNotaFiscal(notaId: number): Promise<NotaFiscal> {
  const { data } = await api.get<NotaFiscal>(`${BASE}/${notaId}`);
  return data;
}
