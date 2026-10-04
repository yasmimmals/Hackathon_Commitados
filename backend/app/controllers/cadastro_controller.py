"""Cadastros de apoio: baias (docas), equipamentos, chapas e tipos de item do boletim."""
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.auth import exigir_perfil
from app.core.database import get_db
from app.core.exceptions import NaoEncontradoError, RegraNegocioError
from app.models import Baia, Chapa, Equipamento, LocalFisico, PerfilUsuario, TipoItem
from app.schemas.agendamento import BaiaCreate, BaiaOut, EquipamentoOut
from app.schemas.boletim import ChapaCreate, ChapaOut, TipoItemOut

router = APIRouter(prefix="/cadastros", tags=["Cadastros"])

_SO_ARMAZEM = [Depends(exigir_perfil(PerfilUsuario.ARMAZEM))]


@router.get("/baias", response_model=list[BaiaOut])
def listar_baias(local: Optional[LocalFisico] = None, incluir_inativas: bool = False,
                 db: Session = Depends(get_db)):
    stmt = select(Baia)
    if local:
        stmt = stmt.where(Baia.local == local)
    if not incluir_inativas:
        stmt = stmt.where(Baia.ativa.is_(True))
    return db.scalars(stmt.order_by(Baia.local, Baia.codigo)).all()


@router.post("/baias", response_model=BaiaOut, status_code=201, dependencies=_SO_ARMAZEM)
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


@router.patch("/baias/{baia_id}/ativa", response_model=BaiaOut, dependencies=_SO_ARMAZEM)
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


@router.get("/chapas", response_model=list[ChapaOut])
def listar_chapas(incluir_inativos: bool = False, db: Session = Depends(get_db)):
    stmt = select(Chapa)
    if not incluir_inativos:
        stmt = stmt.where(Chapa.ativo.is_(True))
    return db.scalars(stmt.order_by(Chapa.nome)).all()


@router.post("/chapas", response_model=ChapaOut, status_code=201, dependencies=_SO_ARMAZEM)
def criar_chapa(dados: ChapaCreate, db: Session = Depends(get_db)):
    chapa = Chapa(matricula=dados.matricula.strip(), nome=dados.nome)
    db.add(chapa)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise RegraNegocioError(f"Matrícula {dados.matricula} já cadastrada",
                                codigo="CHAPA_DUPLICADO")
    db.refresh(chapa)
    return chapa


@router.get("/tipos-item", response_model=list[TipoItemOut])
def listar_tipos_item(db: Session = Depends(get_db)):
    """As 14 linhas do boletim com o preço unitário."""
    return db.scalars(select(TipoItem).where(TipoItem.ativo.is_(True)).order_by(TipoItem.id)).all()