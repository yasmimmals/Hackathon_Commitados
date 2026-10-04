"""agendamento criado por

- agendamentos.criado_por_id: usuário que agendou. A NF pode ser de outra empresa, então o
  fornecedor logado enxerga o que é da empresa dele e o que ele mesmo agendou.

Revision ID: 8a5c2d7e1f39
Revises: 7e4a1b9c0d22
Create Date: 2026-10-04 10:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '8a5c2d7e1f39'
down_revision: Union[str, Sequence[str], None] = '7e4a1b9c0d22'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('agendamentos', sa.Column('criado_por_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_agendamentos_criado_por', 'agendamentos', 'usuarios', ['criado_por_id'], ['id'])
    op.create_index(op.f('ix_agendamentos_criado_por_id'), 'agendamentos', ['criado_por_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_agendamentos_criado_por_id'), table_name='agendamentos')
    op.drop_constraint('fk_agendamentos_criado_por', 'agendamentos', type_='foreignkey')
    op.drop_column('agendamentos', 'criado_por_id')
