"""Boletim Diário de Serviços dos Ensacadores (Tarefa 2).

Ordem de uso: POST /boletins (abre o rascunho do dia; boletim geral, sem armazém)
  -> PUT /boletins/{id}/producao  e  PUT /boletins/{id}/equipe  (quantas vezes quiser)
  -> POST /boletins/{id}/fechar   (congela o custo do dia)
"""
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import LocalFisico, StatusBoletim
from app.schemas.boletim import BoletimCreate, BoletimOut, EquipeIn, FecharIn, ProducaoIn
from app.services import boletim_service as svc

router = APIRouter(prefix="/boletins", tags=["Boletim diário (chapas)"])


@router.post("", response_model=BoletimOut, status_code=201)
def abrir(dados: BoletimCreate, db: Session = Depends(get_db)):
    return svc.para_saida(db, svc.abrir(db, dados))


@router.get("", response_model=list[BoletimOut])
def listar(inicio: Optional[date] = None, fim: Optional[date] = None,
           local: Optional[LocalFisico] = None, status: Optional[StatusBoletim] = None,
           db: Session = Depends(get_db)):
    return [svc.para_saida(db, b) for b in svc.listar(db, inicio, fim, local, status)]


@router.get("/{boletim_id}", response_model=BoletimOut)
def detalhar(boletim_id: int, db: Session = Depends(get_db)):
    return svc.para_saida(db, svc.buscar(db, boletim_id))


@router.put("/{boletim_id}/producao", response_model=BoletimOut)
def producao(boletim_id: int, dados: ProducaoIn, db: Session = Depends(get_db)):
    return svc.para_saida(db, svc.lancar_producao(db, boletim_id, dados.linhas))


@router.put("/{boletim_id}/equipe", response_model=BoletimOut)
def equipe(boletim_id: int, dados: EquipeIn, db: Session = Depends(get_db)):
    return svc.para_saida(db, svc.definir_equipe(db, boletim_id, dados.equipe))


@router.post("/{boletim_id}/fechar", response_model=BoletimOut)
def fechar(boletim_id: int, dados: FecharIn, db: Session = Depends(get_db)):
    return svc.para_saida(db, svc.fechar(db, boletim_id, dados.fechado_por))


@router.post("/{boletim_id}/reabrir", response_model=BoletimOut)
def reabrir(boletim_id: int, db: Session = Depends(get_db)):
    return svc.para_saida(db, svc.reabrir(db, boletim_id))