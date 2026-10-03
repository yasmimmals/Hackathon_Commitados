from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models import (
    Acondicionamento, Horario, LocalFisico, MotivoNaoRecebimento,
    OrigemAgendamento, StatusAgendamento,
)


# ---------- Fornecedor ----------

class FornecedorCreate(BaseModel):
    nome: str = Field(min_length=2)
    cnpj: str
    codigo: Optional[str] = None

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


class BalcaoCreate(BaseModel):
    """Caminhão chegou sem agendamento: com a nota lida, o armazém agenda na hora."""
    nota_fiscal_id: int
    horario: Horario
    acondicionamento: Acondicionamento


class AprovacaoIn(BaseModel):
    pedido_compra: int
    analisado_por: str
    observacao: Optional[str] = None


class RejeicaoIn(BaseModel):
    motivo: MotivoNaoRecebimento = MotivoNaoRecebimento.REJEITADO_COMPRAS
    analisado_por: str
    observacao: Optional[str] = None


class DestinosIn(BaseModel):
    locais: list[LocalFisico] = Field(min_length=1)


class EntradaIn(BaseModel):
    local: LocalFisico


class Equipamento(BaseModel):
    tipo: str          # ex.: EMPILHADEIRA_GAS, PALETEIRA_MANUAL, TRATOR
    qtd: int = Field(ge=1)


class SaidaIn(BaseModel):
    local: LocalFisico
    qtd_chapas: int = Field(ge=0)
    equipamentos: list[Equipamento] = []


class ReagendamentoChuvaIn(BaseModel):
    nova_data: Optional[date] = None      # padrão: próximo dia útil
    novo_horario: Horario = Horario.H08


class DescargaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    local: LocalFisico
    horario_entrada: Optional[datetime]
    horario_saida: Optional[datetime]
    qtd_chapas: Optional[int]
    equipamentos: list


class AgendamentoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    fornecedor_id: int
    fornecedor: FornecedorOut
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