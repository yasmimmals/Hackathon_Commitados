"""Carga histórica: cada problema real dos dados tem um teste com dados sintéticos."""
from collections import Counter
from datetime import date, datetime

import pandas as pd
import pytest
from fastapi.testclient import TestClient

from app.core.config import TZ
from app.models import (
    FolhaDiaria, Fornecedor, LocalFisico as L, PedidoItem, Produto, RecebimentoHistorico,
)
from scripts import carregar_historico as ch

CHAVE_OK = "35240446025801000293550010000005241533956614"     # chave real, DV válido


def linha(pedido=1, item="PEC000001", qtd=1, peso=100.0, dep="MATLoja", receb=1,
          data_receb="2025-03-10", data_doc="2025-03-01", nf=10, chave=CHAVE_OK, pn="FD000001"):
    return {"Pedido Compra": pedido, "Data Lançamento": pd.Timestamp(data_doc),
            "Data do Documento": pd.Timestamp(data_doc), "Cod PN": pn, "Nome": "X",
            "Cod Item": item, "Desc Item": "desc", "Qtd": qtd, "Peso": peso, "Deposito": dep,
            "Nº Recebimento": receb, "Data Recebimento": pd.Timestamp(data_receb),
            "Nota Fiscal de Entrada": nf, "Chave de Acesso": chave}


# ------------------------------------------------------------ regras puras

@pytest.mark.parametrize("grupo,dep,esperado", [
    ("FER", "MATFerti", L.ADUBO),
    ("FER", "MATGeral", L.INSUMOS),          # MATGeral fica dentro do Insumos (dossiê)
    ("PEC", "MATGeral", L.INSUMOS),
    ("PEC", "MATLoja", L.LOJA),
    ("AGR", "MATDefe", L.INSUMOS),
    ("MAQ", "MATLoja", L.MAQUINAS),          # o local segue o grupo
    ("SEM", "MATLoja", L.LOJA),              # grupo sem regra: vale o depósito
    ("PEC", "MATIndus", None),               # depósito fora da lista oficial
])
def test_armazem_fisico(grupo, dep, esperado):
    assert ch.local_fisico(grupo, dep) == esperado


def test_duplicadas_saem_e_peso_do_pedido_e_rateado():
    rel = Counter()
    df = pd.DataFrame([
        linha(item="FER000001", dep="MATFerti", qtd=90, peso=90000, receb=1, nf=1, chave="x1"),
        linha(item="FER000001", dep="MATFerti", qtd=90, peso=90000, receb=2, nf=2, chave="x2"),
        linha(item="FER000001", dep="MATFerti", qtd=90, peso=90000, receb=3, nf=3, chave="x3"),
        linha(item="FER000001", dep="MATFerti", qtd=90, peso=90000, receb=3, nf=3, chave="x3"),  # dup
    ])
    m = ch.preparar_movimentacao(df, rel)
    assert rel["mov_duplicadas_descartadas"] == 1
    assert list(m["peso_rateado"]) == [30000, 30000, 30000]  # 90 t do pedido / 3 caminhões


def test_nota_vira_um_recebimento_com_alertas():
    rel = Counter()
    df = pd.DataFrame([
        linha(item="FER000001", dep="MATFerti", peso=80000, chave=CHAVE_OK),       # 1 receb: 80 t
        linha(item="PEC000001", dep="MATLoja", peso=200, chave=CHAVE_OK),
        linha(nf=99, chave=None, peso=100, data_receb="2025-03-08"),                # sábado, sem chave
        linha(nf=77, chave="123", peso=600, data_receb="2025-02-20", data_doc="2025-02-25"),
    ])
    rs = {r["nf_numero"]: r for r in ch.montar_recebimentos(ch.preparar_movimentacao(df, rel), rel)}

    a = rs["10"]
    assert a["itens"] == 2 and a["chave_valida"] and a["local_principal"] == L.ADUBO
    assert a["locais"] == "ADUBO,LOJA" and float(a["peso_estimado_kg"]) == 50000   # teto: 1 caminhão
    assert float(a["peso_planilha_kg"]) == 80200 and a["exige_chapa"]
    assert any("50 t" in x for x in a["alertas"])

    b = rs["99"]
    assert not b["chave_valida"] and b["chave"] is None and not b["exige_chapa"]   # 100 kg
    assert "Recebida em fim de semana" in b["alertas"]

    c = rs["77"]
    assert any("antes do pedido" in x for x in c["alertas"])                        # informativo
    assert rel["notas_recebidas"] == 3 and rel["notas_que_exigem_chapa"] == 2


def test_folha_marca_dias_suspeitos_e_meses_faltando():
    rel = Counter()
    folha = pd.DataFrame([
        {"data": "2025-07-01", "dia_semana": "terca", "chapas_presentes": 10, "chapas_operacao_cafe": 0, "valor_pago_dia": 1000},
        {"data": "2025-07-02", "dia_semana": "quarta", "chapas_presentes": 10, "chapas_operacao_cafe": 0, "valor_pago_dia": 1000},
        {"data": "2025-07-06", "dia_semana": "domingo", "chapas_presentes": 2, "chapas_operacao_cafe": 0, "valor_pago_dia": 200},
        {"data": "2025-09-30", "dia_semana": "terca", "chapas_presentes": 10, "chapas_operacao_cafe": 0, "valor_pago_dia": 4000},
    ])
    dias = {d["data"]: d for d in ch.montar_folha(folha, rel)}
    assert dias[date(2025, 7, 6)]["suspeito"] and "domingo" in dias[date(2025, 7, 6)]["motivo_suspeita"]
    assert dias[date(2025, 9, 30)]["suspeito"] and "4.0x" in dias[date(2025, 9, 30)]["motivo_suspeita"]
    assert not dias[date(2025, 7, 1)]["suspeito"]
    assert rel["folha_meses_sem_registro"] == "2025-08"


def test_produto_repetido_fica_com_o_deposito_que_recebe():
    rel = Counter()
    p = pd.DataFrame([
        {"Nº do item": "PEC000009", "Descrição do item": "P", "Unidade de medida": "UN", "Peso": 1,
         "Nome do grupo": "", "Grupo ": "", "Descrição": "", "depósito": "MATProv"},
        {"Nº do item": "PEC000009", "Descrição do item": "P", "Unidade de medida": "UN", "Peso": 1,
         "Nome do grupo": "", "Grupo ": "", "Descrição": "", "depósito": "MATLoja"},
    ])
    [prod] = ch.montar_produtos(p, rel)
    assert prod["deposito"] == "MATLoja" and prod["local"] == L.LOJA and rel["produtos_unicos"] == 1


# ------------------------------------------------------------ carga completa (arquivos sintéticos)

@pytest.fixture
def pasta_dados(tmp_path):
    (tmp_path / "02_cadastros").mkdir()
    (tmp_path / "03_movimentacao").mkdir()
    (tmp_path / "04_mao_de_obra").mkdir()
    pd.DataFrame([{"COD": "FD000001", "FORNECEDOR": "Fornecedor Teste", "CNPJ": "07467822000126"},
                  {"COD": "FD000002", "FORNECEDOR": "Filial", "CNPJ": "07467822000126"}]
                 ).to_excel(tmp_path / "02_cadastros/fornecedores.xlsx", index=False)
    pd.DataFrame([{"Nº do item": "FER000001", "Descrição do item": "ADUBO", "Unidade de medida": "TON",
                   "Peso": 1000, "Nome do grupo": "", "Grupo ": "", "Descrição": "", "depósito": "MATFerti"}]
                 ).to_excel(tmp_path / "02_cadastros/produtos.xlsx", index=False)
    pd.DataFrame([linha(pedido=26001, item="FER000001", dep="MATFerti", qtd=30, peso=30000)]
                 ).to_excel(tmp_path / "03_movimentacao/pedido_recebimento_notafiscal.xlsx", index=False)
    pd.DataFrame([{"data": "2025-03-10", "dia_semana": "segunda", "chapas_presentes": 8,
                   "chapas_operacao_cafe": 0, "valor_pago_dia": 800}]
                 ).to_csv(tmp_path / "04_mao_de_obra/chapas_por_dia.csv", index=False)
    return tmp_path


def test_carga_completa_e_idempotente(db, pasta_dados, fornecedor):
    # `fornecedor` (CNPJ 07467822000126, código FD000001) já existe: é atualizado, não duplicado
    for _ in range(2):
        rel = ch.run(str(pasta_dados))
    db.expire_all()
    assert db.query(RecebimentoHistorico).count() == 1
    assert db.query(PedidoItem).count() == 1 and db.query(Produto).count() == 1
    assert db.query(FolhaDiaria).count() == 1
    assert db.query(Fornecedor).filter_by(cnpj="07467822000126").count() == 2   # 2 códigos, mesmo CNPJ
    r = db.query(RecebimentoHistorico).one()
    assert r.fornecedor_id == fornecedor.id and r.local_principal == L.ADUBO and r.exige_chapa
    assert rel["fornecedores_cnpj_repetido"] == 1


def test_carga_completa_vincula_fornecedor_criado_pela_nota(db, pasta_dados):
    criado = Fornecedor(nome="Criado pela nota", cnpj="07467822000126")       # sem código
    db.add(criado)
    db.commit()
    rel = ch.run(str(pasta_dados))
    db.expire_all()
    assert db.get(Fornecedor, criado.id).codigo == "FD000001"
    assert rel["fornecedores_vinculados_a_cadastro_existente"] == 1


# ------------------------------------------------------------ conferência do Compras com pedido

def test_conferencia_mostra_o_pedido_real(db, pasta_dados, nova_nota):
    ch.run(str(pasta_dados))
    from app.schemas.agendamento import AgendamentoCreate
    from app.services import agendamento_service as svc
    ag = svc.criar_agendamento(db, AgendamentoCreate(
        nota_fiscal_id=nova_nota().id, data=date(2026, 10, 7), horario="08:00",
        acondicionamento="BIG_BAG", ciente_risco_chuva=True),
        agora=datetime(2026, 10, 5, 10, 0, tzinfo=TZ))
    from main import app
    c = TestClient(app)

    sem = c.get(f"/api/v1/agendamentos/{ag.id}/conferencia").json()
    assert sem["pedido_compra"] is None and sem["pedidos_recentes_do_fornecedor"] == [26001]

    com = c.get(f"/api/v1/agendamentos/{ag.id}/conferencia", params={"pedido": 26001}).json()
    assert com["pedido_compra"]["locais"] == ["ADUBO"]
    assert com["pedido_compra"]["itens"][0]["codigo"] == "FER000001"
    v = {x["item"]: x for x in com["verificacoes"]}
    assert v["Pedido de compra encontrado"]["ok"] and v["Pedido é do mesmo fornecedor da nota"]["ok"]

    inexistente = c.get(f"/api/v1/agendamentos/{ag.id}/conferencia", params={"pedido": 1}).json()
    assert not {x["item"]: x for x in inexistente["verificacoes"]}["Pedido de compra encontrado"]["ok"]