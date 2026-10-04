"""Regra do piso do boletim (dossiê, seção 8). Função pura: sem banco, fácil de testar.

    diárias equivalentes = nº de chapas − 0,5 para cada meia diária
    valor por diária     = produção total ÷ diárias equivalentes
    se valor por diária < piso:  total = piso × diárias equivalentes
                                 complemento = total − produção
    senão:                       total = produção, complemento = 0      (não há teto)

Tudo em Decimal, SEM arredondar no meio. Só a apresentação arredonda (2 casas, half-up).
É a mesma conta da planilha da Cocapec (célula J65 = MÁXIMO(J64; piso) × diárias).
"""
from dataclasses import dataclass
from decimal import ROUND_HALF_UP, Decimal
from typing import Optional

ZERO = Decimal("0")
MEIO = Decimal("0.5")
CENTAVO = Decimal("0.01")


def arredondar(valor: Optional[Decimal]) -> Optional[Decimal]:
    return None if valor is None else Decimal(valor).quantize(CENTAVO, rounding=ROUND_HALF_UP)


@dataclass(frozen=True)
class ResultadoBoletim:
    producao_total: Decimal
    diarias_equivalentes: Decimal
    valor_por_diaria: Optional[Decimal]   # None quando não há equipe lançada
    piso_total: Decimal                   # piso × diárias equivalentes
    total_pagar: Decimal                  # custo da operação no dia
    complemento: Decimal                  # quanto se pagou acima do produzido

    @property
    def abaixo_do_piso(self) -> bool:
        return self.complemento > 0


def calcular(linhas: list[tuple[int, Decimal]], n_chapas: int, n_meias: int,
             piso: Decimal) -> ResultadoBoletim:
    """linhas: [(quantidade_total, preco_unitario), ...]"""
    if n_meias > n_chapas:
        raise ValueError("Mais meias diárias do que chapas")
    producao = sum((Decimal(q) * Decimal(p) for q, p in linhas), ZERO)
    diarias = Decimal(n_chapas) - MEIO * n_meias
    piso_total = piso * diarias

    if diarias == 0:                       # sem equipe: nada a garantir
        return ResultadoBoletim(producao, diarias, None, ZERO, producao, ZERO)

    valor_por_diaria = producao / diarias
    if valor_por_diaria < piso:
        return ResultadoBoletim(producao, diarias, valor_por_diaria, piso_total,
                                piso_total, piso_total - producao)
    return ResultadoBoletim(producao, diarias, valor_por_diaria, piso_total, producao, ZERO)