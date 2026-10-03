"""baias, equipamentos e origem do dado

- baias: onde o caminhão encosta; definida pelo armazém logo após o Compras aprovar
- equipamentos: catálogo fixo (dossiê, seção 6)
- descargas.baia_id
- origem_dado (HISTORICO | SISTEMA | TESTE) em agendamentos e fornecedores
- fornecedores.cnpj deixa de ser único (cadastro real: 872 linhas, 870 CNPJs)
- status DESTINO_DEFINIDO: não exige DDL (enum guardado como VARCHAR)

Revision ID: 3a7f2c9d1e04
Revises: 1cc5b7f394f2
Create Date: 2026-10-03 20:10:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '3a7f2c9d1e04'
down_revision: Union[str, Sequence[str], None] = '1cc5b7f394f2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

ORIGEM = sa.Enum('HISTORICO', 'SISTEMA', 'TESTE', name='origem', native_enum=False, length=30)


def upgrade() -> None:
    op.create_table('baias',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('local', sa.Enum('INSUMOS', 'ADUBO', 'MAQUINAS', 'LOJA', name='localfisico',
                                   native_enum=False, length=30), nullable=False),
        sa.Column('codigo', sa.String(length=20), nullable=False),
        sa.Column('nome', sa.String(), nullable=False),
        sa.Column('ativa', sa.Boolean(), server_default='true', nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('local', 'codigo', name='uq_baia_local_codigo'),
    )
    op.create_index(op.f('ix_baias_local'), 'baias', ['local'], unique=False)

    op.create_table('equipamentos',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('codigo', sa.String(length=40), nullable=False),
        sa.Column('nome', sa.String(), nullable=False),
        sa.Column('quantidade', sa.Integer(), nullable=True),
        sa.Column('observacao', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('codigo'),
    )

    op.add_column('agendamentos', sa.Column('origem_dado', ORIGEM, server_default='SISTEMA', nullable=False))
    op.add_column('fornecedores', sa.Column('origem_dado', ORIGEM, server_default='SISTEMA', nullable=False))

    op.add_column('descargas', sa.Column('baia_id', sa.Integer(), nullable=True))
    op.create_index(op.f('ix_descargas_baia_id'), 'descargas', ['baia_id'], unique=False)
    op.create_foreign_key('fk_descargas_baia', 'descargas', 'baias', ['baia_id'], ['id'])

    op.drop_index('ix_fornecedores_cnpj', table_name='fornecedores')
    op.create_index(op.f('ix_fornecedores_cnpj'), 'fornecedores', ['cnpj'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_fornecedores_cnpj'), table_name='fornecedores')
    op.create_index('ix_fornecedores_cnpj', 'fornecedores', ['cnpj'], unique=True)
    op.drop_constraint('fk_descargas_baia', 'descargas', type_='foreignkey')
    op.drop_index(op.f('ix_descargas_baia_id'), table_name='descargas')
    op.drop_column('descargas', 'baia_id')
    op.drop_column('fornecedores', 'origem_dado')
    op.drop_column('agendamentos', 'origem_dado')
    op.drop_table('equipamentos')
    op.drop_index(op.f('ix_baias_local'), table_name='baias')
    op.drop_table('baias')