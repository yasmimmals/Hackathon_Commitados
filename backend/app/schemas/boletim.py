from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models import LocalFisico, Origem, StatusBoletim


class ChapaCreate(BaseModel):
    matricula: str = Field(min_length=1, max_length=20)
    nome: str = Field(min_length=1)


class ChapaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    matricula: str
    nome: str
    ativo: bool


class TipoItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    descricao: str
    preco_unitario: Decimal
    ativo: bool


class BoletimCreate(BaseModel):
    """Boletim geral do dia: não informe `local`. Só no modo por armazém
    (config.BOLETIM_POR_ARMAZEM = True) o armazém é obrigatório."""
    data: date
    local: Optional[LocalFisico] = None
    observacao: Optional[str] = None


class LinhaProducaoIn(BaseModel):
    tipo_item_id: int
    descarga: int = Field(default=0, ge=0)
    remocao: int = Field(default=0, ge=0)
    transferencia: int = Field(default=0, ge=0)


class ProducaoIn(BaseModel):
    """Substitui a produção do boletim inteira (o que não vier, sai)."""
    linhas: list[LinhaProducaoIn]


class ChapaNoBoletimIn(BaseModel):
    matricula: str
    meia_diaria: bool = False


class EquipeIn(BaseModel):
    """Substitui a equipe do boletim inteira. Até 20 chapas, por matrícula."""
    equipe: list[ChapaNoBoletimIn]


class FecharIn(BaseModel):
    fechado_por: str = Field(min_length=1)


class LinhaProducaoOut(BaseModel):
    tipo_item_id: int
    tipo_item: str
    descarga: int
    remocao: int
    transferencia: int
    quantidade_total: int
    preco_unitario: Decimal
    valor_linha: Decimal


class ChapaNoBoletimOut(BaseModel):
    matricula: str
    nome: str
    meia_diaria: bool


class CalculoOut(BaseModel):
    """Valores arredondados a 2 casas só aqui, na saída."""
    producao_total: Decimal
    chapas: int
    meias_diarias: int
    diarias_equivalentes: Decimal
    valor_por_diaria: Optional[Decimal]
    piso_diaria: Decimal
    piso_total: Decimal
    total_pagar: Decimal
    complemento: Decimal
    abaixo_do_piso: bool


class BoletimOut(BaseModel):
    id: int
    data: date
    local: Optional[LocalFisico]      # None = boletim geral do dia
    status: StatusBoletim
    origem_dado: Origem
    observacao: Optional[str]
    linhas: list[LinhaProducaoOut]
    equipe: list[ChapaNoBoletimOut]
    calculo: CalculoOut
    avisos: list[str]
    criado_em: datetime
    fechado_em: Optional[datetime]
    fechado_por: Optional[str]