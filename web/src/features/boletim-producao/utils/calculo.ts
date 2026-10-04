import type { LocalFisico } from "@/shared/services";
import { ROTULO_LOCAL } from "@/shared/utils/locais";
import { EFETIVOS, MAX_CHAPAS, PISO_DIARIA, TIPOS_ITEM } from "../constants";
import type { Boletim, ChapaEscalado, LinhaProducao, ResumoBoletim } from "../types";

const LINHA_VAZIA: LinhaProducao = { descarga: 0, remocao: 0, transferencia: 0 };

export const linhaDe = (b: Boletim, tipoId: number) => b.producoes[tipoId] ?? LINHA_VAZIA;
export const quantidadeLinha = (l: LinhaProducao) => l.descarga + l.remocao + l.transferencia;
export const pesoDiaria = (c: ChapaEscalado) => (c.meiaDiaria ? 0.5 : 1);

/**
 * Cálculo do boletim (mesma regra do modelo `boletins_diarios`):
 * produção = Σ quantidade × preço; valor por diária = produção ÷ diárias equivalentes;
 * abaixo do piso, a cooperativa paga o complemento até o piso.
 */
export function calcularResumo(b: Boletim): ResumoBoletim {
  const producaoTotal = TIPOS_ITEM.reduce((t, tipo) => t + quantidadeLinha(linhaDe(b, tipo.id)) * tipo.preco, 0);
  const diariasEquivalentes = b.chapas.reduce((t, c) => t + pesoDiaria(c), 0);
  const valorPorDiaria = diariasEquivalentes ? producaoTotal / diariasEquivalentes : 0;
  const complemento = Math.max(0, PISO_DIARIA * diariasEquivalentes - producaoTotal);
  return {
    producaoTotal,
    diariasEquivalentes,
    valorPorDiaria,
    piso: PISO_DIARIA,
    complemento,
    totalPagar: producaoTotal + complemento,
  };
}

/** Valor a pagar ao chapa: o maior entre o rateio da produção e o piso, proporcional à diária. */
export const pagamentoChapa = (c: ChapaEscalado, r: ResumoBoletim) => Math.max(r.valorPorDiaria, r.piso) * pesoDiaria(c);

export type Verificacao = { regra: string; ok: boolean; detalhe?: string };

const matriculasEfetivas = new Set(EFETIVOS.map((e) => e.matricula));

/**
 * Validação da equipe antes do fechamento: até 20 chapas, sem repetição
 * (nem no mesmo boletim nem em outro armazém no mesmo dia) e sem efetivos.
 */
export function validarEquipe(b: Boletim, outrosDoDia: Boletim[]): Verificacao[] {
  const matriculas = b.chapas.map((c) => c.matricula.trim().toUpperCase());
  const repetidas = [...new Set(matriculas.filter((m, i) => matriculas.indexOf(m) !== i))];
  const efetivos = matriculas.filter((m) => matriculasEfetivas.has(m));
  const emOutroArmazem = outrosDoDia.flatMap((o) =>
    o.chapas
      .filter((c) => matriculas.includes(c.matricula.trim().toUpperCase()))
      .map((c) => `${c.matricula} (${ROTULO_LOCAL[o.local as LocalFisico]})`),
  );
  const incompletos = b.chapas.filter((c) => !c.matricula.trim() || !c.nome.trim()).length;

  return [
    { regra: "Pelo menos um chapa escalado", ok: b.chapas.length > 0 },
    {
      regra: `Até ${MAX_CHAPAS} chapas por boletim`,
      ok: b.chapas.length <= MAX_CHAPAS,
      detalhe: b.chapas.length > MAX_CHAPAS ? `${b.chapas.length} escalados` : undefined,
    },
    { regra: "Matrícula e nome preenchidos", ok: incompletos === 0, detalhe: incompletos ? `${incompletos} linha(s) incompleta(s)` : undefined },
    { regra: "Sem chapa repetido no boletim", ok: repetidas.length === 0, detalhe: repetidas.join(", ") || undefined },
    {
      regra: "Sem chapa em outro armazém no mesmo dia",
      ok: emOutroArmazem.length === 0,
      detalhe: emOutroArmazem.join(", ") || undefined,
    },
    { regra: "Sem funcionários efetivos", ok: efetivos.length === 0, detalhe: efetivos.join(", ") || undefined },
  ];
}

export const moeda = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const decimal = (v: number, casas = 1) => v.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
