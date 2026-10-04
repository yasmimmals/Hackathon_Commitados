import threading
from datetime import date, datetime

import pytest

from app.core.config import TZ
from app.core.database import SessionLocal
from app.core.exceptions import RegraNegocioError
from app.models import (
    Acondicionamento as A, Baia, Fornecedor, Horario as H, LocalFisico as L,
    MotivoNaoRecebimento as M, OrigemAgendamento as O, StatusAgendamento as S,
)
from app.schemas.agendamento import (
    AgendamentoCreate, AprovacaoIn, BalcaoCreate, DestinoIn, EquipamentoUsado,
    ReagendamentoChuvaIn, SaidaIn,
)
from app.services import agendamento_service as svc

QUA = date(2026, 10, 7)                       # quarta-feira
SEG_10H = datetime(2026, 10, 5, 10, 0, tzinfo=TZ)


def dt(d, h, m=0):
    return datetime(2026, 10, d, h, m, tzinfo=TZ)


@pytest.fixture
def agendar(db, nova_nota):
    def _agendar(acond, horario=H.H08, data=QUA, agora=SEG_10H, peso=12000,
                 adubo=False, ciente=False, sessao=None):
        nota = nova_nota(adubo=adubo, peso=peso)
        dados = AgendamentoCreate(nota_fiscal_id=nota.id, data=data, horario=horario,
                                  acondicionamento=acond, ciente_risco_chuva=ciente)
        return svc.criar_agendamento(sessao or db, dados, agora=agora)
    return _agendar


def aprovar(db, ag, agora=SEG_10H):
    return svc.aprovar(db, ag.id, AprovacaoIn(pedido_compra=123, analisado_por="compras"), agora)


@pytest.fixture
def destinar(db, baia):
    """destinar(ag, L.INSUMOS, L.LOJA) -> programa os armazéns com a baia padrão de cada um."""
    def _destinar(ag, *locais):
        return svc.definir_destinos(db, ag.id, [DestinoIn(local=lo, baia_id=baia(lo))
                                                for lo in locais])
    return _destinar


def codigo_do_erro(exc_info) -> str:
    return exc_info.value.codigo


# ------------------------------------------------------------ trava de vagas

def test_batido_ocupa_horario_sozinho(agendar):
    agendar(A.BATIDO)
    with pytest.raises(RegraNegocioError, match="carga batida") as e:
        agendar(A.PALETIZADO)
    assert codigo_do_erro(e) == "VAGA_OCUPADA"


def test_dois_unitizados_e_terceiro_recusado(agendar):
    agendar(A.PALETIZADO)
    agendar(A.BIG_BAG)
    with pytest.raises(RegraNegocioError, match="lotado") as e:
        agendar(A.PALETIZADO)
    assert e.value.extra["alternativas"][0] == {"data": "2026-10-07", "horario": "10:00",
                                                "prob_chuva": None}


def test_batido_nao_entra_em_horario_com_unitizado(agendar):
    agendar(A.PALETIZADO)
    with pytest.raises(RegraNegocioError, match="horário inteiro"):
        agendar(A.BATIDO)


def test_outro_horario_nao_e_afetado(agendar):
    agendar(A.BATIDO, H.H08)
    assert agendar(A.BATIDO, H.H10).status == S.PENDENTE


def test_cancelado_libera_vaga(db, agendar):
    ag = agendar(A.BATIDO)
    svc.cancelar(db, ag.id, agora=SEG_10H)
    assert agendar(A.BATIDO).status == S.PENDENTE


def test_destino_definido_continua_ocupando_vaga(db, agendar, destinar):
    ag = aprovar(db, agendar(A.BATIDO))
    destinar(ag, L.ADUBO)
    with pytest.raises(RegraNegocioError) as e:
        agendar(A.PALETIZADO)
    assert codigo_do_erro(e) == "VAGA_OCUPADA"


def test_disponibilidade(db, agendar):
    agendar(A.PALETIZADO, H.H08)
    agendar(A.BATIDO, H.H10)
    slots = {s["horario"]: s for s in svc.disponibilidade(db, QUA)}
    assert slots[H.H08]["vagas_restantes"] == 1 and not slots[H.H08]["aceita_batido"]
    assert slots[H.H10]["vagas_restantes"] == 0 and slots[H.H10]["tem_batido"]
    assert slots[H.H13]["aceita_batido"] and slots[H.H13]["vagas_restantes"] == 2
    assert slots[H.H13].get("situacao_chuva") is None    # consulta sem nota de adubo


def test_corrida_pela_ultima_vaga(agendar, nova_nota):
    """Quatro fornecedores clicam ao mesmo tempo na última vaga: só um leva."""
    agendar(A.PALETIZADO)
    notas = [nova_nota() for _ in range(4)]
    resultados, barreira = [], threading.Barrier(4)

    def tentar(nota_id):
        s = SessionLocal()
        barreira.wait()
        try:
            svc.criar_agendamento(s, AgendamentoCreate(
                nota_fiscal_id=nota_id, data=QUA, horario=H.H08,
                acondicionamento=A.PALETIZADO), agora=SEG_10H)
            resultados.append("ok")
        except RegraNegocioError:
            resultados.append("recusado")
        finally:
            s.close()

    ts = [threading.Thread(target=tentar, args=(n.id,)) for n in notas]
    [t.start() for t in ts]
    [t.join() for t in ts]
    assert sorted(resultados) == ["ok", "recusado", "recusado", "recusado"]


# ------------------------------------------------------------ validações

@pytest.mark.parametrize("data,codigo", [
    (date(2026, 10, 10), "DIA_NAO_UTIL"),      # sábado
    (date(2026, 10, 12), "DIA_NAO_UTIL"),      # feriado
    (date(2026, 10, 5), "HORARIO_PASSADO"),    # hoje 08:00, agora são 10:00
])
def test_datas_invalidas(agendar, data, codigo):
    with pytest.raises(RegraNegocioError) as e:
        agendar(A.PALETIZADO, data=data)
    assert codigo_do_erro(e) == codigo


def test_mesma_nota_nao_agenda_duas_vezes(db, nova_nota):
    nota = nova_nota()
    dados = AgendamentoCreate(nota_fiscal_id=nota.id, data=QUA, horario=H.H08,
                              acondicionamento=A.PALETIZADO)
    svc.criar_agendamento(db, dados, agora=SEG_10H)
    with pytest.raises(RegraNegocioError) as e:
        svc.criar_agendamento(db, dados.model_copy(update={"horario": H.H10}), agora=SEG_10H)
    assert codigo_do_erro(e) == "NOTA_JA_AGENDADA"


def test_cancelamento_respeita_24h(db, agendar):
    ag = agendar(A.PALETIZADO)                          # quarta 08:00
    with pytest.raises(RegraNegocioError, match="24h") as e:
        svc.cancelar(db, ag.id, agora=dt(6, 8, 1))      # terça 08:01 -> 23h59 antes
    assert codigo_do_erro(e) == "PRAZO_CANCELAMENTO"
    assert svc.cancelar(db, ag.id, agora=dt(6, 8, 0)).status == S.CANCELADO


def test_fornecedor_pode_repetir_cnpj(db):
    """O cadastro real tem o mesmo CNPJ com códigos diferentes."""
    db.add_all([Fornecedor(nome="A", cnpj="11111111111111", codigo="FD1"),
                Fornecedor(nome="A filial", cnpj="11111111111111", codigo="FD2")])
    db.commit()
    assert db.query(Fornecedor).filter_by(cnpj="11111111111111").count() == 2


# ------------------------------------------------------------ previsão de chuva

def test_adubo_bloqueado_com_80_ou_mais_e_sugere_alternativas(agendar, chuva):
    chuva[(QUA, H.H08)] = 80
    chuva[(QUA, H.H10)] = 95
    with pytest.raises(RegraNegocioError, match="80% de chuva") as e:
        agendar(A.BATIDO, adubo=True, ciente=True)
    assert codigo_do_erro(e) == "CHUVA_BLOQUEADA"
    alternativas = e.value.extra["alternativas"]
    assert alternativas[0] == {"data": "2026-10-07", "horario": "13:00", "prob_chuva": 0}
    assert all(a["horario"] not in ("08:00", "10:00") or a["data"] != "2026-10-07"
               for a in alternativas)


def test_adubo_com_risco_exige_ciencia(agendar, chuva):
    chuva[(QUA, H.H08)] = 30
    with pytest.raises(RegraNegocioError, match="aceitar o aviso") as e:
        agendar(A.BATIDO, adubo=True, ciente=False)
    assert codigo_do_erro(e) == "EXIGE_CIENCIA_CHUVA"
    assert e.value.extra == {"prob_chuva": 30, "exige_ciencia": True}

    ag = agendar(A.BATIDO, adubo=True, ciente=True)
    assert ag.prob_chuva == 30 and ag.carga_adubo and ag.ciente_risco_chuva
    assert "30% de chuva" in svc.aviso_chuva(ag) and "próximo dia útil" in svc.aviso_chuva(ag)


def test_adubo_sem_previsao_disponivel_tambem_exige_ciencia(agendar, chuva):
    chuva["padrao"] = None                                # API fora ou data além de 16 dias
    with pytest.raises(RegraNegocioError, match="Não há previsão"):
        agendar(A.BATIDO, adubo=True)
    assert "indisponível" in svc.aviso_chuva(agendar(A.BATIDO, adubo=True, ciente=True))


def test_adubo_sem_chuva_nao_exige_ciencia(agendar):
    ag = agendar(A.BATIDO, adubo=True, ciente=False)      # previsão 0%
    assert ag.prob_chuva == 0


def test_carga_que_nao_e_adubo_ignora_chuva(agendar, chuva):
    chuva["padrao"] = 99
    ag = agendar(A.PALETIZADO, adubo=False, ciente=False)
    assert ag.prob_chuva is None and svc.aviso_chuva(ag) is None


def test_disponibilidade_mostra_chuva_para_nota_de_adubo(db, nova_nota, chuva):
    chuva[(QUA, H.H08)] = 85
    chuva[(QUA, H.H10)] = 40
    slots = {s["horario"]: s for s in svc.disponibilidade(db, QUA, nova_nota(adubo=True).id)}
    assert slots[H.H08]["situacao_chuva"] == "BLOQUEADO" and slots[H.H08]["prob_chuva"] == 85
    assert slots[H.H10]["situacao_chuva"] == "RISCO"
    assert slots[H.H13]["situacao_chuva"] == "SEM_RISCO"


# ------------------------------------------------------------ destino e baia

def test_aprovacao_leva_a_aprovado_e_destino_programa_baia(db, agendar, destinar, baia):
    ag = aprovar(db, agendar(A.PALETIZADO))
    assert ag.status == S.APROVADO
    ag = destinar(ag, L.INSUMOS)
    assert ag.status == S.DESTINO_DEFINIDO
    assert ag.descargas[0].baia_id == baia(L.INSUMOS)
    assert ag.descargas[0].baia.codigo == "INSUMOS-01"


def test_caixa_de_entrada_do_armazem(db, agendar, destinar):
    pendente = agendar(A.PALETIZADO, H.H08)
    aprovado = aprovar(db, agendar(A.PALETIZADO, H.H10))
    ja_destinado = destinar(aprovar(db, agendar(A.PALETIZADO, H.H13)), L.LOJA)
    ids = [a.id for a in svc.aguardando_destino(db, QUA)]
    assert ids == [aprovado.id]
    assert pendente.id not in ids and ja_destinado.id not in ids


def test_chegada_sem_destino_e_recusada(db, agendar):
    ag = aprovar(db, agendar(A.PALETIZADO))
    with pytest.raises(RegraNegocioError) as e:
        svc.registrar_chegada(db, ag.id)
    assert codigo_do_erro(e) == "DESTINO_NAO_DEFINIDO"


def test_chegada_sem_aprovacao_e_recusada(db, agendar):
    ag = agendar(A.PALETIZADO)
    with pytest.raises(RegraNegocioError, match="PENDENTE") as e:
        svc.registrar_chegada(db, ag.id)
    assert codigo_do_erro(e) == "TRANSICAO_INVALIDA"


def test_destino_antes_do_compras_e_recusado(db, agendar, destinar):
    ag = agendar(A.PALETIZADO)
    with pytest.raises(RegraNegocioError) as e:
        destinar(ag, L.INSUMOS)
    assert codigo_do_erro(e) == "TRANSICAO_INVALIDA"


def test_baia_de_outro_armazem_e_recusada(db, agendar, baia):
    ag = aprovar(db, agendar(A.PALETIZADO))
    with pytest.raises(RegraNegocioError, match="é do armazém ADUBO") as e:
        svc.definir_destinos(db, ag.id, [DestinoIn(local=L.INSUMOS, baia_id=baia(L.ADUBO))])
    assert codigo_do_erro(e) == "BAIA_INVALIDA"


def test_baia_inativa_e_recusada(db, agendar, baia):
    ag = aprovar(db, agendar(A.PALETIZADO))
    b = db.get(Baia, baia(L.LOJA))
    b.ativa = False
    db.commit()
    with pytest.raises(RegraNegocioError) as e:
        svc.definir_destinos(db, ag.id, [DestinoIn(local=L.LOJA, baia_id=b.id)])
    assert codigo_do_erro(e) == "BAIA_INVALIDA"


def test_troca_de_baia_antes_de_descarregar(db, agendar, destinar):
    ag = destinar(aprovar(db, agendar(A.PALETIZADO)), L.INSUMOS)
    nova = Baia(local=L.INSUMOS, codigo="INSUMOS-02", nome="Insumos - Baia 2")
    db.add(nova)
    db.commit()
    ag = svc.definir_destinos(db, ag.id, [DestinoIn(local=L.INSUMOS, baia_id=nova.id)])
    assert ag.status == S.DESTINO_DEFINIDO and ag.descargas[0].baia.codigo == "INSUMOS-02"


def test_entrada_em_armazem_nao_programado_e_recusada(db, agendar, destinar):
    ag = destinar(aprovar(db, agendar(A.PALETIZADO)), L.INSUMOS)
    svc.registrar_chegada(db, ag.id, agora=dt(7, 7, 50))
    with pytest.raises(RegraNegocioError) as e:
        svc.iniciar_descarga(db, ag.id, L.LOJA)
    assert codigo_do_erro(e) == "LOCAL_NAO_PROGRAMADO"


# ------------------------------------------------------------ fluxo completo

def test_fluxo_completo_dois_armazens(db, agendar, destinar):
    ag = aprovar(db, agendar(A.PALETIZADO))
    assert ag.peso_kg == 12000 and ag.nf_chave
    ag = destinar(ag, L.INSUMOS, L.LOJA)
    assert [d.local for d in ag.descargas] == [L.INSUMOS, L.LOJA]
    assert svc.registrar_chegada(db, ag.id, agora=dt(7, 7, 50)).status == S.NA_FILA
    svc.iniciar_descarga(db, ag.id, L.INSUMOS, agora=dt(7, 8, 5))
    saida = SaidaIn(local=L.INSUMOS, qtd_chapas=2,
                    equipamentos=[EquipamentoUsado(codigo="EMPILHADEIRA_GAS", qtd=1)])
    ag = svc.finalizar_descarga(db, ag.id, saida, agora=dt(7, 8, 20))
    assert ag.status == S.EM_DESCARGA                    # ainda falta a Loja
    svc.iniciar_descarga(db, ag.id, L.LOJA, agora=dt(7, 8, 25))
    ag = svc.finalizar_descarga(db, ag.id, SaidaIn(local=L.LOJA, qtd_chapas=1), agora=dt(7, 8, 35))
    assert ag.status == S.CONCLUIDO
    assert ag.descargas[0].equipamentos == [{"codigo": "EMPILHADEIRA_GAS", "qtd": 1}]
    assert svc.chapas_norma(ag) == 2


def test_equipamento_fora_do_catalogo_e_recusado(db, agendar, destinar):
    ag = destinar(aprovar(db, agendar(A.PALETIZADO)), L.INSUMOS)
    svc.registrar_chegada(db, ag.id, agora=dt(7, 7, 50))
    svc.iniciar_descarga(db, ag.id, L.INSUMOS, agora=dt(7, 8, 0))
    with pytest.raises(RegraNegocioError) as e:
        svc.finalizar_descarga(db, ag.id, SaidaIn(
            local=L.INSUMOS, qtd_chapas=2, equipamentos=[EquipamentoUsado(codigo="GUINDASTE")]))
    assert codigo_do_erro(e) == "EQUIPAMENTO_INVALIDO"


def test_nao_finaliza_sem_iniciar(db, agendar, destinar):
    ag = destinar(aprovar(db, agendar(A.BATIDO)), L.ADUBO)
    svc.registrar_chegada(db, ag.id, agora=dt(7, 7, 50))
    with pytest.raises(RegraNegocioError) as e:
        svc.finalizar_descarga(db, ag.id, SaidaIn(local=L.ADUBO, qtd_chapas=5))
    assert codigo_do_erro(e) == "TRANSICAO_INVALIDA"


@pytest.mark.parametrize("acond,peso,esperado", [
    (A.BATIDO, 28000, 5), (A.PALETIZADO, 10000, 2), (A.BIG_BAG, 20000, 2), (A.BATIDO, 300, 0),
])
def test_chapas_norma(agendar, acond, peso, esperado):
    assert svc.chapas_norma(agendar(acond, peso=peso)) == esperado


# ------------------------------------------------------------ chuva no dia, balcão, no-show

def test_chuva_reagenda_com_prioridade_mantendo_aprovacao_e_baia(db, agendar, destinar, baia):
    sex = date(2026, 10, 9)
    ag = destinar(aprovar(db, agendar(A.BATIDO, data=sex, adubo=True)), L.ADUBO)
    # próximo dia útil é terça 13 (segunda 12 é feriado); lota o horário das 08h dela
    outro = destinar(aprovar(db, agendar(A.BATIDO, data=date(2026, 10, 13))), L.ADUBO)

    novo = svc.reagendar_por_chuva(db, ag.id, ReagendamentoChuvaIn())
    assert novo.data == date(2026, 10, 13) and novo.horario == H.H08
    assert novo.prioritario and novo.origem == O.CHUVA
    assert novo.status == S.DESTINO_DEFINIDO and novo.pedido_compra == 123   # não volta ao Compras
    assert novo.carga_adubo and novo.nota_fiscal_id == ag.nota_fiscal_id
    assert [(d.local, d.baia_id) for d in novo.descargas] == [(L.ADUBO, baia(L.ADUBO))]
    antigo = svc.buscar(db, ag.id)
    assert antigo.status == S.REAGENDADO and antigo.motivo_nao_recebimento == M.CHUVA

    fila = svc.fila_do_dia(db, date(2026, 10, 13))
    assert [a.id for a in fila] == [novo.id, outro.id]   # chuva fura a fila


def test_balcao_com_vaga_entra_na_fila_quando_destino_e_definido(db, nova_nota, destinar):
    agora = dt(7, 10, 30)
    ag = svc.agendar_balcao(db, BalcaoCreate(nota_fiscal_id=nova_nota().id, horario=H.H10,
                                             acondicionamento=A.PALETIZADO), agora=agora)
    assert ag.origem == O.BALCAO and ag.horario_chegada == agora and ag.status == S.PENDENTE
    assert aprovar(db, ag).status == S.APROVADO
    assert destinar(ag, L.LOJA).status == S.NA_FILA       # já está no pátio


def test_balcao_sem_vaga_registra_nao_recebimento(db, agendar, nova_nota):
    agendar(A.BATIDO, H.H10)
    with pytest.raises(RegraNegocioError, match="Não recebimento registrado") as e:
        svc.agendar_balcao(db, BalcaoCreate(nota_fiscal_id=nova_nota().id, horario=H.H10,
                                            acondicionamento=A.PALETIZADO), agora=dt(7, 10, 30))
    assert codigo_do_erro(e) == "SEM_VAGA_BALCAO" and e.value.extra["alternativas"]
    recusa = svc.listar(db, status=S.REJEITADO)[0]
    assert recusa.motivo_nao_recebimento == M.SEM_VAGA


def test_nao_compareceu_so_depois_da_janela(db, agendar, destinar):
    ag = destinar(aprovar(db, agendar(A.PALETIZADO)), L.INSUMOS)   # quarta 08:00-10:00
    with pytest.raises(RegraNegocioError, match="não terminou") as e:
        svc.marcar_nao_compareceu(db, ag.id, agora=dt(7, 9, 0))
    assert codigo_do_erro(e) == "JANELA_EM_ANDAMENTO"
    ag = svc.marcar_nao_compareceu(db, ag.id, agora=dt(7, 10, 1))
    assert ag.status == S.NAO_COMPARECEU

def test_aviso_de_atraso_fica_gravado_para_o_armazem(db, agendar, destinar):
    from app.schemas.agendamento import AgendamentoOut, AtrasoIn
    ag = destinar(aprovar(db, agendar(A.PALETIZADO)), L.INSUMOS)
    ag = svc.informar_atraso(db, ag.id, AtrasoIn(minutos=40, motivo="  trânsito na rodovia "), agora=dt(7, 7, 30))
    assert (ag.atraso_minutos, ag.atraso_motivo) == (40, "trânsito na rodovia")
    assert ag.atraso_informado_em == dt(7, 7, 30) and ag.status == S.DESTINO_DEFINIDO
    out = AgendamentoOut.model_validate(ag)
    assert out.atraso_minutos == 40 and out.atraso_informado_em is not None


def test_aviso_de_atraso_depois_da_chegada_e_recusado(db, agendar, destinar):
    from app.schemas.agendamento import AtrasoIn
    ag = destinar(aprovar(db, agendar(A.PALETIZADO)), L.INSUMOS)
    svc.registrar_chegada(db, ag.id)
    with pytest.raises(RegraNegocioError) as e:
        svc.informar_atraso(db, ag.id, AtrasoIn(minutos=30))
    assert codigo_do_erro(e) == "TRANSICAO_INVALIDA"


def test_aviso_de_atraso_valida_minutos():
    from pydantic import ValidationError
    from app.schemas.agendamento import AtrasoIn
    with pytest.raises(ValidationError):
        AtrasoIn(minutos=0)
