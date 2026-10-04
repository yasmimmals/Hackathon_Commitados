"""usuários e login

- usuarios: acesso ao sistema por e-mail e senha (hash PBKDF2-SHA256 com sal)
- perfil: FORNECEDOR (vinculado a uma empresa), COMPRAS, ARMAZEM ou ADMIN

Revision ID: 7e4a1b9c0d22
Revises: 6d3f0a8c2e57
Create Date: 2026-10-04 00:30:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '7e4a1b9c0d22'
down_revision: Union[str, Sequence[str], None] = '6d3f0a8c2e57'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('usuarios',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('nome', sa.String(), nullable=False),
        sa.Column('senha_hash', sa.String(), nullable=False),
        sa.Column('perfil', sa.Enum('FORNECEDOR', 'COMPRAS', 'ARMAZEM', 'ADMIN',
                                    name='perfilusuario', native_enum=False, length=30),
                  nullable=False),
        sa.Column('fornecedor_id', sa.Integer(), nullable=True),
        sa.Column('ativo', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('criado_em', sa.DateTime(timezone=True), server_default=sa.text('now()'),
                  nullable=False),
        sa.ForeignKeyConstraint(['fornecedor_id'], ['fornecedores.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint("perfil <> 'FORNECEDOR' OR fornecedor_id IS NOT NULL",
                           name='ck_usuario_fornecedor_tem_empresa'),
    )
    op.create_index(op.f('ix_usuarios_email'), 'usuarios', ['email'], unique=True)
    op.create_index(op.f('ix_usuarios_fornecedor_id'), 'usuarios', ['fornecedor_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_usuarios_fornecedor_id'), table_name='usuarios')
    op.drop_index(op.f('ix_usuarios_email'), table_name='usuarios')
    op.drop_table('usuarios')
