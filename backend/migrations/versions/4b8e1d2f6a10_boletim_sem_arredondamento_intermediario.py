"""boletim sem arredondamento intermediário

Dinheiro do boletim passa de NUMERIC(12,2) para NUMERIC(16,6): arredondar só na saída.
Com 2 casas o complemento do exemplo do dossiê dá 73,70 em vez de 73,71.
6 casas porque meio piso (0,5 x 90,1731 = 45,08655) já tem 5.
Também: origem_dado e fechado_por no boletim.

Revision ID: 4b8e1d2f6a10
Revises: 3a7f2c9d1e04
Create Date: 2026-10-03 21:30:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '4b8e1d2f6a10'
down_revision: Union[str, Sequence[str], None] = '3a7f2c9d1e04'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

COLUNAS_DINHEIRO = ["producao_total", "valor_por_diaria", "total_pagar", "complemento"]


def upgrade() -> None:
    op.add_column('boletins_diarios', sa.Column(
        'origem_dado', sa.Enum('HISTORICO', 'SISTEMA', 'TESTE', name='origem',
                               native_enum=False, length=30),
        server_default='SISTEMA', nullable=False))
    op.add_column('boletins_diarios', sa.Column('fechado_por', sa.String(), nullable=True))
    for col in COLUNAS_DINHEIRO:
        op.alter_column('boletins_diarios', col,
                        existing_type=sa.NUMERIC(precision=12, scale=2),
                        type_=sa.Numeric(precision=16, scale=6))


def downgrade() -> None:
    for col in COLUNAS_DINHEIRO:
        op.alter_column('boletins_diarios', col,
                        existing_type=sa.Numeric(precision=16, scale=6),
                        type_=sa.NUMERIC(precision=12, scale=2))
    op.drop_column('boletins_diarios', 'fechado_por')
    op.drop_column('boletins_diarios', 'origem_dado')