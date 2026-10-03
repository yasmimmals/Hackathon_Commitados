"""Todas as respostas de erro da API têm o mesmo formato:

    {"codigo": "VAGA_OCUPADA", "mensagem": "Horário lotado", "detalhes": {...}}

409 = regra de negócio | 404 = não encontrado | 422 = dados inválidos
"""
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.exceptions import NaoEncontradoError, RegraNegocioError


def _erro(status: int, codigo: str, mensagem: str, detalhes=None) -> JSONResponse:
    return JSONResponse(status_code=status, content=jsonable_encoder(
        {"codigo": codigo, "mensagem": mensagem, "detalhes": detalhes or {}}))


def registrar_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(RegraNegocioError)
    def regra_negocio(_: Request, exc: RegraNegocioError):
        return _erro(409, exc.codigo, str(exc), exc.extra)

    @app.exception_handler(NaoEncontradoError)
    def nao_encontrado(_: Request, exc: NaoEncontradoError):
        return _erro(404, "NAO_ENCONTRADO", str(exc))

    @app.exception_handler(RequestValidationError)
    def validacao(_: Request, exc: RequestValidationError):
        return _erro(422, "VALIDACAO", "Dados inválidos", {"erros": exc.errors()})

    @app.exception_handler(StarletteHTTPException)
    def http(_: Request, exc: StarletteHTTPException):
        mensagem = exc.detail if isinstance(exc.detail, str) else "Erro HTTP"
        return _erro(exc.status_code, "HTTP", mensagem)