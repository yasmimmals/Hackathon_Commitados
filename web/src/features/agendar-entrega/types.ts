import type { ErrosFormulario } from "@/shared/utils/formulario";

export type Horario = "08:00" | "10:00" | "13:00" | "15:00";

export type Categoria = "adubo" | "corretivo" | "defensivo" | "outros";

export type Acondicionamento = "paletizado" | "bigbag" | "batido";

/**
 * Dados do formulário. As chaves também são os ids dos campos na tela,
 * para `focarPrimeiroErro` levar o foco ao campo certo.
 */
export interface NovaEntrega {
  data: string;               // AAAA-MM-DD
  horario: Horario | "";
  categoria: Categoria | "";
  acondicionamento: Acondicionamento | "";
  peso: string;               // toneladas como digitado, ex.: "28,5"
  notaFiscal: File | null;    // PDF ou XML da NF-e
  cienteChuva: boolean;       // obrigatório apenas para Adubo
}

export type ErrosEntrega = ErrosFormulario<NovaEntrega>;

export interface EntregaConfirmada {
  protocolo: string;          // ex.: #AG-88412
  entrega: NovaEntrega;
}
