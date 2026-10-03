from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.controllers import agendamento_controller, armazem_controller, fornecedor_controller
from app.core.database import get_db
from app.core.exceptions import NaoEncontradoError, RegraNegocioError

app = FastAPI(title="Cocapec - Recebimento Inteligente")

# Libera o frontend React (Vite usa 5173, CRA usa 3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RegraNegocioError)
def regra_negocio(_: Request, exc: RegraNegocioError):
    return JSONResponse(status_code=409, content={"detail": str(exc), **exc.extra})


@app.exception_handler(NaoEncontradoError)
def nao_encontrado(_: Request, exc: NaoEncontradoError):
    return JSONResponse(status_code=404, content={"detail": str(exc)})


app.include_router(fornecedor_controller.router)
app.include_router(agendamento_controller.router)
app.include_router(armazem_controller.router)


@app.get("/health")
def health(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"status": "ok", "db": "ok"}