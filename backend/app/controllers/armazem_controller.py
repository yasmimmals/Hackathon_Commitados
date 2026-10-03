"""Rotas do operador do pátio (PWA): fila, destino, 3 marcos, balcão, chuva, no-show."""
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import LocalFisico
from app.schemas.agendamento import (
    AgendamentoOut, BalcaoCreate, DestinosIn, EntradaIn, ReagendamentoChuvaIn, SaidaIn,
)
from app.services import agendamento_service as svc
from app.controllers.agendamento_controller import out

router = APIRouter(prefix="/armazem", tags=["Armazém (operador do pátio)"])


@router.get("/fila", response_model=list[AgendamentoOut])
def fila(data: date, local: Optional[LocalFisico] = None, db: Session = Depends(get_db)):
    return [out(a) for a in svc.fila_do_dia(db, data, local)]


@router.post("/balcao", response_model=AgendamentoOut, status_code=201)
def balcao(dados: BalcaoCreate, db: Session = Depends(get_db)):
    return out(svc.agendar_balcao(db, dados))


@router.put("/agendamentos/{ag_id}/destinos", response_model=AgendamentoOut)
def destinos(ag_id: int, dados: DestinosIn, db: Session = Depends(get_db)):
    return out(svc.definir_destinos(db, ag_id, dados.locais))


@router.post("/agendamentos/{ag_id}/chegada", response_model=AgendamentoOut)
def chegada(ag_id: int, db: Session = Depends(get_db)):
    return out(svc.registrar_chegada(db, ag_id))


@router.post("/agendamentos/{ag_id}/entrada", response_model=AgendamentoOut)
def entrada(ag_id: int, dados: EntradaIn, db: Session = Depends(get_db)):
    return out(svc.iniciar_descarga(db, ag_id, dados.local))


@router.post("/agendamentos/{ag_id}/saida", response_model=AgendamentoOut)
def saida(ag_id: int, dados: SaidaIn, db: Session = Depends(get_db)):
    return out(svc.finalizar_descarga(db, ag_id, dados))


@router.post("/agendamentos/{ag_id}/nao-compareceu", response_model=AgendamentoOut)
def nao_compareceu(ag_id: int, db: Session = Depends(get_db)):
    return out(svc.marcar_nao_compareceu(db, ag_id))


@router.post("/agendamentos/{ag_id}/reagendar-chuva", response_model=AgendamentoOut)
def reagendar_chuva(ag_id: int, dados: ReagendamentoChuvaIn, db: Session = Depends(get_db)):
    return out(svc.reagendar_por_chuva(db, ag_id, dados))