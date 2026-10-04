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
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.auth import (
    cnpj_do_usuario, eh_fornecedor, exigir_perfil, garantir_agendamento_do_fornecedor, usuario_atual,
)
from app.core.database import get_db
from app.models import Fornecedor, PerfilUsuario, StatusAgendamento, Usuario
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
    """A nota pode ser de qualquer empresa (não precisa ser a do fornecedor logado)."""
    return svc.registrar_nota(db, arquivo.filename or "", await arquivo.read())


@router.get("/nota-fiscal/{nota_id}", response_model=NotaFiscalOut)
def ver_nota(nota_id: int, db: Session = Depends(get_db)):
    return svc.buscar_nota(db, nota_id)


@router.get("/disponibilidade", response_model=list[SlotDisponibilidade])
def disponibilidade(data: date, nota_fiscal_id: Optional[int] = None,
                    db: Session = Depends(get_db)):
    return svc.disponibilidade(db, data, nota_fiscal_id)


@router.post("", response_model=AgendamentoOut, status_code=201)
def criar(dados: AgendamentoCreate, db: Session = Depends(get_db),
          usuario: Usuario = Depends(exigir_perfil(PerfilUsuario.FORNECEDOR))):
    return out(svc.criar_agendamento(db, dados, criado_por_id=usuario.id))


@router.get("", response_model=list[AgendamentoOut])
def listar(data: Optional[date] = None, status: Optional[StatusAgendamento] = None,
           fornecedor_id: Optional[int] = None, db: Session = Depends(get_db),
           usuario: Usuario = Depends(usuario_atual)):
    """Fornecedor logado vê o que é da própria empresa (todos os cadastros com o mesmo CNPJ)
    e o que ele mesmo agendou com nota de outra empresa."""
    if eh_fornecedor(usuario):
        ids = list(db.scalars(select(Fornecedor.id).where(Fornecedor.cnpj == cnpj_do_usuario(usuario))))
        return [out(a) for a in svc.listar(db, data, status, fornecedor_ids=ids, criado_por_id=usuario.id)]
    return [out(a) for a in svc.listar(db, data, status, fornecedor_id)]


@router.get("/{ag_id}", response_model=AgendamentoOut)
def detalhar(ag_id: int, db: Session = Depends(get_db),
             usuario: Usuario = Depends(usuario_atual)):
    ag = svc.buscar(db, ag_id)
    garantir_agendamento_do_fornecedor(usuario, ag)
    return out(ag)


@router.post("/{ag_id}/cancelar", response_model=AgendamentoOut)
def cancelar(ag_id: int, db: Session = Depends(get_db),
             usuario: Usuario = Depends(exigir_perfil(PerfilUsuario.FORNECEDOR))):
    garantir_agendamento_do_fornecedor(usuario, svc.buscar(db, ag_id))
    return out(svc.cancelar(db, ag_id))


@router.get("/{ag_id}/notificacoes", response_model=list[NotificacaoOut])
def notificacoes(ag_id: int, db: Session = Depends(get_db),
                 usuario: Usuario = Depends(usuario_atual)):
    """Avisos enviados ao fornecedor sobre este agendamento."""
    garantir_agendamento_do_fornecedor(usuario, svc.buscar(db, ag_id))
    return notificacao_service.listar(db, ag_id)


# ---- Compras ----

@router.get("/{ag_id}/conferencia", response_model=ConferenciaOut,
            dependencies=[Depends(exigir_perfil(PerfilUsuario.COMPRAS))])
def conferencia(ag_id: int, db: Session = Depends(get_db)):
    """Tela do Compras: nota lida + checagens automáticas, para aprovar ou reprovar."""
    c = svc.conferencia(db, ag_id)
    return {**c, "agendamento": out(c["agendamento"])}


@router.post("/{ag_id}/aprovar", response_model=AgendamentoOut,
             dependencies=[Depends(exigir_perfil(PerfilUsuario.COMPRAS))])
def aprovar(ag_id: int, dados: AprovacaoIn, db: Session = Depends(get_db)):
    return out(svc.aprovar(db, ag_id, dados))


@router.post("/{ag_id}/rejeitar", response_model=AgendamentoOut,
             dependencies=[Depends(exigir_perfil(PerfilUsuario.COMPRAS))])
def rejeitar(ag_id: int, dados: RejeicaoIn, db: Session = Depends(get_db)):
    """Reprovar exige motivo e observação; o fornecedor recebe o aviso por e-mail."""
    return out(svc.rejeitar(db, ag_id, dados))