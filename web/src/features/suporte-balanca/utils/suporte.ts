import { placaValida } from "@/shared/utils/placa";
import type { Chamado, ChamadoErros, FaqGrupo } from "../types";

export const CHAMADO_VAZIO: Chamado = { assunto: "pesagem", motorista: "", placa: "", codigo: "", descricao: "" };

export function validarChamado(c: Chamado): ChamadoErros {
  const erros: ChamadoErros = {};
  if (c.motorista.trim().length < 3) erros.motorista = "Informe o nome do motorista ou transportadora.";
  if (!placaValida(c.placa)) erros.placa = "Informe uma placa válida, ex.: BRA2E19.";
  if (c.descricao.trim().length < 10) erros.descricao = "Descreva a situação com pelo menos 10 caracteres.";
  return erros;
}

/** Remove acentos e caixa para comparar textos. */
const normalizar = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Mantém só as perguntas que contêm todos os termos buscados (grupos vazios saem). */
export function filtrarFaq(faq: FaqGrupo[], busca: string): FaqGrupo[] {
  const termos = normalizar(busca).split(/\s+/).filter(Boolean);
  if (termos.length === 0) return faq;
  return faq
    .map((g) => ({
      ...g,
      itens: g.itens.filter((i) => {
        const texto = normalizar(`${g.titulo} ${i.pergunta} ${i.resposta}`);
        return termos.every((t) => texto.includes(t));
      }),
    }))
    .filter((g) => g.itens.length > 0);
}

export const idsDasPerguntas = (grupos: FaqGrupo[]) => grupos.flatMap((g) => g.itens.map((i) => i.id));

export const horaAgora = () => new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
