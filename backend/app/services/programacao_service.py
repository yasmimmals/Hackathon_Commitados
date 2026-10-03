"""Programação antecipada do recebimento.

O responsável pediu: "quanto mais informação antes, melhor". Esta visão mostra, para os
próximos dias, o que vai chegar em cada armazém e quanta equipe isso exige, inclusive
agendamentos que o Compras ainda não aprovou (marcados como não confirmados).

Os tempos são estimativas de ordem de grandeza do dossiê (seções 7 e 9), não medições.
Quando a plataforma acumular registros reais (3 marcos por descarga), estas estimativas
podem ser trocadas pelas médias medidas.
"""
import math
from collections import defaultdict
from datetime import date, timedelta
from decimal import Decimal
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core import config
from app.models import (
    Acondicionamento as A, Agendamento, Descarga, Horario, LocalFisico as L,
    NotaFiscal, StatusAgendamento as St,
)
from app.services import clima_service
from app.services.agendamento_service import STATUS_EM_ABERTO, chapas_norma

PREMISSAS = [
    "Tempos são estimativas do responsável pela operação (dossiê, seção 9), não medições.",
    "Unitizada: 5 min de equipe por palete/big bag (ciclo completo) e 1,5 min de caminhão.",
    "Batido: 40 min até 10 t e 50 min acima; máquina/implemento: 20 min.",
    "Paletes estimados por peso (1 palete por tonelada) quando a nota não permite contar.",
    f"Chapas recomendados = chapa-minutos ÷ ({config.JORNADA_MINUTOS} min × "
    f"{int(config.PRODUTIVIDADE_EQUIPE * 100)}% de produtividade), mínimo de "
    f"{config.CHAPAS_MINIMO_SE_HA_BATIDO} se houver carga batida no dia.",
    "Considera só o RECEBIMENTO. A mesma equipe também carrega cooperados, que fica fora "
    "desta conta (o boletim diário registra toda a movimentação).",
]

CONFIRMADOS = {St.DESTINO_DEFINIDO, St.NA_FILA, St.EM_DESCARGA}


def _volumes(ag: Agendamento, nota: Optional[NotaFiscal]) -> Optional[int]:
    if ag.acondicionamento == A.BATIDO:
        return None
    vol_nota = nota.volumes if nota else None
    if ag.acondicionamento == A.BIG_BAG and vol_nota and 1 <= vol_nota <= 60:
        return vol_nota                      # big bag: a nota costuma contar as bags
    if ag.peso_kg:
        return max(1, math.ceil(Decimal(ag.peso_kg) / 1000))
    return config.VOLUMES_PADRAO[ag.acondicionamento.value]


def _tempos(ag: Agendamento, locais: list, volumes: Optional[int]) -> tuple[int, int]:
    """(minutos até liberar o caminhão, minutos de equipe ocupada)."""
    if L.MAQUINAS in locais:
        return config.MINUTOS_MAQUINA, config.MINUTOS_MAQUINA
    if ag.acondicionamento == A.BATIDO:
        t = (config.MINUTOS_BATIDO_ATE_10T if (ag.peso_kg or 0) <= 10000
             else config.MINUTOS_BATIDO_ACIMA_10T)
        return t, t
    return (math.ceil(volumes * config.MINUTOS_CAMINHAO_POR_VOLUME),
            volumes * config.MINUTOS_EQUIPE_POR_VOLUME)


def _equipamento(ag: Agendamento, locais: list) -> Optional[str]:
    if L.MAQUINAS in locais:
        return "TRATOR ou EMPILHADEIRA_GAS"
    if ag.acondicionamento == A.BATIDO:
        return None                          # manual, saco a saco
    return "EMPILHADEIRA_GAS"


def programacao(db: Session, inicio: date, fim: date, local: Optional[L] = None) -> dict:
    ags = list(db.scalars(
        select(Agendamento)
        .where(Agendamento.data.between(inicio, fim), Agendamento.status.in_(STATUS_EM_ABERTO))
        .options(selectinload(Agendamento.descargas).selectinload(Descarga.baia),
                 selectinload(Agendamento.fornecedor), selectinload(Agendamento.nota_fiscal))
        .order_by(Agendamento.data, Agendamento.horario, Agendamento.id)))

    caminhoes, grupos = [], defaultdict(list)
    for ag in ags:
        locais = [d.local for d in ag.descargas]
        sugerido = False
        if not locais and ag.carga_adubo:    # antes do destino: adubo vai para o pátio de adubos
            locais, sugerido = [L.ADUBO], True
        if local and local not in locais:
            continue

        vol = _volumes(ag, ag.nota_fiscal)
        min_caminhao, min_equipe = _tempos(ag, locais, vol)
        prob = situacao = None
        if ag.carga_adubo:
            prob = clima_service.prob_chuva(ag.data, ag.horario)
            situacao = clima_service.classificar(prob)
        c = {
            "agendamento_id": ag.id, "data": ag.data, "horario": ag.horario,
            "status": ag.status, "confirmado": ag.status in CONFIRMADOS,
            "prioritario": ag.prioritario, "fornecedor": ag.fornecedor.nome,
            "nf_numero": ag.nf_numero, "acondicionamento": ag.acondicionamento,
            "peso_kg": ag.peso_kg, "volumes_estimados": vol,
            "locais": locais, "locais_sugeridos": sugerido,
            "doca": ", ".join(d.baia.nome for d in ag.descargas if d.baia) or None,
            "chapas_norma": chapas_norma(ag), "equipamento_sugerido": _equipamento(ag, locais),
            "minutos_caminhao": min_caminhao, "minutos_equipe": min_equipe,
            "carga_adubo": ag.carga_adubo, "prob_chuva": prob, "situacao_chuva": situacao,
        }
        caminhoes.append(c)
        # caminhão para mais de um armazém: entra no resumo de cada um
        for lo in (locais or [None]):
            grupos[(ag.data, lo)].append(c)

    resumo = []
    capacidade = config.JORNADA_MINUTOS * config.PRODUTIVIDADE_EQUIPE
    for (dia, lo), cs in sorted(grupos.items(), key=lambda kv: (kv[0][0], kv[0][1] or "")):
        chapa_min = sum((c["chapas_norma"] or 0) * c["minutos_equipe"] for c in cs)
        tem_batido = any(c["acondicionamento"] == A.BATIDO and (c["chapas_norma"] or 0) > 0
                         for c in cs)
        recomendados = math.ceil(chapa_min / capacidade) if chapa_min else 0
        if tem_batido:
            recomendados = max(recomendados, config.CHAPAS_MINIMO_SE_HA_BATIDO)
        resumo.append({
            "data": dia, "local": lo, "caminhoes": len(cs),
            "confirmados": sum(c["confirmado"] for c in cs),
            "peso_total_kg": sum((Decimal(c["peso_kg"] or 0) for c in cs), Decimal(0)),
            "chapa_minutos": chapa_min, "tem_batido": tem_batido,
            "chapas_recomendados": recomendados,
            "caminhoes_com_risco_chuva": sum(c["situacao_chuva"] in ("RISCO", "BLOQUEADO")
                                             for c in cs),
        })

    return {"inicio": inicio, "fim": fim, "premissas": PREMISSAS,
            "resumo": resumo, "caminhoes": caminhoes}


def periodo_padrao(hoje: date) -> tuple[date, date]:
    """Hoje + 6 dias: a semana que vem pela frente."""
    return hoje, hoje + timedelta(days=6)