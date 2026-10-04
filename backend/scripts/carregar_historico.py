"""Carga dos dados históricos da Cocapec, com tratamento e relatório de qualidade.

Uso (dentro do container):
    docker compose exec backend python -m scripts.carregar_historico dados/DADOS_HACKATHON_2026

Os arquivos originais NÃO vão para o repositório (LEIA-ME): copie a pasta para backend/dados/.
Idempotente: as tabelas históricas são recriadas a cada execução; fornecedores são
atualizados pelo código (agendamentos existentes não são tocados).

Problemas tratados (cada um aparece contado no relatório):
  1. Linhas duplicadas exatas na movimentação -> descartadas.
  2. Qtd/Peso são do ITEM DO PEDIDO e se repetem em cada recebimento -> o peso por nota
     é rateado pelo nº de recebimentos do item e limitado à carga de um caminhão.
  3. Armazém físico: MATGeral fica no Insumos (dossiê); nos demais vale o grupo do produto;
     depósitos fora da lista oficial ficam sem armazém e sinalizados.
  4. 25% dos itens não existem no cadastro de produtos -> grupo lido do prefixo do código.
  5. Chave de acesso ausente ou com dígito verificador inválido -> nota agrupada por
     fornecedor + número + data, com alerta.
  6. Recebimento antes do pedido -> NÃO é erro: o pedido costuma ser lançado no SAP
     depois da nota (dossiê, seção 3). Fica só registrado.
  7. CNPJ repetido no cadastro de fornecedores (mesmo CNPJ, códigos diferentes) -> mantidos.
  8. Folha: dias com valor por pessoa muito acima do normal (acerto/encargos) e domingos
     -> marcados como suspeitos, não descartados.
"""
import re
import sys
from collections import Counter
from decimal import Decimal
from pathlib import Path
from typing import Optional

import pandas as pd
from sqlalchemy import delete, insert, select

from app.core.database import SessionLocal
from app.models import (
    FolhaDiaria, Fornecedor, LocalFisico as L, Origem, PedidoItem, Produto,
    RecebimentoHistorico,
)
from app.services.nfe_parser import chave_valida

PESO_MINIMO_CHAPA_KG = 500          # abaixo disso a carga dispensa chapa (dossiê, seção 7)
PESO_MAXIMO_CAMINHAO_KG = 50_000    # bitrem: nenhuma nota trouxe mais que isso num caminhão
DEPOSITOS_OFICIAIS = {"MATLoja", "MATGeral", "MATFerti", "MATDefe", "MATMaq",
                      "MATDef2", "MATGer2", "MATFert2"}
LOCAL_POR_GRUPO = {"FER": L.ADUBO, "MAQ": L.MAQUINAS, "AGR": L.INSUMOS,
                   "PEC": L.LOJA, "ALI": L.LOJA, "MED": L.LOJA, "ACE": L.LOJA}
LOCAL_POR_DEPOSITO = {"MATLoja": L.LOJA, "MATGeral": L.INSUMOS, "MATGer2": L.INSUMOS,
                      "MATFerti": L.ADUBO, "MATFert2": L.ADUBO, "MATDefe": L.INSUMOS,
                      "MATDef2": L.INSUMOS, "MATMaq": L.MAQUINAS}
DEPOSITOS_QUE_NAO_RECEBEM = {"MATProv", "MATReser"}


# ------------------------------------------------------------------ regras puras

def so_digitos(v) -> str:
    return re.sub(r"\D", "", str(v or ""))


def local_fisico(grupo: Optional[str], deposito: Optional[str]) -> Optional[L]:
    """Dossiê seção 5: MATGeral fica dentro do Insumos; no resto o local segue o grupo."""
    if deposito in ("MATGeral", "MATGer2"):
        return L.INSUMOS
    if deposito and deposito not in DEPOSITOS_OFICIAIS:
        return None                                  # MATIndus, MATTrans...: sem armazém
    return LOCAL_POR_GRUPO.get(grupo) or LOCAL_POR_DEPOSITO.get(deposito)


def chave_ok(chave) -> bool:
    return isinstance(chave, str) and chave_valida(so_digitos(chave)) and len(so_digitos(chave)) == 44


def preparar_movimentacao(m: pd.DataFrame, rel: Counter) -> pd.DataFrame:
    rel["mov_linhas_lidas"] = len(m)
    antes = len(m)
    m = m.drop_duplicates().copy()
    rel["mov_duplicadas_descartadas"] = antes - len(m)
    m["grupo"] = m["Cod Item"].astype(str).str[:3]
    # guardado como texto no DataFrame (o pandas troca None por NaN em colunas de objeto)
    m["local"] = [(lf.value if (lf := local_fisico(g, d)) else None)
                  for g, d in zip(m["grupo"], m["Deposito"])]
    rel["mov_linhas_sem_armazem"] = int(m["local"].isna().sum())
    rel["mov_peso_zerado"] = int((m["Peso"] <= 0).sum())
    # nº de recebimentos de cada item de pedido: o Peso da linha é do pedido inteiro
    n = m.groupby(["Pedido Compra", "Cod Item"])["Nº Recebimento"].transform("nunique")
    rel["mov_itens_pedido_com_varios_recebimentos"] = int(
        m.loc[n > 1, ["Pedido Compra", "Cod Item"]].drop_duplicates().shape[0])
    m["peso_rateado"] = m["Peso"].clip(lower=0) / n
    m["chave_ok"] = m["Chave de Acesso"].map(chave_ok)
    m["chave_digitos"] = m["Chave de Acesso"].map(so_digitos)
    m["grupo_nota"] = [c if ok else f"SEM_CHAVE|{pn}|{nf}|{d:%Y-%m-%d}"
                       for c, ok, pn, nf, d in zip(m["chave_digitos"], m["chave_ok"], m["Cod PN"],
                                                    m["Nota Fiscal de Entrada"], m["Data Recebimento"])]
    return m


def montar_recebimentos(m: pd.DataFrame, rel: Counter) -> list[dict]:
    out = []
    for chave, g in m.groupby("grupo_nota", sort=False):
        data = g["Data Recebimento"].min()
        if g["Data Recebimento"].nunique() > 1:
            rel["nota_com_datas_diferentes"] += 1
        por_local = g.dropna(subset=["local"]).groupby("local")["peso_rateado"].sum()
        locais = sorted(por_local.index)
        principal = por_local
        peso_planilha = float(g["Peso"].clip(lower=0).sum())
        peso_est = min(float(g["peso_rateado"].sum()), PESO_MAXIMO_CAMINHAO_KG)
        alertas = []
        valida = bool(g["chave_ok"].iloc[0])
        if not valida:
            alertas.append("Chave de acesso ausente ou inválida")
            rel["nota_sem_chave_valida"] += 1
        if g["Data Recebimento"].iloc[0] < g["Data do Documento"].min():
            alertas.append("Recebida antes do pedido (pedido lançado depois da NF, prática da Cocapec)")
            rel["nota_recebida_antes_do_pedido"] += 1
        if data.weekday() >= 5:
            alertas.append("Recebida em fim de semana")
            rel["nota_em_fim_de_semana"] += 1
        if g["local"].isna().any():
            alertas.append("Item em depósito fora da lista oficial")
        if g["peso_rateado"].sum() > PESO_MAXIMO_CAMINHAO_KG:
            alertas.append("Peso da planilha acima de um caminhão: limitado a 50 t")
            rel["nota_peso_limitado_a_um_caminhao"] += 1
        out.append({
            "data": data.date(), "fornecedor_codigo": g["Cod PN"].iloc[0],
            "nf_numero": str(g["Nota Fiscal de Entrada"].iloc[0]),
            "chave": g["chave_digitos"].iloc[0] if valida else None, "chave_valida": valida,
            "itens": len(g), "pedidos": int(g["Pedido Compra"].nunique()),
            "local_principal": L(principal.idxmax()) if len(principal) else None,
            "locais": ",".join(locais) or None,
            "grupos": ",".join(sorted(g["grupo"].unique())),
            "peso_planilha_kg": Decimal(str(round(peso_planilha, 3))),
            "peso_estimado_kg": Decimal(str(round(peso_est, 3))),
            "exige_chapa": peso_est >= PESO_MINIMO_CHAPA_KG,
            "alertas": alertas, "origem_dado": Origem.HISTORICO,
        })
    rel["notas_recebidas"] = len(out)
    rel["notas_que_exigem_chapa"] = sum(r["exige_chapa"] for r in out)
    return out


def montar_folha(c: pd.DataFrame, rel: Counter) -> list[dict]:
    c = c.copy()
    c["data"] = pd.to_datetime(c["data"])
    por_pessoa = c["valor_pago_dia"] / c["chapas_presentes"].where(c["chapas_presentes"] > 0)
    mediana = por_pessoa.median()
    rel["folha_dias"] = len(c)
    rel["folha_valor_mediano_por_pessoa"] = round(float(mediana), 2)
    out = []
    for (_, row), pp in zip(c.iterrows(), por_pessoa):
        motivos = []
        if row["data"].weekday() == 6:
            motivos.append("domingo")
        if pd.notna(pp) and pp > 2 * mediana:
            motivos.append(f"R$ {pp:.2f} por pessoa ({pp / mediana:.1f}x a mediana): acerto ou encargos?")
        if motivos:
            rel["folha_dias_suspeitos"] += 1
        out.append({
            "data": row["data"].date(), "dia_semana": row["dia_semana"],
            "chapas_presentes": int(row["chapas_presentes"]),
            "chapas_operacao_cafe": int(row.get("chapas_operacao_cafe", 0) or 0),
            "valor_pago": Decimal(str(row["valor_pago_dia"])),
            "suspeito": bool(motivos), "motivo_suspeita": "; ".join(motivos) or None,
        })
    meses = sorted({d["data"].strftime("%Y-%m") for d in out})
    rel["folha_periodo"] = f"{meses[0]} a {meses[-1]}" if meses else "-"
    todos = pd.period_range(meses[0], meses[-1], freq="M").strftime("%Y-%m") if meses else []
    rel["folha_meses_sem_registro"] = ", ".join(m for m in todos if m not in meses) or "nenhum"
    return out


def montar_produtos(p: pd.DataFrame, rel: Counter) -> list[dict]:
    p = p.copy()
    p.columns = [c.strip() for c in p.columns]
    rel["produtos_linhas"] = len(p)
    # mesmo código em vários depósitos: prefere o que recebe mercadoria
    p["_nao_recebe"] = p["depósito"].isin(DEPOSITOS_QUE_NAO_RECEBEM)
    p = p.sort_values(["Nº do item", "_nao_recebe"]).drop_duplicates("Nº do item")
    rel["produtos_unicos"] = len(p)
    out = []
    for _, r in p.iterrows():
        grupo = str(r["Nº do item"])[:3]
        peso = r.get("Peso")
        out.append({
            "codigo": str(r["Nº do item"]), "descricao": str(r["Descrição do item"]),
            "unidade": None if pd.isna(r["Unidade de medida"]) else str(r["Unidade de medida"]),
            "peso_unitario_kg": None if pd.isna(peso) else Decimal(str(peso)),
            "grupo": grupo, "deposito": r["depósito"],
            "local": local_fisico(grupo, r["depósito"]),
        })
    return out


def _local(v) -> Optional[L]:
    return L(v) if isinstance(v, str) else None


def montar_pedidos(m: pd.DataFrame) -> list[dict]:
    p = m.sort_values("Data do Documento").drop_duplicates(["Pedido Compra", "Cod Item"])
    return [{
        "pedido": int(r["Pedido Compra"]), "fornecedor_codigo": r["Cod PN"],
        "codigo_item": r["Cod Item"], "descricao": r["Desc Item"],
        "quantidade": Decimal(str(r["Qtd"])), "peso_kg": Decimal(str(max(r["Peso"], 0))),
        "deposito": r["Deposito"], "local": _local(r["local"]),
        "data_documento": r["Data do Documento"].date(),
    } for _, r in p.iterrows()]


# ------------------------------------------------------------------ carga

def _inserir(db, tabela, linhas, lote=2000):
    for i in range(0, len(linhas), lote):
        db.execute(insert(tabela), linhas[i:i + lote])


def carregar_fornecedores(db, f: pd.DataFrame, rel: Counter) -> dict[str, int]:
    f = f.copy()
    f["cnpj"] = f["CNPJ"].map(lambda v: so_digitos(v).zfill(14))
    rel["fornecedores_no_cadastro"] = len(f)
    rel["fornecedores_cnpj_repetido"] = int(f["cnpj"].duplicated().sum())
    por_codigo = {x.codigo: x for x in db.scalars(select(Fornecedor)) if x.codigo}
    sem_codigo = {}
    for x in db.scalars(select(Fornecedor).where(Fornecedor.codigo.is_(None))):
        sem_codigo.setdefault(x.cnpj, x)            # criados a partir de notas enviadas
    for _, r in f.iterrows():
        cod, nome, cnpj = str(r["COD"]), str(r["FORNECEDOR"]).strip(), r["cnpj"]
        if cod in por_codigo:
            por_codigo[cod].nome, por_codigo[cod].cnpj = nome, cnpj
        elif cnpj in sem_codigo:                    # completa o fornecedor criado pela nota
            x = sem_codigo.pop(cnpj)
            x.codigo = cod
            por_codigo[cod] = x
            rel["fornecedores_vinculados_a_cadastro_existente"] += 1
        else:
            x = Fornecedor(codigo=cod, nome=nome, cnpj=cnpj, origem_dado=Origem.HISTORICO)
            db.add(x)
            por_codigo[cod] = x
    db.flush()
    return {cod: x.id for cod, x in por_codigo.items()}


def run(pasta: str) -> Counter:
    base = Path(pasta)
    rel = Counter()
    fornecedores = pd.read_excel(base / "02_cadastros/fornecedores.xlsx", dtype=str)
    produtos = pd.read_excel(base / "02_cadastros/produtos.xlsx")
    mov = pd.read_excel(base / "03_movimentacao/pedido_recebimento_notafiscal.xlsx",
                        dtype={"Chave de Acesso": str})
    folha = pd.read_csv(base / "04_mao_de_obra/chapas_por_dia.csv")

    m = preparar_movimentacao(mov, rel)
    recebimentos = montar_recebimentos(m, rel)
    pedidos = montar_pedidos(m)
    prods = montar_produtos(produtos, rel)
    dias = montar_folha(folha, rel)
    rel["itens_fora_do_cadastro_de_produtos"] = int((~mov["Cod Item"].isin(produtos["Nº do item"])).sum())

    db = SessionLocal()
    try:
        ids = carregar_fornecedores(db, fornecedores, rel)
        for tabela in (RecebimentoHistorico, PedidoItem, Produto, FolhaDiaria):
            db.execute(delete(tabela))
        for r in recebimentos:
            r["fornecedor_id"] = ids.get(r["fornecedor_codigo"])
        _inserir(db, RecebimentoHistorico, recebimentos)
        _inserir(db, PedidoItem, pedidos)
        _inserir(db, Produto, prods)
        _inserir(db, FolhaDiaria, dias)
        db.commit()
        rel["pedido_itens"] = len(pedidos)
    finally:
        db.close()
    return rel


def imprimir(rel: Counter) -> None:
    print("\n=== Carga histórica concluída: relatório de qualidade ===")
    for k, v in rel.items():
        print(f"  {k:48s} {v}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    imprimir(run(sys.argv[1]))