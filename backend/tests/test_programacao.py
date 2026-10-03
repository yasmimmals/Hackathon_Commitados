"""Doca automática e programação antecipada (o que vai chegar e quanta equipe precisa)."""
from datetime import date, datetime

import pytest
from fastapi.testclient import TestClient

from app.core.config import TZ
from app.core.exceptions import RegraNegocioError
from app.models import (
    Acondicionamento as A, Baia, Horario as H, LocalFisico as L, StatusAgendamento as S,
)
from app.schemas.agendamento import AgendamentoCreate, AprovacaoIn, DestinoIn
from app.services import agendamento_service as svc
from app.services.programacao_service import programacao

QUA = date(2026, 10, 7)
SEG_10H = datetime(2026, 10, 5, 10, 0, tzinfo=TZ)


@pytest.fixture
def agendar(db, nova_nota):
    def _agendar(acond, horario, peso, adubo=False, volumes=None):
        nota = nova_nota(adubo=adubo, peso=peso)
        if volumes:
            nota.volumes = volumes
            db.commit()
        return svc.criar_agendamento(db, AgendamentoCreate(
            nota_fiscal_id=nota.id, data=QUA, horario=horario, acondicionamento=acond,
            ciente_risco_chuva=True), agora=SEG_10H)
    return _agendar


def aprovar(db, ag):
    return svc.aprovar(db, ag.id, AprovacaoIn(pedido_compra=1, analisado_por="c"), SEG_10H)


# ------------------------------------------------------------ doca automática

def test_doca_unica_e_escolhida_automaticamente(db, agendar):
    ag = aprovar(db, agendar(A.PALETIZADO, H.H08, 12000))
    ag = svc.definir_destinos(db, ag.id, [DestinoIn(local=L.INSUMOS)])   # sem baia_id
    assert ag.status == S.DESTINO_DEFINIDO and ag.descargas[0].baia.codigo == "INSUMOS-01"


def test_com_duas_docas_e_preciso_escolher(db, agendar):
    db.add(Baia(local=L.INSUMOS, codigo="INSUMOS-02", nome="Insumos - Doca 2"))
    db.commit()
    ag = aprovar(db, agendar(A.PALETIZADO, H.H08, 12000))
    with pytest.raises(RegraNegocioError) as e:
        svc.definir_destinos(db, ag.id, [DestinoIn(local=L.INSUMOS)])
    assert e.value.codigo == "DOCA_OBRIGATORIA"


# ------------------------------------------------------------ programação antecipada

def test_programacao_mostra_caminhoes_e_estima_equipe(db, agendar, chuva):
    chuva[(QUA, H.H08)] = 30
    adubo = agendar(A.BATIDO, H.H08, 28000, adubo=True)                 # pendente: previsão
    palete = aprovar(db, agendar(A.PALETIZADO, H.H10, 12000))
    svc.definir_destinos(db, palete.id, [DestinoIn(local=L.INSUMOS)])
    bag = aprovar(db, agendar(A.BIG_BAG, H.H13, 24000, volumes=24))
    svc.definir_destinos(db, bag.id, [DestinoIn(local=L.INSUMOS)])

    p = programacao(db, QUA, QUA)
    por_id = {c["agendamento_id"]: c for c in p["caminhoes"]}

    a = por_id[adubo.id]
    assert not a["confirmado"] and a["locais"] == [L.ADUBO] and a["locais_sugeridos"]
    assert a["minutos_equipe"] == 50 and a["chapas_norma"] == 5 and a["equipamento_sugerido"] is None
    assert a["prob_chuva"] == 30 and a["situacao_chuva"] == "RISCO"

    pl = por_id[palete.id]
    assert pl["confirmado"] and pl["doca"] == "Insumos - Baia 1"
    assert pl["volumes_estimados"] == 12                       # 12 t -> 12 paletes
    assert (pl["minutos_caminhao"], pl["minutos_equipe"]) == (18, 60)
    assert pl["equipamento_sugerido"] == "EMPILHADEIRA_GAS"

    assert por_id[bag.id]["volumes_estimados"] == 24            # big bag: contagem da nota
    assert por_id[bag.id]["minutos_equipe"] == 120

    resumo = {r["local"]: r for r in p["resumo"]}
    # adubo batido: 5 chapas x 50 min = 250 chapa-min; mínimo de 5 chapas por haver batido
    assert resumo[L.ADUBO]["chapa_minutos"] == 250 and resumo[L.ADUBO]["chapas_recomendados"] == 5
    assert resumo[L.ADUBO]["caminhoes_com_risco_chuva"] == 1
    # insumos: 2x60 + 2x120 = 360 chapa-min; 360 / (480 x 0,9) -> 1 chapa
    assert resumo[L.INSUMOS]["chapa_minutos"] == 360
    assert resumo[L.INSUMOS]["chapas_recomendados"] == 1
    assert resumo[L.INSUMOS]["caminhoes"] == 2 and resumo[L.INSUMOS]["confirmados"] == 2


def test_programacao_filtra_por_armazem_e_ignora_cancelados(db, agendar):
    ag = agendar(A.PALETIZADO, H.H08, 12000)
    svc.cancelar(db, ag.id, agora=SEG_10H)
    palete = aprovar(db, agendar(A.PALETIZADO, H.H10, 12000))
    svc.definir_destinos(db, palete.id, [DestinoIn(local=L.LOJA)])
    assert [c["agendamento_id"] for c in programacao(db, QUA, QUA)["caminhoes"]] == [palete.id]
    assert programacao(db, QUA, QUA, local=L.INSUMOS)["caminhoes"] == []


def test_programacao_pela_api(db, agendar):
    agendar(A.PALETIZADO, H.H08, 12000)
    from main import app
    r = TestClient(app).get("/api/v1/armazem/programacao",
                            params={"inicio": "2026-10-07", "fim": "2026-10-09"})
    assert r.status_code == 200, r.text
    corpo = r.json()
    assert len(corpo["caminhoes"]) == 1 and corpo["premissas"]
    assert corpo["resumo"][0]["local"] is None        # sem destino e não é adubo: a definir