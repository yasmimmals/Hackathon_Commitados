"""Previsibilidade da mão de obra (Tarefa 3, parte "para a frente").

Modelo de demanda (testado contra o que de fato aconteceu, ver `precisao`):
    caminhões por dia útil no mês = NÍVEL x ÍNDICE SAZONAL do mês
      NÍVEL  = média dos últimos 12 meses, já sem o efeito da estação (captura o crescimento)
      ÍNDICE = quanto aquele mês costuma ficar acima/abaixo da média do ano (2022-2026)
Para os próximos dias, os agendamentos já confirmados entram por cima do modelo.

Necessidade de chapas = caminhões x 185 chapa-min (meio da faixa da seção 9) / 432 min úteis,
mais a reserva para outras atividades (carregamento de cooperados), com mínimo de 5.
Custo = chapas x dias úteis x diária ATUAL da folha (o valor sobe: usar a média geral subestima).
"""
import math
from collections import defaultdict
from datetime import date, timedelta
from statistics import mean, median
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core import config
from app.models import Agendamento, FolhaDiaria, RecebimentoHistorico as RH, StatusAgendamento as St
from app.services.agendamento_service import eh_dia_util

CAPACIDADE = config.JORNADA_MINUTOS * config.PRODUTIVIDADE_EQUIPE      # 432 min por chapa/dia
MESES_PT = ["", "jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]
MIN_DIAS_NO_MES = 10                 # mês com menos dias registrados não entra no modelo
STATUS_PREVISTOS = {St.PENDENTE, St.APROVADO, St.DESTINO_DEFINIDO, St.NA_FILA, St.EM_DESCARGA}


def _hoje() -> date:
    from datetime import datetime
    return datetime.now(config.TZ).date()


def _r1(x):
    return None if x is None else round(float(x), 1)


def _mes(d: date) -> date:
    return d.replace(day=1)


def _somar_meses(m: date, n: int) -> date:
    a, mm = divmod(m.month - 1 + n, 12)
    return date(m.year + a, mm + 1, 1)


def dias_uteis(inicio: date, fim: date) -> list[date]:
    out, d = [], inicio
    while d <= fim:
        if eh_dia_util(d):
            out.append(d)
        d += timedelta(days=1)
    return out


def dias_uteis_do_mes(m: date) -> int:
    return len(dias_uteis(m, _somar_meses(m, 1) - timedelta(days=1)))


# ------------------------------------------------------------------ série histórica

def serie_mensal(db: Session) -> dict[date, float]:
    """Caminhões que exigem chapa por dia útil, mês a mês (só meses com dados suficientes)."""
    por_dia = db.execute(select(RH.data, func.count(RH.id)).where(RH.exige_chapa)
                         .group_by(RH.data)).all()
    meses = defaultdict(list)
    for d, n in por_dia:
        if d.weekday() < 5:
            meses[_mes(d)].append(n)
    return {m: mean(v) for m, v in sorted(meses.items()) if len(v) >= MIN_DIAS_NO_MES}


def _indices(serie: dict[date, float]) -> dict[int, float]:
    """Índice sazonal por mês do calendário: média do mês / média do ano (anos com 10+ meses)."""
    anos = defaultdict(dict)
    for m, v in serie.items():
        anos[m.year][m.month] = v
    razoes = defaultdict(list)
    for ano, meses in anos.items():
        if len(meses) >= 10:
            media_ano = mean(meses.values())
            for mm, v in meses.items():
                razoes[mm].append(v / media_ano)
    return {mm: mean(v) for mm, v in razoes.items()}


def _nivel(serie: dict[date, float], indices: dict[int, float]) -> Optional[float]:
    """Média dessazonalizada dos últimos 12 meses com dados."""
    ultimos = list(serie.items())[-12:]
    valores = [v / indices[m.month] for m, v in ultimos if m.month in indices]
    return mean(valores) if valores else None


def _prever(serie: dict[date, float], mes: date) -> Optional[float]:
    passado = {m: v for m, v in serie.items() if m < mes}
    indices = _indices(passado)
    nivel = _nivel(passado, indices)
    if nivel is None or mes.month not in indices:
        return None
    return nivel * indices[mes.month]


def precisao(serie: dict[date, float], meses_teste: int = 18) -> dict:
    """Teste honesto: para cada mês recente, prevê só com o que se sabia antes dele."""
    detalhe = []
    for mes, real in list(serie.items())[-meses_teste:]:
        prev = _prever(serie, mes)
        if prev is not None and real:
            detalhe.append({"mes": mes.strftime("%Y-%m"), "previsto": _r1(prev), "real": _r1(real),
                            "erro_percentual": _r1(100 * abs(prev - real) / real)})
    erros = [d["erro_percentual"] for d in detalhe]
    return {"erro_medio_percentual": _r1(mean(erros)) if erros else None,
            "meses_testados": len(detalhe), "detalhe": detalhe,
            "como_ler": "Para cada mês, o modelo foi rodado só com dados anteriores a ele e "
                        "comparado com o que aconteceu. É a margem de erro esperada."}


# ------------------------------------------------------------------ equipe e custo atuais

def equipe_e_diaria_atual(db: Session) -> dict:
    """Equipe média e valor da diária nos últimos dias registrados na folha."""
    ultima = db.scalar(select(func.max(FolhaDiaria.data)))
    if not ultima:
        return {"equipe_atual": None, "diaria_atual": None, "referencia": None}
    desde = ultima - timedelta(days=config.DIAS_PARA_DIARIA_ATUAL)
    dias = [f for f in db.scalars(select(FolhaDiaria).where(FolhaDiaria.data > desde))
            if f.data.weekday() < 5 and not f.suspeito and f.chapas_presentes]
    if not dias:
        return {"equipe_atual": None, "diaria_atual": None, "referencia": None}
    return {
        "equipe_atual": _r1(mean(f.chapas_presentes for f in dias)),
        "diaria_atual": round(median(float(f.valor_pago) / f.chapas_presentes for f in dias), 2),
        "referencia": f"folha de {min(f.data for f in dias):%d/%m/%Y} a {ultima:%d/%m/%Y}",
    }


def chapas_necessarios(caminhoes_dia: float, reserva: int) -> dict:
    recebimento = caminhoes_dia * config.CHAPA_MINUTOS_POR_CAMINHAO_PLANEJAMENTO / CAPACIDADE
    leve = caminhoes_dia * config.CHAPA_MINUTOS_POR_CAMINHAO_LEVE / CAPACIDADE
    pesado = caminhoes_dia * config.CHAPA_MINUTOS_POR_CAMINHAO_PESADO / CAPACIDADE
    return {
        "recomendado": max(math.ceil(recebimento) + reserva, config.EQUIPE_MINIMA),
        "so_recebimento_leve": _r1(leve), "so_recebimento_pesado": _r1(pesado),
    }


def _acao(recomendado: int, atual: Optional[float]) -> str:
    if atual is None:
        return "SEM_REFERENCIA"
    if recomendado > atual + 0.5:
        return f"REFORCAR +{math.ceil(recomendado - atual)}"
    if recomendado < atual - 1:
        return f"REDUZIR {math.floor(atual - recomendado)}"
    return "MANTER"


def _agendados_por_dia(db: Session, inicio: date, fim: date) -> dict[date, int]:
    rows = db.execute(select(Agendamento.data, func.count(Agendamento.id))
                      .where(Agendamento.data.between(inicio, fim),
                             Agendamento.status.in_(STATUS_PREVISTOS),
                             (Agendamento.peso_kg.is_(None)) | (Agendamento.peso_kg >= 500))
                      .group_by(Agendamento.data)).all()
    return dict(rows)


# ------------------------------------------------------------------ 1. previsão semanal

def previsao_semanal(db: Session, semanas: int = 12, reserva: Optional[int] = None,
                     hoje: Optional[date] = None) -> dict:
    hoje = hoje or _hoje()
    reserva = config.RESERVA_OUTRAS_ATIVIDADES if reserva is None else reserva
    serie = serie_mensal(db)
    prec = precisao(serie)
    erro = (prec["erro_medio_percentual"] or 0) / 100
    base = equipe_e_diaria_atual(db)
    inicio = hoje + timedelta(days=(7 - hoje.weekday()) % 7 or 7)        # próxima segunda
    agendados = _agendados_por_dia(db, inicio, inicio + timedelta(weeks=semanas))
    cache = {}

    linhas = []
    for s in range(semanas):
        seg = inicio + timedelta(weeks=s)
        dias = dias_uteis(seg, seg + timedelta(days=4))
        if not dias:
            continue
        previstos, ag_semana = [], 0
        for d in dias:
            m = _mes(d)
            if m not in cache:
                cache[m] = _prever(serie, m)
            modelo = cache[m] or 0
            ag = agendados.get(d, 0)
            ag_semana += ag
            previstos.append(max(modelo, ag))          # o já agendado é piso garantido
        cam = mean(previstos)
        nec = chapas_necessarios(cam, reserva)
        dia = base["diaria_atual"] or 0
        custo_plano = nec["recomendado"] * len(dias) * dia
        custo_atual = (base["equipe_atual"] or 0) * len(dias) * dia
        linhas.append({
            "semana": seg.isoformat(), "dias_uteis": len(dias),
            "caminhoes_dia_previsto": _r1(cam),
            "caminhoes_dia_faixa": [_r1(cam * (1 - erro)), _r1(cam * (1 + erro))],
            "caminhoes_ja_agendados": ag_semana,
            "chapas_recomendados": nec["recomendado"],
            "chapas_recomendados_faixa": [
                chapas_necessarios(cam * (1 - erro), reserva)["recomendado"],
                chapas_necessarios(cam * (1 + erro), reserva)["recomendado"]],
            "equipe_atual": base["equipe_atual"],
            "acao": _acao(nec["recomendado"], base["equipe_atual"]),
            "custo_previsto": round(custo_plano, 2),
            "custo_com_equipe_atual": round(custo_atual, 2),
        })
    return {
        "gerado_em": hoje.isoformat(), "semanas": linhas, "precisao": prec, **base,
        "reserva_outras_atividades": reserva,
        "premissas": [
            "Caminhões previstos = nível dos últimos 12 meses x padrão sazonal do mês; "
            "os agendamentos já confirmados entram como mínimo garantido.",
            f"Faixa = ± erro médio medido no histórico ({prec['erro_medio_percentual']}%).",
            f"Chapas recomendados = caminhões x {config.CHAPA_MINUTOS_POR_CAMINHAO_PLANEJAMENTO} "
            f"chapa-min ÷ {int(CAPACIDADE)} min + {reserva} de reserva para carregamento de "
            f"cooperados e organização; mínimo de {config.EQUIPE_MINIMA} (carga batida).",
            f"Custo = chapas x dias úteis x diária atual da folha (R$ {base['diaria_atual']}). "
            "Sem encargos.",
        ],
    }


# ------------------------------------------------------------------ 2. custo mensal

def custo_mensal(db: Session) -> dict:
    folha = list(db.scalars(select(FolhaDiaria).order_by(FolhaDiaria.data)))
    cam = dict(db.execute(select(RH.data, func.count(RH.id)).where(RH.exige_chapa)
                          .group_by(RH.data)).all())
    meses = defaultdict(list)
    for f in folha:
        if not f.suspeito:
            meses[_mes(f.data)].append(f)

    linhas = []
    for m, dias in sorted(meses.items()):
        pago = sum(float(f.valor_pago) for f in dias)
        chapas_dia = sum(f.chapas_presentes for f in dias)
        caminhoes = sum(cam.get(f.data, 0) for f in dias)
        uteis = [f for f in dias if f.data.weekday() < 5]
        presentes = mean(f.chapas_presentes for f in uteis) if uteis else None
        cam_dia = mean(cam.get(f.data, 0) for f in uteis) if uteis else 0
        necessarios = (cam_dia * config.CHAPA_MINUTOS_POR_CAMINHAO_PLANEJAMENTO / CAPACIDADE
                       + config.RESERVA_OUTRAS_ATIVIDADES)
        linhas.append({
            "mes": m.strftime("%Y-%m"), "dias_com_folha": len(dias),
            "parcial": len(dias) < 15,
            "valor_pago": round(pago, 2), "diarias_pagas": chapas_dia,
            "valor_por_diaria": round(pago / chapas_dia, 2) if chapas_dia else None,
            "caminhoes_recebidos": caminhoes,
            "custo_por_caminhao": round(pago / caminhoes, 2) if caminhoes else None,
            "equipe_media": _r1(presentes),
            "equipe_necessaria_estimada": _r1(max(necessarios, config.EQUIPE_MINIMA)),
        })

    completos = [l for l in linhas if not l["parcial"] and l["valor_por_diaria"]]
    reajuste = None
    if len(completos) >= 6:
        ini = mean(l["valor_por_diaria"] for l in completos[:3])
        fim = mean(l["valor_por_diaria"] for l in completos[-3:])
        reajuste = {"de": round(ini, 2), "para": round(fim, 2),
                    "variacao_percentual": _r1(100 * (fim - ini) / ini),
                    "periodo": f"{completos[0]['mes']} a {completos[-1]['mes']}"}
    todos_meses = [m for m in meses]
    faltando = []
    if todos_meses:
        m = min(todos_meses)
        while m <= max(todos_meses):
            if m not in meses:
                faltando.append(m.strftime("%Y-%m"))
            m = _somar_meses(m, 1)
    cpc = [l["custo_por_caminhao"] for l in completos if l["custo_por_caminhao"]]
    return {
        "fonte": "HISTORICO", "mensal": linhas,
        "total_pago": round(sum(l["valor_pago"] for l in linhas), 2),
        "custo_medio_por_caminhao": round(mean(cpc), 2) if cpc else None,
        "reajuste_da_diaria": reajuste,
        "meses_sem_folha": faltando,
        "premissas": [
            "Valor pago = folha diária (diária base, sem encargos); dias suspeitos ficam fora.",
            "Custo por caminhão = valor pago no mês ÷ caminhões que exigem chapa no mês. "
            "Inclui o tempo da equipe em outras atividades (carregamento), por isso é um custo cheio.",
            "Meses com menos de 15 dias de folha aparecem como parciais.",
        ],
    }


# ------------------------------------------------------------------ 3. plano anual e simulador

def _base_pratica(db: Session) -> dict[int, float]:
    """Prática atual: equipe média de cada mês do calendário no último ano com folha."""
    por_mes = defaultdict(list)
    for f in db.scalars(select(FolhaDiaria)):
        if f.data.weekday() < 5 and not f.suspeito:
            por_mes[_mes(f.data)].append(f.chapas_presentes)
    ultimo = {}
    for m in sorted(por_mes):
        ultimo[m.month] = mean(por_mes[m])        # o mais recente sobrescreve
    return ultimo


def _meses_futuros(hoje: date, meses: int) -> list[date]:
    primeiro = _somar_meses(_mes(hoje), 1)
    return [_somar_meses(primeiro, i) for i in range(meses)]


def _situacao(equipe: float, caminhoes: float, reserva: int) -> str:
    """Compara a equipe com a MESMA régua da recomendação (para plano e diagnóstico baterem):
    FALTA = não cobre nem o cenário leve; RISCO = abaixo do recomendado;
    SOBRA = 2+ chapas acima do recomendado; ADEQUADO = no recomendado ou até 1 acima."""
    recomendado = chapas_necessarios(caminhoes, reserva)["recomendado"]
    leve = caminhoes * config.CHAPA_MINUTOS_POR_CAMINHAO_LEVE / CAPACIDADE + reserva
    if equipe < leve:
        return "FALTA"
    if equipe < recomendado - 0.5:
        return "RISCO_DE_FALTA"
    if equipe >= recomendado + config.FOLGA_PARA_SOBRA:
        return "SOBRA"
    return "ADEQUADO"


def plano_escala(db: Session, meses: int = 12, reserva: Optional[int] = None,
                 equipe_fixa: Optional[int] = None, hoje: Optional[date] = None) -> dict:
    """Plano de escala recomendado para os próximos meses, comparado com a prática atual.
    Com `equipe_fixa`, vira simulador: o que acontece se a equipe ficar sempre com N chapas."""
    hoje = hoje or _hoje()
    reserva = config.RESERVA_OUTRAS_ATIVIDADES if reserva is None else reserva
    serie = serie_mensal(db)
    prec = precisao(serie)
    base = equipe_e_diaria_atual(db)
    diaria = base["diaria_atual"] or 0
    pratica = _base_pratica(db)

    linhas = []
    for m in _meses_futuros(hoje, meses):
        cam = _prever(serie, m)
        if cam is None:
            continue
        uteis = dias_uteis_do_mes(m)
        rec = chapas_necessarios(cam, reserva)["recomendado"]
        atual = pratica.get(m.month, base["equipe_atual"])
        linha = {
            "mes": m.strftime("%Y-%m"), "rotulo": f"{MESES_PT[m.month]}/{m.year % 100:02d}",
            "dias_uteis": uteis, "caminhoes_dia_previsto": _r1(cam),
            "equipe_recomendada": rec,
            "equipe_pratica_atual": _r1(atual),
            "situacao_pratica_atual": _situacao(atual, cam, reserva) if atual else None,
            "custo_recomendado": round(rec * uteis * diaria, 2),
            "custo_pratica_atual": round((atual or 0) * uteis * diaria, 2),
        }
        if equipe_fixa is not None:
            linha.update(equipe_simulada=equipe_fixa,
                         situacao_simulada=_situacao(equipe_fixa, cam, reserva),
                         custo_simulado=round(equipe_fixa * uteis * diaria, 2))
        linhas.append(linha)

    tot_rec = sum(l["custo_recomendado"] for l in linhas)
    tot_atual = sum(l["custo_pratica_atual"] for l in linhas)
    meses_falta_pratica = [l["rotulo"] for l in linhas
                           if l["situacao_pratica_atual"] in ("FALTA", "RISCO_DE_FALTA")]
    resumo = {
        "custo_plano_recomendado": round(tot_rec, 2),
        "custo_pratica_atual": round(tot_atual, 2),
        "diferenca": round(tot_atual - tot_rec, 2),
        "meses_com_risco_na_pratica_atual": meses_falta_pratica,
    }
    if equipe_fixa is not None:
        resumo.update(
            custo_simulado=round(sum(l["custo_simulado"] for l in linhas), 2),
            meses_com_falta_simulada=[l["rotulo"] for l in linhas
                                      if l["situacao_simulada"] in ("FALTA", "RISCO_DE_FALTA")],
            meses_com_sobra_simulada=[l["rotulo"] for l in linhas if l["situacao_simulada"] == "SOBRA"])
    resumo["frase"] = _frase_plano(resumo, len(linhas))
    return {
        "gerado_em": hoje.isoformat(), "meses": linhas, "resumo": resumo, "precisao": prec,
        "diaria_atual": diaria, "reserva_outras_atividades": reserva,
        "premissas": [
            "Equipe recomendada = necessidade do recebimento previsto + reserva para outras "
            "atividades (ajustável), com mínimo de 5.",
            "Prática atual = equipe média do mesmo mês no último ano registrado na folha.",
            f"Todos os custos usam a diária atual (R$ {diaria}), para comparar escala com escala.",
            f"A previsão de caminhões tem erro médio de {prec['erro_medio_percentual']}% no histórico.",
        ],
    }


def _reais(v: float) -> str:
    return f"R$ {v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def _frase_plano(r: dict, n: int) -> str:
    if not n:
        return "Sem histórico suficiente para planejar."
    partes = []
    if r["diferenca"] > 0:
        partes.append(f"Escalando pela previsão, os próximos {n} meses custariam "
                      f"{_reais(r['diferenca'])} a menos que a prática atual")
    elif r["diferenca"] < 0:
        partes.append(f"A previsão pede {_reais(-r['diferenca'])} a mais que a prática atual "
                      f"nos próximos {n} meses")
    if r["meses_com_risco_na_pratica_atual"]:
        partes.append("e evitaria o risco de falta em " + ", ".join(r["meses_com_risco_na_pratica_atual"]))
    return (" ".join(partes) + ".") if partes else "A prática atual já acompanha a demanda prevista."