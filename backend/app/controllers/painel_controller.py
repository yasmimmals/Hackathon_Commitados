"""Painel gerencial (Tarefa 3). Só leitura. Acesso: Compras e Armazém (fornecedor não vê).

Toda resposta diz de onde vem o número (`fonte`: HISTORICO ou SISTEMA) e quais premissas
foram usadas. Filtros comuns: `inicio`, `fim` (datas) e, quando faz sentido, `local`.
"""
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth import exigir_perfil
from app.core.database import get_db
from app.models import LocalFisico, PerfilUsuario
from app.services import painel_service as svc

# Custo e mão de obra são informação de gestão: só Compras e Armazém
router = APIRouter(prefix="/painel", tags=["Painel gerencial (Tarefa 3)"],
                   dependencies=[Depends(exigir_perfil(PerfilUsuario.COMPRAS, PerfilUsuario.ARMAZEM))])


@router.get("/resumo")
def resumo(inicio: Optional[date] = None, fim: Optional[date] = None, db: Session = Depends(get_db)):
    """Visão executiva: a resposta à direção e os números principais."""
    return svc.resumo(db, inicio, fim)


@router.get("/sobra-falta")
def sobra_falta(inicio: Optional[date] = None, fim: Optional[date] = None,
                db: Session = Depends(get_db)):
    """A pergunta da direção. `historico`: estimativa mês a mês (folha x caminhões).
    `sistema`: medição pelo boletim (complemento pago sem produção)."""
    return {"historico": svc.sobra_falta_historico(db, inicio, fim),
            "sistema": svc.sobra_falta_sistema(db, inicio, fim)}


@router.get("/cargas")
def cargas(inicio: Optional[date] = None, fim: Optional[date] = None,
           local: Optional[LocalFisico] = None, db: Session = Depends(get_db)):
    """Quantidade de cargas recebidas por dia e por armazém."""
    return svc.cargas_por_dia(db, inicio, fim, local)


@router.get("/tempos")
def tempos(inicio: Optional[date] = None, fim: Optional[date] = None,
           local: Optional[LocalFisico] = None, db: Session = Depends(get_db)):
    """Tempo médio de espera (chegada -> entrada) e de descarga (entrada -> saída)."""
    return svc.tempos(db, inicio, fim, local)


@router.get("/chapas-por-recebimento")
def chapas_por_recebimento(inicio: Optional[date] = None, fim: Optional[date] = None,
                           local: Optional[LocalFisico] = None, db: Session = Depends(get_db)):
    return svc.chapas_por_recebimento(db, inicio, fim, local)


@router.get("/utilizacao")
def utilizacao(inicio: Optional[date] = None, fim: Optional[date] = None,
               local: Optional[LocalFisico] = None, db: Session = Depends(get_db)):
    """Utilização das docas e dos equipamentos."""
    return svc.utilizacao(db, inicio, fim, local)


@router.get("/fornecedores")
def fornecedores(inicio: Optional[date] = None, fim: Optional[date] = None, limite: int = 10,
                 db: Session = Depends(get_db)):
    """Fornecedores com maior volume."""
    return svc.fornecedores_maior_volume(db, inicio, fim, limite)


@router.get("/movimento")
def movimento(inicio: Optional[date] = None, fim: Optional[date] = None,
              db: Session = Depends(get_db)):
    """Horários, dias da semana e meses de maior movimento."""
    return svc.movimento(db, inicio, fim)


@router.get("/nao-recebimentos")
def nao_recebimentos(inicio: Optional[date] = None, fim: Optional[date] = None,
                     db: Session = Depends(get_db)):
    """Quantidade de não recebimentos, por motivo."""
    return svc.nao_recebimentos(db, inicio, fim)


@router.get("/custo")
def custo(inicio: Optional[date] = None, fim: Optional[date] = None,
          db: Session = Depends(get_db)):
    """Custo estimado da operação (mão de obra dos chapas, sem encargos)."""
    return svc.custo(db, inicio, fim)


@router.get("/qualidade-dados")
def qualidade_dados(db: Session = Depends(get_db)):
    """Problemas encontrados nos dados históricos e como foram tratados."""
    return svc.qualidade_dados(db)