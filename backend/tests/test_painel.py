"""Painel (Tarefa 3): cada indicador com um cenário de resultado conhecido."""
from datetime import date, datetime, timedelta
from decimal import Decimal as D

import pytest
from fastapi.testclient import TestClient

from app.core.config import TZ
from app.models import (
    Acondicionamento as A, Agendamento, BoletimChapa, BoletimDiario, Chapa, Descarga,
    FolhaDiaria, Horario as H, LocalFisico as L, MotivoNaoRecebimento as M, Origem,
    OrigemAgendamento as O, RecebimentoHistorico, StatusAgendamento as S, StatusBoletim,
)
from app.services import painel_service as svc

SEG = date(2025, 7, 7)          # segunda-feira de julho (pico)
SEG_JAN = date(2026, 1, 5)      # segunda-feira de janeiro


def hora(d, h, m=0):
    return datetime(d.year, d.month, d.day, h, m, tzinfo=TZ)


@pytest.fixture
def api():
    from main import app
    return TestClient(app)


def notas(db, fornecedor, dia, qtd, local=L.ADUBO, exige=True):
    for i in range(qtd):
        db.add(RecebimentoHistorico(
            data=dia, fornecedor_id=fornecedor.id, nf_numero=f"{dia}-{i}", chave_valida=True,
            itens=1, pedidos=1, local_principal=local, exige_chapa=exige,
            peso_estimado_kg=D("20000"), alertas=[], origem_dado=Origem.HISTORICO))


def folha(db, dia, presentes, valor_por_pessoa=100, suspeito=False):
    db.add(FolhaDiaria(data=dia, dia_semana="x", chapas_presentes=presentes,
                       chapas_operacao_cafe=0, valor_pago=D(presentes * valor_por_pessoa),
                       suspeito=suspeito))


# ------------------------------------------------------------ sobra ou falta (histórico)

def test_sobra_em_janeiro_e_risco_de_falta_em_julho(db, fornecedor):
    # janeiro: 10 chapas, 4 caminhões -> precisa de 1,1 a 2,3 -> SOBRA (sobram 7,7+ no pesado)
    folha(db, SEG_JAN, 10)
    notas(db, fornecedor, SEG_JAN, 4)
    # julho: 6 chapas, 18 caminhões -> precisa de 5,0 a 10,4 -> RISCO_DE_FALTA
    folha(db, SEG, 6)
    notas(db, fornecedor, SEG, 18)
    db.commit()

    r = svc.sobra_falta_historico(db)
    mes = {m["mes"]: m for m in r["mensal"]}
    assert mes["2026-01"]["situacao"] == "SOBRA"
    assert mes["2026-01"]["chapas_necessarios_leve"] == 1.1      # 4 x 120 / 432
    assert mes["2026-01"]["chapas_necessarios_pesado"] == 2.3    # 4 x 250 / 432
    assert mes["2025-07"]["situacao"] == "RISCO_DE_FALTA"
    assert r["meses_com_sobra"] == ["2026-01"] and r["meses_com_risco_de_falta"] == ["2025-07"]
    # custo da sobra: (10 - 2,31) chapas x 1 dia x R$ 100 de diária mediana
    assert r["custo_sobra_estimado_total"] == pytest.approx(768.52, abs=0.01)
    assert "SOBRA" in r["resposta"] and "RISCO DE FALTA" in r["resposta"]
    assert any("carregamento" in p.lower() or "cooperados" in p for p in r["premissas"])


def test_falta_quando_nem_o_cenario_leve_cabe(db, fornecedor):
    folha(db, SEG, 2)
    notas(db, fornecedor, SEG, 18)          # leve: 5,0 chapas > 2
    db.commit()
    assert svc.sobra_falta_historico(db)["mensal"][0]["situacao"] == "FALTA"


def test_dias_suspeitos_e_fim_de_semana_ficam_fora(db, fornecedor):
    folha(db, SEG_JAN, 10)
    folha(db, SEG_JAN + timedelta(days=1), 30, suspeito=True)   # acerto de fim de mês
    folha(db, SEG_JAN + timedelta(days=5), 3)                   # sábado
    db.commit()
    r = svc.sobra_falta_historico(db)
    assert r["mensal"][0]["dias_uteis"] == 1 and r["mensal"][0]["chapas_presentes_media"] == 10
    assert r["dias_descartados"] == 2


# ------------------------------------------------------------ sobra ou falta (sistema = boletim)

def test_sistema_mede_sobra_pelo_complemento(db):
    db.add_all([Chapa(matricula=str(i), nome=f"C{i}") for i in range(11)])
    db.flush()
    b = BoletimDiario(data=SEG_JAN, status=StatusBoletim.FECHADO, producao_total=D("918.1952"),
                      diarias_equivalentes=D("11"), total_pagar=D("991.9041"),
                      complemento=D("73.7089"), valor_por_diaria=D("83.47"))
    b.chapas_alocados = [BoletimChapa(chapa_id=i + 1) for i in range(11)]
    db.add(b)
    db.commit()
    r = svc.sobra_falta_sistema(db)
    assert r["complemento_total"] == D("73.71") and r["total_pago"] == D("991.90")
    assert r["percentual_pago_sem_producao"] == 7.4
    assert r["dias"][0]["diarias_ociosas_equivalentes"] == 0.8      # 73,71 / 90,17


# ------------------------------------------------------------ indicadores do sistema

@pytest.fixture
def operacao(db, fornecedor, nova_nota, baia):
    """Dois caminhões concluídos, um reprovado, um que não veio."""
    def ag(nota, horario, acond, status=S.CONCLUIDO, motivo=None):
        a = Agendamento(fornecedor_id=fornecedor.id, nota_fiscal_id=nota.id, data=SEG_JAN,
                        horario=horario, acondicionamento=acond, peso_kg=D("12000"),
                        status=status, origem=O.NORMAL, motivo_nao_recebimento=motivo)
        db.add(a)
        return a

    a1 = ag(nova_nota(), H.H08, A.PALETIZADO)
    a1.horario_chegada = hora(SEG_JAN, 7, 50)
    a1.descargas = [Descarga(local=L.INSUMOS, baia_id=baia(L.INSUMOS),
                             horario_entrada=hora(SEG_JAN, 8, 10), horario_saida=hora(SEG_JAN, 8, 40),
                             qtd_chapas=2, equipamentos=[{"codigo": "EMPILHADEIRA_GAS", "qtd": 1}])]
    a2 = ag(nova_nota(), H.H10, A.BATIDO)
    a2.horario_chegada = hora(SEG_JAN, 10, 0)
    a2.descargas = [Descarga(local=L.ADUBO, baia_id=baia(L.ADUBO),
                             horario_entrada=hora(SEG_JAN, 10, 30), horario_saida=hora(SEG_JAN, 11, 20),
                             qtd_chapas=4, equipamentos=[])]
    ag(nova_nota(), H.H13, A.BIG_BAG, S.REJEITADO, M.DIVERGENCIA_NF_PEDIDO)
    ag(nova_nota(), H.H15, A.BIG_BAG, S.NAO_COMPARECEU, M.NAO_COMPARECEU)
    db.commit()


def test_tempos_de_espera_e_descarga(db, operacao):
    t = svc.tempos(db)
    assert t["espera_media_min"] == 25.0          # (20 + 30) / 2
    assert t["descarga_media_min"] == 40.0        # (30 + 50) / 2
    assert t["descarga_media_por_armazem_min"] == {"ADUBO": 50.0, "INSUMOS": 30.0}
    assert t["caminhoes_medidos"] == 2


def test_chapas_por_recebimento_comparado_a_norma(db, operacao):
    c = svc.chapas_por_recebimento(db)
    assert c["media_chapas_por_descarga"] == 3.0
    assert (c["na_norma"], c["abaixo_da_norma"]) == (1, 1)   # paletizado 2 = 2; batido 4 < 5


def test_utilizacao_de_docas_e_equipamentos(db, operacao):
    u = svc.utilizacao(db)
    docas = {d["doca"]: d for d in u["docas"]}
    assert docas["Insumos - Baia 1"]["minutos_ocupados"] == 30.0
    assert docas["Adubo - Baia 1"]["ocupacao_percentual"] == 10.4      # 50 / 480
    [emp] = u["equipamentos"]
    assert emp["codigo"] == "EMPILHADEIRA_GAS" and emp["usos"] == 1
    assert emp["ocupacao_percentual"] == 1.6                            # 30 / (480 x 4 empilhadeiras)


def test_nao_recebimentos_por_motivo(db, operacao):
    n = svc.nao_recebimentos(db)
    assert n["total"] == 2
    assert {m["motivo"] for m in n["por_motivo"]} == {"DIVERGENCIA_NF_PEDIDO", "NAO_COMPARECEU"}


def test_movimento_por_horario_e_dia(db, operacao, fornecedor):
    notas(db, fornecedor, SEG, 6)
    notas(db, fornecedor, SEG + timedelta(days=1), 2)
    db.commit()
    m = svc.movimento(db)
    assert {d["dia"]: d["media"] for d in m["dia_da_semana"]["media_caminhoes"]} == {
        "segunda": 6.0, "terça": 2.0}
    horarios = {h["horario"]: h["total"] for h in m["horario"]["agendamentos"]}
    assert horarios == {"08:00": 1, "10:00": 1}       # reprovado e no-show não contam como movimento


def test_cargas_e_fornecedores(db, operacao, fornecedor):
    notas(db, fornecedor, SEG, 3)
    notas(db, fornecedor, SEG, 2, exige=False)         # encomenda pequena: não é caminhão de chapa
    db.commit()
    c = svc.cargas_por_dia(db)
    assert c["historico"]["dias"] == [{"data": SEG, "por_armazem": {"ADUBO": 3}, "total": 3}]
    assert c["sistema"]["dias"][0]["por_armazem"] == {"ADUBO": 1, "INSUMOS": 1}
    f = svc.fornecedores_maior_volume(db)
    assert f["historico"]["ranking"][0]["caminhoes"] == 3
    assert f["sistema"]["ranking"][0]["caminhoes"] == 2


# ------------------------------------------------------------ API

def test_todos_os_endpoints_respondem_com_fonte(api, db, operacao, fornecedor):
    folha(db, SEG_JAN, 8)
    notas(db, fornecedor, SEG_JAN, 5)
    db.commit()
    for ep in ["resumo", "sobra-falta", "cargas", "tempos", "chapas-por-recebimento", "utilizacao",
               "fornecedores", "movimento", "nao-recebimentos", "custo", "qualidade-dados"]:
        r = api.get(f"/api/v1/painel/{ep}")
        assert r.status_code == 200, (ep, r.text)
    res = api.get("/api/v1/painel/resumo").json()
    assert res["pergunta"] == "Sobra ou falta chapa?" and res["resposta"]
    assert res["sistema"]["espera_media_min"] == 25.0 and res["sistema"]["nao_recebimentos"] == 2
    filtrado = api.get("/api/v1/painel/tempos", params={"inicio": "2030-01-01"}).json()
    assert filtrado["descarga_media_min"] is None