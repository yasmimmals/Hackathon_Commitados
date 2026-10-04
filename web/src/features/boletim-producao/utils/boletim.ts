import type { Boletim, Chapa, ChapaNoBoletim } from "@/shared/services";

/** Limite do formulário de papel (o backend recusa acima disso: LIMITE_CHAPAS). */
export const MAX_CHAPAS = 20;

/** O chapa recebe o maior entre o rateio da produção e o piso, proporcional à diária. */
export function pagamentoChapa(c: ChapaNoBoletim, b: Boletim): number {
  const porDiaria = Math.max(Number(b.calculo.valor_por_diaria ?? 0), Number(b.calculo.piso_diaria));
  return porDiaria * (c.meia_diaria ? 0.5 : 1);
}

/** `aviso`: não impede o fechamento (o backend também só avisa). */
export type Verificacao = { regra: string; ok: boolean; detalhe?: string; aviso?: boolean };

/**
 * Conferência antes de fechar. O backend já impede repetição, excesso e matrícula fora do
 * cadastro; aqui a tela mostra o estado e os avisos do backend (que não bloqueiam).
 */
export function verificarBoletim(b: Boletim, chapas: Chapa[]): Verificacao[] {
  const temporarios = new Set(chapas.filter((c) => c.ativo).map((c) => c.matricula));
  const foraDoCadastro = b.equipe.filter((c) => !temporarios.has(c.matricula)).map((c) => c.matricula);
  return [
    { regra: "Pelo menos um chapa escalado", ok: b.equipe.length > 0 },
    {
      regra: `Até ${MAX_CHAPAS} chapas por boletim`,
      ok: b.equipe.length <= MAX_CHAPAS,
      detalhe: `${b.equipe.length} escalado(s)`,
    },
    { regra: "Sem chapa repetido", ok: new Set(b.equipe.map((c) => c.matricula)).size === b.equipe.length },
    {
      regra: "Somente chapas temporários do cadastro (sem efetivos)",
      ok: foraDoCadastro.length === 0,
      detalhe: foraDoCadastro.join(", ") || undefined,
    },
    {
      regra: "Produção lançada",
      ok: b.linhas.length > 0,
      aviso: true,
      detalhe: b.linhas.length ? undefined : "Sem produção, o dia inteiro é pago como complemento",
    },
  ];
}
