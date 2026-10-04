"""Painel gerencial (Tarefa 3): indicadores do dossiê e a resposta a "sobra ou falta chapa?".

Duas fontes, sempre identificadas na resposta:
  HISTORICO: o que a Cocapec já tinha (notas recebidas 2022-2026 e folha 2025-2026).
             Não tem horários nem acondicionamento: tempos e uso de docas não existem aqui.
  SISTEMA:   o que a plataforma registra (agendamentos, 3 marcos, boletins).

Cada resposta traz `fonte` e `premissas`, para ninguém confundir estimativa com medição.
"""
from collections import Counter, defaultdict
from datetime import date
from decimal import Decimal
from statistics import mean, median
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.core import config
from app.models import (
    Agendamento, BoletimDiario, Descarga, Equipamento, FolhaDiaria, Fornecedor,
    LocalFisico as L, RecebimentoHistorico as RH, StatusAgendamento as St, StatusBoletim,
)
from app.services.boletim_calculo import arredondar

DIAS = ["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"]
CAPACIDADE_CHAPA_DIA = config.JORNADA_MINUTOS * config.PRODUTIVIDADE_EQUIPE   # 432 min úteis


def _r1(x) -> Optional[float]:
    return None if x is None else round(float(x), 1)


def _periodo(stmt, coluna, inicio, fim):
    if inicio:
        stmt = stmt.where(coluna >= inicio)
    if fim:
        stmt = stmt.where(coluna <= fim)
    return stmt


def _minutos(a, b) -> Optional[float]:
    return (b - a).total_seconds() / 60 if a and b else None


# =====================================================================
# 1. SOBRA OU FALTA CHAPA (a pergunta da direção)
# =====================================================================

def _classificar(saldo_pesado: float, saldo_leve: float) -> str:
    if saldo_leve < 0:
        return "FALTA"                 # falta até no cenário leve
    if saldo_pesado < 0:
        return "RISCO_DE_FALTA"        # falta se as cargas forem pesadas
    if saldo_pesado >= config.FOLGA_PARA_SOBRA:
        return "SOBRA"                 # sobra até no cenário pesado
    return "EQUILIBRIO"


def sobra_falta_historico(db: Session, inicio: Optional[date] = None,
                          fim: Optional[date] = None) -> dict:
    """Cruza, dia útil a dia útil, quem trabalhou (folha) com quanto caminhão chegou (notas)."""
    folha = list(db.scalars(_periodo(select(FolhaDiaria), FolhaDiaria.data, inicio, fim)
                            .order_by(FolhaDiaria.data)))
    cam = dict(db.execute(_periodo(
        select(RH.data, func.count(RH.id)).where(RH.exige_chapa).group_by(RH.data),
        RH.data, inicio, fim)).all())

    dias = [f for f in folha if f.data.weekday() < 5 and not f.suspeito]
    descartados = len(folha) - len(dias)
    por_pessoa = [float(f.valor_pago) / f.chapas_presentes for f in dias if f.chapas_presentes]
    diaria_media = median(por_pessoa) if por_pessoa else 0

    meses = defaultdict(list)
    for f in dias:
        meses[f.data.strftime("%Y-%m")].append((f, cam.get(f.data, 0)))

    linhas, custo_sobra_total = [], 0.0
    for mes, itens in sorted(meses.items()):
        presentes = mean(f.chapas_presentes for f, _ in itens)
        caminhoes = mean(c for _, c in itens)
        nec_leve = caminhoes * config.CHAPA_MINUTOS_POR_CAMINHAO_LEVE / CAPACIDADE_CHAPA_DIA
        nec_pesado = caminhoes * config.CHAPA_MINUTOS_POR_CAMINHAO_PESADO / CAPACIDADE_CHAPA_DIA
        saldo_leve, saldo_pesado = presentes - nec_leve, presentes - nec_pesado
        situacao = _classificar(saldo_pesado, saldo_leve)
        # custo conservador: só a sobra que existe até no cenário pesado
        custo_sobra = max(saldo_pesado, 0) * len(itens) * diaria_media
        custo_sobra_total += custo_sobra
        linhas.append({
            "mes": mes, "dias_uteis": len(itens),
            "chapas_presentes_media": _r1(presentes), "caminhoes_dia_media": _r1(caminhoes),
            "chapas_necessarios_leve": _r1(nec_leve), "chapas_necessarios_pesado": _r1(nec_pesado),
            "saldo_leve": _r1(saldo_leve), "saldo_pesado": _r1(saldo_pesado),
            "situacao": situacao, "custo_sobra_estimado": round(custo_sobra, 2),
        })

    contagem = Counter(m["situacao"] for m in linhas)
    meses_falta = [m["mes"] for m in linhas if m["situacao"] in ("FALTA", "RISCO_DE_FALTA")]
    meses_sobra = [m["mes"] for m in linhas if m["situacao"] == "SOBRA"]
    return {
        "fonte": "HISTORICO",
        "resposta": _frase_resposta(meses_sobra, meses_falta, custo_sobra_total),
        "meses_por_situacao": dict(contagem),
        "meses_com_sobra": meses_sobra,
        "meses_com_risco_de_falta": meses_falta,
        "custo_sobra_estimado_total": round(custo_sobra_total, 2),
        "diaria_mediana_folha": round(diaria_media, 2),
        "dias_descartados": descartados,
        "mensal": linhas,
        "premissas": [
            "Efetivo real: folha diária dos chapas (dias úteis; dias marcados como suspeitos ficam de fora).",
            "Demanda: notas fiscais que exigem chapa (>= 500 kg) por dia, a melhor aproximação de caminhão.",
            f"Cada caminhão exige de {config.CHAPA_MINUTOS_POR_CAMINHAO_LEVE} (leve) a "
            f"{config.CHAPA_MINUTOS_POR_CAMINHAO_PESADO} (pesado) chapa-minutos, faixa da seção 9 do dossiê; "
            "o histórico não registra o acondicionamento.",
            f"Capacidade de um chapa: {config.JORNADA_MINUTOS} min x "
            f"{int(config.PRODUTIVIDADE_EQUIPE * 100)}% = {int(CAPACIDADE_CHAPA_DIA)} min por dia.",
            "SOBRA = sobram 2+ chapas até no cenário pesado; RISCO_DE_FALTA = falta só no pesado; "
            "FALTA = falta até no leve.",
            "LIMITE IMPORTANTE: a mesma equipe carrega cooperados, operação que não está nos dados. "
            "Parte da sobra no recebimento pode estar sendo usada ali. A medida definitiva é o "
            "complemento do boletim (pago sem produção), que o sistema registra a partir de agora.",
            "Custo da sobra: chapas sobrando no cenário pesado x dias x diária mediana da folha "
            "(diária base; não inclui encargos).",
        ],
    }


def _reais(v: float) -> str:
    return f"R$ {v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def _frase_resposta(meses_sobra, meses_falta, custo) -> str:
    if not meses_sobra and not meses_falta:
        return "Sem dados suficientes no período."
    partes = []
    if meses_sobra:
        partes.append(f"SOBRA chapa no recebimento em {len(meses_sobra)} meses "
                      f"(custo estimado da sobra: {_reais(custo)})")
    if meses_falta:
        partes.append(f"há RISCO DE FALTA em {len(meses_falta)} meses ({', '.join(meses_falta)}), "
                      "no pico de recebimento")
    return "; ".join(partes) + ". O reforço de equipe deveria acompanhar o pico de chegada de caminhões."


def sobra_falta_sistema(db: Session, inicio: Optional[date] = None,
                        fim: Optional[date] = None) -> dict:
    """Medição real, a partir do boletim: complemento = dinheiro pago sem produção."""
    bols = list(db.scalars(_periodo(
        select(BoletimDiario).where(BoletimDiario.status == StatusBoletim.FECHADO)
        .options(selectinload(BoletimDiario.chapas_alocados)),
        BoletimDiario.data, inicio, fim).order_by(BoletimDiario.data)))
    dias = []
    for b in bols:
        ocioso = (float(b.complemento) / float(config.PISO_DIARIA)) if b.complemento else 0
        dias.append({
            "data": b.data, "local": b.local, "chapas": len(b.chapas_alocados),
            "diarias_equivalentes": float(b.diarias_equivalentes),
            "producao": arredondar(b.producao_total), "total_pago": arredondar(b.total_pagar),
            "complemento": arredondar(b.complemento),
            "diarias_ociosas_equivalentes": _r1(ocioso),
            "situacao": "SOBRA" if b.complemento and b.complemento > 0 else "SEM_SOBRA",
        })
    total_comp = sum((b.complemento for b in bols), Decimal(0))
    total_pago = sum((b.total_pagar for b in bols), Decimal(0))
    return {
        "fonte": "SISTEMA",
        "boletins_fechados": len(bols),
        "dias_com_complemento": sum(d["situacao"] == "SOBRA" for d in dias),
        "complemento_total": arredondar(total_comp),
        "total_pago": arredondar(total_pago),
        "percentual_pago_sem_producao": _r1(100 * total_comp / total_pago) if total_pago else None,
        "dias": dias,
        "premissas": [
            "Complemento = piso x diárias − produção: o que se pagou acima do que a equipe produziu.",
            "Complemento > 0 indica equipe maior que o serviço do dia (inclui carregamento de "
            "cooperados, pois o boletim registra toda a movimentação).",
            "diárias ociosas equivalentes = complemento ÷ piso da diária (R$ 90,1731).",
        ],
    }


# =====================================================================
# 2. INDICADORES PEDIDOS NO DOSSIÊ (seção 4)
# =====================================================================

def cargas_por_dia(db: Session, inicio=None, fim=None, local: Optional[L] = None) -> dict:
    """Quantidade de cargas recebidas por dia e por armazém."""
    stmt = select(RH.data, RH.local_principal, func.count(RH.id)).where(RH.exige_chapa)
    if local:
        stmt = stmt.where(RH.local_principal == local)
    hist = db.execute(_periodo(stmt, RH.data, inicio, fim)
                      .group_by(RH.data, RH.local_principal).order_by(RH.data)).all()

    stmt = (select(Agendamento.data, Descarga.local, func.count(func.distinct(Agendamento.id)))
            .join(Descarga, Descarga.agendamento_id == Agendamento.id)
            .where(Agendamento.status == St.CONCLUIDO))
    if local:
        stmt = stmt.where(Descarga.local == local)
    sist = db.execute(_periodo(stmt, Agendamento.data, inicio, fim)
                      .group_by(Agendamento.data, Descarga.local).order_by(Agendamento.data)).all()

    def agrupa(rows):
        por_dia = defaultdict(dict)
        for d, lo, n in rows:
            por_dia[d][lo.value if lo else "SEM_ARMAZEM"] = n
        return [{"data": d, "por_armazem": v, "total": sum(v.values())} for d, v in sorted(por_dia.items())]

    h = agrupa(hist)
    return {
        "historico": {"fonte": "HISTORICO", "dias": h,
                      "media_por_dia": _r1(mean(x["total"] for x in h)) if h else None,
                      "premissa": "Notas fiscais que exigem chapa (>= 500 kg); armazém de maior peso da nota."},
        "sistema": {"fonte": "SISTEMA", "dias": agrupa(sist),
                    "premissa": "Agendamentos concluídos, por armazém de descarga."},
    }


def _descargas_concluidas(db, inicio, fim, local):
    stmt = (select(Descarga).join(Agendamento, Agendamento.id == Descarga.agendamento_id)
            .where(Descarga.horario_saida.is_not(None))
            .options(selectinload(Descarga.agendamento), selectinload(Descarga.baia)))
    if local:
        stmt = stmt.where(Descarga.local == local)
    return list(db.scalars(_periodo(stmt, Agendamento.data, inicio, fim)))


def tempos(db: Session, inicio=None, fim=None, local: Optional[L] = None) -> dict:
    """Tempo médio de espera (chegada -> entrada) e de descarga (entrada -> saída)."""
    descs = _descargas_concluidas(db, inicio, fim, local)
    # espera: do caminhão (chegada) até a 1ª entrada em qualquer armazém
    chegada, primeira_entrada = {}, {}
    for d in descs:
        ag = d.agendamento
        if ag.horario_chegada and d.horario_entrada:
            chegada[ag.id] = ag.horario_chegada
            primeira_entrada[ag.id] = min(primeira_entrada.get(ag.id, d.horario_entrada),
                                          d.horario_entrada)
    esperas = [_minutos(chegada[i], primeira_entrada[i]) for i in chegada]
    descargas = [_minutos(d.horario_entrada, d.horario_saida) for d in descs]
    por_local = defaultdict(list)
    for d in descs:
        por_local[d.local.value].append(_minutos(d.horario_entrada, d.horario_saida))
    return {
        "fonte": "SISTEMA",
        "espera_media_min": _r1(mean(esperas)) if esperas else None,
        "espera_max_min": _r1(max(esperas)) if esperas else None,
        "descarga_media_min": _r1(mean(descargas)) if descargas else None,
        "descarga_media_por_armazem_min": {k: _r1(mean(v)) for k, v in sorted(por_local.items())},
        "caminhoes_medidos": len(esperas), "descargas_medidas": len(descargas),
        "premissa": "Só existe a partir do sistema: a Cocapec nunca registrou horários (LEIA-ME).",
    }


def chapas_por_recebimento(db: Session, inicio=None, fim=None, local: Optional[L] = None) -> dict:
    """Colaboradores utilizados por recebimento (real) comparado à norma da seção 7."""
    from app.services.agendamento_service import chapas_norma
    descs = _descargas_concluidas(db, inicio, fim, local)
    reais = [d.qtd_chapas for d in descs if d.qtd_chapas is not None]
    comparacao = []
    for d in descs:
        norma = chapas_norma(d.agendamento)
        if d.qtd_chapas is not None and norma is not None:
            comparacao.append(d.qtd_chapas - norma)
    return {
        "fonte": "SISTEMA",
        "media_chapas_por_descarga": _r1(mean(reais)) if reais else None,
        "descargas": len(reais),
        "acima_da_norma": sum(1 for x in comparacao if x > 0),
        "na_norma": sum(1 for x in comparacao if x == 0),
        "abaixo_da_norma": sum(1 for x in comparacao if x < 0),
        "premissa": "Chapas por descarga medem a intensidade da carga; NÃO se somam no dia "
                    "(a mesma equipe faz várias descargas). O efetivo do dia vem do boletim.",
    }


def utilizacao(db: Session, inicio=None, fim=None, local: Optional[L] = None) -> dict:
    """Uso das docas (minutos ocupados) e dos equipamentos (vezes e minutos)."""
    descs = _descargas_concluidas(db, inicio, fim, local)
    dias = len({d.agendamento.data for d in descs}) or 1
    docas = defaultdict(float)
    equip_vezes, equip_min = Counter(), defaultdict(float)
    for d in descs:
        m = _minutos(d.horario_entrada, d.horario_saida) or 0
        docas[d.baia.nome if d.baia else d.local.value] += m
        for e in d.equipamentos or []:
            equip_vezes[e["codigo"]] += e.get("qtd", 1)
            equip_min[e["codigo"]] += m * e.get("qtd", 1)
    catalogo = {e.codigo: e for e in db.scalars(select(Equipamento))}
    jornada = config.JORNADA_MINUTOS
    return {
        "fonte": "SISTEMA",
        "dias_com_descarga": dias if descs else 0,
        "docas": [{"doca": k, "minutos_ocupados": _r1(v),
                   "ocupacao_percentual": _r1(100 * v / (jornada * dias))}
                  for k, v in sorted(docas.items())],
        "equipamentos": [{
            "codigo": c, "nome": catalogo[c].nome if c in catalogo else c,
            "usos": equip_vezes[c], "minutos": _r1(equip_min[c]),
            "ocupacao_percentual": _r1(100 * equip_min[c] /
                                       (jornada * dias * (catalogo[c].quantidade or 1)))
            if c in catalogo else None,
        } for c in sorted(equip_vezes)],
        "premissa": "Ocupação = minutos de descarga ÷ (jornada de 480 min x dias com descarga "
                    "x quantidade do equipamento). Só o recebimento: carregamento de cooperados não entra.",
    }


def fornecedores_maior_volume(db: Session, inicio=None, fim=None, limite: int = 10) -> dict:
    rows = db.execute(_periodo(
        select(Fornecedor.nome, Fornecedor.cnpj, func.count(RH.id).label("n"),
               func.sum(RH.peso_estimado_kg).label("peso"))
        .join(Fornecedor, Fornecedor.id == RH.fornecedor_id).where(RH.exige_chapa)
        .group_by(Fornecedor.nome, Fornecedor.cnpj), RH.data, inicio, fim)
        .order_by(func.count(RH.id).desc()).limit(limite)).all()
    sist = db.execute(_periodo(
        select(Fornecedor.nome, func.count(Agendamento.id).label("n"))
        .join(Fornecedor, Fornecedor.id == Agendamento.fornecedor_id)
        .where(Agendamento.status == St.CONCLUIDO).group_by(Fornecedor.nome),
        Agendamento.data, inicio, fim).order_by(func.count(Agendamento.id).desc()).limit(limite)).all()
    return {
        "historico": {"fonte": "HISTORICO", "ranking": [
            {"fornecedor": r.nome, "cnpj": r.cnpj, "caminhoes": r.n,
             "peso_estimado_t": _r1((r.peso or 0) / 1000)} for r in rows],
            "premissa": "Ranking por nº de caminhões (notas >= 500 kg). O peso é estimado: a planilha "
                        "repete o peso do pedido em cada recebimento."},
        "sistema": {"fonte": "SISTEMA", "ranking": [{"fornecedor": r.nome, "caminhoes": r.n} for r in sist]},
    }


def movimento(db: Session, inicio=None, fim=None) -> dict:
    """Horários e dias de maior movimento."""
    hist = db.execute(_periodo(select(RH.data, func.count(RH.id)).where(RH.exige_chapa)
                               .group_by(RH.data), RH.data, inicio, fim)).all()
    por_dia, por_mes = defaultdict(list), defaultdict(list)
    for d, n in hist:
        por_dia[d.weekday()].append(n)
        por_mes[d.month].append(n)
    horarios = db.execute(_periodo(
        select(Agendamento.horario, func.count(Agendamento.id))
        .where(Agendamento.status.in_([St.CONCLUIDO, St.EM_DESCARGA, St.NA_FILA,
                                       St.DESTINO_DEFINIDO, St.APROVADO, St.PENDENTE]))
        .group_by(Agendamento.horario), Agendamento.data, inicio, fim)).all()
    return {
        "dia_da_semana": {"fonte": "HISTORICO", "media_caminhoes": [
            {"dia": DIAS[k], "media": _r1(mean(v)), "dias_observados": len(v)}
            for k, v in sorted(por_dia.items())]},
        "mes_do_ano": {"fonte": "HISTORICO", "media_caminhoes_por_dia": [
            {"mes": k, "media": _r1(mean(v))} for k, v in sorted(por_mes.items())]},
        "horario": {"fonte": "SISTEMA", "agendamentos": [
            {"horario": h.value, "total": n} for h, n in sorted(horarios, key=lambda x: x[0].value)],
            "premissa": "O histórico não tem hora de chegada; o horário vem dos agendamentos."},
    }


def nao_recebimentos(db: Session, inicio=None, fim=None) -> dict:
    rows = db.execute(_periodo(
        select(Agendamento.motivo_nao_recebimento, func.count(Agendamento.id))
        .where(Agendamento.motivo_nao_recebimento.is_not(None))
        .group_by(Agendamento.motivo_nao_recebimento), Agendamento.data, inicio, fim)).all()
    total = sum(n for _, n in rows)
    return {"fonte": "SISTEMA", "total": total,
            "por_motivo": sorted([{"motivo": m.value, "total": n} for m, n in rows],
                                 key=lambda x: -x["total"]),
            "premissa": "Inclui reprovação do Compras, falta de vaga no balcão, chuva, "
                        "cancelamento e não comparecimento."}


def custo(db: Session, inicio=None, fim=None) -> dict:
    """Custo estimado da operação = total do boletim (sem encargos, dossiê seção 8)."""
    bols = list(db.scalars(_periodo(select(BoletimDiario).where(
        BoletimDiario.status == StatusBoletim.FECHADO), BoletimDiario.data, inicio, fim)
        .order_by(BoletimDiario.data)))
    folha = db.execute(_periodo(select(func.count(FolhaDiaria.data), func.sum(FolhaDiaria.valor_pago),
                                       func.sum(FolhaDiaria.chapas_presentes)),
                                FolhaDiaria.data, inicio, fim)).one()
    return {
        "sistema": {"fonte": "SISTEMA", "boletins": len(bols),
                    "custo_total": arredondar(sum((b.total_pagar for b in bols), Decimal(0))),
                    "producao_total": arredondar(sum((b.producao_total for b in bols), Decimal(0))),
                    "complemento_total": arredondar(sum((b.complemento for b in bols), Decimal(0))),
                    "por_dia": [{"data": b.data, "total": arredondar(b.total_pagar),
                                 "complemento": arredondar(b.complemento)} for b in bols],
                    "premissa": "Total apurado no boletim (produção, ou piso + complemento). Sem encargos."},
        "historico": {"fonte": "HISTORICO", "dias": folha[0] or 0,
                      "valor_pago_folha": _r1(folha[1]), "diarias_pagas": folha[2] or 0,
                      "premissa": "Folha de pagamento (diária base de R$ 99 a R$ 113). Não é o custo do "
                                  "boletim: os três valores de diária do dossiê não são intercambiáveis."},
    }


def resumo(db: Session, inicio=None, fim=None) -> dict:
    sf = sobra_falta_historico(db, inicio, fim)
    sist = sobra_falta_sistema(db, inicio, fim)
    t = tempos(db, inicio, fim)
    cargas = cargas_por_dia(db, inicio, fim)
    nr = nao_recebimentos(db, inicio, fim)
    return {
        "pergunta": "Sobra ou falta chapa?",
        "resposta": sf["resposta"],
        "historico": {
            "caminhoes_por_dia_util": cargas["historico"]["media_por_dia"],
            "meses_com_sobra": len(sf["meses_com_sobra"]),
            "meses_com_risco_de_falta": len(sf["meses_com_risco_de_falta"]),
            "custo_sobra_estimado": sf["custo_sobra_estimado_total"],
        },
        "sistema": {
            "boletins_fechados": sist["boletins_fechados"],
            "complemento_pago_sem_producao": sist["complemento_total"],
            "percentual_pago_sem_producao": sist["percentual_pago_sem_producao"],
            "espera_media_min": t["espera_media_min"],
            "descarga_media_min": t["descarga_media_min"],
            "nao_recebimentos": nr["total"],
        },
    }


def qualidade_dados(db: Session) -> dict:
    """Problemas encontrados nos dados históricos e como foram tratados."""
    alertas = Counter()
    for (lista,) in db.execute(select(RH.alertas)):
        for a in lista or []:
            alertas[a] += 1
    suspeitos = db.execute(select(FolhaDiaria.data, FolhaDiaria.motivo_suspeita)
                           .where(FolhaDiaria.suspeito).order_by(FolhaDiaria.data)).all()
    return {
        "notas_historicas": db.scalar(select(func.count(RH.id))) or 0,
        "notas_que_exigem_chapa": db.scalar(select(func.count(RH.id)).where(RH.exige_chapa)) or 0,
        "alertas_nas_notas": [{"alerta": k, "notas": v} for k, v in alertas.most_common()],
        "dias_suspeitos_na_folha": [{"data": d, "motivo": m} for d, m in suspeitos],
    }