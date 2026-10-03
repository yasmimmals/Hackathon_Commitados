"""nota fiscal e previsao de chuva

Revision ID: 1cc5b7f394f2
Revises: 869eea36026b
Create Date: 2026-10-03 18:59:35.882505

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '1cc5b7f394f2'
down_revision: Union[str, Sequence[str], None] = '869eea36026b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('notas_fiscais',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('chave', sa.String(length=44), nullable=False),
    sa.Column('numero', sa.String(length=20), nullable=True),
    sa.Column('serie', sa.String(length=5), nullable=True),
    sa.Column('data_emissao', sa.Date(), nullable=True),
    sa.Column('fornecedor_id', sa.Integer(), nullable=False),
    sa.Column('valor_total', sa.Numeric(precision=14, scale=2), nullable=True),
    sa.Column('peso_bruto_kg', sa.Numeric(precision=12, scale=3), nullable=True),
    sa.Column('peso_liquido_kg', sa.Numeric(precision=12, scale=3), nullable=True),
    sa.Column('volumes', sa.Integer(), nullable=True),
    sa.Column('especie', sa.String(), nullable=True),
    sa.Column('carga_adubo', sa.Boolean(), server_default=sa.text('false'), nullable=False),
    sa.Column('itens', postgresql.JSONB(astext_type=sa.Text()), server_default='[]', nullable=False),
    sa.Column('alertas', postgresql.JSONB(astext_type=sa.Text()), server_default='[]', nullable=False),
    sa.Column('formato', sa.String(length=3), nullable=False),
    sa.Column('arquivo_url', sa.String(), nullable=False),
    sa.Column('criado_em', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['fornecedor_id'], ['fornecedores.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_notas_fiscais_chave'), 'notas_fiscais', ['chave'], unique=True)
    op.create_index(op.f('ix_notas_fiscais_fornecedor_id'), 'notas_fiscais', ['fornecedor_id'], unique=False)
    op.add_column('agendamentos', sa.Column('nota_fiscal_id', sa.Integer(), nullable=True))
    op.add_column('agendamentos', sa.Column('carga_adubo', sa.Boolean(), server_default=sa.text('false'), nullable=False))
    op.add_column('agendamentos', sa.Column('prob_chuva', sa.Integer(), nullable=True))
    op.create_index(op.f('ix_agendamentos_nota_fiscal_id'), 'agendamentos', ['nota_fiscal_id'], unique=False)
    op.create_foreign_key('fk_agendamentos_nota_fiscal', 'agendamentos', 'notas_fiscais', ['nota_fiscal_id'], ['id'])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('fk_agendamentos_nota_fiscal', 'agendamentos', type_='foreignkey')
    op.drop_index(op.f('ix_agendamentos_nota_fiscal_id'), table_name='agendamentos')
    op.drop_column('agendamentos', 'prob_chuva')
    op.drop_column('agendamentos', 'carga_adubo')
    op.drop_column('agendamentos', 'nota_fiscal_id')
    op.drop_index(op.f('ix_notas_fiscais_fornecedor_id'), table_name='notas_fiscais')
    op.drop_index(op.f('ix_notas_fiscais_chave'), table_name='notas_fiscais')
    op.drop_table('notas_fiscais')