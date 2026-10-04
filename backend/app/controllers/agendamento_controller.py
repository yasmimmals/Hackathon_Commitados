"""Rotas do fornecedor (enviar nota, consultar vagas, agendar, cancelar)
e de Compras (conferir, aprovar, reprovar).

Fluxo do fornecedor:
  1. POST /agendamentos/nota-fiscal        -> envia XML ou PDF; o sistema lê tudo
  2. GET  /agendamentos/disponibilidade    -> vagas + previsão de chuva (se adubo)
  3. POST /agendamentos                    -> escolhe acondicionamento, dia e horário
"""
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import StatusAgendamento
from app.schemas.agendamento import (
    AgendamentoCreate, AgendamentoOut, AprovacaoIn, ConferenciaOut, NotaFiscalOut,
    NotificacaoOut, RejeicaoIn, SlotDisponibilidade,
)
from app.services import agendamento_service as svc
from app.services import notificacao_service

router = APIRouter(prefix="/agendamentos", tags=["Agendamento (fornecedor e Compras)"])


def out(ag) -> AgendamentoOut:
    resp = AgendamentoOut.model_validate(ag)
    resp.chapas_norma = svc.chapas_norma(ag)
    resp.aviso_chuva = svc.aviso_chuva(ag)
    return resp


@router.post("/nota-fiscal", response_model=NotaFiscalOut, status_code=201)
async def enviar_nota(arquivo: UploadFile = File(...), db: Session = Depends(get_db)):
    return svc.registrar_nota(db, arquivo.filename or "", await arquivo.read())


@router.get("/nota-fiscal/{nota_id}", response_model=NotaFiscalOut)
def ver_nota(nota_id: int, db: Session = Depends(get_db)):
    return svc.buscar_nota(db, nota_id)


@router.get("/disponibilidade", response_model=list[SlotDisponibilidade])
def disponibilidade(data: date, nota_fiscal_id: Optional[int] = None,
                    db: Session = Depends(get_db)):
    return svc.disponibilidade(db, data, nota_fiscal_id)


@router.post("", response_model=AgendamentoOut, status_code=201)
def criar(dados: AgendamentoCreate, db: Session = Depends(get_db)):
    return out(svc.criar_agendamento(db, dados))


@router.get("", response_model=list[AgendamentoOut])
def listar(data: Optional[date] = None, status: Optional[StatusAgendamento] = None,
           fornecedor_id: Optional[int] = None, db: Session = Depends(get_db)):
    return [out(a) for a in svc.listar(db, data, status, fornecedor_id)]


@router.get("/{ag_id}", response_model=AgendamentoOut)
def detalhar(ag_id: int, db: Session = Depends(get_db)):
    return out(svc.buscar(db, ag_id))


@router.post("/{ag_id}/cancelar", response_model=AgendamentoOut)
def cancelar(ag_id: int, db: Session = Depends(get_db)):
    return out(svc.cancelar(db, ag_id))


@router.get("/{ag_id}/notificacoes", response_model=list[NotificacaoOut])
def notificacoes(ag_id: int, db: Session = Depends(get_db)):
    """Avisos enviados ao fornecedor sobre este agendamento."""
    svc.buscar(db, ag_id)
    return notificacao_service.listar(db, ag_id)


# ---- Compras ----

@router.get("/{ag_id}/conferencia", response_model=ConferenciaOut)
def conferencia(ag_id: int, db: Session = Depends(get_db)):
    """Tela do Compras: nota lida + checagens automáticas, para aprovar ou reprovar."""
    c = svc.conferencia(db, ag_id)
    return {**c, "agendamento": out(c["agendamento"])}


@router.post("/{ag_id}/aprovar", response_model=AgendamentoOut)
def aprovar(ag_id: int, dados: AprovacaoIn, db: Session = Depends(get_db)):
    return out(svc.aprovar(db, ag_id, dados))


@router.post("/{ag_id}/rejeitar", response_model=AgendamentoOut)
def rejeitar(ag_id: int, dados: RejeicaoIn, db: Session = Depends(get_db)):
    """Reprovar exige motivo e observação; o fornecedor recebe o aviso por e-mail."""
    return out(svc.rejeitar(db, ag_id, dados))