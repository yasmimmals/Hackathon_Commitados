"""Popula as tabelas de referência. Idempotente: pode rodar várias vezes sem duplicar.

- tipos de item do boletim (dossiê, seção 8)
- equipamentos de descarga (dossiê, seção 6)
- baias: uma por armazém para começar; o armazém cadastra as demais em /cadastros/baias
"""
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models import Baia, Equipamento, LocalFisico, TipoItem

TIPOS_ITEM = [
    ("Sacaria malas c/ 25", "0.1824"),
    ("Sacaria malas c/ 40", "0.2635"),
    ("Sacaria malas c/ 50", "0.3224"),
    ("Sacaria fardo c/ 250", "1.1780"),
    ("Sacaria fardo c/ 500", "2.3561"),
    ("Peças", "0.3387"),
    ("Máquinas / equipamentos", "0.3224"),
    ("Agroquímico", "0.3224"),
    ("Fertilizantes", "0.3224"),
    ("Sementes", "0.3224"),
    ("Medicamentos", "0.3387"),
    ("Alimentação animal", "0.3387"),
    ("Acessórios agropecuários", "0.3224"),
    ("Serviços diversos", "0.3224"),
]

EQUIPAMENTOS = [
    ("EMPILHADEIRA_GAS", "Empilhadeira a gás", 4,
     "Insumos 1, Adubo 2 (podem subir para o Insumos), Pátio de Máquinas 1. Usada em palete e big bag"),
    ("EMPILHADEIRA_ELETRICA", "Empilhadeira elétrica / retrátil", 1, "Insumos, fixa"),
    ("TRANSPALETEIRA_ELETRICA", "Transpaleteira elétrica", 2, "Insumos, fixas"),
    ("PALETEIRA_ELETRICA", "Paleteira elétrica", 2, "Insumos; podem ir a outros armazéns"),
    ("PALETEIRA_MANUAL", "Paleteira manual", 3, "Insumos 2 (transitam), Adubo 1 (fixa)"),
    ("CARRINHO_MAO", "Carrinho de mão", 2, "Insumos 2 (transitam); Loja sem quantidade informada"),
    ("TRATOR", "Trator", 4, "Pátio de Máquinas"),
]

BAIAS = [
    (LocalFisico.INSUMOS, "INSUMOS-01", "Insumos - Baia 1"),
    (LocalFisico.ADUBO, "ADUBO-01", "Adubo - Baia 1"),
    (LocalFisico.MAQUINAS, "MAQUINAS-01", "Pátio de Máquinas - Baia 1"),
    (LocalFisico.LOJA, "LOJA-01", "Loja - Baia 1"),
]


def popular(db: Session) -> dict:
    criados = {"tipos_item": 0, "equipamentos": 0, "baias": 0}

    existentes = set(db.scalars(select(TipoItem.descricao)))
    for desc, preco in TIPOS_ITEM:
        if desc not in existentes:
            db.add(TipoItem(descricao=desc, preco_unitario=Decimal(preco)))
            criados["tipos_item"] += 1

    existentes = set(db.scalars(select(Equipamento.codigo)))
    for codigo, nome, qtd, obs in EQUIPAMENTOS:
        if codigo not in existentes:
            db.add(Equipamento(codigo=codigo, nome=nome, quantidade=qtd, observacao=obs))
            criados["equipamentos"] += 1

    existentes = {(b.local, b.codigo) for b in db.scalars(select(Baia))}
    for local, codigo, nome in BAIAS:
        if (local, codigo) not in existentes:
            db.add(Baia(local=local, codigo=codigo, nome=nome))
            criados["baias"] += 1

    db.commit()
    return criados


def run():
    db = SessionLocal()
    try:
        criados = popular(db)
        print("   " + ", ".join(f"{k}: {v} inseridos" for k, v in criados.items()))
    finally:
        db.close()


if __name__ == "__main__":
    run()