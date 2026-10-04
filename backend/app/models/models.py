import enum

from sqlalchemy import (
    Boolean, CheckConstraint, Column, Date, DateTime, Enum, ForeignKey, Index,
    Integer, Numeric, String, Text, UniqueConstraint, func, text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from app.core.database import Base


# ==========================================
# ENUMS
# native_enum=False -> vira VARCHAR no banco (evita dor de cabeça em migration)
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


class Origem(str, enum.Enum):
    """Procedência do registro (campo `origem_dado`). O painel declara de onde vêm os números.
    Não confundir com OrigemAgendamento (NORMAL/BALCAO/CHUVA), que é como o agendamento nasceu."""
    HISTORICO = "HISTORICO"          # carga dos dados da Cocapec
    SISTEMA = "SISTEMA"              # uso real da plataforma
    TESTE = "TESTE"                  # cenário de demonstração


class StatusAgendamento(str, enum.Enum):
    PENDENTE = "PENDENTE"                  # aguardando Compras
    APROVADO = "APROVADO"                  # Compras liberou; falta o armazém definir destino e baia
    DESTINO_DEFINIDO = "DESTINO_DEFINIDO"  # armazém e baia pré-programados; aguarda a chegada
    REJEITADO = "REJEITADO"                # Compras recusou
    CANCELADO = "CANCELADO"                # fornecedor cancelou (>= 24h antes)
    NA_FILA = "NA_FILA"                    # chegada registrada
    EM_DESCARGA = "EM_DESCARGA"            # pelo menos uma descarga iniciada
    CONCLUIDO = "CONCLUIDO"                # todas as descargas finalizadas
    NAO_COMPARECEU = "NAO_COMPARECEU"
    REAGENDADO = "REAGENDADO"              # substituído por outro agendamento (chuva etc.)


class OrigemAgendamento(str, enum.Enum):
    NORMAL = "NORMAL"                # fornecedor agendou antes
    BALCAO = "BALCAO"                # chegou sem agendar e havia vaga
    CHUVA = "CHUVA"                  # reagendado pelo armazém por intempérie (ignora limite)


class MotivoNaoRecebimento(str, enum.Enum):
    SEM_VAGA = "SEM_VAGA"
    SEM_PEDIDO = "SEM_PEDIDO"                  # Compras: não há pedido para esta nota
    CHUVA = "CHUVA"
    DIVERGENCIA_NF_PEDIDO = "DIVERGENCIA_NF_PEDIDO"
    REJEITADO_COMPRAS = "REJEITADO_COMPRAS"
    NAO_COMPARECEU = "NAO_COMPARECEU"
    CANCELADO_FORNECEDOR = "CANCELADO_FORNECEDOR"
    OUTRO = "OUTRO"

class TipoNotificacao(str, enum.Enum):
    APROVADO = "APROVADO"                    # Compras liberou a entrega
    REPROVADO = "REPROVADO"                  # Compras recusou (com motivo)
    DESTINO_DEFINIDO = "DESTINO_DEFINIDO"    # armazém e doca onde o caminhão vai parar
    REAGENDADO_CHUVA = "REAGENDADO_CHUVA"    # choveu: nova data, com prioridade


class StatusNotificacao(str, enum.Enum):
    ENVIADA = "ENVIADA"                      # entregue ao servidor SMTP
    SIMULADA = "SIMULADA"                    # SMTP não configurado: só registrada
    SEM_DESTINATARIO = "SEM_DESTINATARIO"    # fornecedor sem e-mail cadastrado
    FALHOU = "FALHOU"

class StatusBoletim(str, enum.Enum):
    RASCUNHO = "RASCUNHO"            # vai sendo preenchido ao longo do dia
    FECHADO = "FECHADO"              # totais congelados


class PerfilUsuario(str, enum.Enum):
    """Quem acessa o sistema. ADMIN pode tudo (manutenção e testes)."""
    FORNECEDOR = "FORNECEDOR"        # agenda entregas da própria empresa
    COMPRAS = "COMPRAS"              # valida notas e aprova/reprova agendamentos
    ARMAZEM = "ARMAZEM"              # recebimento, boletim e painel
    ADMIN = "ADMIN"


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
    # NÃO é único: o cadastro real tem 872 linhas e 870 CNPJs (mesmo CNPJ, códigos diferentes)
    cnpj = Column(String(14), index=True, nullable=False)          # só dígitos
    origem_dado = Column(_enum(Origem), nullable=False, default=Origem.SISTEMA,
                         server_default=Origem.SISTEMA.value)
    email = Column(String)        # contato para avisos; o cadastro da Cocapec não traz

    agendamentos = relationship("Agendamento", back_populates="fornecedor")


class Baia(Base):
    """Ponto físico onde o caminhão encosta dentro de um armazém.
    O responsável pelo armazém escolhe a baia logo após a aprovação do Compras."""
    __tablename__ = "baias"
    __table_args__ = (UniqueConstraint("local", "codigo", name="uq_baia_local_codigo"),)

    id = Column(Integer, primary_key=True)
    local = Column(_enum(LocalFisico), nullable=False, index=True)
    codigo = Column(String(20), nullable=False)       # ex.: ADUBO-01
    nome = Column(String, nullable=False)             # ex.: "Adubo - Baia 1"
    ativa = Column(Boolean, nullable=False, default=True, server_default="true")


class Equipamento(Base):
    """Catálogo fixo de equipamentos de descarga (dossiê, seção 6).
    A descarga só aceita códigos daqui: o indicador de utilização fica consistente."""
    __tablename__ = "equipamentos"

    id = Column(Integer, primary_key=True)
    codigo = Column(String(40), unique=True, nullable=False)   # ex.: EMPILHADEIRA_GAS
    nome = Column(String, nullable=False)
    quantidade = Column(Integer)                                # total na cooperativa
    observacao = Column(Text)


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
    origem_dado = Column(_enum(Origem), nullable=False, default=Origem.SISTEMA,
                         server_default=Origem.SISTEMA.value)
    # Usuário que agendou. A NF pode ser de outra empresa (transportadora, revenda...):
    # o fornecedor logado enxerga o que é da empresa dele E o que ele mesmo agendou.
    criado_por_id = Column(Integer, ForeignKey("usuarios.id"), index=True)

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

    atraso_minutos = Column(Integer)
    atraso_motivo = Column(Text)
    atraso_informado_em = Column(DateTime(timezone=True))

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
    baia_id = Column(Integer, ForeignKey("baias.id"), index=True)   # pré-programada pelo armazém

    # Marcos 2 e 3
    horario_entrada = Column(DateTime(timezone=True))
    horario_saida = Column(DateTime(timezone=True))

    # Intensidade DESTA descarga. NÃO somar no dia: o efetivo vem do boletim.
    qtd_chapas = Column(Integer)
    # ex.: [{"codigo": "EMPILHADEIRA_GAS", "qtd": 1}] — códigos do catálogo de equipamentos
    equipamentos = Column(JSONB, nullable=False, server_default="[]")

    agendamento = relationship("Agendamento", back_populates="descargas")
    baia = relationship("Baia")

class Notificacao(Base):
    """E-mail enviado (ou registrado) para o fornecedor a cada etapa relevante.
    Fica gravado mesmo sem SMTP: serve de histórico e de prova do aviso."""
    __tablename__ = "notificacoes"

    id = Column(Integer, primary_key=True)
    agendamento_id = Column(Integer, ForeignKey("agendamentos.id"), nullable=False, index=True)
    tipo = Column(_enum(TipoNotificacao), nullable=False)
    destinatario = Column(String)
    assunto = Column(String, nullable=False)
    corpo = Column(Text, nullable=False)
    status = Column(_enum(StatusNotificacao), nullable=False)
    erro = Column(Text)
    criado_em = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
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
    """Boletim Diário de Serviços dos Ensacadores: um geral por dia (ou um por armazém,
    conforme config.BOLETIM_POR_ARMAZEM).
    Registra TODA a movimentação da equipe (descarga, remoção, transferência), não só
    o recebimento. O total apurado é o custo da operação (dossiê, seção 8)."""
    __tablename__ = "boletins_diarios"
    __table_args__ = (
        UniqueConstraint("data", "local", name="uq_boletim_data_local"),
        # boletim geral (local vazio): no máximo um por dia
        Index("uq_boletim_geral_dia", "data", unique=True,
              postgresql_where=text("local IS NULL")),
    )

    id = Column(Integer, primary_key=True)
    data = Column(Date, nullable=False, index=True)
    local = Column(_enum(LocalFisico))     # vazio = boletim geral do dia (padrão da Cocapec)
    status = Column(_enum(StatusBoletim), nullable=False, default=StatusBoletim.RASCUNHO)
    origem_dado = Column(_enum(Origem), nullable=False, default=Origem.SISTEMA,
                         server_default=Origem.SISTEMA.value)
    observacao = Column(Text)

    # Snapshot do cálculo, recalculado a cada alteração e congelado ao fechar.
    # Sem arredondar no meio: 991,9041 - 918,1952 = 73,7089 -> 73,71
    # (com 2 casas: 991,90 - 918,20 = 73,70, e o exemplo do dossiê não fecha).
    # 6 casas porque meio piso (0,5 x 90,1731 = 45,08655) já tem 5.
    producao_total = Column(Numeric(16, 6), nullable=False, default=0)
    diarias_equivalentes = Column(Numeric(6, 1), nullable=False, default=0)
    valor_por_diaria = Column(Numeric(16, 6))
    total_pagar = Column(Numeric(16, 6), nullable=False, default=0)   # = custo da operação
    complemento = Column(Numeric(16, 6), nullable=False, default=0)

    criado_em = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    fechado_em = Column(DateTime(timezone=True))
    fechado_por = Column(String)

    producoes = relationship("BoletimProducao", back_populates="boletim",
                             cascade="all, delete-orphan", order_by="BoletimProducao.tipo_item_id")
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

# ==========================================
# 3. ACESSO (LOGIN)
# ==========================================

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, index=True, nullable=False)   # sempre minúsculo
    nome = Column(String, nullable=False)
    senha_hash = Column(String, nullable=False)                           # PBKDF2-SHA256 com sal
    perfil = Column(_enum(PerfilUsuario), nullable=False)
    # Só para FORNECEDOR: a empresa cujos agendamentos o usuário enxerga
    fornecedor_id = Column(Integer, ForeignKey("fornecedores.id"), index=True)
    ativo = Column(Boolean, nullable=False, default=True, server_default=text("true"))
    criado_em = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    fornecedor = relationship("Fornecedor")

    __table_args__ = (
        CheckConstraint("perfil <> 'FORNECEDOR' OR fornecedor_id IS NOT NULL",
                        name="ck_usuario_fornecedor_tem_empresa"),
    )



# ==========================================
# 3. DADOS HISTÓRICOS DA COCAPEC (carregados por scripts/carregar_historico.py)
# Somente leitura para o sistema: servem ao painel e à conferência do Compras.
# ==========================================

class Produto(Base):
    """Cadastro de produtos (02_cadastros/produtos.xlsx), um registro por código.
    O mesmo código aparece em vários depósitos no arquivo: fica o depósito que recebe."""
    __tablename__ = "produtos"

    codigo = Column(String(20), primary_key=True)          # código Cocapec: FER000003
    descricao = Column(String, nullable=False)
    unidade = Column(String(10))
    peso_unitario_kg = Column(Numeric(14, 4))
    grupo = Column(String(3), index=True)                  # FER, PEC, AGR...
    deposito = Column(String(20))
    local = Column(_enum(LocalFisico))


class PedidoItem(Base):
    """Item de pedido de compra (03_movimentacao). Alimenta a conferência do Compras.
    Atenção: Qtd e Peso são do ITEM DO PEDIDO, não do que chegou em cada caminhão."""
    __tablename__ = "pedido_itens"
    __table_args__ = (UniqueConstraint("pedido", "codigo_item", name="uq_pedido_item"),)

    id = Column(Integer, primary_key=True)
    pedido = Column(Integer, nullable=False, index=True)
    fornecedor_codigo = Column(String(20), index=True)
    codigo_item = Column(String(20), nullable=False)
    descricao = Column(String)
    quantidade = Column(Numeric(16, 4))
    peso_kg = Column(Numeric(16, 3))
    deposito = Column(String(20))
    local = Column(_enum(LocalFisico))
    data_documento = Column(Date)


class RecebimentoHistorico(Base):
    """Uma entrega histórica = uma nota fiscal recebida (agregação das linhas da movimentação).
    É a melhor aproximação de 'um caminhão' que os dados permitem."""
    __tablename__ = "recebimentos_historicos"

    id = Column(Integer, primary_key=True)
    data = Column(Date, nullable=False, index=True)
    fornecedor_id = Column(Integer, ForeignKey("fornecedores.id"), index=True)
    fornecedor_codigo = Column(String(20))
    nf_numero = Column(String(20))
    chave = Column(String(60), index=True)
    chave_valida = Column(Boolean, nullable=False, default=False)
    itens = Column(Integer, nullable=False)
    pedidos = Column(Integer, nullable=False)
    local_principal = Column(_enum(LocalFisico), index=True)   # armazém com mais peso na nota
    locais = Column(String)                                    # todos os armazéns da nota
    grupos = Column(String)
    peso_planilha_kg = Column(Numeric(16, 3))   # soma bruta da planilha (inflada: peso do pedido)
    peso_estimado_kg = Column(Numeric(16, 3))   # rateado por recebimento e limitado a 1 caminhão
    exige_chapa = Column(Boolean, nullable=False, default=False)   # peso estimado >= 500 kg
    alertas = Column(JSONB, nullable=False, server_default="[]")
    origem_dado = Column(_enum(Origem), nullable=False, default=Origem.HISTORICO,
                         server_default=Origem.HISTORICO.value)


class FolhaDiaria(Base):
    """Folha diária dos ensacadores (04_mao_de_obra/chapas_por_dia.csv): quem trabalhou
    e quanto foi pago no dia. É o registro real de efetivo para o 'sobra ou falta chapa'."""
    __tablename__ = "folha_diaria"

    data = Column(Date, primary_key=True)
    dia_semana = Column(String(10))
    chapas_presentes = Column(Integer, nullable=False)
    chapas_operacao_cafe = Column(Integer, nullable=False, default=0)
    valor_pago = Column(Numeric(12, 2), nullable=False)
    suspeito = Column(Boolean, nullable=False, default=False)   # dia fora do padrão
    motivo_suspeita = Column(String)