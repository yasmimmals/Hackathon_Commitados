"""Login e cadastro.

    POST /auth/login     -> {token, usuario}   (envie depois: Authorization: Bearer <token>)
    POST /auth/cadastro  -> cria o usuário e já devolve a sessão
    GET  /auth/me        -> usuário do token
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth import usuario_atual
from app.core.database import get_db
from app.models import Usuario
from app.schemas.auth import CadastroIn, LoginIn, SessaoOut, UsuarioOut
from app.services import auth_service as svc

router = APIRouter(prefix="/auth", tags=["Acesso (login)"])


@router.post("/login", response_model=SessaoOut)
def login(dados: LoginIn, db: Session = Depends(get_db)):
    return svc.autenticar(db, dados.email, dados.senha)


@router.post("/cadastro", response_model=SessaoOut, status_code=201)
def cadastro(dados: CadastroIn, db: Session = Depends(get_db)):
    return svc.sessao(svc.cadastrar(db, dados))


@router.get("/me", response_model=UsuarioOut)
def me(usuario: Usuario = Depends(usuario_atual)):
    return usuario
