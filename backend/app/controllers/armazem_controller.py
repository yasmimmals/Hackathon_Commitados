"""Rotas do responsável pelo armazém / operador do pátio (PWA).

Fluxo: Compras aprova -> aparece em /aguardando-destino -> define a baia (destinos)
-> caminhão chega (chegada) -> entrada -> saída (chapas + equipamentos).
"""
from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core import config
from app.core.auth import exigir_perfil, garantir_nota_do_fornecedor
from app.core.database import get_db
from app.models import LocalFisico, PerfilUsuario, Usuario
from app.schemas.agendamento import (
    AgendamentoOut, BalcaoCreate, DestinosIn, EntradaIn, Programacao, ReagendamentoChuvaIn,
    SaidaIn,
)
from app.services import agendamento_service as svc
from app.services import programacao_service
from app.controllers.agendamento_controller import out

router = APIRouter(prefix="/armazem", tags=["Armazém (operador do pátio)"])

_SO_ARMAZEM = [Depends(exigir_perfil(PerfilUsuario.ARMAZEM))]


@router.get("/programacao", response_model=Programacao, dependencies=_SO_ARMAZEM)
def programacao(inicio: Optional[date] = None, fim: Optional[date] = None,
                local: Optional[LocalFisico] = None, db: Session = Depends(get_db)):
    """O que vai chegar nos próximos dias (padrão: hoje + 6), por armazém, com a equipe
    estimada. Inclui o que o Compras ainda não aprovou (confirmado = false)."""
    padrao_ini, padrao_fim = programacao_service.periodo_padrao(datetime.now(config.TZ).date())
    return programacao_service.programacao(db, inicio or padrao_ini, fim or padrao_fim, local)


@router.get("/aguardando-destino", response_model=list[AgendamentoOut], dependencies=_SO_ARMAZEM)
def aguardando_destino(data: Optional[date] = None, db: Session = Depends(get_db)):
    """Aprovados por Compras que ainda não têm baia definida."""
    return [out(a) for a in svc.aguardando_destino(db, data)]


@router.get("/fila", response_model=list[AgendamentoOut], dependencies=_SO_ARMAZEM)
def fila(data: date, local: Optional[LocalFisico] = None, db: Session = Depends(get_db)):
    return [out(a) for a in svc.fila_do_dia(db, data, local)]


@router.post("/balcao", response_model=AgendamentoOut, status_code=201)
def balcao(dados: BalcaoCreate, db: Session = Depends(get_db),
           usuario: Usuario = Depends(exigir_perfil(PerfilUsuario.FORNECEDOR, PerfilUsuario.ARMAZEM))):
    garantir_nota_do_fornecedor(usuario, svc.buscar_nota(db, dados.nota_fiscal_id))
    return out(svc.agendar_balcao(db, dados))


@router.put("/agendamentos/{ag_id}/destinos", response_model=AgendamentoOut, dependencies=_SO_ARMAZEM)
def destinos(ag_id: int, dados: DestinosIn, db: Session = Depends(get_db)):
    return out(svc.definir_destinos(db, ag_id, dados.destinos))


@router.post("/agendamentos/{ag_id}/chegada", response_model=AgendamentoOut, dependencies=_SO_ARMAZEM)
def chegada(ag_id: int, db: Session = Depends(get_db)):
    return out(svc.registrar_chegada(db, ag_id))


@router.post("/agendamentos/{ag_id}/entrada", response_model=AgendamentoOut, dependencies=_SO_ARMAZEM)
def entrada(ag_id: int, dados: EntradaIn, db: Session = Depends(get_db)):
    return out(svc.iniciar_descarga(db, ag_id, dados.local))


@router.post("/agendamentos/{ag_id}/saida", response_model=AgendamentoOut, dependencies=_SO_ARMAZEM)
def saida(ag_id: int, dados: SaidaIn, db: Session = Depends(get_db)):
    return out(svc.finalizar_descarga(db, ag_id, dados))


@router.post("/agendamentos/{ag_id}/nao-compareceu", response_model=AgendamentoOut, dependencies=_SO_ARMAZEM)
def nao_compareceu(ag_id: int, db: Session = Depends(get_db)):
    return out(svc.marcar_nao_compareceu(db, ag_id))


@router.post("/agendamentos/{ag_id}/reagendar-chuva", response_model=AgendamentoOut, dependencies=_SO_ARMAZEM)
def reagendar_chuva(ag_id: int, dados: ReagendamentoChuvaIn, db: Session = Depends(get_db)):
    return out(svc.reagendar_por_chuva(db, ag_id, dados))