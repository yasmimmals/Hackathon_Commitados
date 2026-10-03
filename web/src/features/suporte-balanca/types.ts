import type { ErrosFormulario } from "@/shared/utils/formulario";

export type Assunto = "pesagem" | "agendamento" | "nfe" | "atraso";

export interface Chamado {
  assunto: Assunto;
  motorista: string;
  placa: string;
  codigo: string;
  descricao: string;
}

export type ChamadoErros = ErrosFormulario<Chamado>;

export interface FaqItem {
  id: string;
  pergunta: string;
  resposta: string;
}

export interface FaqGrupo {
  id: string;
  titulo: string;
  itens: FaqItem[];
}
