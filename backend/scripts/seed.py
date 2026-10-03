"""Popula os 14 tipos de item do boletim (preços da seção 8 do dossiê).
Idempotente: pode rodar quantas vezes quiser, não duplica."""
from decimal import Decimal

from app.core.database import SessionLocal
from app.models import TipoItem

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


def run():
    db = SessionLocal()
    try:
        existentes = {t.descricao for t in db.query(TipoItem).all()}
        novos = [TipoItem(descricao=d, preco_unitario=Decimal(p))
                 for d, p in TIPOS_ITEM if d not in existentes]
        db.add_all(novos)
        db.commit()
        print(f"   tipos_item: {len(novos)} inseridos, {len(existentes)} já existiam")
    finally:
        db.close()


if __name__ == "__main__":
    run()
