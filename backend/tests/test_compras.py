"""Compras: conferência, aprovação/reprovação com motivo e avisos ao fornecedor."""
from datetime import date, datetime

import pytest
from fastapi.testclient import TestClient

from app.core.config import TZ
from app.core.exceptions import RegraNegocioError
from app.models import (
    Acondicionamento as A, Horario as H, LocalFisico as L, MotivoNaoRecebimento as M,
    StatusAgendamento as S, StatusNotificacao as SN, TipoNotificacao as T,
)
from app.schemas.agendamento import (
    AgendamentoCreate, AprovacaoIn, DestinoIn, ReagendamentoChuvaIn, RejeicaoIn,
)
from app.services import agendamento_service as svc
from app.services import notificacao_service

QUA = date(2026, 10, 7)
SEG_10H = datetime(2026, 10, 5, 10, 0, tzinfo=TZ)


@pytest.fixture
def agendar(db, nova_nota):
    def _agendar(email=None, horario=H.H08, adubo=False, nota=None):
        nota = nota or nova_nota(adubo=adubo)
        return svc.criar_agendamento(db, AgendamentoCreate(
            nota_fiscal_id=nota.id, data=QUA, horario=horario, acondicionamento=A.PALETIZADO,
            ciente_risco_chuva=True, email_contato=email), agora=SEG_10H)
    return _agendar


def aprovar(db, ag):
    return svc.aprovar(db, ag.id, AprovacaoIn(pedido_compra=26001, analisado_por="ana"), SEG_10H)


def avisos(db, ag):
    return notificacao_service.listar(db, ag.id)


# ------------------------------------------------------------ reprovação

def test_reprovar_exige_observacao():
    with pytest.raises(ValueError):
        RejeicaoIn(motivo=M.DIVERGENCIA_NF_PEDIDO, analisado_por="ana", observacao="")


def test_reprovar_com_motivo_que_nao_e_do_compras(db, agendar):
    ag = agendar()
    with pytest.raises(RegraNegocioError) as e:
        svc.rejeitar(db, ag.id, RejeicaoIn(motivo=M.SEM_VAGA, analisado_por="ana",
                                           observacao="não serve aqui"))
    assert e.value.codigo == "MOTIVO_INVALIDO"


def test_reprovar_avisa_fornecedor_e_libera_horario_e_nota(db, agendar):
    ag = agendar(email="logistica@fornecedor.com")
    ag = svc.rejeitar(db, ag.id, RejeicaoIn(
        motivo=M.DIVERGENCIA_NF_PEDIDO, analisado_por="ana",
        observacao="NF com 100 sacas, pedido com 80. Emitir carta de correção."))
    assert ag.status == S.REJEITADO and ag.motivo_nao_recebimento == M.DIVERGENCIA_NF_PEDIDO

    [n] = avisos(db, ag)
    assert n.tipo == T.REPROVADO and n.destinatario == "logistica@fornecedor.com"
    assert n.status == SN.SIMULADA                       # sem SMTP nos testes
    assert "NÃO aprovada" in n.assunto
    assert "não conferem com o pedido" in n.corpo and "carta de correção" in n.corpo

    # o horário ficou livre e a mesma nota pode ser agendada de novo
    nota = svc.buscar_nota(db, ag.nota_fiscal_id)
    novo = agendar(nota=nota)
    assert novo.status == S.PENDENTE and novo.horario == ag.horario


# ------------------------------------------------------------ aprovação e doca

def test_aprovar_avisa_e_sem_email_fica_registrado(db, agendar):
    ag = aprovar(db, agendar())                          # fornecedor sem e-mail
    [n] = avisos(db, ag)
    assert n.tipo == T.APROVADO and n.status == SN.SEM_DESTINATARIO
    assert "aprovou a entrega" in n.corpo


def test_email_do_agendamento_fica_no_fornecedor(db, agendar):
    ag = agendar(email="  Contato@Fornecedor.COM ")
    assert ag.fornecedor.email == "contato@fornecedor.com"


def test_doca_definida_vai_para_o_fornecedor_e_nao_depois_da_chegada(db, agendar, baia):
    ag = aprovar(db, agendar(email="f@f.com"))
    svc.definir_destinos(db, ag.id, [DestinoIn(local=L.INSUMOS)])
    tipos = [n.tipo for n in avisos(db, ag)]
    assert tipos == [T.APROVADO, T.DESTINO_DEFINIDO]
    assert "Insumos - Baia 1" in avisos(db, ag)[-1].corpo

    svc.registrar_chegada(db, ag.id, agora=datetime(2026, 10, 7, 7, 50, tzinfo=TZ))
    svc.definir_destinos(db, ag.id, [DestinoIn(local=L.INSUMOS), DestinoIn(local=L.LOJA)])
    assert len(avisos(db, ag)) == 2                      # caminhão já está no pátio


def test_adubo_aprovado_leva_aviso_de_chuva(db, agendar):
    ag = aprovar(db, agendar(email="f@f.com", adubo=True))
    assert "pátio aberto" in avisos(db, ag)[0].corpo


def test_reagendado_por_chuva_avisa_nova_data(db, agendar):
    ag = aprovar(db, agendar(email="f@f.com", adubo=True))
    svc.definir_destinos(db, ag.id, [DestinoIn(local=L.ADUBO)])
    novo = svc.reagendar_por_chuva(db, ag.id, ReagendamentoChuvaIn())
    [n] = avisos(db, novo)
    assert n.tipo == T.REAGENDADO_CHUVA and "08/10/2026" in n.assunto and "PRIORIDADE" in n.corpo


# ------------------------------------------------------------ envio real (SMTP)

class SMTPFalso:
    enviados = []

    def __init__(self, host, port, timeout):
        self.host = host

    def __enter__(self):
        return self

    def __exit__(self, *a):
        return False

    def send_message(self, msg):
        SMTPFalso.enviados.append(msg)


def test_com_smtp_o_email_sai_de_verdade(db, agendar, monkeypatch):
    monkeypatch.setattr("app.core.config.SMTP_HOST", "mailpit")
    monkeypatch.setattr("app.services.notificacao_service.smtplib.SMTP", SMTPFalso)
    SMTPFalso.enviados.clear()
    ag = aprovar(db, agendar(email="f@f.com"))
    assert avisos(db, ag)[0].status == SN.ENVIADA
    [msg] = SMTPFalso.enviados
    assert msg["To"] == "f@f.com" and "entrega aprovada" in msg["Subject"]


def test_email_fora_do_ar_nao_desfaz_a_aprovacao(db, agendar, monkeypatch):
    def quebra(*a, **k):
        raise ConnectionRefusedError("SMTP fora do ar")
    monkeypatch.setattr("app.core.config.SMTP_HOST", "mailpit")
    monkeypatch.setattr("app.services.notificacao_service.smtplib.SMTP", quebra)
    ag = aprovar(db, agendar(email="f@f.com"))
    assert ag.status == S.APROVADO
    n = avisos(db, ag)[0]
    assert n.status == SN.FALHOU and "fora do ar" in n.erro


# ------------------------------------------------------------ API

def test_conferencia_e_notificacoes_pela_api(db, agendar):
    ag = agendar(email="f@f.com")
    from main import app
    c = TestClient(app)

    conf = c.get(f"/api/v1/agendamentos/{ag.id}/conferencia").json()
    assert conf["agendamento"]["status"] == "PENDENTE" and conf["nota"]["id"] == ag.nota_fiscal_id
    itens = {v["item"]: v for v in conf["verificacoes"]}
    assert itens["Emitente = fornecedor do agendamento"]["ok"]
    assert itens["Fornecedor com e-mail para aviso"]["detalhe"] == "f@f.com"

    r = c.post(f"/api/v1/agendamentos/{ag.id}/rejeitar",
               json={"motivo": "SEM_PEDIDO", "analisado_por": "ana"})
    assert r.status_code == 422                          # sem observação
    r = c.post(f"/api/v1/agendamentos/{ag.id}/rejeitar",
               json={"motivo": "SEM_PEDIDO", "analisado_por": "ana",
                     "observacao": "Pedido ainda não lançado no SAP."})
    assert r.json()["status"] == "REJEITADO"

    [n] = c.get(f"/api/v1/agendamentos/{ag.id}/notificacoes").json()
    assert n["tipo"] == "REPROVADO" and "não há pedido de compra" in n["corpo"]