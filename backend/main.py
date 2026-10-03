"""Ponto de entrada da API. Rotas ficam em app/routes.py.

Swagger: /swagger  |  OpenAPI: /openapi.json  |  todas as rotas sob /api/v1
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.error_handlers import registrar_error_handlers
from app.routes import api_router

API_PREFIX = "/api/v1"

app = FastAPI(
    title="Cocapec - Recebimento Inteligente",
    version="1.0.0",
    docs_url="/swagger",
    redoc_url="/redoc",
)

# Hackathon: frontend em outra máquina/porta -> CORS aberto
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

registrar_error_handlers(app)
app.include_router(api_router, prefix=API_PREFIX)