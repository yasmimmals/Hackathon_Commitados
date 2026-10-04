"""e-mail do fornecedor e notificações

- fornecedores.email: contato informado no agendamento (o cadastro da Cocapec não traz)
- notificacoes: histórico dos avisos (aprovado, reprovado, doca definida, reagendado)
- novo motivo SEM_PEDIDO: não exige DDL (enum guardado como VARCHAR)

Revision ID: 6d3f0a8c2e57
Revises: 5c2a9e7b3d41
Create Date: 2026-10-03 23:50:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '6d3f0a8c2e57'
down_revision: Union[str, Sequence[str], None] = '5c2a9e7b3d41'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('fornecedores', sa.Column('email', sa.String(), nullable=True))
    op.create_table('notificacoes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('agendamento_id', sa.Integer(), nullable=False),
        sa.Column('tipo', sa.Enum('APROVADO', 'REPROVADO', 'DESTINO_DEFINIDO', 'REAGENDADO_CHUVA',
                                  name='tiponotificacao', native_enum=False, length=30),
                  nullable=False),
        sa.Column('destinatario', sa.String(), nullable=True),
        sa.Column('assunto', sa.String(), nullable=False),
        sa.Column('corpo', sa.Text(), nullable=False),
        sa.Column('status', sa.Enum('ENVIADA', 'SIMULADA', 'SEM_DESTINATARIO', 'FALHOU',
                                    name='statusnotificacao', native_enum=False, length=30),
                  nullable=False),
        sa.Column('erro', sa.Text(), nullable=True),
        sa.Column('criado_em', sa.DateTime(timezone=True), server_default=sa.text('now()'),
                  nullable=False),
        sa.ForeignKeyConstraint(['agendamento_id'], ['agendamentos.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_notificacoes_agendamento_id'), 'notificacoes', ['agendamento_id'],
                    unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_notificacoes_agendamento_id'), table_name='notificacoes')
    op.drop_table('notificacoes')
    op.drop_column('fornecedores', 'email')