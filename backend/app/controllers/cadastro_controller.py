"""Cadastros de apoio: baias (onde o caminhão encosta) e catálogo de equipamentos."""
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.exceptions import NaoEncontradoError, RegraNegocioError
from app.models import Baia, Equipamento, LocalFisico
from app.schemas.agendamento import BaiaCreate, BaiaOut, EquipamentoOut

router = APIRouter(prefix="/cadastros", tags=["Cadastros"])


@router.get("/baias", response_model=list[BaiaOut])
def listar_baias(local: Optional[LocalFisico] = None, incluir_inativas: bool = False,
                 db: Session = Depends(get_db)):
    stmt = select(Baia)
    if local:
        stmt = stmt.where(Baia.local == local)
    if not incluir_inativas:
        stmt = stmt.where(Baia.ativa.is_(True))
    return db.scalars(stmt.order_by(Baia.local, Baia.codigo)).all()


@router.post("/baias", response_model=BaiaOut, status_code=201)
def criar_baia(dados: BaiaCreate, db: Session = Depends(get_db)):
    baia = Baia(**dados.model_dump())
    db.add(baia)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise RegraNegocioError(f"Já existe a baia {dados.codigo} em {dados.local.value}",
                                codigo="BAIA_DUPLICADA")
    db.refresh(baia)
    return baia


@router.patch("/baias/{baia_id}/ativa", response_model=BaiaOut)
def ativar_desativar_baia(baia_id: int, ativa: bool, db: Session = Depends(get_db)):
    baia = db.get(Baia, baia_id)
    if not baia:
        raise NaoEncontradoError(f"Baia {baia_id} não encontrada")
    baia.ativa = ativa
    db.commit()
    db.refresh(baia)
    return baia


@router.get("/equipamentos", response_model=list[EquipamentoOut])
def listar_equipamentos(db: Session = Depends(get_db)):
    return db.scalars(select(Equipamento).order_by(Equipamento.nome)).all()