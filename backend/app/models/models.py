import enum

from sqlalchemy import (
    Boolean, CheckConstraint, Column, Date, DateTime, Enum, ForeignKey,
    Integer, Numeric, String, Text, UniqueConstraint, func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from app.core.database import Base


# ==========================================
# ENUMS
# native_enum=False -> vira VARCHAR + CHECK no banco (evita dor de cabeça em migration)
# ==========================================

class Horario(str, enum.Enum):
    H08 = "08:00"
    H10 = "10:00"
    H13 = "13:00"
    H15 = "15:00"


class Acondicionamento(str, enum.Enum):
    BATIDO = "BATIDO"
    PALETIZADO = "PALETIZADO"
    BIG_BAG = "BIG_BAG"


class LocalFisico(str, enum.Enum):
    """Armazém físico. É por ele que o boletim e os indicadores são agregados.
    O depósito do SAP (MATLoja, MATFerti...) só serve para descobrir o local."""
    INSUMOS = "INSUMOS"
    ADUBO = "ADUBO"
    MAQUINAS = "MAQUINAS"
    LOJA = "LOJA"


class StatusAgendamento(str, enum.Enum):
    PENDENTE = "PENDENTE"            # aguardando Compras
    APROVADO = "APROVADO"            # Compras liberou
    REJEITADO = "REJEITADO"          # Compras recusou
    CANCELADO = "CANCELADO"          # fornecedor cancelou (>= 24h antes)
    NA_FILA = "NA_FILA"              # chegada registrada
    EM_DESCARGA = "EM_DESCARGA"      # pelo menos uma descarga iniciada
    CONCLUIDO = "CONCLUIDO"          # todas as descargas finalizadas
    NAO_COMPARECEU = "NAO_COMPARECEU"
    REAGENDADO = "REAGENDADO"        # substituído por outro agendamento (chuva etc.)


class OrigemAgendamento(str, enum.Enum):
    NORMAL = "NORMAL"                # fornecedor agendou antes
    BALCAO = "BALCAO"                # chegou sem agendar e havia vaga
    CHUVA = "CHUVA"                  # reagendado pelo armazém por intempérie (ignora limite)


class MotivoNaoRecebimento(str, enum.Enum):
    SEM_VAGA = "SEM_VAGA"
    CHUVA = "CHUVA"
    DIVERGENCIA_NF_PEDIDO = "DIVERGENCIA_NF_PEDIDO"
    REJEITADO_COMPRAS = "REJEITADO_COMPRAS"
    NAO_COMPARECEU = "NAO_COMPARECEU"
    CANCELADO_FORNECEDOR = "CANCELADO_FORNECEDOR"
    OUTRO = "OUTRO"


class StatusBoletim(str, enum.Enum):
    RASCUNHO = "RASCUNHO"            # vai sendo preenchido ao longo do dia
    FECHADO = "FECHADO"              # totais congelados


def _enum(e):
    return Enum(e, native_enum=False, length=30)


# ==========================================
# 1. AGENDAMENTO E DESCARGA
# ==========================================

class Fornecedor(Base):
    __tablename__ = "fornecedores"

    id = Column(Integer, primary_key=True)
    codigo = Column(String(20), unique=True, index=True)          # Cod PN do SAP, ex. FD017530
    nome = Column(String, nullable=False)
    cnpj = Column(String(14), unique=True, index=True, nullable=False)  # só dígitos

    agendamentos = relationship("Agendamento", back_populates="fornecedor")


class NotaFiscal(Base):
    """Nota enviada pelo fornecedor (XML ou PDF), lida antes de agendar.
    O agendamento nasce dela: fornecedor, peso e tipo de carga vêm daqui."""
    __tablename__ = "notas_fiscais"

    id = Column(Integer, primary_key=True)
    chave = Column(String(44), unique=True, index=True, nullable=False)
    numero = Column(String(20))
    serie = Column(String(5))
    data_emissao = Column(Date)
    fornecedor_id = Column(Integer, ForeignKey("fornecedores.id"), nullable=False, index=True)
    valor_total = Column(Numeric(14, 2))
    peso_bruto_kg = Column(Numeric(12, 3))
    peso_liquido_kg = Column(Numeric(12, 3))
    volumes = Column(Integer)
    especie = Column(String)
    carga_adubo = Column(Boolean, nullable=False, default=False, server_default="false")  # pátio aberto
    itens = Column(JSONB, nullable=False, server_default="[]")
    alertas = Column(JSONB, nullable=False, server_default="[]")
    formato = Column(String(3), nullable=False)                    # xml | pdf
    arquivo_url = Column(String, nullable=False)
    criado_em = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    fornecedor = relationship("Fornecedor")


class Agendamento(Base):
    """Um caminhão. Tudo que é do caminhão como um todo fica aqui."""
    __tablename__ = "agendamentos"

    id = Column(Integer, primary_key=True)
    fornecedor_id = Column(Integer, ForeignKey("fornecedores.id"), nullable=False, index=True)

    data = Column(Date, nullable=False, index=True)
    horario = Column(_enum(Horario), nullable=False)
    acondicionamento = Column(_enum(Acondicionamento), nullable=False)
    peso_kg = Column(Numeric(12, 3))                 # < 500 kg dispensa chapa

    # Nota fiscal (lida do XML/PDF enviado pelo fornecedor)
    nota_fiscal_id = Column(Integer, ForeignKey("notas_fiscais.id"), index=True)
    carga_adubo = Column(Boolean, nullable=False, default=False, server_default="false")  # regra de chuva
    prob_chuva = Column(Integer)          # % prevista para o horário, no momento do agendamento
    nf_arquivo_url = Column(String)
    nf_numero = Column(String(20))
    nf_chave = Column(String(44), index=True)

    # Validação de Compras
    pedido_compra = Column(Integer, index=True)      # liga ao pedido -> produtos -> depósito -> local
    analisado_por = Column(String)
    analisado_em = Column(DateTime(timezone=True))
    observacao_compras = Column(Text)

    status = Column(_enum(StatusAgendamento), nullable=False,
                    default=StatusAgendamento.PENDENTE, index=True)
    origem = Column(_enum(OrigemAgendamento), nullable=False, default=OrigemAgendamento.NORMAL)
    prioritario = Column(Boolean, nullable=False, default=False)   # reagendado por chuva fura fila
    ciente_risco_chuva = Column(Boolean, nullable=False, default=False)
    motivo_nao_recebimento = Column(_enum(MotivoNaoRecebimento))
    reagendado_de_id = Column(Integer, ForeignKey("agendamentos.id"))

    # Marco 1: chegada é do caminhão, não do armazém (espera = chegada -> 1ª entrada)
    horario_chegada = Column(DateTime(timezone=True))

    criado_em = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    cancelado_em = Column(DateTime(timezone=True))   # para auditar a regra das 24h

    fornecedor = relationship("Fornecedor", back_populates="agendamentos")
    nota_fiscal = relationship("NotaFiscal")
    descargas = relationship("Descarga", back_populates="agendamento",
                             cascade="all, delete-orphan", order_by="Descarga.id")
    reagendado_de = relationship("Agendamento", remote_side=[id])


class Descarga(Base):
    """Uma descarga por armazém. Um caminhão pode ter mais de uma."""
    __tablename__ = "descargas"
    __table_args__ = (
        UniqueConstraint("agendamento_id", "local", name="uq_descarga_agendamento_local"),
        CheckConstraint("qtd_chapas IS NULL OR qtd_chapas >= 0", name="ck_descarga_chapas"),
        CheckConstraint("horario_saida IS NULL OR horario_entrada IS NULL "
                        "OR horario_saida >= horario_entrada", name="ck_descarga_tempos"),
    )

    id = Column(Integer, primary_key=True)
    agendamento_id = Column(Integer, ForeignKey("agendamentos.id"), nullable=False, index=True)
    local = Column(_enum(LocalFisico), nullable=False, index=True)

    # Marcos 2 e 3
    horario_entrada = Column(DateTime(timezone=True))
    horario_saida = Column(DateTime(timezone=True))

    # Intensidade DESTA descarga. NÃO somar no dia: o efetivo vem do boletim.
    qtd_chapas = Column(Integer)
    # ex.: [{"tipo": "EMPILHADEIRA_GAS", "qtd": 1}, {"tipo": "PALETEIRA_MANUAL", "qtd": 1}]
    equipamentos = Column(JSONB, nullable=False, server_default="[]")

    agendamento = relationship("Agendamento", back_populates="descargas")


# ==========================================
# 2. BOLETIM DIÁRIO E CUSTO
# ==========================================

class TipoItem(Base):
    """Os 14 tipos do boletim com preço unitário (seed a partir do dossiê)."""
    __tablename__ = "tipos_item"

    id = Column(Integer, primary_key=True)
    descricao = Column(String, unique=True, nullable=False)   # "Sacaria malas c/ 25", "Fertilizantes"...
    preco_unitario = Column(Numeric(10, 4), nullable=False)
    ativo = Column(Boolean, nullable=False, default=True)


class Chapa(Base):
    __tablename__ = "chapas"

    id = Column(Integer, primary_key=True)
    matricula = Column(String(20), unique=True, index=True, nullable=False)
    nome = Column(String, nullable=False)                     # vem anonimizado: CHAPA_01...
    ativo = Column(Boolean, nullable=False, default=True)

    boletins = relationship("BoletimChapa", back_populates="chapa")


class BoletimDiario(Base):
    __tablename__ = "boletins_diarios"
    __table_args__ = (UniqueConstraint("data", "local", name="uq_boletim_data_local"),)

    id = Column(Integer, primary_key=True)
    data = Column(Date, nullable=False, index=True)
    local = Column(_enum(LocalFisico), nullable=False)
    status = Column(_enum(StatusBoletim), nullable=False, default=StatusBoletim.RASCUNHO)
    observacao = Column(Text)

    # Snapshot calculado pelo service (recalcula a cada alteração, congela ao fechar)
    producao_total = Column(Numeric(12, 2), nullable=False, default=0)
    diarias_equivalentes = Column(Numeric(6, 1), nullable=False, default=0)
    valor_por_diaria = Column(Numeric(12, 2))
    total_pagar = Column(Numeric(12, 2), nullable=False, default=0)   # = custo da operação
    complemento = Column(Numeric(12, 2), nullable=False, default=0)

    criado_em = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    fechado_em = Column(DateTime(timezone=True))

    producoes = relationship("BoletimProducao", back_populates="boletim",
                             cascade="all, delete-orphan")
    chapas_alocados = relationship("BoletimChapa", back_populates="boletim",
                                   cascade="all, delete-orphan")


class BoletimProducao(Base):
    """Uma linha por tipo de item, igual ao formulário de papel."""
    __tablename__ = "boletim_producoes"
    __table_args__ = (
        UniqueConstraint("boletim_id", "tipo_item_id", name="uq_producao_boletim_tipo"),
        CheckConstraint("descarga >= 0 AND remocao >= 0 AND transferencia >= 0",
                        name="ck_producao_nao_negativa"),
    )

    id = Column(Integer, primary_key=True)
    boletim_id = Column(Integer, ForeignKey("boletins_diarios.id"), nullable=False, index=True)
    tipo_item_id = Column(Integer, ForeignKey("tipos_item.id"), nullable=False)

    descarga = Column(Integer, nullable=False, default=0)
    remocao = Column(Integer, nullable=False, default=0)
    transferencia = Column(Integer, nullable=False, default=0)
    # Cópia do preço no momento do lançamento: reajuste da tabela não altera o passado
    preco_unitario = Column(Numeric(10, 4), nullable=False)

    boletim = relationship("BoletimDiario", back_populates="producoes")
    tipo_item = relationship("TipoItem")

    @property
    def quantidade_total(self) -> int:
        return self.descarga + self.remocao + self.transferencia

    @property
    def valor_linha(self):
        return self.quantidade_total * self.preco_unitario


class BoletimChapa(Base):
    __tablename__ = "boletim_chapas"

    boletim_id = Column(Integer, ForeignKey("boletins_diarios.id"), primary_key=True)
    chapa_id = Column(Integer, ForeignKey("chapas.id"), primary_key=True)
    meia_diaria = Column(Boolean, nullable=False, default=False)

    boletim = relationship("BoletimDiario", back_populates="chapas_alocados")
    chapa = relationship("Chapa", back_populates="boletins")