"""Dependências de acesso para as rotas.

    usuario_atual               -> exige login (token Bearer válido de usuário ativo)
    exigir_perfil(COMPRAS, ...) -> exige login E um dos perfis (ADMIN sempre passa)
"""
from typing import Optional

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.exceptions import AcessoNegadoError, NaoAutenticadoError
from app.core.seguranca import ler_token
from app.models import Agendamento, PerfilUsuario, Usuario

_bearer = HTTPBearer(auto_error=False)


def usuario_atual(cred: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
                  db: Session = Depends(get_db)) -> Usuario:
    if cred is None or cred.scheme.lower() != "bearer":
        raise NaoAutenticadoError("Faça login para continuar")
    dados = ler_token(cred.credentials)
    if dados is None:
        raise NaoAutenticadoError("Sessão expirada ou inválida. Entre novamente", "TOKEN_INVALIDO")
    usuario = db.get(Usuario, dados.get("sub"))
    if usuario is None or not usuario.ativo:
        raise NaoAutenticadoError("Usuário inativo ou removido", "TOKEN_INVALIDO")
    return usuario


def exigir_perfil(*perfis: PerfilUsuario):
    def _verificar(usuario: Usuario = Depends(usuario_atual)) -> Usuario:
        if usuario.perfil != PerfilUsuario.ADMIN and usuario.perfil not in perfis:
            raise AcessoNegadoError()
        return usuario
    return _verificar


def eh_fornecedor(usuario: Usuario) -> bool:
    return usuario.perfil == PerfilUsuario.FORNECEDOR


def cnpj_do_usuario(usuario: Usuario) -> Optional[str]:
    return usuario.fornecedor.cnpj if usuario.fornecedor else None


def garantir_agendamento_do_fornecedor(usuario: Usuario, ag: Agendamento) -> None:
    """Fornecedor acessa o que é da própria empresa (mesmo CNPJ) ou o que ele mesmo agendou.
    A nota fiscal pode ser de outra empresa, por isso não há restrição sobre a NF."""
    if not eh_fornecedor(usuario):
        return
    if ag.fornecedor.cnpj != cnpj_do_usuario(usuario) and ag.criado_por_id != usuario.id:
        raise AcessoNegadoError("Este agendamento é de outra empresa", "AGENDAMENTO_DE_OUTRO_FORNECEDOR")
