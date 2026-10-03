from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.exceptions import RegraNegocioError
from app.models import Fornecedor
from app.schemas.agendamento import FornecedorCreate, FornecedorOut

router = APIRouter(prefix="/fornecedores", tags=["Fornecedores"])


@router.post("", response_model=FornecedorOut, status_code=201)
def criar(dados: FornecedorCreate, db: Session = Depends(get_db)):
    f = Fornecedor(**dados.model_dump())
    db.add(f)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise RegraNegocioError("Já existe fornecedor com esse código",
                                {"codigo": dados.codigo}, codigo="FORNECEDOR_DUPLICADO")
    db.refresh(f)
    return f


@router.get("", response_model=list[FornecedorOut])
def listar(q: Optional[str] = None, limite: int = 50, db: Session = Depends(get_db)):
    stmt = select(Fornecedor)
    if q:
        stmt = stmt.where(or_(Fornecedor.nome.ilike(f"%{q}%"), Fornecedor.cnpj.like(f"%{q}%")))
    return db.scalars(stmt.order_by(Fornecedor.nome).limit(limite)).all()