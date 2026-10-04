"""Dados de demonstração: coerentes, marcados como TESTE e apagáveis sem tocar no resto."""
from datetime import date
from decimal import Decimal as D

from app.models import (
    Agendamento, BoletimDiario, Fornecedor, Origem, StatusAgendamento as S, StatusBoletim,
)
from scripts import popular_demo as demo

HOJE = date(2026, 9, 21)                      # segunda; 2 semanas antes inclui o feriado de 07/09


def test_gera_boletim_geral_por_dia_util_e_sabado_sem_feriado(db):
    rel = demo.gerar(db, semanas=2, hoje=HOJE)
    datas = sorted(b.data for b in db.query(BoletimDiario).all())
    assert date(2026, 9, 7) not in datas                     # feriado nacional
    assert date(2026, 9, 12) in datas and date(2026, 9, 19) in datas   # sábados (organização)
    assert date(2026, 9, 13) not in datas                    # domingo
    assert rel["boletins"] == len(datas) == 11               # 9 dias úteis + 2 sábados
    for b in db.query(BoletimDiario).all():
        assert b.local is None and b.status == StatusBoletim.FECHADO and b.origem_dado == Origem.TESTE
        matriculas = [c.chapa.matricula for c in b.chapas_alocados]
        assert len(matriculas) == len(set(matriculas)) >= 4  # cada chapa uma vez por boletim


def test_descargas_tem_os_tres_marcos_e_respeitam_a_grade(db):
    demo.gerar(db, semanas=2, hoje=HOJE)
    concluidos = db.query(Agendamento).filter_by(status=S.CONCLUIDO).all()
    assert concluidos and all(a.origem_dado == Origem.TESTE for a in concluidos)
    for a in concluidos:
        [d] = a.descargas
        assert a.horario_chegada <= d.horario_entrada < d.horario_saida
        assert d.baia_id and d.qtd_chapas >= 1
    # grade: até 2 por horário e carga batida sozinha
    por_slot = {}
    for a in db.query(Agendamento).filter(Agendamento.status.in_([S.CONCLUIDO, S.NAO_COMPARECEU, S.CANCELADO])):
        por_slot.setdefault((a.data, a.horario), []).append(a.acondicionamento.value)
    for itens in por_slot.values():
        assert len(itens) <= 2 and ("BATIDO" not in itens or len(itens) == 1)


def test_mesmo_chapa_em_barracoes_diferentes_no_mesmo_dia(db):
    """A equipe do dia é uma só: no boletim cada um aparece uma vez; nas descargas,
    as quantidades de vários armazéns somadas passam do tamanho da equipe."""
    demo.gerar(db, semanas=2, hoje=HOJE)
    dias = 0
    for b in db.query(BoletimDiario).filter(BoletimDiario.data < HOJE).all():
        descargas = [d for a in db.query(Agendamento).filter_by(data=b.data, status=S.CONCLUIDO) for d in a.descargas]
        if len({d.local for d in descargas}) > 1 and sum(d.qtd_chapas for d in descargas) > len(b.chapas_alocados):
            dias += 1
    assert dias > 0


def test_limpar_apaga_so_a_demonstracao(db, fornecedor):
    real = BoletimDiario(data=date(2026, 9, 1), status=StatusBoletim.FECHADO, total_pagar=D("100"),
                         producao_total=D("100"), complemento=D("0"), diarias_equivalentes=D("1"))
    db.add(real)
    db.commit()
    demo.gerar(db, semanas=1, hoje=HOJE)
    assert db.query(BoletimDiario).count() > 1
    rel = demo.limpar(db)
    assert rel["boletins_apagados"] > 0 and rel["agendamentos_apagados"] > 0
    assert db.query(BoletimDiario).count() == 1                    # o real continua
    assert db.query(Agendamento).count() == 0
    assert db.get(Fornecedor, fornecedor.id) is not None           # fornecedor real continua
    assert db.query(Fornecedor).filter_by(origem_dado=Origem.TESTE).count() == 0


def test_nao_sobrescreve_boletim_real_dentro_do_periodo(db):
    real = BoletimDiario(data=date(2026, 9, 19), status=StatusBoletim.RASCUNHO, total_pagar=D("0"),
                         producao_total=D("0"), complemento=D("0"), diarias_equivalentes=D("0"))
    db.add(real)
    db.commit()
    rel = demo.gerar(db, semanas=1, hoje=HOJE)
    assert rel["dias_com_boletim_real"] == 1
    do_dia = db.query(BoletimDiario).filter_by(data=date(2026, 9, 19)).all()
    assert [b.id for b in do_dia] == [real.id] and do_dia[0].origem_dado == Origem.SISTEMA


def test_rodar_de_novo_nao_duplica(db):
    a = demo.gerar(db, semanas=1, hoje=HOJE)
    b = demo.gerar(db, semanas=1, hoje=HOJE)
    assert a == b and db.query(BoletimDiario).count() == a["boletins"]
