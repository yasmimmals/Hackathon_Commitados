import type { ErrosFormulario } from "@/shared/utils/formulario";

export type Horario = "08:00" | "10:00" | "13:00" | "15:00";

export type Categoria = "adubo" | "corretivo" | "defensivo" | "outros";

export type Acondicionamento = "paletizado" | "bigbag" | "batido";

export interface NovaEntrega {
  data: string;
  horario: Horario | "";
  categoria: Categoria | "";
  acondicionamento: Acondicionamento | "";
  peso: string;
  notaFiscal: File | null;
  cienteChuva: boolean;
}

export type ErrosEntrega = ErrosFormulario<NovaEntrega>;

export interface EntregaConfirmada {
  protocolo: string;
  entrega: NovaEntrega;
}
