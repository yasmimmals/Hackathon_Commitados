"""dados históricos da Cocapec

Tabelas somente leitura carregadas por scripts/carregar_historico.py:
produtos, pedido_itens, recebimentos_historicos (uma linha por nota fiscal) e folha_diaria.

Revision ID: 7e4b1c9a5f62
Revises: 6d3f0a8c2e57
Create Date: 2026-10-04 03:44:48

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '7e4b1c9a5f62'
down_revision: Union[str, Sequence[str], None] = '6d3f0a8c2e57'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

LOCAL = sa.Enum('INSUMOS', 'ADUBO', 'MAQUINAS', 'LOJA', name='localfisico', native_enum=False, length=30)


def upgrade() -> None:
    op.create_table('folha_diaria',
        sa.Column('data', sa.Date(), nullable=False),
        sa.Column('dia_semana', sa.String(length=10), nullable=True),
        sa.Column('chapas_presentes', sa.Integer(), nullable=False),
        sa.Column('chapas_operacao_cafe', sa.Integer(), nullable=False),
        sa.Column('valor_pago', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('suspeito', sa.Boolean(), nullable=False),
        sa.Column('motivo_suspeita', sa.String(), nullable=True),
        sa.PrimaryKeyConstraint('data'),
    )
    op.create_table('pedido_itens',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('pedido', sa.Integer(), nullable=False),
        sa.Column('fornecedor_codigo', sa.String(length=20), nullable=True),
        sa.Column('codigo_item', sa.String(length=20), nullable=False),
        sa.Column('descricao', sa.String(), nullable=True),
        sa.Column('quantidade', sa.Numeric(precision=16, scale=4), nullable=True),
        sa.Column('peso_kg', sa.Numeric(precision=16, scale=3), nullable=True),
        sa.Column('deposito', sa.String(length=20), nullable=True),
        sa.Column('local', LOCAL, nullable=True),
        sa.Column('data_documento', sa.Date(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('pedido', 'codigo_item', name='uq_pedido_item'),
    )
    op.create_index(op.f('ix_pedido_itens_fornecedor_codigo'), 'pedido_itens', ['fornecedor_codigo'], unique=False)
    op.create_index(op.f('ix_pedido_itens_pedido'), 'pedido_itens', ['pedido'], unique=False)
    op.create_table('produtos',
        sa.Column('codigo', sa.String(length=20), nullable=False),
        sa.Column('descricao', sa.String(), nullable=False),
        sa.Column('unidade', sa.String(length=10), nullable=True),
        sa.Column('peso_unitario_kg', sa.Numeric(precision=14, scale=4), nullable=True),
        sa.Column('grupo', sa.String(length=3), nullable=True),
        sa.Column('deposito', sa.String(length=20), nullable=True),
        sa.Column('local', LOCAL, nullable=True),
        sa.PrimaryKeyConstraint('codigo'),
    )
    op.create_index(op.f('ix_produtos_grupo'), 'produtos', ['grupo'], unique=False)
    op.create_table('recebimentos_historicos',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('data', sa.Date(), nullable=False),
        sa.Column('fornecedor_id', sa.Integer(), nullable=True),
        sa.Column('fornecedor_codigo', sa.String(length=20), nullable=True),
        sa.Column('nf_numero', sa.String(length=20), nullable=True),
        sa.Column('chave', sa.String(length=60), nullable=True),
        sa.Column('chave_valida', sa.Boolean(), nullable=False),
        sa.Column('itens', sa.Integer(), nullable=False),
        sa.Column('pedidos', sa.Integer(), nullable=False),
        sa.Column('local_principal', LOCAL, nullable=True),
        sa.Column('locais', sa.String(), nullable=True),
        sa.Column('grupos', sa.String(), nullable=True),
        sa.Column('peso_planilha_kg', sa.Numeric(precision=16, scale=3), nullable=True),
        sa.Column('peso_estimado_kg', sa.Numeric(precision=16, scale=3), nullable=True),
        sa.Column('exige_chapa', sa.Boolean(), nullable=False),
        sa.Column('alertas', postgresql.JSONB(astext_type=sa.Text()), server_default='[]', nullable=False),
        sa.Column('origem_dado', sa.Enum('HISTORICO', 'SISTEMA', 'TESTE', name='origem',
                                         native_enum=False, length=30),
                  server_default='HISTORICO', nullable=False),
        sa.ForeignKeyConstraint(['fornecedor_id'], ['fornecedores.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_recebimentos_historicos_chave'), 'recebimentos_historicos', ['chave'], unique=False)
    op.create_index(op.f('ix_recebimentos_historicos_data'), 'recebimentos_historicos', ['data'], unique=False)
    op.create_index(op.f('ix_recebimentos_historicos_fornecedor_id'), 'recebimentos_historicos', ['fornecedor_id'], unique=False)
    op.create_index(op.f('ix_recebimentos_historicos_local_principal'), 'recebimentos_historicos', ['local_principal'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_recebimentos_historicos_local_principal'), table_name='recebimentos_historicos')
    op.drop_index(op.f('ix_recebimentos_historicos_fornecedor_id'), table_name='recebimentos_historicos')
    op.drop_index(op.f('ix_recebimentos_historicos_data'), table_name='recebimentos_historicos')
    op.drop_index(op.f('ix_recebimentos_historicos_chave'), table_name='recebimentos_historicos')
    op.drop_table('recebimentos_historicos')
    op.drop_index(op.f('ix_produtos_grupo'), table_name='produtos')
    op.drop_table('produtos')
    op.drop_index(op.f('ix_pedido_itens_pedido'), table_name='pedido_itens')
    op.drop_index(op.f('ix_pedido_itens_fornecedor_codigo'), table_name='pedido_itens')
    op.drop_table('pedido_itens')
    op.drop_table('folha_diaria')