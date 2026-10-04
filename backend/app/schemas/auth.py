import re
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.core import config
from app.models import PerfilUsuario

_EMAIL = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _email_valido(v: str) -> str:
    v = v.strip().lower()
    if not _EMAIL.match(v):
        raise ValueError("E-mail inválido")
    return v


class LoginIn(BaseModel):
    email: str
    senha: str = Field(min_length=1)

    @field_validator("email")
    @classmethod
    def normalizar(cls, v: str) -> str:
        return v.strip().lower()


class CadastroIn(BaseModel):
    """Fornecedor se cadastra livremente (informa a empresa). Compras e armazém
    precisam do código interno (config.CODIGO_CADASTRO_INTERNO)."""
    perfil: PerfilUsuario
    nome: str = Field(min_length=2)
    email: str
    senha: str = Field(min_length=config.SENHA_MINIMA)
    empresa: Optional[str] = None          # razão social, só fornecedor
    cnpj: Optional[str] = None             # só fornecedor; aceita máscara
    codigo_interno: Optional[str] = None   # só compras e armazém

    @field_validator("email")
    @classmethod
    def validar_email(cls, v: str) -> str:
        return _email_valido(v)

    @field_validator("cnpj")
    @classmethod
    def so_digitos(cls, v: Optional[str]) -> Optional[str]:
        return "".join(c for c in v if c.isdigit()) if v else v

    @model_validator(mode="after")
    def conferir_perfil(self):
        if self.perfil == PerfilUsuario.ADMIN:
            raise ValueError("Perfil ADMIN não pode ser criado pelo cadastro")
        if self.perfil == PerfilUsuario.FORNECEDOR:
            if not self.cnpj or len(self.cnpj) != 14:
                raise ValueError("Informe o CNPJ da empresa (14 dígitos)")
            if not self.empresa or len(self.empresa.strip()) < 2:
                raise ValueError("Informe a razão social da empresa")
        return self


class EmpresaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    nome: str
    cnpj: str


class UsuarioOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: str
    nome: str
    perfil: PerfilUsuario
    fornecedor: Optional[EmpresaOut] = None


class SessaoOut(BaseModel):
    token: str
    tipo: str = "Bearer"
    expira_em: int                         # segundos Unix
    usuario: UsuarioOut
