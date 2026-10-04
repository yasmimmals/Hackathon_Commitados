"""Cadastro e login de usuários."""
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core import config
from app.core.exceptions import NaoAutenticadoError, RegraNegocioError
from app.core.seguranca import conferir_senha, gerar_hash_senha, gerar_token
from app.models import Fornecedor, PerfilUsuario, Usuario

# Comparado quando o e-mail não existe, para o tempo de resposta não revelar quem é cadastrado.
_HASH_FICTICIO = gerar_hash_senha("senha-ficticia-para-tempo-constante")


def _por_email(db: Session, email: str):
    return db.scalars(select(Usuario).where(func.lower(Usuario.email) == email.lower())).first()


def sessao(usuario: Usuario) -> dict:
    token, expira = gerar_token(usuario.id, usuario.perfil.value)
    return {"token": token, "expira_em": expira, "usuario": usuario}


def autenticar(db: Session, email: str, senha: str) -> dict:
    usuario = _por_email(db, email)
    ok = conferir_senha(senha, usuario.senha_hash if usuario else _HASH_FICTICIO)
    if not usuario or not ok:
        raise NaoAutenticadoError("E-mail ou senha inválidos", "CREDENCIAIS_INVALIDAS")
    if not usuario.ativo:
        raise NaoAutenticadoError("Usuário desativado. Procure a COCAPEC", "USUARIO_INATIVO")
    return sessao(usuario)


def _empresa(db: Session, cnpj: str, nome: str, email: str) -> Fornecedor:
    """Mesma regra da leitura da NF: a empresa é o primeiro fornecedor com o CNPJ."""
    empresa = db.scalars(select(Fornecedor).where(Fornecedor.cnpj == cnpj)
                         .order_by(Fornecedor.id)).first()
    if empresa is None:
        empresa = Fornecedor(cnpj=cnpj, nome=nome.strip(), email=email)
        db.add(empresa)
        db.flush()
    elif not empresa.email:
        empresa.email = email
    return empresa


def cadastrar(db: Session, dados) -> Usuario:
    if _por_email(db, dados.email):
        raise RegraNegocioError("Já existe um usuário com este e-mail", codigo="EMAIL_JA_CADASTRADO")
    if dados.perfil in (PerfilUsuario.COMPRAS, PerfilUsuario.ARMAZEM) and \
            (dados.codigo_interno or "").strip() != config.CODIGO_CADASTRO_INTERNO:
        raise RegraNegocioError("Código interno inválido: peça à COCAPEC",
                                codigo="CODIGO_INTERNO_INVALIDO")

    usuario = Usuario(email=dados.email, nome=dados.nome.strip(), perfil=dados.perfil,
                      senha_hash=gerar_hash_senha(dados.senha))
    if dados.perfil == PerfilUsuario.FORNECEDOR:
        usuario.fornecedor = _empresa(db, dados.cnpj, dados.empresa, dados.email)
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario
