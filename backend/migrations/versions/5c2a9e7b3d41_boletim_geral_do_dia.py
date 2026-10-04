"""boletim geral do dia

A Cocapec preenche um boletim geral por dia (não um por armazém): `local` passa a ser
opcional (vazio = geral) e um índice único parcial garante no máximo um geral por dia.
O modo por armazém continua possível (config.BOLETIM_POR_ARMAZEM).

Revision ID: 5c2a9e7b3d41
Revises: 4b8e1d2f6a10
Create Date: 2026-10-03 22:40:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '5c2a9e7b3d41'
down_revision: Union[str, Sequence[str], None] = '4b8e1d2f6a10'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column('boletins_diarios', 'local',
                    existing_type=sa.VARCHAR(length=30), nullable=True)
    op.create_index('uq_boletim_geral_dia', 'boletins_diarios', ['data'], unique=True,
                    postgresql_where=sa.text('local IS NULL'))


def downgrade() -> None:
    # boletins gerais não têm armazém: não cabem na estrutura antiga
    op.execute("DELETE FROM boletim_producoes WHERE boletim_id IN "
               "(SELECT id FROM boletins_diarios WHERE local IS NULL)")
    op.execute("DELETE FROM boletim_chapas WHERE boletim_id IN "
               "(SELECT id FROM boletins_diarios WHERE local IS NULL)")
    op.execute("DELETE FROM boletins_diarios WHERE local IS NULL")
    op.drop_index('uq_boletim_geral_dia', table_name='boletins_diarios',
                  postgresql_where=sa.text('local IS NULL'))
    op.alter_column('boletins_diarios', 'local',
                    existing_type=sa.VARCHAR(length=30), nullable=False)