import type { LocalFisico } from "@/shared/services";
import type { Boletim } from "../types";

/**
 * Persistência local dos boletins enquanto o backend não expõe rotas para
 * `boletins_diarios`. A interface (ler/salvar/listar por data e armazém) é a
 * mesma que a API terá: trocar a implementação aqui não muda as telas.
 * Atenção: os dados ficam só neste navegador.
 */
const PREFIXO = "cocapec.boletim.";
const chave = (data: string, local: LocalFisico) => `${PREFIXO}${data}.${local}`;

export function lerBoletim(data: string, local: LocalFisico): Boletim | null {
  try {
    const bruto = localStorage.getItem(chave(data, local));
    return bruto ? (JSON.parse(bruto) as Boletim) : null;
  } catch {
    return null;
  }
}

export function salvarBoletim(boletim: Boletim): void {
  try {
    localStorage.setItem(chave(boletim.data, boletim.local), JSON.stringify(boletim));
  } catch {
    throw new Error("Não foi possível salvar o boletim neste navegador.");
  }
}

export function listarBoletins(): Boletim[] {
  const lista: Boletim[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k?.startsWith(PREFIXO)) continue;
      const bruto = localStorage.getItem(k);
      if (bruto) lista.push(JSON.parse(bruto) as Boletim);
    }
  } catch {
    // Armazenamento indisponível: nenhum boletim.
  }
  return lista;
}

export function novoBoletim(data: string, local: LocalFisico): Boletim {
  return { data, local, status: "RASCUNHO", producoes: {}, chapas: [], observacao: "", criadoEm: new Date().toISOString() };
}
