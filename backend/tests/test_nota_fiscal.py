"""Leitura da NF-e e fluxo do fornecedor pela API (envia nota -> consulta -> agenda)."""
from fastapi.testclient import TestClient

from app.services.nfe_parser import chave_valida, dados_da_chave, eh_carga_adubo, ler_nfe_xml


def _com_dv(chave43: str) -> str:
    soma, peso = 0, 2
    for d in reversed(chave43):
        soma += int(d) * peso
        peso = 2 if peso == 9 else peso + 1
    resto = soma % 11
    return chave43 + str(0 if resto < 2 else 11 - resto)


CHAVE = _com_dv("3526100746782200012655001000012345100000001")


def nfe_xml(ncm="31052000", descricao="ADUBO 20-05-20", unidade="SC", peso="28100.000",
            cnpj="07467822000126", chave=CHAVE) -> bytes:
    return f"""<?xml version="1.0"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe"><NFe><infNFe Id="NFe{chave}">
<ide><serie>1</serie><nNF>12345</nNF><dhEmi>2026-10-01T09:00:00-03:00</dhEmi></ide>
<emit><CNPJ>{cnpj}</CNPJ><xNome>FERTILIZANTES TESTE SA</xNome></emit>
<det nItem="1"><prod><cProd>ABC1</cProd><xProd>{descricao}</xProd><NCM>{ncm}</NCM>
<qCom>560.0000</qCom><uCom>{unidade}</uCom></prod></det>
<total><ICMSTot><vNF>98765.43</vNF></ICMSTot></total>
<transp><vol><qVol>560</qVol><esp>SACO</esp><pesoL>28000.000</pesoL><pesoB>{peso}</pesoB></vol></transp>
</infNFe></NFe></nfeProc>""".encode()


# ------------------------------------------------------------ leitor

def test_chave_e_dados_derivados():
    assert chave_valida(CHAVE)
    assert not chave_valida(CHAVE[:-1] + str((int(CHAVE[-1]) + 1) % 10))
    assert dados_da_chave(CHAVE) == {"cnpj_emitente": "07467822000126", "serie": "1",
                                     "numero": "12345"}


def test_le_xml_completo():
    n = ler_nfe_xml(nfe_xml())
    assert n["chave"] == CHAVE and n["numero"] == "12345" and n["serie"] == "1"
    assert n["data_emissao"] == "2026-10-01" and str(n["valor_total"]) == "98765.43"
    assert str(n["peso_bruto_kg"]) == "28100.000" and n["volumes"] == 560
    assert n["carga_adubo"] and n["alertas"] == []


def test_xml_sem_peso_gera_alerta():
    n = ler_nfe_xml(nfe_xml().replace(b"<pesoB>28100.000</pesoB>", b""))
    assert n["peso_bruto_kg"] is None and "Peso não informado na nota" in n["alertas"]


def test_regra_de_carga_de_adubo():
    item = lambda ncm, desc, un="KG": {"ncm": ncm, "descricao": desc, "unidade": un}  # noqa: E731
    assert eh_carga_adubo([item("31042010", "CLORETO DE POTASSIO")])         # NCM 31 sólido
    assert eh_carga_adubo([item("25202090", "GESSO AGRICOLA PLUS")])         # corretivo
    assert eh_carga_adubo([item("25182000", "DOLOMITA MOIDA")])
    assert not eh_carga_adubo([item("31059090", "QUIMIFOL (20L)", "L")])     # foliar líquido
    assert not eh_carga_adubo([item("84324200", "DISTRIBUIDOR CALCARIO")])   # máquina
    assert not eh_carga_adubo([item("38089324", "NUFOSATE (1X20L)", "L")])   # defensivo


# ------------------------------------------------------------ API

def test_fluxo_fornecedor_pela_api(chuva):
    from main import app
    c = TestClient(app)

    r = c.post("/agendamentos/nota-fiscal", files={"arquivo": ("nf.xml", nfe_xml(), "text/xml")})
    assert r.status_code == 201, r.text
    nota = r.json()
    assert nota["carga_adubo"] and nota["fornecedor"]["cnpj"] == "07467822000126"
    assert "Fornecedor cadastrado automaticamente a partir da nota" in nota["alertas"]

    # reenviar a mesma nota reaproveita o registro
    r2 = c.post("/agendamentos/nota-fiscal", files={"arquivo": ("nf.xml", nfe_xml(), "text/xml")})
    assert r2.json()["id"] == nota["id"]

    chuva["padrao"] = 90
    slots = c.get("/agendamentos/disponibilidade",
                  params={"data": "2030-01-08", "nota_fiscal_id": nota["id"]}).json()
    assert {s["situacao_chuva"] for s in slots} == {"BLOQUEADO"}

    corpo = {"nota_fiscal_id": nota["id"], "data": "2030-01-08", "horario": "08:00",
             "acondicionamento": "BIG_BAG", "ciente_risco_chuva": True}
    r = c.post("/agendamentos", json=corpo)
    assert r.status_code == 409 and "90% de chuva" in r.json()["detail"]
    assert "alternativas" in r.json()

    chuva["padrao"] = 20
    r = c.post("/agendamentos", json=corpo)
    assert r.status_code == 201, r.text
    ag = r.json()
    assert ag["prob_chuva"] == 20 and ag["peso_kg"] == "28100.000" and ag["chapas_norma"] == 2
    assert "próximo dia útil" in ag["aviso_chuva"]

    r = c.post("/agendamentos/nota-fiscal", files={"arquivo": ("nf.xml", nfe_xml(), "text/xml")})
    assert r.status_code == 409 and r.json()["agendamento_id"] == ag["id"]


def test_arquivo_invalido():
    from main import app
    r = TestClient(app).post("/agendamentos/nota-fiscal",
                             files={"arquivo": ("nota.txt", b"qualquer coisa", "text/plain")})
    assert r.status_code == 409 and "XML" in r.json()["detail"]