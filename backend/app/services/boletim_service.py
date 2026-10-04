"""Boletim Diário de Serviços dos Ensacadores (Tarefa 2).

Fluxo: abrir (rascunho) -> lançar produção e equipe, quantas vezes quiser ao longo do dia
-> fechar (congela os valores).

Padrão da Cocapec: UM boletim geral por dia (local vazio). O modo por armazém fica
disponível em config.BOLETIM_POR_ARMAZEM. Os dois nunca convivem no mesmo dia, para o
custo não ser contado duas vezes.
O cálculo fica em boletim_calculo.py; aqui só persistência e validações.
"""
from datetime import date, datetime
from typing import Optional

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.core import config
from app.core.exceptions import NaoEncontradoError, RegraNegocioError
from app.models import (
    BoletimChapa, BoletimDiario, BoletimProducao, Chapa, LocalFisico, StatusBoletim, TipoItem,
)
from app.services.boletim_calculo import arredondar, calcular


def _agora() -> datetime:
    return datetime.now(config.TZ)


def buscar(db: Session, boletim_id: int) -> BoletimDiario:
    b = db.scalars(select(BoletimDiario).where(BoletimDiario.id == boletim_id).options(
        selectinload(BoletimDiario.producoes).selectinload(BoletimProducao.tipo_item),
        selectinload(BoletimDiario.chapas_alocados).selectinload(BoletimChapa.chapa),
    )).first()
    if not b:
        raise NaoEncontradoError(f"Boletim {boletim_id} não encontrado")
    return b


def _exigir_rascunho(b: BoletimDiario):
    if b.status == StatusBoletim.FECHADO:
        raise RegraNegocioError(
            "Boletim fechado: reabra para alterar", {"boletim_id": b.id}, codigo="BOLETIM_FECHADO")


def _recalcular(b: BoletimDiario) -> None:
    linhas = [(p.quantidade_total, p.preco_unitario) for p in b.producoes]
    meias = sum(1 for c in b.chapas_alocados if c.meia_diaria)
    r = calcular(linhas, len(b.chapas_alocados), meias, config.PISO_DIARIA)
    b.producao_total = r.producao_total
    b.diarias_equivalentes = r.diarias_equivalentes
    b.valor_por_diaria = r.valor_por_diaria
    b.total_pagar = r.total_pagar
    b.complemento = r.complemento


def _nome(local: Optional[LocalFisico]) -> str:
    return local.value if local else "geral"


def abrir(db: Session, dados) -> BoletimDiario:
    local = dados.local
    if config.BOLETIM_POR_ARMAZEM and local is None:
        raise RegraNegocioError("Informe o armazém do boletim", codigo="LOCAL_OBRIGATORIO")
    if not config.BOLETIM_POR_ARMAZEM and local is not None:
        raise RegraNegocioError(
            "O boletim é geral (um por dia, para toda a equipe): não informe armazém",
            codigo="BOLETIM_GERAL")

    # Um geral por dia; no modo por armazém, um por armazém; nunca os dois no mesmo dia
    conflito = select(BoletimDiario.id).where(BoletimDiario.data == dados.data)
    if local is not None:
        conflito = conflito.where((BoletimDiario.local == local) | BoletimDiario.local.is_(None))
    if (existente := db.scalars(conflito).first()):
        raise RegraNegocioError(
            f"Já existe boletim ({_nome(local)}) em {dados.data:%d/%m/%Y}",
            {"boletim_id": existente}, codigo="BOLETIM_JA_EXISTE")

    b = BoletimDiario(data=dados.data, local=local, observacao=dados.observacao,
                      status=StatusBoletim.RASCUNHO)
    db.add(b)
    try:
        db.commit()
    except IntegrityError:                 # corrida: outro usuário abriu ao mesmo tempo
        db.rollback()
        existente = db.scalars(select(BoletimDiario.id).where(
            BoletimDiario.data == dados.data)).first()
        raise RegraNegocioError(
            f"Já existe boletim ({_nome(local)}) em {dados.data:%d/%m/%Y}",
            {"boletim_id": existente}, codigo="BOLETIM_JA_EXISTE")
    return buscar(db, b.id)


def lancar_producao(db: Session, boletim_id: int, linhas: list) -> BoletimDiario:
    b = buscar(db, boletim_id)
    _exigir_rascunho(b)

    ids = [ln.tipo_item_id for ln in linhas]
    if (repetidos := sorted({i for i in ids if ids.count(i) > 1})):
        raise RegraNegocioError("Cada tipo de item aparece uma vez por boletim",
                                {"tipo_item_ids": repetidos}, codigo="TIPO_ITEM_REPETIDO")
    tipos = {t.id: t for t in db.scalars(select(TipoItem).where(TipoItem.id.in_(ids)))}
    if (invalidos := sorted(set(ids) - {i for i, t in tipos.items() if t.ativo})):
        raise RegraNegocioError("Tipo de item inexistente ou inativo",
                                {"tipo_item_ids": invalidos}, codigo="TIPO_ITEM_INVALIDO")

    b.producoes.clear()
    db.flush()
    for ln in linhas:
        if ln.descarga + ln.remocao + ln.transferencia == 0:
            continue                       # linha zerada não precisa existir
        b.producoes.append(BoletimProducao(
            tipo_item_id=ln.tipo_item_id, descarga=ln.descarga, remocao=ln.remocao,
            transferencia=ln.transferencia,
            preco_unitario=tipos[ln.tipo_item_id].preco_unitario))   # preço congelado
    db.flush()
    db.refresh(b)
    _recalcular(b)
    db.commit()
    return buscar(db, boletim_id)


def definir_equipe(db: Session, boletim_id: int, equipe: list) -> BoletimDiario:
    b = buscar(db, boletim_id)
    _exigir_rascunho(b)

    if len(equipe) > config.LIMITE_CHAPAS_POR_BOLETIM:
        raise RegraNegocioError(
            f"No máximo {config.LIMITE_CHAPAS_POR_BOLETIM} chapas por boletim",
            {"informados": len(equipe)}, codigo="LIMITE_CHAPAS")
    matriculas = [e.matricula.strip() for e in equipe]
    if (repetidas := sorted({m for m in matriculas if matriculas.count(m) > 1})):
        # sem esta trava, o mesmo chapa contaria várias diárias e inflaria o custo
        raise RegraNegocioError("Matrícula lançada mais de uma vez no mesmo boletim",
                                {"matriculas": repetidas}, codigo="MATRICULA_REPETIDA")
    chapas = {c.matricula: c for c in db.scalars(select(Chapa).where(Chapa.matricula.in_(matriculas)))}
    if (desconhecidas := [m for m in matriculas if m not in chapas]):
        raise RegraNegocioError("Matrícula não cadastrada",
                                {"matriculas": desconhecidas}, codigo="CHAPA_NAO_CADASTRADA")

    b.chapas_alocados.clear()
    db.flush()
    for e, m in zip(equipe, matriculas):
        b.chapas_alocados.append(BoletimChapa(chapa_id=chapas[m].id, meia_diaria=e.meia_diaria))
    db.flush()
    db.refresh(b)
    _recalcular(b)
    db.commit()
    return buscar(db, boletim_id)


def fechar(db: Session, boletim_id: int, fechado_por: str) -> BoletimDiario:
    b = buscar(db, boletim_id)
    _exigir_rascunho(b)
    if not b.chapas_alocados:
        raise RegraNegocioError("Lance a equipe do dia antes de fechar",
                                codigo="BOLETIM_SEM_EQUIPE")
    _recalcular(b)
    b.status = StatusBoletim.FECHADO
    b.fechado_em = _agora()
    b.fechado_por = fechado_por
    db.commit()
    return buscar(db, boletim_id)


def reabrir(db: Session, boletim_id: int) -> BoletimDiario:
    b = buscar(db, boletim_id)
    b.status = StatusBoletim.RASCUNHO
    b.fechado_em = b.fechado_por = None
    db.commit()
    return buscar(db, boletim_id)


def listar(db: Session, inicio: Optional[date] = None, fim: Optional[date] = None,
           local: Optional[LocalFisico] = None,
           status: Optional[StatusBoletim] = None) -> list[BoletimDiario]:
    stmt = select(BoletimDiario).options(
        selectinload(BoletimDiario.producoes).selectinload(BoletimProducao.tipo_item),
        selectinload(BoletimDiario.chapas_alocados).selectinload(BoletimChapa.chapa))
    if inicio:
        stmt = stmt.where(BoletimDiario.data >= inicio)
    if fim:
        stmt = stmt.where(BoletimDiario.data <= fim)
    if local:
        stmt = stmt.where(BoletimDiario.local == local)
    if status:
        stmt = stmt.where(BoletimDiario.status == status)
    return list(db.scalars(stmt.order_by(BoletimDiario.data, BoletimDiario.local)))


def avisos(db: Session, b: BoletimDiario) -> list[str]:
    """Não bloqueiam: só chamam atenção de quem preenche."""
    out = []
    ids = [c.chapa_id for c in b.chapas_alocados]
    if ids:
        outros = db.execute(
            select(Chapa.matricula, BoletimDiario.local)
            .join(BoletimChapa, BoletimChapa.chapa_id == Chapa.id)
            .join(BoletimDiario, BoletimDiario.id == BoletimChapa.boletim_id)
            .where(BoletimDiario.data == b.data, BoletimDiario.id != b.id,
                   BoletimChapa.chapa_id.in_(ids))).all()
        for matricula, local in outros:
            out.append(f"Matrícula {matricula} também está no boletim {_nome(local)} neste dia")
    if b.chapas_alocados and not b.producoes:
        out.append("Equipe lançada sem produção: o dia inteiro será pago como complemento")
    if b.complemento and b.complemento > 0:
        out.append(f"Produção abaixo do piso: complemento de R$ {arredondar(b.complemento)} "
                   "pago sem contrapartida de serviço")
    return out


def para_saida(db: Session, b: BoletimDiario) -> dict:
    meias = sum(1 for c in b.chapas_alocados if c.meia_diaria)
    return {
        "id": b.id, "data": b.data, "local": b.local, "status": b.status,
        "origem_dado": b.origem_dado, "observacao": b.observacao,
        "linhas": [{
            "tipo_item_id": p.tipo_item_id, "tipo_item": p.tipo_item.descricao,
            "descarga": p.descarga, "remocao": p.remocao, "transferencia": p.transferencia,
            "quantidade_total": p.quantidade_total, "preco_unitario": p.preco_unitario,
            "valor_linha": arredondar(p.valor_linha),
        } for p in b.producoes],
        "equipe": [{"matricula": c.chapa.matricula, "nome": c.chapa.nome,
                    "meia_diaria": c.meia_diaria}
                   for c in sorted(b.chapas_alocados, key=lambda c: c.chapa.matricula)],
        "calculo": {
            "producao_total": arredondar(b.producao_total),
            "chapas": len(b.chapas_alocados), "meias_diarias": meias,
            "diarias_equivalentes": b.diarias_equivalentes,
            "valor_por_diaria": arredondar(b.valor_por_diaria),
            "piso_diaria": config.PISO_DIARIA,
            "piso_total": arredondar(config.PISO_DIARIA * b.diarias_equivalentes),
            "total_pagar": arredondar(b.total_pagar),
            "complemento": arredondar(b.complemento),
            "abaixo_do_piso": bool(b.complemento and b.complemento > 0),
        },
        "avisos": avisos(db, b),
        "criado_em": b.criado_em, "fechado_em": b.fechado_em, "fechado_por": b.fechado_por,
    }