"""Testes rodam num banco separado (cocapec_test), criado automaticamente.
A previsão do tempo é simulada (fixture `chuva`): nada sai para a internet."""
import itertools
import os

from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url

_base = make_url(os.getenv("DATABASE_URL", "postgresql://root:rootpassword@localhost:5433/cocapec"))
_test_url = _base.set(database="cocapec_test")
os.environ["DATABASE_URL"] = _test_url.render_as_string(hide_password=False)

_admin = create_engine(_base.set(database="postgres"), isolation_level="AUTOCOMMIT")
with _admin.connect() as c:
    if not c.scalar(text("SELECT 1 FROM pg_database WHERE datname='cocapec_test'")):
        c.execute(text("CREATE DATABASE cocapec_test"))
_admin.dispose()

import pytest  # noqa: E402

import app.models  # noqa: E402,F401
from app.core.database import Base, SessionLocal, engine  # noqa: E402
from app.models import Baia, Fornecedor, LocalFisico, NotaFiscal  # noqa: E402
from app.services import clima_service  # noqa: E402
from scripts.seed import popular  # noqa: E402

_seq = itertools.count(1)


@pytest.fixture(scope="session", autouse=True)
def schema():
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    yield
    engine.dispose()


@pytest.fixture(autouse=True)
def limpar(tmp_path, monkeypatch):
    monkeypatch.setattr("app.core.config.UPLOAD_DIR", str(tmp_path))
    with engine.begin() as c:
        nomes = ", ".join(t.name for t in Base.metadata.sorted_tables)
        c.execute(text(f"TRUNCATE {nomes} RESTART IDENTITY CASCADE"))
    s = SessionLocal()
    popular(s)                 # tipos de item, equipamentos e uma baia por armazém
    s.close()
    yield


@pytest.fixture(autouse=True)
def sem_smtp(monkeypatch):
    """Nos testes nenhum e-mail sai: avisos ficam registrados como SIMULADA."""
    monkeypatch.setattr("app.core.config.SMTP_HOST", None)

@pytest.fixture(autouse=True)
def chuva(monkeypatch):
    """Previsão simulada. Padrão 0%. Use chuva[(data, Horario)] = 85 ou chuva['padrao'] = None."""
    previsao = {"padrao": 0}
    monkeypatch.setattr(clima_service, "prob_chuva",
                        lambda d, h: previsao.get((d, h), previsao["padrao"]))
    return previsao


@pytest.fixture
def db():
    s = SessionLocal()
    yield s
    s.close()


@pytest.fixture
def fornecedor(db):
    f = Fornecedor(nome="Fornecedor Teste", cnpj="07467822000126", codigo="FD000001")
    db.add(f)
    db.commit()
    return f


@pytest.fixture
def nova_nota(db, fornecedor):
    """Cria uma nota já lida (sem passar pelo arquivo). Cada chamada = nota nova."""
    def _criar(adubo=False, peso=12000):
        n = NotaFiscal(chave=f"{next(_seq):044d}", numero="1", fornecedor_id=fornecedor.id,
                       peso_bruto_kg=peso, carga_adubo=adubo, formato="xml", arquivo_url="x")
        db.add(n)
        db.commit()
        return n
    return _criar


@pytest.fixture
def baia(db):
    """baia(LocalFisico.ADUBO) -> id da baia padrão daquele armazém."""
    def _baia(local: LocalFisico) -> int:
        return db.query(Baia).filter(Baia.local == local).order_by(Baia.id).first().id
    return _baia

@pytest.fixture(autouse=True)
def usuario_admin():
    """As rotas exigem login. Nos testes de regra de negócio, todo request entra como ADMIN;
    tests/test_auth.py desliga isto (fixture `com_login`) e usa tokens de verdade."""
    from app.core.auth import usuario_atual
    from app.models import PerfilUsuario, Usuario
    from main import app

    app.dependency_overrides[usuario_atual] = lambda: Usuario(
        id=None, email="admin@teste", nome="Admin de teste", perfil=PerfilUsuario.ADMIN,
        senha_hash="-", ativo=True)
    yield
    app.dependency_overrides.pop(usuario_atual, None)
