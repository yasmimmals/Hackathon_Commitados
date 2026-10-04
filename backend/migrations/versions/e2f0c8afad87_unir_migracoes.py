"""unir migrações: ramo do login + ramo dos dados históricos

Duas migrations nasceram da mesma base (6d3f0a8c2e57) em paralelo:
  - 7e4a1b9c0d22 -> 8a5c2d7e1f39  (usuários, login e agendamento.criado_por)
  - 7e4b1c9a5f62                  (dados históricos da Cocapec)
Esta migration só junta as duas pontas numa sequência única. Não altera o banco.

Revision ID: e2f0c8afad87
Revises: 8a5c2d7e1f39, 7e4b1c9a5f62
Create Date: 2026-10-04 12:00:00

"""
from typing import Sequence, Union

revision: str = 'e2f0c8afad87'
down_revision: Union[str, Sequence[str], None] = ('8a5c2d7e1f39', '7e4b1c9a5f62')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass