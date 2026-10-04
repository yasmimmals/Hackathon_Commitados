"""aviso de atraso do fornecedor

- agendamentos.atraso_minutos, atraso_motivo e atraso_informado_em: o fornecedor avisa
  que vai atrasar e a equipe do armazém vê o aviso na agenda do dia.

Revision ID: b3d9f2a6c481
Revises: e2f0c8afad87
Create Date: 2026-10-04 06:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'b3d9f2a6c481'
down_revision: Union[str, Sequence[str], None] = 'e2f0c8afad87'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('agendamentos', sa.Column('atraso_minutos', sa.Integer(), nullable=True))
    op.add_column('agendamentos', sa.Column('atraso_motivo', sa.Text(), nullable=True))
    op.add_column('agendamentos', sa.Column('atraso_informado_em', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column('agendamentos', 'atraso_informado_em')
    op.drop_column('agendamentos', 'atraso_motivo')
    op.drop_column('agendamentos', 'atraso_minutos')
