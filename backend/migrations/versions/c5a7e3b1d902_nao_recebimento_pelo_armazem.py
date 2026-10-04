"""não recebimento registrado pelo armazém

- agendamentos.observacao_nao_recebimento e nao_recebido_em: o responsável pelo armazém
  recusa o caminhão (divergência na conferência ou outro motivo) e descreve o que houve.

Revision ID: c5a7e3b1d902
Revises: b3d9f2a6c481
Create Date: 2026-10-04 06:30:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'c5a7e3b1d902'
down_revision: Union[str, Sequence[str], None] = 'b3d9f2a6c481'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('agendamentos', sa.Column('observacao_nao_recebimento', sa.Text(), nullable=True))
    op.add_column('agendamentos', sa.Column('nao_recebido_em', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column('agendamentos', 'nao_recebido_em')
    op.drop_column('agendamentos', 'observacao_nao_recebimento')
