import re
from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models import (
    Acondicionamento, Horario, LocalFisico, MotivoNaoRecebimento, Origem,
    OrigemAgendamento, StatusAgendamento, StatusNotificacao, TipoNotificacao,
)

_EMAIL = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _validar_email(v: Optional[str]) -> Optional[str]:
    if v is None or not v.strip():
        return None
    v = v.strip().lower()
    if not _EMAIL.match(v):
        raise ValueError("E-mail inválido")
    return v


# ---------- Fornecedor ----------

class FornecedorCreate(BaseModel):
    nome: str = Field(min_length=2)
    cnpj: str
    codigo: Optional[str] = None
    email: Optional[str] = None

    @field_validator("cnpj")
    @classmethod
    def so_digitos(cls, v: str) -> str:
        digitos = "".join(c for c in v if c.isdigit())
        if len(digitos) != 14:
            raise ValueError("CNPJ deve ter 14 dígitos")
        return digitos
        


class FornecedorOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    nome: str
    cnpj: str
    codigo: Optional[str]
    origem_dado: Origem


# ---------- Cadastros: baias e equipamentos ----------

class BaiaCreate(BaseModel):
    local: LocalFisico
    codigo: str = Field(min_length=1, max_length=20)
    nome: str = Field(min_length=1)


class BaiaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    local: LocalFisico
    codigo: str
    nome: str
    ativa: bool


class EquipamentoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    codigo: str
    nome: str
    quantidade: Optional[int]
    observacao: Optional[str]


# ---------- Nota fiscal ----------

class NotaFiscalOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    chave: str
    numero: Optional[str]
    serie: Optional[str]
    data_emissao: Optional[date]
    fornecedor: FornecedorOut
    valor_total: Optional[Decimal]
    peso_bruto_kg: Optional[Decimal]
    peso_liquido_kg: Optional[Decimal]
    volumes: Optional[int]
    especie: Optional[str]
    carga_adubo: bool
    itens: list[dict]
    alertas: list[str]
    formato: str


# ---------- Agendamento ----------

class AgendamentoCreate(BaseModel):
    """O fornecedor só informa acondicionamento, dia e horário.
    Fornecedor, peso e tipo de carga vêm da nota fiscal enviada antes."""
    nota_fiscal_id: int
    data: date
    horario: Horario
    acondicionamento: Acondicionamento
    ciente_risco_chuva: bool = Field(
        default=False,
        description="Obrigatório para carga de adubo com risco de chuva: se chover, "
                    "a descarga é reagendada para o próximo dia útil, com prioridade",
    )
    email_contato: Optional[str] = Field(
        default=None, description="Para onde vão os avisos (aprovação, reprovação, doca)")

    _email = field_validator("email_contato")(lambda cls, v: _validar_email(v))


class BalcaoCreate(BaseModel):
    """Caminhão chegou sem agendamento: com a nota lida, o armazém agenda na hora."""
    nota_fiscal_id: int
    horario: Horario
    acondicionamento: Acondicionamento
    email_contato: Optional[str] = None

    _email = field_validator("email_contato")(lambda cls, v: _validar_email(v))


class AprovacaoIn(BaseModel):
    pedido_compra: int
    analisado_por: str
    observacao: Optional[str] = None


class RejeicaoIn(BaseModel):
    """Reprovar exige motivo e explicação: o texto vai no e-mail ao fornecedor."""
    motivo: MotivoNaoRecebimento = Field(
        description="DIVERGENCIA_NF_PEDIDO | SEM_PEDIDO | REJEITADO_COMPRAS | OUTRO")
    analisado_por: str = Field(min_length=1)
    observacao: str = Field(min_length=5, description="O que está errado e o que fazer")


class DestinoIn(BaseModel):
    local: LocalFisico
    baia_id: Optional[int] = None    # opcional: com uma única doca ativa, o sistema escolhe

class DestinosIn(BaseModel):
    """Logo após o Compras aprovar, o armazém pré-programa onde o caminhão vai parar.
    Pode ser mais de um armazém (uma nota com itens de grupos diferentes)."""
    destinos: list[DestinoIn] = Field(min_length=1)


class NaoRecebimentoIn(BaseModel):
    """Recusa feita pelo armazém: divergência encontrada na conferência ou outro motivo."""
    motivo: MotivoNaoRecebimento = Field(description="DIVERGENCIA_NF_PEDIDO | OUTRO")
    descricao: str = Field(min_length=5, max_length=300)

    @field_validator("motivo")
    @classmethod
    def _motivo_do_armazem(cls, v: MotivoNaoRecebimento) -> MotivoNaoRecebimento:
        if v not in (MotivoNaoRecebimento.DIVERGENCIA_NF_PEDIDO, MotivoNaoRecebimento.OUTRO):
            raise ValueError("O armazém registra divergência entre nota e pedido ou outro motivo")
        return v

    @field_validator("descricao")
    @classmethod
    def _sem_espacos(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 5:
            raise ValueError("Descreva o motivo com pelo menos 5 caracteres")
        return v


class AtrasoIn(BaseModel):
    minutos: int = Field(ge=5, le=600)
    motivo: Optional[str] = Field(default=None, max_length=300)


class EntradaIn(BaseModel):
    local: LocalFisico


class EquipamentoUsado(BaseModel):
    codigo: str        # do catálogo GET /cadastros/equipamentos (ex.: EMPILHADEIRA_GAS)
    qtd: int = Field(default=1, ge=1)


class SaidaIn(BaseModel):
    local: LocalFisico
    qtd_chapas: int = Field(ge=0)
    equipamentos: list[EquipamentoUsado] = []


class ReagendamentoChuvaIn(BaseModel):
    nova_data: Optional[date] = None      # padrão: próximo dia útil
    novo_horario: Horario = Horario.H08


class DescargaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    local: LocalFisico
    baia: Optional[BaiaOut]
    horario_entrada: Optional[datetime]
    horario_saida: Optional[datetime]
    qtd_chapas: Optional[int]
    equipamentos: list


class AgendamentoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    fornecedor_id: int
    fornecedor: FornecedorOut
    origem_dado: Origem
    nota_fiscal_id: Optional[int]
    data: date
    horario: Horario
    acondicionamento: Acondicionamento
    peso_kg: Optional[Decimal]
    carga_adubo: bool
    prob_chuva: Optional[int]
    nf_numero: Optional[str]
    nf_chave: Optional[str]
    pedido_compra: Optional[int]
    analisado_por: Optional[str]
    analisado_em: Optional[datetime]
    observacao_compras: Optional[str]
    status: StatusAgendamento
    origem: OrigemAgendamento
    prioritario: bool
    ciente_risco_chuva: bool
    motivo_nao_recebimento: Optional[MotivoNaoRecebimento]
    reagendado_de_id: Optional[int]
    horario_chegada: Optional[datetime]
    atraso_minutos: Optional[int] = None
    atraso_motivo: Optional[str] = None
    atraso_informado_em: Optional[datetime] = None
    observacao_nao_recebimento: Optional[str] = None
    nao_recebido_em: Optional[datetime] = None
    criado_em: datetime
    cancelado_em: Optional[datetime]
    descargas: list[DescargaOut]
    chapas_norma: Optional[int] = None   # quantos chapas a regra da seção 7 exige
    aviso_chuva: Optional[str] = None


class SlotDisponibilidade(BaseModel):
    horario: Horario
    ocupados: int
    tem_batido: bool
    aceita_batido: bool
    aceita_unitizado: bool
    vagas_restantes: int
    encaixes_chuva: int
    # Preenchidos quando a consulta é para uma nota de adubo
    prob_chuva: Optional[int] = None
    situacao_chuva: Optional[str] = None   # BLOQUEADO | RISCO | SEM_RISCO
    
    

# ---------- Programação antecipada (visão do armazém para os próximos dias) ----------

class CaminhaoPrevisto(BaseModel):
    agendamento_id: int
    data: date
    horario: Horario
    status: StatusAgendamento
    confirmado: bool                 # False = Compras ainda não aprovou (previsão)
    prioritario: bool
    fornecedor: str
    nf_numero: Optional[str]
    acondicionamento: Acondicionamento
    peso_kg: Optional[Decimal]
    volumes_estimados: Optional[int]
    locais: list[LocalFisico]
    locais_sugeridos: bool           # True = armazém sugerido pelo sistema, ainda não definido
    doca: Optional[str]
    chapas_norma: Optional[int]
    equipamento_sugerido: Optional[str]
    minutos_caminhao: int            # até liberar o caminhão
    minutos_equipe: int              # até a equipe ficar livre (ciclo completo)
    carga_adubo: bool
    prob_chuva: Optional[int]
    situacao_chuva: Optional[str]


class ResumoDiaLocal(BaseModel):
    data: date
    local: Optional[LocalFisico]     # None = armazém ainda não definido nem sugerido
    caminhoes: int
    confirmados: int
    peso_total_kg: Decimal
    chapa_minutos: int               # soma de (chapas da norma x minutos de equipe)
    tem_batido: bool
    chapas_recomendados: int
    caminhoes_com_risco_chuva: int


class Programacao(BaseModel):
    inicio: date
    fim: date
    premissas: list[str]
    resumo: list[ResumoDiaLocal]
    caminhoes: list[CaminhaoPrevisto]



# ---------- Compras: conferência e notificações ----------

class Verificacao(BaseModel):
    item: str
    ok: bool
    detalhe: str


class ConferenciaOut(BaseModel):
    """O que o Compras precisa ver para aprovar ou reprovar."""
    agendamento: AgendamentoOut
    nota: NotaFiscalOut
    verificacoes: list[Verificacao]
    pedido_compra: Optional[dict] = None   # itens do pedido (base histórica da Cocapec)
    pedidos_recentes_do_fornecedor: list[int] = []   # ajuda o Compras a achar o pedido


class NotificacaoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    tipo: TipoNotificacao
    destinatario: Optional[str]
    assunto: str
    corpo: str
    status: StatusNotificacao
    erro: Optional[str]
    criado_em: datetime