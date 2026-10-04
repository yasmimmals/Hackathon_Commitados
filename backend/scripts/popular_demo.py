"""Dados de DEMONSTRAÇÃO: 4 semanas de operação simulada no sistema.

Uso (dentro do container):
    docker compose exec backend python -m scripts.popular_demo            # gera (refaz se já existir)
    docker compose exec backend python -m scripts.popular_demo --semanas 6
    docker compose exec backend python -m scripts.popular_demo --limpar   # apaga só a demonstração

Tudo o que este script cria tem origem_dado = TESTE e pode ser apagado sem tocar no resto
(dados históricos da Cocapec e o que for registrado ao vivo ficam intactos).

Como a simulação é montada (coerente com os dados reais e as regras do sistema):
- Demanda do dia = modelo de previsão do painel para aquele mês (nível x sazonalidade), com variação.
- Grade: 4 horários, até 2 caminhões por horário, carga batida ocupa o horário sozinha.
  Quem não cabe na grade e aparece no balcão vira não recebimento por falta de vaga.
- Tempos de descarga na faixa do dossiê (seção 9); chapas pela norma (seção 7).
- UM boletim geral por dia. A equipe do dia trabalha em todos os barracões: o mesmo chapa
  aparece em descargas de armazéns diferentes, mas só uma vez no boletim.
- Sábados: equipe menor fazendo organização interna (é onde costuma aparecer complemento).
"""
import argparse
import random
from datetime import date, datetime, timedelta
from decimal import Decimal
from types import SimpleNamespace

from sqlalchemy import delete, func, select

from app.core import config
from app.core.database import SessionLocal
from app.models import (
    Acondicionamento as A, Agendamento, Baia, BoletimDiario, Chapa, Descarga, Fornecedor, Horario as H,
    LocalFisico as L, MotivoNaoRecebimento as M, Notificacao, Origem, OrigemAgendamento as O,
    RecebimentoHistorico, StatusAgendamento as S, TipoItem,
)
from app.services import boletim_service
from app.services.agendamento_service import eh_dia_util
from app.services.previsao_service import _prever, serie_mensal

SEMENTE = 2026
HORARIOS = [H.H08, H.H10, H.H13, H.H15]
INICIO_HORARIO = {H.H08: (8, 0), H.H10: (10, 0), H.H13: (13, 0), H.H15: (15, 0)}

# Proporção de caminhões por armazém (notas >= 500 kg no histórico) e acondicionamento típico
PESO_LOCAL = {L.ADUBO: 0.45, L.INSUMOS: 0.32, L.LOJA: 0.12, L.MAQUINAS: 0.11}
ACOND = {
    L.ADUBO: [(A.BIG_BAG, 0.5), (A.BATIDO, 0.3), (A.PALETIZADO, 0.2)],
    L.INSUMOS: [(A.PALETIZADO, 0.7), (A.BATIDO, 0.2), (A.BIG_BAG, 0.1)],
    L.LOJA: [(A.PALETIZADO, 1.0)],
    L.MAQUINAS: [(A.PALETIZADO, 1.0)],
}
TIPO_ITEM = {L.ADUBO: "Fertilizantes", L.INSUMOS: "Agroquímico", L.MAQUINAS: "Máquinas / equipamentos"}
TIPOS_LOJA = ["Peças", "Medicamentos", "Alimentação animal", "Acessórios agropecuários"]
CHAPAS_PADRAO = ["158", "137", "35", "155", "69", "13", "75", "74", "79", "15", "161", "1", "637", "654", "595"]


def _escolher(r: random.Random, opcoes):
    x, acc = r.random(), 0.0
    for valor, peso in opcoes:
        acc += peso
        if x <= acc:
            return valor
    return opcoes[-1][0]


def _hora(d: date, h: int, m: int) -> datetime:
    return datetime(d.year, d.month, d.day, h, m, tzinfo=config.TZ) 


# ------------------------------------------------------------------ limpeza

def limpar(db) -> dict:
    ags = list(db.scalars(select(Agendamento.id).where(Agendamento.origem_dado == Origem.TESTE)))
    if ags:
        db.execute(delete(Notificacao).where(Notificacao.agendamento_id.in_(ags)))
        db.execute(delete(Descarga).where(Descarga.agendamento_id.in_(ags)))
        db.execute(Agendamento.__table__.update().where(Agendamento.reagendado_de_id.in_(ags)).values(reagendado_de_id=None))
        db.execute(delete(Agendamento).where(Agendamento.id.in_(ags)))
    bols = list(db.scalars(select(BoletimDiario).where(BoletimDiario.origem_dado == Origem.TESTE)))
    for b in bols:
        db.delete(b)                                  # produção e equipe vão junto (cascade)
    db.flush()
    sem_uso = select(Fornecedor.id).where(
        Fornecedor.origem_dado == Origem.TESTE,
        ~Fornecedor.id.in_(select(Agendamento.fornecedor_id)),
        ~Fornecedor.id.in_(select(RecebimentoHistorico.fornecedor_id).where(RecebimentoHistorico.fornecedor_id.is_not(None))),
    )
    forn = db.execute(delete(Fornecedor).where(Fornecedor.id.in_(sem_uso))).rowcount
    db.commit()
    return {"agendamentos_apagados": len(ags), "boletins_apagados": len(bols), "fornecedores_apagados": forn}


# ------------------------------------------------------------------ preparação

def _fornecedores(db, r: random.Random) -> dict:
    """Usa os fornecedores reais de maior volume de cada armazém; sem histórico, cria fictícios."""
    por_local = {}
    for local in L:
        ids = list(db.scalars(
            select(RecebimentoHistorico.fornecedor_id)
            .where(RecebimentoHistorico.local_principal == local, RecebimentoHistorico.exige_chapa,
                   RecebimentoHistorico.fornecedor_id.is_not(None))
            .group_by(RecebimentoHistorico.fornecedor_id)
            .order_by(func.count().desc()).limit(12)))
        por_local[local] = ids
    if all(por_local.values()):
        return por_local
    criados = []
    for i in range(8):
        f = Fornecedor(nome=f"Fornecedor Demonstração {i + 1}", cnpj=f"{10000000000100 + i:014d}",
                       origem_dado=Origem.TESTE, email=f"demo{i + 1}@fornecedor.exemplo")
        db.add(f)
        criados.append(f)
    db.flush()
    ids = [f.id for f in criados]
    return {local: por_local[local] or ids for local in L}


def _chapas(db) -> list[str]:
    ativos = list(db.scalars(select(Chapa.matricula).where(Chapa.ativo.is_(True)).order_by(Chapa.id)))
    if len(ativos) >= 8:
        return ativos
    for m in CHAPAS_PADRAO:
        if m not in ativos:
            db.add(Chapa(matricula=m, nome=f"CHAPA_M{m}"))
    db.flush()
    return list(db.scalars(select(Chapa.matricula).where(Chapa.ativo.is_(True)).order_by(Chapa.id)))


# ------------------------------------------------------------------ geração

def _caminhao(r, local):
    acond = _escolher(r, ACOND[local])
    if local == L.MAQUINAS:
        peso = r.randint(1500, 6000)
    elif acond == A.BATIDO:
        peso = r.randint(10, 28) * 1000
    elif acond == A.BIG_BAG:
        peso = r.randint(20, 30) * 1000
    else:
        peso = r.randint(6, 14) * 1000
    return acond, peso


def _duracao(r, local, acond, peso) -> int:
    """Minutos de descarga, faixa da seção 9 do dossiê."""
    if local == L.MAQUINAS:
        return r.randint(15, 30)
    if acond == A.BATIDO:
        return (40 if peso <= 10000 else 50) + r.randint(-5, 15)
    if acond == A.BIG_BAG:
        return int(peso / 1000 * 3.5) + r.randint(-10, 15)      # ~20 big bags em ~75-100 min
    return int(peso / 1000 * 4.5) + r.randint(-5, 15)           # ~10 paletes em ~50 min


def _chapas_norma(local, acond, peso) -> int:
    if peso < 500:
        return 0
    if local == L.MAQUINAS:
        return 1
    return 5 if acond == A.BATIDO else 2


def _equipamentos(r, local, acond):
    if local == L.MAQUINAS:
        return [{"codigo": "TRATOR", "qtd": 1}]
    if acond == A.BATIDO:
        return [{"codigo": "CARRINHO_MAO", "qtd": 1}] if r.random() < 0.4 else []
    if local == L.LOJA:
        return [{"codigo": r.choice(["PALETEIRA_MANUAL", "PALETEIRA_ELETRICA"]), "qtd": 1}]
    if local == L.INSUMOS and acond == A.PALETIZADO:
        return [{"codigo": r.choice(["EMPILHADEIRA_GAS", "EMPILHADEIRA_ELETRICA", "TRANSPALETEIRA_ELETRICA"]), "qtd": 1}]
    return [{"codigo": "EMPILHADEIRA_GAS", "qtd": 1}]


def _itens_producao(r, local, acond, peso) -> tuple[str, int]:
    """Quantos itens o caminhão gera no boletim (os preços são por item)."""
    if local == L.MAQUINAS:
        return "Máquinas / equipamentos", r.randint(1, 4)
    tipo = r.choice(TIPOS_LOJA) if local == L.LOJA else TIPO_ITEM[local]
    if acond == A.BIG_BAG:
        return "Sacaria fardo c/ 500", peso // 500            # big bag de 1 t = 2 unidades de 500 kg
    if acond == A.BATIDO:
        return tipo, peso // 50                                # sacas de 50 kg
    return tipo, int(peso / 1000 * r.randint(28, 40))         # volumes paletizados


def gerar(db, semanas: int = 4, hoje: date | None = None, semente: int = SEMENTE) -> dict:
    r = random.Random(semente)
    hoje = hoje or datetime.now(config.TZ).date()
    limpar(db)
    fornecedores = _fornecedores(db, r)
    matriculas = _chapas(db)
    baias = {b.local: b.id for b in db.scalars(select(Baia).where(Baia.ativa.is_(True)))}
    tipos = {t.descricao: t.id for t in db.scalars(select(TipoItem))}
    serie = serie_mensal(db)
    cache_previsao = {}
    nucleo = matriculas[:9]                                    # equipe fixa que vem quase todo dia
    rel = {"dias": 0, "boletins": 0, "agendamentos": 0, "concluidos": 0, "nao_recebimentos": 0, "futuros": 0}
    nf = 900000

    def demanda(d: date) -> float:
        m = d.replace(day=1)
        if m not in cache_previsao:
            cache_previsao[m] = _prever(serie, m) or 7.0
        return cache_previsao[m]

    inicio = hoje - timedelta(weeks=semanas)
    d = inicio
    while d < hoje:
        sabado = d.weekday() == 5
        if not (eh_dia_util(d) or sabado):
            d += timedelta(days=1)
            continue
        rel["dias"] += 1
        producao: dict[str, list[int]] = {}

        def somar(tipo, descarga=0, remocao=0):
            p = producao.setdefault(tipo, [0, 0])
            p[0] += descarga
            p[1] += remocao

        if not sabado:
            procura = max(2, round(demanda(d) * r.uniform(0.75, 1.2)))
            ocupacao = {h: [] for h in HORARIOS}
            sem_vaga = 0
            for _ in range(procura):
                local = _escolher(r, list(PESO_LOCAL.items()))
                acond, peso = _caminhao(r, local)
                livre = [h for h in HORARIOS if not any(a == A.BATIDO for a in ocupacao[h])
                         and (len(ocupacao[h]) < 2 if acond != A.BATIDO else not ocupacao[h])]
                nf += 1
                base = dict(fornecedor_id=r.choice(fornecedores[local]), origem_dado=Origem.TESTE, data=d,
                            acondicionamento=acond, peso_kg=Decimal(peso), carga_adubo=(local == L.ADUBO),
                            nf_numero=f"DEMO-{nf}", ciente_risco_chuva=True, origem=O.NORMAL)
                if not livre:
                    if r.random() < 0.12:                     # alguns dos que não cabem aparecem no balcão
                        sem_vaga += 1
                        db.add(Agendamento(**{**base, "origem": O.BALCAO}, horario=r.choice(HORARIOS), status=S.REJEITADO,
                                           motivo_nao_recebimento=M.SEM_VAGA, observacao_compras="Horário lotado",
                                           horario_chegada=_hora(d, 9, r.randint(0, 59))))
                    continue
                h = r.choice(livre)
                ocupacao[h].append(acond)
                base.update(horario=h, pedido_compra=r.randint(26000, 27999), analisado_por="compras.demo",
                            analisado_em=_hora(d - timedelta(days=r.randint(1, 4)), 10, 0))
                sorteio = r.random()
                rel["agendamentos"] += 1
                if sorteio < 0.05:
                    db.add(Agendamento(**{**base, "pedido_compra": None}, status=S.REJEITADO,
                                       motivo_nao_recebimento=r.choice([M.DIVERGENCIA_NF_PEDIDO, M.SEM_PEDIDO]),
                                       observacao_compras="Quantidade da NF diferente do pedido."))
                    rel["nao_recebimentos"] += 1
                    continue
                if sorteio < 0.08:
                    db.add(Agendamento(**base, status=S.CANCELADO, motivo_nao_recebimento=M.CANCELADO_FORNECEDOR,
                                       cancelado_em=_hora(d - timedelta(days=2), 15, 0)))
                    rel["nao_recebimentos"] += 1
                    continue
                if sorteio < 0.11:
                    db.add(Agendamento(**base, status=S.NAO_COMPARECEU, motivo_nao_recebimento=M.NAO_COMPARECEU,
                                       descargas=[Descarga(local=local, baia_id=baias.get(local))]))
                    rel["nao_recebimentos"] += 1
                    continue
                hh, mm = INICIO_HORARIO[h]
                chegada = _hora(d, hh, mm) + timedelta(minutes=r.randint(-20, 30))
                entrada = chegada + timedelta(minutes=r.randint(5, 20) + 10 * (len(ocupacao[h]) - 1))
                saida = entrada + timedelta(minutes=max(10, _duracao(r, local, acond, peso)))
                chapas = _chapas_norma(local, acond, peso)
                if chapas and r.random() < 0.2:
                    chapas += r.choice([-1, 1])
                db.add(Agendamento(**base, status=S.CONCLUIDO, horario_chegada=chegada, descargas=[Descarga(
                    local=local, baia_id=baias.get(local), horario_entrada=entrada, horario_saida=saida,
                    qtd_chapas=max(chapas, 1), equipamentos=_equipamentos(r, local, acond))]))
                rel["concluidos"] += 1
                tipo, qtd = _itens_producao(r, local, acond, peso)
                somar(tipo, descarga=qtd)
            rel["nao_recebimentos"] += sem_vaga
            # carregamento de cooperados, remoções e transferências internas (o boletim registra tudo)
            alta = d.month in (9, 10, 11, 12, 1, 2, 3)
            somar("Serviços diversos", remocao=r.randint(400, 1200) if alta else r.randint(150, 600))
            equipe = r.sample(nucleo, k=min(len(nucleo), r.randint(7, 9)))
            extras = [m for m in matriculas if m not in equipe]
            if extras and r.random() < 0.4:
                equipe += r.sample(extras, k=min(len(extras), r.randint(1, 2)))
        else:
            somar("Serviços diversos", remocao=r.randint(200, 700))       # organização interna
            equipe = r.sample(nucleo, k=min(len(nucleo), r.randint(4, 6)))

        meia = r.choice(equipe) if r.random() < 0.15 else None
        if db.scalar(select(BoletimDiario.id).where(BoletimDiario.data == d)):
            rel["dias_com_boletim_real"] = rel.get("dias_com_boletim_real", 0) + 1
            d += timedelta(days=1)
            continue
        b = boletim_service.abrir(db, SimpleNamespace(data=d, local=None, observacao="Demonstração"))
        boletim_service.lancar_producao(db, b.id, [
            SimpleNamespace(tipo_item_id=tipos[t], descarga=v[0], remocao=v[1], transferencia=0)
            for t, v in producao.items() if t in tipos])
        boletim_service.definir_equipe(db, b.id, [SimpleNamespace(matricula=m, meia_diaria=(m == meia)) for m in equipe])
        boletim_service.fechar(db, b.id, "armazem.demo")
        b = db.get(BoletimDiario, b.id)
        b.origem_dado = Origem.TESTE
        db.commit()
        rel["boletins"] += 1
        d += timedelta(days=1)

    # agendamentos já marcados para as próximas 2 semanas (aparecem na previsão como "já agendados")
    d = hoje + timedelta(days=1)
    while d <= hoje + timedelta(days=14):
        if eh_dia_util(d):
            for h in r.sample(HORARIOS, k=r.randint(2, 4)):
                local = _escolher(r, list(PESO_LOCAL.items()))
                acond, peso = _caminhao(r, local)
                acond = A.PALETIZADO if acond == A.BATIDO else acond
                nf += 1
                status = r.choice([S.PENDENTE, S.APROVADO, S.DESTINO_DEFINIDO, S.DESTINO_DEFINIDO])
                db.add(Agendamento(
                    fornecedor_id=r.choice(fornecedores[local]), origem_dado=Origem.TESTE, data=d, horario=h,
                    acondicionamento=acond, peso_kg=Decimal(peso), carga_adubo=(local == L.ADUBO),
                    nf_numero=f"DEMO-{nf}", ciente_risco_chuva=True, origem=O.NORMAL, status=status,
                    pedido_compra=None if status == S.PENDENTE else r.randint(26000, 27999),
                    descargas=[Descarga(local=local, baia_id=baias.get(local))] if status == S.DESTINO_DEFINIDO else []))
                rel["futuros"] += 1
        d += timedelta(days=1)
    db.commit()
    rel["periodo"] = f"{inicio:%d/%m/%Y} a {hoje - timedelta(days=1):%d/%m/%Y}"
    return rel


if __name__ == "__main__":
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--semanas", type=int, default=4)
    p.add_argument("--limpar", action="store_true", help="apaga só os dados de demonstração")
    args = p.parse_args()
    db = SessionLocal()
    try:
        if args.limpar:
            print("Demonstração apagada:", limpar(db))
        else:
            rel = gerar(db, args.semanas)
            print("Demonstração gerada:")
            for k, v in rel.items():
                print(f"  {k:20s} {v}")
    finally:
        db.close()
