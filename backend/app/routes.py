"""Mapa central de rotas da API.

Cada controller é um APIRouter com seu próprio prefixo. Para adicionar um
módulo novo (ex.: boletim), crie o controller e registre UMA linha aqui.

    /health          -> health_controller
    /fornecedores    -> fornecedor_controller
    /agendamentos    -> agendamento_controller   (fornecedor e Compras)
    /armazem         -> armazem_controller       (operador do pátio / PWA)
    /cadastros       -> cadastro_controller      (docas, equipamentos, chapas, tipos de item)
    /boletins        -> boletim_controller       (boletim diário dos chapas - Tarefa 2)
    /auth            -> auth_controller          (login e cadastro)

Login: todas as rotas, menos /health e /auth/login|cadastro, exigem "Authorization: Bearer <token>".

Tudo fica sob /api/v1 (prefixo aplicado no main.py).
"""
from fastapi import APIRouter, Depends

from app.controllers import (
    agendamento_controller,
    armazem_controller,
    auth_controller,
    boletim_controller,
    cadastro_controller,
    fornecedor_controller,
    health_controller,
)
from app.core.auth import exigir_perfil, usuario_atual
from app.models import PerfilUsuario

api_router = APIRouter()

api_router.include_router(health_controller.router)
api_router.include_router(auth_controller.router)

_LOGADO = [Depends(usuario_atual)]
api_router.include_router(fornecedor_controller.router, dependencies=_LOGADO)
api_router.include_router(agendamento_controller.router, dependencies=_LOGADO)
api_router.include_router(armazem_controller.router, dependencies=_LOGADO)
api_router.include_router(cadastro_controller.router, dependencies=_LOGADO)
api_router.include_router(boletim_controller.router,
                          dependencies=[Depends(exigir_perfil(PerfilUsuario.ARMAZEM))])
