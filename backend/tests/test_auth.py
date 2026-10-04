"""Login, cadastro e permissões por perfil (com tokens de verdade, sem o ADMIN de teste)."""
import time
from datetime import date

import pytest
from fastapi.testclient import TestClient

from app.core import config
from app.core.auth import usuario_atual
from app.core.seguranca import conferir_senha, gerar_hash_senha, gerar_token, ler_token
from app.models import Agendamento, Fornecedor, Horario, NotaFiscal, PerfilUsuario, Usuario
from main import app

API = "/api/v1"
SENHA = "SenhaForte123"


@pytest.fixture
def cliente():
    """Remove o ADMIN automático do conftest: aqui cada request precisa de token."""
    app.dependency_overrides.pop(usuario_atual, None)
    return TestClient(app)


@pytest.fixture
def usuario(db):
    def _criar(email, perfil, fornecedor=None, ativo=True):
        u = Usuario(email=email, nome=email.split("@")[0], perfil=perfil, ativo=ativo,
                    senha_hash=gerar_hash_senha(SENHA), fornecedor_id=fornecedor.id if fornecedor else None)
        db.add(u)
        db.commit()
        return u
    return _criar


def entrar(cliente, email, senha=SENHA):
    r = cliente.post(f"{API}/auth/login", json={"email": email, "senha": senha})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['token']}"}


# ---------- senha e token ----------

def test_senha_guardada_com_hash_e_sal():
    a, b = gerar_hash_senha("abc12345"), gerar_hash_senha("abc12345")
    assert a != b and "abc12345" not in a
    assert conferir_senha("abc12345", a) and not conferir_senha("errada", a)


def test_token_assinado_e_com_validade():
    token, _ = gerar_token(7, "COMPRAS")
    assert ler_token(token)["sub"] == 7
    assert ler_token(token[:-1] + ("A" if token[-1] != "A" else "B")) is None   # adulterado
    vencido, _ = gerar_token(7, "COMPRAS", agora=time.time() - (config.TOKEN_VALIDADE_HORAS + 1) * 3600)
    assert ler_token(vencido) is None


# ---------- login ----------

def test_login_devolve_token_e_usuario(cliente, usuario):
    usuario("compras@x.com", PerfilUsuario.COMPRAS)
    r = cliente.post(f"{API}/auth/login", json={"email": " COMPRAS@X.com ", "senha": SENHA})
    assert r.status_code == 200
    corpo = r.json()
    assert corpo["usuario"]["perfil"] == "COMPRAS" and corpo["tipo"] == "Bearer"
    me = cliente.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {corpo['token']}"})
    assert me.json()["email"] == "compras@x.com"


@pytest.mark.parametrize("email,senha", [("compras@x.com", "errada"), ("ninguem@x.com", SENHA)])
def test_login_invalido_nao_revela_se_o_email_existe(cliente, usuario, email, senha):
    usuario("compras@x.com", PerfilUsuario.COMPRAS)
    r = cliente.post(f"{API}/auth/login", json={"email": email, "senha": senha})
    assert r.status_code == 401
    assert r.json()["codigo"] == "CREDENCIAIS_INVALIDAS"


def test_usuario_inativo_nao_entra(cliente, usuario):
    usuario("off@x.com", PerfilUsuario.ARMAZEM, ativo=False)
    r = cliente.post(f"{API}/auth/login", json={"email": "off@x.com", "senha": SENHA})
    assert r.status_code == 401 and r.json()["codigo"] == "USUARIO_INATIVO"


def test_rotas_exigem_token(cliente):
    assert cliente.get(f"{API}/health").status_code == 200          # pública
    r = cliente.get(f"{API}/agendamentos")
    assert r.status_code == 401 and r.json()["codigo"] == "NAO_AUTENTICADO"
    r = cliente.get(f"{API}/agendamentos", headers={"Authorization": "Bearer lixo.lixo"})
    assert r.status_code == 401 and r.json()["codigo"] == "TOKEN_INVALIDO"


# ---------- permissões por perfil ----------

def test_boletim_so_para_armazem(cliente, usuario):
    usuario("compras@x.com", PerfilUsuario.COMPRAS)
    usuario("armazem@x.com", PerfilUsuario.ARMAZEM)
    r = cliente.get(f"{API}/boletins", headers=entrar(cliente, "compras@x.com"))
    assert r.status_code == 403 and r.json()["codigo"] == "ACESSO_NEGADO"
    assert cliente.get(f"{API}/boletins", headers=entrar(cliente, "armazem@x.com")).status_code == 200


def test_fornecedor_nao_aprova(cliente, usuario, fornecedor):
    usuario("forn@x.com", PerfilUsuario.FORNECEDOR, fornecedor)
    r = cliente.post(f"{API}/agendamentos/1/aprovar", headers=entrar(cliente, "forn@x.com"),
                     json={"pedido_compra": 1, "analisado_por": "eu"})
    assert r.status_code == 403


def test_fornecedor_ve_so_a_propria_empresa(cliente, usuario, db, fornecedor, nova_nota):
    outra = Fornecedor(nome="Outra", cnpj="11222333000144")
    db.add(outra)
    db.commit()
    nota_minha = nova_nota()
    nota_outra = NotaFiscal(chave="9" * 44, numero="9", fornecedor_id=outra.id, peso_bruto_kg=1000,
                            formato="xml", arquivo_url="x")
    db.add(nota_outra)
    db.commit()
    for nota, forn in ((nota_minha, fornecedor), (nota_outra, outra)):
        db.add(Agendamento(fornecedor_id=forn.id, nota_fiscal_id=nota.id, data=date(2030, 1, 7),
                           horario=Horario.H08, acondicionamento="PALETIZADO"))
    db.commit()
    alheio = db.query(Agendamento).filter_by(fornecedor_id=outra.id).one()

    usuario("forn@x.com", PerfilUsuario.FORNECEDOR, fornecedor)
    h = entrar(cliente, "forn@x.com")
    lista = cliente.get(f"{API}/agendamentos", headers=h).json()
    assert [a["fornecedor_id"] for a in lista] == [fornecedor.id]
    r = cliente.get(f"{API}/agendamentos/{alheio.id}", headers=h)
    assert r.status_code == 403 and r.json()["codigo"] == "AGENDAMENTO_DE_OUTRO_FORNECEDOR"
    # A nota em si pode ser de outra empresa: consultar é permitido.
    assert cliente.get(f"{API}/agendamentos/nota-fiscal/{nota_outra.id}", headers=h).status_code == 200


def test_fornecedor_agenda_com_nota_de_outra_empresa_e_enxerga(cliente, usuario, db, fornecedor):
    outra = Fornecedor(nome="Transportadora X", cnpj="55666777000188")
    db.add(outra)
    db.commit()
    nota = NotaFiscal(chave="8" * 44, numero="77", fornecedor_id=outra.id, peso_bruto_kg=1000,
                      formato="xml", arquivo_url="x")
    db.add(nota)
    db.commit()
    eu = usuario("forn@x.com", PerfilUsuario.FORNECEDOR, fornecedor)
    h = entrar(cliente, "forn@x.com")

    r = cliente.post(f"{API}/agendamentos", headers=h, json={
        "nota_fiscal_id": nota.id, "data": "2030-01-07", "horario": "08:00", "acondicionamento": "PALETIZADO"})
    assert r.status_code == 201, r.text
    ag = r.json()
    assert ag["fornecedor_id"] == outra.id                     # fica no nome do emitente da NF
    assert [a["id"] for a in cliente.get(f"{API}/agendamentos", headers=h).json()] == [ag["id"]]
    assert cliente.get(f"{API}/agendamentos/{ag['id']}", headers=h).status_code == 200
    assert db.get(Agendamento, ag["id"]).criado_por_id == eu.id


# ---------- cadastro ----------

def test_cadastro_de_fornecedor_cria_a_empresa_e_ja_entra(cliente, db):
    r = cliente.post(f"{API}/auth/cadastro", json={
        "perfil": "FORNECEDOR", "nome": "Ana", "email": "ana@empresa.com", "senha": SENHA,
        "empresa": "Empresa Nova Ltda", "cnpj": "12.345.678/0001-90"})
    assert r.status_code == 201, r.text
    corpo = r.json()
    assert corpo["usuario"]["fornecedor"]["cnpj"] == "12345678000190"
    assert cliente.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {corpo['token']}"}).status_code == 200


def test_cadastro_de_fornecedor_reaproveita_empresa_existente(cliente, fornecedor):
    r = cliente.post(f"{API}/auth/cadastro", json={
        "perfil": "FORNECEDOR", "nome": "Bia", "email": "bia@x.com", "senha": SENHA,
        "empresa": "Qualquer", "cnpj": fornecedor.cnpj})
    assert r.json()["usuario"]["fornecedor"]["id"] == fornecedor.id


def test_cadastro_interno_exige_codigo(cliente):
    base = {"perfil": "ARMAZEM", "nome": "Caio", "email": "caio@cocapec.com", "senha": SENHA}
    r = cliente.post(f"{API}/auth/cadastro", json=base)
    assert r.status_code == 409 and r.json()["codigo"] == "CODIGO_INTERNO_INVALIDO"
    r = cliente.post(f"{API}/auth/cadastro", json={**base, "codigo_interno": config.CODIGO_CADASTRO_INTERNO})
    assert r.status_code == 201 and r.json()["usuario"]["perfil"] == "ARMAZEM"


def test_cadastro_rejeita_email_repetido_senha_curta_e_admin(cliente, usuario):
    usuario("dup@x.com", PerfilUsuario.COMPRAS)
    base = {"perfil": "COMPRAS", "nome": "Dup", "senha": SENHA, "codigo_interno": config.CODIGO_CADASTRO_INTERNO}
    r = cliente.post(f"{API}/auth/cadastro", json={**base, "email": "DUP@x.com"})
    assert r.status_code == 409 and r.json()["codigo"] == "EMAIL_JA_CADASTRADO"
    assert cliente.post(f"{API}/auth/cadastro", json={**base, "email": "n@x.com", "senha": "123"}).status_code == 422
    assert cliente.post(f"{API}/auth/cadastro", json={**base, "email": "a@x.com", "perfil": "ADMIN"}).status_code == 422
    sem_cnpj = {"perfil": "FORNECEDOR", "nome": "F", "email": "f@x.com", "senha": SENHA, "empresa": "F"}
    assert cliente.post(f"{API}/auth/cadastro", json=sem_cnpj).status_code == 422
