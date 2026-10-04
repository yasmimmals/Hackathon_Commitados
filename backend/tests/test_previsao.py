"""Previsibilidade: previsão de demanda, custo do chapeiro e plano de escala."""
from datetime import date, timedelta
from decimal import Decimal as D

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import insert

from app.models import (
    Acondicionamento as A, Agendamento, FolhaDiaria, Horario as H, OrigemAgendamento as O,
    RecebimentoHistorico, StatusAgendamento as S,
)
from app.services import previsao_service as p

# Padrão estável: 6 caminhões/dia de jan a jun, 18 de jul a out, 9 em nov e dez
PADRAO = {1: 6, 2: 6, 3: 6, 4: 6, 5: 6, 6: 6, 7: 18, 8: 18, 9: 18, 10: 18, 11: 9, 12: 9}
HOJE = date(2026, 6, 24)            # quarta; dados até maio de 2026


def dias_uteis(ini, fim):
    d = ini
    while d <= fim:
        if d.weekday() < 5:
            yield d
        d += timedelta(days=1)


@pytest.fixture
def historico(db, fornecedor):
    linhas = []
    for d in dias_uteis(date(2023, 1, 1), date(2026, 5, 31)):
        for i in range(PADRAO[d.month]):
            linhas.append(dict(data=d, fornecedor_id=fornecedor.id, nf_numero=f"{d}-{i}",
                               chave_valida=True, itens=1, pedidos=1, exige_chapa=True,
                               peso_estimado_kg=D("20000"), alertas=[], origem_dado="HISTORICO"))
    db.execute(insert(RecebimentoHistorico), linhas)
    # folha: 8 chapas o ano todo; diária sobe de R$ 90 (2025) para R$ 110 (2026)
    for d in dias_uteis(date(2025, 1, 1), date(2026, 5, 31)):
        valor = 90 if d.year == 2025 else 110
        db.add(FolhaDiaria(data=d, dia_semana="x", chapas_presentes=8, chapas_operacao_cafe=0,
                           valor_pago=D(8 * valor), suspeito=False))
    db.commit()


def test_modelo_acerta_padrao_estavel(db, historico):
    serie = p.serie_mensal(db)
    assert p._prever(serie, date(2026, 7, 1)) == pytest.approx(18, abs=0.01)
    assert p._prever(serie, date(2027, 1, 1)) == pytest.approx(6, abs=0.01)
    prec = p.precisao(serie)
    assert prec["meses_testados"] >= 12 and prec["erro_medio_percentual"] < 0.5   # praticamente zero


def test_modelo_acompanha_crescimento(db, fornecedor):
    """Volume dobra a partir de jun/2025: a previsão de julho sobe de 18 para perto de 36.
    O salto brusco no meio do ano distorce um pouco o índice daquele ano (margem de 15%)."""
    linhas = []
    for d in dias_uteis(date(2023, 1, 1), date(2026, 5, 31)):
        n = PADRAO[d.month] * (2 if d >= date(2025, 6, 1) else 1)
        linhas += [dict(data=d, fornecedor_id=fornecedor.id, nf_numero=f"{d}-{i}", chave_valida=True,
                        itens=1, pedidos=1, exige_chapa=True, alertas=[], origem_dado="HISTORICO")
                   for i in range(n)]
    db.execute(insert(RecebimentoHistorico), linhas)
    db.commit()
    assert p._prever(p.serie_mensal(db), date(2026, 7, 1)) == pytest.approx(36, rel=0.15)


def test_previsao_semanal_recomenda_reforco_no_pico(db, historico):
    r = p.previsao_semanal(db, semanas=6, hoje=HOJE)
    assert r["equipe_atual"] == 8.0 and r["diaria_atual"] == 110.0
    julho = [s for s in r["semanas"] if s["semana"] >= "2026-07-06"][0]
    # 18 caminhões x 185 / 432 = 7,7 -> 8 + 2 de reserva = 10
    assert julho["caminhoes_dia_previsto"] == 18.0 and julho["chapas_recomendados"] == 10
    assert julho["acao"] == "REFORCAR +2"
    assert julho["custo_previsto"] == 10 * 5 * 110 and julho["custo_com_equipe_atual"] == 8 * 5 * 110
    junho = r["semanas"][0]                                  # semana de 29/06 (junho/julho)
    assert junho["semana"] == "2026-06-29"


def test_agendamentos_confirmados_entram_como_minimo(db, historico, fornecedor, nova_nota):
    dia = date(2026, 6, 30)                                  # junho: o modelo prevê 6
    for _ in range(12):
        db.add(Agendamento(fornecedor_id=fornecedor.id, nota_fiscal_id=nova_nota().id, data=dia,
                           horario=H.H08, acondicionamento=A.PALETIZADO, peso_kg=D("10000"),
                           status=S.APROVADO, origem=O.NORMAL))
    db.commit()
    semana = p.previsao_semanal(db, semanas=1, hoje=HOJE)["semanas"][0]
    assert semana["caminhoes_ja_agendados"] == 12
    # dia 29 (jun) = 6, dia 30 (jun) = 12 agendados, dias 1-3 (jul) = 18 -> média 14,4
    assert semana["caminhoes_dia_previsto"] == 14.4


def test_custo_mensal_mostra_reajuste_e_custo_por_caminhao(db, historico):
    c = p.custo_mensal(db)
    assert c["reajuste_da_diaria"]["variacao_percentual"] == 22.2      # 90 -> 110
    jan26 = next(m for m in c["mensal"] if m["mes"] == "2026-01")
    # 8 chapas x R$ 110 / 6 caminhões por dia
    assert jan26["custo_por_caminhao"] == pytest.approx(146.67, abs=0.01)
    assert jan26["equipe_necessaria_estimada"] == 5.0                  # mínimo (batido)


def test_plano_reduz_fora_do_pico_e_reforca_no_pico(db, historico):
    r = p.plano_escala(db, meses=12, hoje=HOJE)
    m = {l["mes"]: l for l in r["meses"]}
    assert m["2026-07"]["equipe_recomendada"] == 10 and m["2026-07"]["situacao_pratica_atual"] == "RISCO_DE_FALTA"
    assert m["2027-01"]["equipe_recomendada"] == 5 and m["2027-01"]["situacao_pratica_atual"] == "SOBRA"
    assert "jul/26" in r["resumo"]["meses_com_risco_na_pratica_atual"]
    assert r["resumo"]["diferenca"] == pytest.approx(
        r["resumo"]["custo_pratica_atual"] - r["resumo"]["custo_plano_recomendado"], abs=0.01)
    assert "a menos" in r["resumo"]["frase"] or "a mais" in r["resumo"]["frase"]


def test_simulador_equipe_fixa(db, historico):
    r = p.plano_escala(db, meses=12, equipe_fixa=6, hoje=HOJE)
    m = {l["mes"]: l for l in r["meses"]}
    assert m["2026-08"]["situacao_simulada"] == "FALTA"        # 18 cam: leve 5 + 2 = 7 > 6
    assert m["2027-02"]["situacao_simulada"] == "ADEQUADO"
    assert "ago/26" in r["resumo"]["meses_com_falta_simulada"]
    assert r["resumo"]["custo_simulado"] == sum(l["custo_simulado"] for l in r["meses"])


def test_sem_historico_nao_quebra(db):
    assert p.previsao_semanal(db, hoje=HOJE)["equipe_atual"] is None
    assert p.plano_escala(db, hoje=HOJE)["resumo"]["frase"] == "Sem histórico suficiente para planejar."
    assert p.custo_mensal(db)["mensal"] == []


def test_rotas_de_previsibilidade(db, historico):
    from main import app
    c = TestClient(app)
    assert c.get("/api/v1/painel/previsao", params={"semanas": 4}).status_code == 200
    assert c.get("/api/v1/painel/custo-mensal").json()["reajuste_da_diaria"] is not None
    sim = c.get("/api/v1/painel/plano-escala", params={"equipe_fixa": 10}).json()
    assert "custo_simulado" in sim["resumo"]