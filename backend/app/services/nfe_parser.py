"""Leitura determinística da NF-e (sem IA), em XML ou PDF (DANFE).

- XML: fonte completa e confiável. É o formato preferido.
- PDF: a chave de acesso (44 dígitos, com dígito verificador) é a âncora.
  Dela saem CNPJ do emitente, série e número com certeza; peso, NCM e itens
  são lidos do texto do DANFE e podem falhar (vira alerta, não erro).

O código de produto da nota é do FORNECEDOR, não da Cocapec: serve para
exibição, nunca para descobrir depósito (isso vem do pedido de compra).
"""
import io
import re
import xml.etree.ElementTree as ET
from datetime import datetime
from decimal import Decimal, InvalidOperation
from typing import Optional

NS = {"n": "http://www.portalfiscal.inf.br/nfe"}

# O que interessa para a regra de chuva é: a carga vai para o PÁTIO DE ADUBOS
# (a céu aberto)? Validado contra o depósito real da planilha de movimentação:
# - NCM 31 (fertilizantes) sólidos -> pátio de adubos
# - NCM 2518/2519/2520 (calcário, dolomita, magnesita, gesso agrícola) -> também
# - fertilizante LÍQUIDO (foliar, em litros) fica no Insumos, coberto -> não conta
# - máquinas (NCM 84/87) que citam "calcário" no nome -> não contam
NCM_PATIO_ADUBO = ("31", "2518", "2519", "2520")
UNIDADES_LIQUIDO = {"L", "LT", "LTS", "ML", "GL", "GAL"}
PALAVRAS_ADUBO = (
    "ADUBO", "FERTILIZ", "FERT.", "UREIA", "URÉIA", "NPK", "SUPERFOSFATO",
    "CLORETO DE POTASSIO", "CLORETO DE POTÁSSIO", "KCL", "NITRATO DE AMONIO",
    "SULFATO DE AMONIO", "YARAMILA", "CALCARIO", "CALCÁRIO", "GESSO AGRICOLA",
    "GESSO AGRÍCOLA", "DOLOMIT", "SOLO FERTIL", "CORRETIVO DE ACIDEZ",
)


# ------------------------------------------------------------------ helpers

def _dec(v) -> Optional[Decimal]:
    try:
        return Decimal(v) if v not in (None, "") else None
    except InvalidOperation:
        return None


def _dec_br(v: str) -> Optional[Decimal]:
    """'26.019,000' -> Decimal('26019.000')"""
    return _dec(v.replace(".", "").replace(",", ".")) if v else None


def chave_valida(chave: str) -> bool:
    """Dígito verificador da chave de acesso (módulo 11, pesos 2..9)."""
    if not re.fullmatch(r"\d{44}", chave or ""):
        return False
    soma, peso = 0, 2
    for d in reversed(chave[:43]):
        soma += int(d) * peso
        peso = 2 if peso == 9 else peso + 1
    resto = soma % 11
    dv = 0 if resto < 2 else 11 - resto
    return dv == int(chave[43])


def dados_da_chave(chave: str) -> dict:
    """Layout: cUF(2) AAMM(4) CNPJ(14) mod(2) série(3) nNF(9) tpEmis(1) cNF(8) DV(1)"""
    return {
        "cnpj_emitente": chave[6:20],
        "serie": str(int(chave[22:25])),
        "numero": str(int(chave[25:34])),
    }


def _item_eh_liquido(it: dict) -> bool:
    un = (it.get("unidade") or "").upper().strip()
    desc = (it.get("descricao") or "").upper()
    return un in UNIDADES_LIQUIDO or bool(re.search(r"\(\s*\d+\s*L\s*\)|\d+\s*LITROS", desc))


def eh_carga_adubo(itens: list[dict]) -> bool:
    """True se algum item vai para o pátio de adubos (sujeito a chuva)."""
    for it in itens:
        ncm = it.get("ncm") or ""
        if ncm.startswith(("84", "87")) or _item_eh_liquido(it):
            continue
        if ncm.startswith(NCM_PATIO_ADUBO):
            return True
        desc = f" {(it.get('descricao') or '').upper()} "
        if any(p in desc for p in PALAVRAS_ADUBO):
            return True
    return False


def _resultado(**campos) -> dict:
    base = {
        "formato": None, "chave": None, "numero": None, "serie": None,
        "data_emissao": None, "cnpj_emitente": None, "nome_emitente": None,
        "valor_total": None, "peso_bruto_kg": None, "peso_liquido_kg": None,
        "volumes": None, "especie": None, "itens": [], "carga_adubo": False,
        "alertas": [],
    }
    base.update(campos)
    base["carga_adubo"] = eh_carga_adubo(base["itens"])
    if base["peso_bruto_kg"] is None:
        base["alertas"].append("Peso não informado na nota")
    return base


# ------------------------------------------------------------------ XML

def _txt(el, path):
    if el is None:
        return None
    found = el.find(path, NS)
    return found.text.strip() if found is not None and found.text else None


def ler_nfe_xml(conteudo: bytes) -> dict:
    root = ET.fromstring(conteudo)
    inf = root.find(".//n:infNFe", NS)
    if inf is None:
        raise ValueError("XML não parece ser uma NF-e (infNFe não encontrado)")

    alertas = []
    chave = (inf.get("Id") or "").removeprefix("NFe") or None
    if chave and not chave_valida(chave):
        alertas.append("Dígito verificador da chave de acesso não confere")
    emit = inf.find("n:emit", NS)

    vols = inf.findall("n:transp/n:vol", NS)
    peso_b = sum((_dec(_txt(v, "n:pesoB")) or Decimal(0) for v in vols), Decimal(0))
    peso_l = sum((_dec(_txt(v, "n:pesoL")) or Decimal(0) for v in vols), Decimal(0))
    qvol = sum(int(_dec(_txt(v, "n:qVol")) or 0) for v in vols)
    especies = sorted({_txt(v, "n:esp") for v in vols if _txt(v, "n:esp")})

    itens = [{
        "codigo_fornecedor": _txt(det, "n:prod/n:cProd"),
        "descricao": _txt(det, "n:prod/n:xProd"),
        "ncm": _txt(det, "n:prod/n:NCM"),
        "quantidade": str(_dec(_txt(det, "n:prod/n:qCom"))),
        "unidade": _txt(det, "n:prod/n:uCom"),
    } for det in inf.findall("n:det", NS)]

    dh = _txt(inf, "n:ide/n:dhEmi") or _txt(inf, "n:ide/n:dEmi")
    return _resultado(
        formato="xml", chave=chave,
        numero=_txt(inf, "n:ide/n:nNF"), serie=_txt(inf, "n:ide/n:serie"),
        data_emissao=dh[:10] if dh else None,
        cnpj_emitente=_txt(emit, "n:CNPJ"),
        nome_emitente=" ".join((_txt(emit, "n:xNome") or "").split()) or None,
        valor_total=_dec(_txt(inf, "n:total/n:ICMSTot/n:vNF")),
        peso_bruto_kg=peso_b or None, peso_liquido_kg=peso_l or None,
        volumes=qvol or None, especie=", ".join(especies) or None,
        itens=itens, alertas=alertas,
    )


# ------------------------------------------------------------------ PDF (DANFE)

RE_CHAVE = re.compile(r"(?<!\d)((?:\d{4}\s?){10}\d{4})(?!\d)")
# Blocos estruturais do DANFE (principal) e canhoto (reserva; às vezes vem rotacionado)
RE_EMITENTE = re.compile(r"\n([^\n]+)\n0 - ENTRADA")
RE_EMITENTE_CANHOTO = re.compile(r"RECEBEMOS DE (.+?) OS PRODUTOS", re.S)
RE_EMISSAO = re.compile(r"DATA DA EMISS[ÃA]O\n[^\n]*?(\d{2}/\d{2}/\d{4})")
RE_EMISSAO_CANHOTO = re.compile(r"EMISS[ÃA]O:\s*(\d{2}/\d{2}/\d{4})")
RE_VALOR = re.compile(r"V\. TOTAL DA NOTA\n([^\n]+)")
RE_VALOR_CANHOTO = re.compile(r"VALOR TOTAL:\s*R\$\s*([\d.]+,\d{2})")
RE_MOEDA = re.compile(r"\d{1,3}(?:\.\d{3})*,\d{2}(?!\d)")
RE_VOLUMES = re.compile(
    r"QUANTIDADE ESP.CIE MARCA NUMERA..O PESO BRUTO PESO L.QUIDO\n(.*)")
RE_PESO = re.compile(r"\d{1,3}(?:\.\d{3})*,\d{3}")
# no DANFE, a linha do produto traz: ... NCM(8) CST(3) CFOP(4) UN QTD ...
RE_ITEM = re.compile(
    r"^(\S+) (.+?) (\d{8}) \d{3} \d{4} (\S+) ([\d.]+,\d{2,4})", re.M)


def ler_danfe_pdf(conteudo: bytes) -> dict:
    import pdfplumber

    with pdfplumber.open(io.BytesIO(conteudo)) as pdf:
        texto = "\n".join(p.extract_text() or "" for p in pdf.pages)
    if not texto.strip():
        raise ValueError("PDF sem texto (provavelmente digitalizado). Envie o XML da nota")

    alertas = []
    chave = None
    for cand in RE_CHAVE.findall(texto):
        digitos = re.sub(r"\D", "", cand)
        if chave_valida(digitos):
            chave = digitos
            break
    if not chave:
        raise ValueError("Chave de acesso válida não encontrada no PDF. Envie o XML da nota")
    da_chave = dados_da_chave(chave)

    nome = RE_EMITENTE.search(texto) or RE_EMITENTE_CANHOTO.search(texto)
    emissao = RE_EMISSAO.search(texto) or RE_EMISSAO_CANHOTO.search(texto)
    valor = None
    m_valor = RE_VALOR.search(texto)
    if m_valor and RE_MOEDA.findall(m_valor.group(1)):
        valor = RE_MOEDA.findall(m_valor.group(1))[-1]
    elif RE_VALOR_CANHOTO.search(texto):
        valor = RE_VALOR_CANHOTO.search(texto).group(1)

    peso_b = peso_l = volumes = especie = None
    m = RE_VOLUMES.search(texto)
    if m:
        linha = m.group(1)
        pesos = RE_PESO.findall(linha)
        if len(pesos) >= 2:
            peso_b, peso_l = _dec_br(pesos[-2]), _dec_br(pesos[-1])
        elif len(pesos) == 1:
            peso_b = _dec_br(pesos[0])
            alertas.append("Só um peso legível no DANFE; assumido como peso bruto")
        resto = RE_PESO.sub("", linha).split()
        if resto and resto[0].isdigit():
            volumes = int(resto[0])
            especie = " ".join(resto[1:2]) or None

    itens = [{
        "codigo_fornecedor": it[0], "descricao": it[1].strip(), "ncm": it[2],
        "unidade": it[3], "quantidade": str(_dec_br(it[4])),
    } for it in RE_ITEM.findall(texto)]
    if not itens:
        alertas.append("Itens não identificados no PDF")
    alertas.append("Dados lidos do PDF; confira o peso antes de confirmar")

    return _resultado(
        formato="pdf", chave=chave, **da_chave,
        data_emissao=(datetime.strptime(emissao.group(1), "%d/%m/%Y").date().isoformat()
                      if emissao else None),
        nome_emitente=" ".join(nome.group(1).split()) if nome else None,
        valor_total=_dec_br(valor) if valor else None,
        peso_bruto_kg=peso_b, peso_liquido_kg=peso_l, volumes=volumes, especie=especie,
        itens=itens, alertas=alertas,
    )


def ler_nota(nome_arquivo: str, conteudo: bytes) -> dict:
    nome = (nome_arquivo or "").lower()
    if nome.endswith(".xml") or conteudo.lstrip()[:5] == b"<?xml":
        return ler_nfe_xml(conteudo)
    if nome.endswith(".pdf") or conteudo[:4] == b"%PDF":
        return ler_danfe_pdf(conteudo)
    raise ValueError("Envie o XML (preferível) ou o PDF (DANFE) da nota")