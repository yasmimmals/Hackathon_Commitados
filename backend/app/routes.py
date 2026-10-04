"""Mapa central de rotas da API.

Cada controller é um APIRouter com seu próprio prefixo. Para adicionar um
módulo novo, crie o controller e registre UMA linha aqui.

    /health          -> health_controller
    /auth            -> auth_controller          (login e cadastro de usuários)
    /fornecedores    -> fornecedor_controller
    /agendamentos    -> agendamento_controller   (fornecedor e Compras)
    /armazem         -> armazem_controller       (operador do pátio / PWA)
    /cadastros       -> cadastro_controller      (docas, equipamentos, chapas, tipos de item)
    /boletins        -> boletim_controller       (boletim diário dos chapas - Tarefa 2)
    /painel          -> painel_controller        (indicadores e "sobra ou falta chapa" - Tarefa 3)

Tudo fica sob /api/v1 (prefixo aplicado no main.py).
"""
from fastapi import APIRouter

from app.controllers import (
    agendamento_controller,
    armazem_controller,
    auth_controller,                # login
    boletim_controller,
    cadastro_controller,
    fornecedor_controller,
    health_controller,
    painel_controller,
)

api_router = APIRouter()

api_router.include_router(health_controller.router)
api_router.include_router(auth_controller.router)       # login
api_router.include_router(fornecedor_controller.router)
api_router.include_router(agendamento_controller.router)
api_router.include_router(armazem_controller.router)
api_router.include_router(cadastro_controller.router)
api_router.include_router(boletim_controller.router)
api_router.include_router(painel_controller.router)