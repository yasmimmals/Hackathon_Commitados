"""Regras do agendamento (dossiê seção 4 + conversa com o stakeholder).

Fluxo:
  PENDENTE --Compras aprova--> APROVADO --armazém define armazém+baia--> DESTINO_DEFINIDO
  --chegada--> NA_FILA --entrada--> EM_DESCARGA --saída (todas)--> CONCLUIDO

Toda função recebe `agora` opcional para facilitar teste; em produção usa o relógio.
Cada RegraNegocioError tem um `codigo` estável para o frontend tratar o caso.
"""
import os
import uuid
from datetime import date, datetime, timedelta
from typing import Optional

from sqlalchemy import func, select, text
from sqlalchemy.orm import Session, selectinload

from app.core import config
from app.core.exceptions import NaoEncontradoError, RegraNegocioError
from app.models import (
    Acondicionamento, Agendamento, Baia, Descarga, Equipamento, Fornecedor, Horario,
    LocalFisico, MotivoNaoRecebimento as Motivo, NotaFiscal, OrigemAgendamento as Origem,
    StatusAgendamento as St, TipoNotificacao,
)
from app.services import clima_service, notificacao_service
from app.services.nfe_parser import chave_valida, ler_nota

# Motivos que o Compras pode usar ao reprovar
MOTIVOS_COMPRAS = {Motivo.DIVERGENCIA_NF_PEDIDO, Motivo.SEM_PEDIDO,
                   Motivo.REJEITADO_COMPRAS, Motivo.OUTRO}

# Status em que o agendamento segura a vaga do horário
STATUS_OCUPAM_VAGA = {St.PENDENTE, St.APROVADO, St.DESTINO_DEFINIDO, St.NA_FILA,
                      St.EM_DESCARGA, St.CONCLUIDO}
STATUS_EM_ABERTO = {St.PENDENTE, St.APROVADO, St.DESTINO_DEFINIDO, St.NA_FILA, St.EM_DESCARGA}
STATUS_ANTES_DA_CHEGADA = {St.PENDENTE, St.APROVADO, St.DESTINO_DEFINIDO}


# ---------------------------------------------------------------- utilidades

def _agora(agora: Optional[datetime]) -> datetime:
    return agora or datetime.now(config.TZ)


def inicio_do_horario(data: date, horario: Horario) -> datetime:
    return datetime.combine(data, config.GRADE[horario.value][0], tzinfo=config.TZ)


def fim_do_horario(data: date, horario: Horario) -> datetime:
    return datetime.combine(data, config.GRADE[horario.value][1], tzinfo=config.TZ)


def eh_dia_util(d: date) -> bool:
    return d.weekday() < 5 and d not in config.FERIADOS


def proximo_dia_util(d: date) -> date:
    d += timedelta(days=1)
    while not eh_dia_util(d):
        d += timedelta(days=1)
    return d


def chapas_norma(ag: Agendamento) -> Optional[int]:
    """Seção 7: <500 kg nenhum; batido 5; paletizado/big bag 2; máquina 1 + operador."""
    if ag.peso_kg is not None and ag.peso_kg < 500:
        return 0
    if any(d.local == LocalFisico.MAQUINAS for d in ag.descargas):
        return 1
    if ag.acondicionamento == Acondicionamento.BATIDO:
        return 5
    return 2


def buscar(db: Session, ag_id: int, travar: bool = False) -> Agendamento:
    stmt = select(Agendamento).where(Agendamento.id == ag_id).options(
        selectinload(Agendamento.descargas).selectinload(Descarga.baia),
        selectinload(Agendamento.fornecedor))
    if travar:
        stmt = stmt.with_for_update(of=Agendamento)
    ag = db.scalars(stmt).first()
    if not ag:
        raise NaoEncontradoError(f"Agendamento {ag_id} não encontrado")
    return ag


def _exigir_status(ag: Agendamento, permitidos: set, acao: str):
    if ag.status not in permitidos:
        nomes = ", ".join(sorted(s.value for s in permitidos))
        raise RegraNegocioError(
            f"Não é possível {acao}: agendamento está {ag.status.value} (esperado: {nomes})",
            {"status_atual": ag.status.value, "esperado": sorted(s.value for s in permitidos)},
            codigo="TRANSICAO_INVALIDA")


# ------------------------------------------------------- capacidade do horário

def _travar_horario(db: Session, data: date, horario: Horario):
    """Lock transacional por (data, horário). Garante que dois fornecedores
    clicando ao mesmo tempo não peguem a mesma última vaga. Funciona até
    com o horário vazio, onde SELECT ... FOR UPDATE não teria linha para travar."""
    chave = f"slot|{data.isoformat()}|{horario.value}"
    db.execute(text("SELECT pg_advisory_xact_lock(hashtext(:k))"), {"k": chave})


def _ocupantes(db: Session, data: date, horario: Horario) -> list[Agendamento]:
    # Encaixes de chuva não consomem vaga: o dossiê permite ignorar o limite
    return list(db.scalars(select(Agendamento).where(
        Agendamento.data == data,
        Agendamento.horario == horario,
        Agendamento.status.in_(STATUS_OCUPAM_VAGA),
        Agendamento.origem != Origem.CHUVA,
    )))


def _motivo_sem_vaga(ocupantes: list[Agendamento], acond: Acondicionamento) -> Optional[str]:
    if any(a.acondicionamento == Acondicionamento.BATIDO for a in ocupantes):
        return "Horário reservado para uma carga batida"
    if acond == Acondicionamento.BATIDO and ocupantes:
        return "Carga batida precisa do horário inteiro, e ele já tem caminhão agendado"
    if len(ocupantes) >= config.CAPACIDADE_POR_HORARIO:
        return "Horário lotado"
    return None


def disponibilidade(db: Session, data: date, nota_fiscal_id: Optional[int] = None) -> list[dict]:
    """Vagas por horário. Se a consulta vier com uma nota de adubo,
    cada horário traz também a previsão de chuva e se está bloqueado."""
    carga_adubo = bool(nota_fiscal_id and buscar_nota(db, nota_fiscal_id).carga_adubo)
    resultado = []
    for h in Horario:
        ocup = _ocupantes(db, data, h)
        tem_batido = any(a.acondicionamento == Acondicionamento.BATIDO for a in ocup)
        encaixes = db.scalar(select(func.count(Agendamento.id)).where(
            Agendamento.data == data, Agendamento.horario == h,
            Agendamento.origem == Origem.CHUVA,
            Agendamento.status.in_(STATUS_OCUPAM_VAGA)))
        vagas = 0 if tem_batido else max(config.CAPACIDADE_POR_HORARIO - len(ocup), 0)
        slot = {
            "horario": h, "ocupados": len(ocup), "tem_batido": tem_batido,
            "aceita_batido": not ocup, "aceita_unitizado": vagas > 0,
            "vagas_restantes": vagas, "encaixes_chuva": encaixes or 0,
        }
        if carga_adubo:
            prob = clima_service.prob_chuva(data, h)
            slot.update(prob_chuva=prob, situacao_chuva=clima_service.classificar(prob))
        resultado.append(slot)
    return resultado


def sugerir_alternativas(db: Session, a_partir_de: date, acond: Acondicionamento,
                         carga_adubo: bool, agora: Optional[datetime] = None,
                         quantidade: int = 3, dias_uteis: int = 10) -> list[dict]:
    """Próximos horários com vaga para esse acondicionamento e, se for adubo,
    com previsão de chuva abaixo do limiar."""
    agora = _agora(agora)
    sugestoes, d, vistos = [], a_partir_de, 0
    while len(sugestoes) < quantidade and vistos < dias_uteis:
        if eh_dia_util(d):
            vistos += 1
            for h in Horario:
                if inicio_do_horario(d, h) <= agora or _motivo_sem_vaga(_ocupantes(db, d, h), acond):
                    continue
                prob = clima_service.prob_chuva(d, h) if carga_adubo else None
                if carga_adubo and clima_service.classificar(prob) == "BLOQUEADO":
                    continue
                sugestoes.append({"data": d.isoformat(), "horario": h.value, "prob_chuva": prob})
                if len(sugestoes) == quantidade:
                    break
        d += timedelta(days=1)
    return sugestoes


def aviso_chuva(ag: Agendamento) -> Optional[str]:
    if not ag.carga_adubo:
        return None
    previsao = (f"Previsão de {ag.prob_chuva}% de chuva no horário. " if ag.prob_chuva is not None
                else "Previsão de chuva indisponível para esta data. ")
    return (previsao + "A descarga de adubo é feita em pátio aberto: se chover, ela será "
            "reagendada para o próximo dia útil, com prioridade na fila.")


# ------------------------------------------------------------------ nota fiscal

def buscar_nota(db: Session, nota_id: int) -> NotaFiscal:
    nota = db.get(NotaFiscal, nota_id)
    if not nota:
        raise NaoEncontradoError(f"Nota fiscal {nota_id} não encontrada")
    return nota


def _agendamento_ativo_da_nota(db: Session, nota_id: int) -> Optional[Agendamento]:
    return db.scalars(select(Agendamento).where(
        Agendamento.nota_fiscal_id == nota_id,
        Agendamento.status.in_(STATUS_OCUPAM_VAGA))).first()


def _erro_nota_ja_agendada(ativo: Agendamento) -> RegraNegocioError:
    return RegraNegocioError(
        f"Esta nota já tem o agendamento #{ativo.id} ({ativo.data:%d/%m} às {ativo.horario.value})",
        {"agendamento_id": ativo.id}, codigo="NOTA_JA_AGENDADA")


def registrar_nota(db: Session, nome_arquivo: str, conteudo: bytes) -> NotaFiscal:
    """Lê a nota (XML ou PDF), identifica o fornecedor pelo CNPJ do emitente
    (cadastra se for novo) e guarda o arquivo. É o primeiro passo do agendamento."""
    try:
        lida = ler_nota(nome_arquivo, conteudo)
    except ValueError as e:
        raise RegraNegocioError(str(e), codigo="NOTA_INVALIDA")
    except Exception as e:  # XML/PDF corrompido
        raise RegraNegocioError(f"Não foi possível ler a nota: {e}", codigo="NOTA_INVALIDA")
    if not lida["chave"]:
        raise RegraNegocioError("Nota sem chave de acesso", codigo="NOTA_INVALIDA")

    existente = db.scalars(select(NotaFiscal).where(NotaFiscal.chave == lida["chave"])).first()
    if existente:
        if (ativo := _agendamento_ativo_da_nota(db, existente.id)):
            raise _erro_nota_ja_agendada(ativo)
        return existente   # mesma nota reenviada: reaproveita

    fornecedor = db.scalars(select(Fornecedor).where(
        Fornecedor.cnpj == lida["cnpj_emitente"]).order_by(Fornecedor.id)).first()
    if not fornecedor:
        fornecedor = Fornecedor(cnpj=lida["cnpj_emitente"],
                                nome=lida["nome_emitente"] or f"CNPJ {lida['cnpj_emitente']}")
        db.add(fornecedor)
        db.flush()
        lida["alertas"].append("Fornecedor cadastrado automaticamente a partir da nota")

    os.makedirs(config.UPLOAD_DIR, exist_ok=True)
    caminho = os.path.join(config.UPLOAD_DIR, f"{lida['chave']}_{uuid.uuid4().hex[:6]}.{lida['formato']}")
    with open(caminho, "wb") as f:
        f.write(conteudo)

    nota = NotaFiscal(
        chave=lida["chave"], numero=lida["numero"], serie=lida["serie"],
        data_emissao=lida["data_emissao"], fornecedor_id=fornecedor.id,
        valor_total=lida["valor_total"], peso_bruto_kg=lida["peso_bruto_kg"],
        peso_liquido_kg=lida["peso_liquido_kg"], volumes=lida["volumes"],
        especie=lida["especie"], carga_adubo=lida["carga_adubo"], itens=lida["itens"],
        alertas=lida["alertas"], formato=lida["formato"], arquivo_url=caminho,
    )
    db.add(nota)
    db.commit()
    db.refresh(nota)
    return nota


def _dados_da_nota(nota: NotaFiscal) -> dict:
    return dict(
        fornecedor_id=nota.fornecedor_id, nota_fiscal_id=nota.id,
        peso_kg=nota.peso_bruto_kg, carga_adubo=nota.carga_adubo,
        nf_numero=nota.numero, nf_chave=nota.chave, nf_arquivo_url=nota.arquivo_url,
    )


# --------------------------------------------------------------- fornecedor

def criar_agendamento(db: Session, dados, agora: Optional[datetime] = None) -> Agendamento:
    agora = _agora(agora)
    nota = buscar_nota(db, dados.nota_fiscal_id)
    if (ativo := _agendamento_ativo_da_nota(db, nota.id)):
        raise _erro_nota_ja_agendada(ativo)
    if not eh_dia_util(dados.data):
        raise RegraNegocioError("Recebimento só de segunda a sexta, exceto feriados",
                                codigo="DIA_NAO_UTIL")
    if inicio_do_horario(dados.data, dados.horario) <= agora:
        raise RegraNegocioError("Horário já passou", codigo="HORARIO_PASSADO")

    # Regra de chuva: só para carga que vai para o pátio de adubos (céu aberto)
    prob = None
    if nota.carga_adubo:
        prob = clima_service.prob_chuva(dados.data, dados.horario)
        situacao = clima_service.classificar(prob)
        if situacao == "BLOQUEADO":
            raise RegraNegocioError(
                f"Previsão de {prob}% de chuva nesse horário. Carga de adubo não pode ser "
                f"agendada com {config.LIMIAR_BLOQUEIO_CHUVA}% ou mais: escolha outro dia",
                {"prob_chuva": prob, "alternativas": sugerir_alternativas(
                    db, dados.data, dados.acondicionamento, True, agora)},
                codigo="CHUVA_BLOQUEADA")
        if situacao == "RISCO" and not dados.ciente_risco_chuva:
            raise RegraNegocioError(
                ("Há previsão de chuva nesse horário. " if prob else
                 "Não há previsão de chuva disponível para essa data. ")
                + "É preciso aceitar o aviso: se chover, a descarga será reagendada "
                "para o próximo dia útil, com prioridade",
                {"prob_chuva": prob, "exige_ciencia": True},
                codigo="EXIGE_CIENCIA_CHUVA")

    _travar_horario(db, dados.data, dados.horario)
    motivo = _motivo_sem_vaga(_ocupantes(db, dados.data, dados.horario), dados.acondicionamento)
    if motivo:
        db.rollback()
        raise RegraNegocioError(motivo, {"alternativas": sugerir_alternativas(
            db, dados.data, dados.acondicionamento, nota.carga_adubo, agora)},
            codigo="VAGA_OCUPADA")

    if dados.email_contato:                                        # NOVO
        nota.fornecedor.email = dados.email_contato                # NOVO
    ag = Agendamento(
        **_dados_da_nota(nota), data=dados.data, horario=dados.horario,
        acondicionamento=dados.acondicionamento, prob_chuva=prob,
        ciente_risco_chuva=bool(dados.ciente_risco_chuva),
        origem=Origem.NORMAL, status=St.PENDENTE,
    )
    db.add(ag)
    db.commit()
    return buscar(db, ag.id)


def cancelar(db: Session, ag_id: int, agora: Optional[datetime] = None) -> Agendamento:
    agora = _agora(agora)
    ag = buscar(db, ag_id, travar=True)
    _exigir_status(ag, STATUS_ANTES_DA_CHEGADA, "cancelar")
    limite = inicio_do_horario(ag.data, ag.horario) - timedelta(hours=config.HORAS_MINIMAS_CANCELAMENTO)
    if agora > limite:
        raise RegraNegocioError(
            f"Cancelamento só até {config.HORAS_MINIMAS_CANCELAMENTO}h antes "
            f"(limite: {limite:%d/%m %H:%M})",
            {"limite": limite.isoformat()}, codigo="PRAZO_CANCELAMENTO")
    ag.status = St.CANCELADO
    ag.motivo_nao_recebimento = Motivo.CANCELADO_FORNECEDOR
    ag.cancelado_em = agora
    db.commit()
    return buscar(db, ag_id)


# ------------------------------------------------------------------ compras

def aprovar(db: Session, ag_id: int, dados, agora: Optional[datetime] = None) -> Agendamento:
    ag = buscar(db, ag_id, travar=True)
    _exigir_status(ag, {St.PENDENTE}, "aprovar")
    ag.pedido_compra = dados.pedido_compra
    ag.analisado_por = dados.analisado_por
    ag.analisado_em = _agora(agora)
    ag.observacao_compras = dados.observacao
    ag.status = St.APROVADO      # próximo passo: o armazém define armazém e baia
    db.commit()
    ag = buscar(db, ag_id)                                                  # NOVO
    notificacao_service.notificar(db, ag, TipoNotificacao.APROVADO)         # NOVO
    return buscar(db, ag_id)


def rejeitar(db: Session, ag_id: int, dados, agora: Optional[datetime] = None) -> Agendamento:
    if dados.motivo not in MOTIVOS_COMPRAS:                                 # NOVO
        raise RegraNegocioError(
            "Motivo inválido para reprovação do Compras",
            {"permitidos": sorted(m.value for m in MOTIVOS_COMPRAS)}, codigo="MOTIVO_INVALIDO")
    ag = buscar(db, ag_id, travar=True)
    _exigir_status(ag, {St.PENDENTE}, "rejeitar")
    ag.status = St.REJEITADO
    ag.motivo_nao_recebimento = dados.motivo
    ag.analisado_por = dados.analisado_por
    ag.analisado_em = _agora(agora)
    ag.observacao_compras = dados.observacao
    db.commit()                  # libera o horário e a nota (pode ser reenviada e reagendada)
    ag = buscar(db, ag_id)                                                  # NOVO
    notificacao_service.notificar(db, ag, TipoNotificacao.REPROVADO)        # NOVO
    return buscar(db, ag_id)


# ------------------------------------------------------------------ armazém

def _doca_unica(db: Session, local: LocalFisico) -> int:
    """Hoje cada armazém tem uma doca: se o operador não escolher, usa a única ativa."""
    ativas = list(db.scalars(select(Baia.id).where(Baia.local == local, Baia.ativa.is_(True))))
    if len(ativas) == 1:
        return ativas[0]
    raise RegraNegocioError(
        f"{local.value} tem {len(ativas)} docas ativas: informe qual (baia_id)",
        {"local": local.value, "docas_ativas": ativas}, codigo="DOCA_OBRIGATORIA")


def definir_destinos(db: Session, ag_id: int, destinos: list) -> Agendamento:
    """Logo após a aprovação do Compras, o armazém pré-programa armazém(ns) e baia(s).
    Pode ser refeito até a descarga daquele armazém começar."""
    ag = buscar(db, ag_id, travar=True)
    _exigir_status(ag, {St.APROVADO, St.DESTINO_DEFINIDO, St.NA_FILA, St.EM_DESCARGA},
                   "definir destino")
    # o fornecedor é avisado da doca enquanto o caminhão ainda não chegou     # NOVO
    avisar = ag.status in (St.APROVADO, St.DESTINO_DEFINIDO) and not ag.horario_chegada

    por_local = {}
    for d in destinos:                      # último informado vale, sem repetir armazém
        por_local[d.local] = d.baia_id or _doca_unica(db, d.local)
    baias = {b.id: b for b in db.scalars(select(Baia).where(Baia.id.in_(por_local.values())))}
    for local, baia_id in por_local.items():
        baia = baias.get(baia_id)
        if not baia or not baia.ativa:
            raise RegraNegocioError(f"Baia {baia_id} não existe ou está inativa",
                                    {"baia_id": baia_id}, codigo="BAIA_INVALIDA")
        if baia.local != local:
            raise RegraNegocioError(
                f"A baia {baia.codigo} é do armazém {baia.local.value}, não de {local.value}",
                {"baia_id": baia_id, "local_da_baia": baia.local.value}, codigo="BAIA_INVALIDA")

    for d in list(ag.descargas):
        if d.local not in por_local:
            if d.horario_entrada:
                raise RegraNegocioError(
                    f"Descarga em {d.local.value} já começou; não dá para remover",
                    codigo="DESCARGA_JA_INICIADA")
            ag.descargas.remove(d)
    atuais = {d.local: d for d in ag.descargas}
    for local, baia_id in por_local.items():
        if local in atuais:
            if not atuais[local].horario_entrada:
                atuais[local].baia_id = baia_id
        else:
            ag.descargas.append(Descarga(local=local, baia_id=baia_id))

    if ag.status == St.APROVADO:
        # Caminhão de balcão já está no pátio: com destino definido, entra direto na fila
        ag.status = St.NA_FILA if ag.horario_chegada else St.DESTINO_DEFINIDO
    db.commit()
    if avisar:                                                                          # NOVO
        notificacao_service.notificar(db, buscar(db, ag_id), TipoNotificacao.DESTINO_DEFINIDO)
    return buscar(db, ag_id)


def registrar_chegada(db: Session, ag_id: int, agora: Optional[datetime] = None) -> Agendamento:
    ag = buscar(db, ag_id, travar=True)
    if ag.status == St.APROVADO:
        raise RegraNegocioError(
            "O armazém ainda não definiu o destino e a baia deste caminhão",
            codigo="DESTINO_NAO_DEFINIDO")
    _exigir_status(ag, {St.DESTINO_DEFINIDO}, "registrar chegada")
    ag.horario_chegada = _agora(agora)
    ag.status = St.NA_FILA
    db.commit()
    return buscar(db, ag_id)


def iniciar_descarga(db: Session, ag_id: int, local: LocalFisico,
                     agora: Optional[datetime] = None) -> Agendamento:
    ag = buscar(db, ag_id, travar=True)
    _exigir_status(ag, {St.NA_FILA, St.EM_DESCARGA}, "iniciar descarga")
    desc = next((d for d in ag.descargas if d.local == local), None)
    if desc is None:
        raise RegraNegocioError(
            f"{local.value} não está entre os destinos programados. "
            "Inclua o armazém e a baia em /destinos antes de iniciar",
            {"programados": [d.local.value for d in ag.descargas]}, codigo="LOCAL_NAO_PROGRAMADO")
    if desc.horario_entrada:
        raise RegraNegocioError(f"Descarga em {local.value} já foi iniciada",
                                codigo="DESCARGA_JA_INICIADA")
    desc.horario_entrada = _agora(agora)
    ag.status = St.EM_DESCARGA
    db.commit()
    return buscar(db, ag_id)


def finalizar_descarga(db: Session, ag_id: int, dados, agora: Optional[datetime] = None) -> Agendamento:
    ag = buscar(db, ag_id, travar=True)
    _exigir_status(ag, {St.EM_DESCARGA}, "finalizar descarga")
    desc = next((d for d in ag.descargas if d.local == dados.local), None)
    if desc is None or not desc.horario_entrada:
        raise RegraNegocioError(f"Descarga em {dados.local.value} não foi iniciada",
                                codigo="DESCARGA_NAO_INICIADA")
    if desc.horario_saida:
        raise RegraNegocioError(f"Descarga em {dados.local.value} já foi finalizada",
                                codigo="DESCARGA_JA_FINALIZADA")

    codigos = [e.codigo for e in dados.equipamentos]
    validos = set(db.scalars(select(Equipamento.codigo).where(Equipamento.codigo.in_(codigos))))
    if (invalidos := sorted(set(codigos) - validos)):
        raise RegraNegocioError(f"Equipamento fora do catálogo: {', '.join(invalidos)}",
                                {"invalidos": invalidos}, codigo="EQUIPAMENTO_INVALIDO")

    desc.horario_saida = _agora(agora)
    desc.qtd_chapas = dados.qtd_chapas
    desc.equipamentos = [e.model_dump() for e in dados.equipamentos]
    if all(d.horario_saida for d in ag.descargas):
        ag.status = St.CONCLUIDO
    db.commit()
    return buscar(db, ag_id)


def marcar_nao_compareceu(db: Session, ag_id: int, agora: Optional[datetime] = None) -> Agendamento:
    agora = _agora(agora)
    ag = buscar(db, ag_id, travar=True)
    _exigir_status(ag, STATUS_ANTES_DA_CHEGADA, "marcar não comparecimento")
    if agora < fim_do_horario(ag.data, ag.horario):
        raise RegraNegocioError("A janela do agendamento ainda não terminou",
                                codigo="JANELA_EM_ANDAMENTO")
    ag.status = St.NAO_COMPARECEU
    ag.motivo_nao_recebimento = Motivo.NAO_COMPARECEU
    db.commit()
    return buscar(db, ag_id)


def agendar_balcao(db: Session, dados, agora: Optional[datetime] = None) -> Agendamento:
    """Chegou sem agendar. Com a nota lida e havendo vaga: agenda na hora
    (chegada já registrada). Sem vaga: grava o não recebimento (SEM_VAGA)."""
    agora = _agora(agora)
    hoje = agora.date()
    nota = buscar_nota(db, dados.nota_fiscal_id)
    if (ativo := _agendamento_ativo_da_nota(db, nota.id)):
        raise _erro_nota_ja_agendada(ativo)
    if not eh_dia_util(hoje):
        raise RegraNegocioError("Não há recebimento hoje", codigo="DIA_NAO_UTIL")
    if fim_do_horario(hoje, dados.horario) <= agora:
        raise RegraNegocioError("Essa janela de horário já terminou", codigo="HORARIO_PASSADO")

    _travar_horario(db, hoje, dados.horario)
    motivo = _motivo_sem_vaga(_ocupantes(db, hoje, dados.horario), dados.acondicionamento)
    if dados.email_contato:                                        # NOVO
        nota.fornecedor.email = dados.email_contato                # NOVO
    ag = Agendamento(
        **_dados_da_nota(nota), data=hoje, horario=dados.horario,
        acondicionamento=dados.acondicionamento,
        origem=Origem.BALCAO, ciente_risco_chuva=True, horario_chegada=agora,
        status=St.REJEITADO if motivo else St.PENDENTE,
        motivo_nao_recebimento=Motivo.SEM_VAGA if motivo else None,
        observacao_compras=motivo,
    )
    db.add(ag)
    db.commit()
    if motivo:
        raise RegraNegocioError(
            f"{motivo}. Não recebimento registrado (#{ag.id}); o fornecedor precisa agendar outra data",
            {"nao_recebimento_id": ag.id, "alternativas": sugerir_alternativas(
                db, hoje, dados.acondicionamento, nota.carga_adubo, agora)},
            codigo="SEM_VAGA_BALCAO")
    return buscar(db, ag.id)


def reagendar_por_chuva(db: Session, ag_id: int, dados) -> Agendamento:
    """Chuva impediu a descarga: o armazém move o caminhão para outro dia,
    com prioridade e sem respeitar o limite do horário (dossiê seção 4).
    Mantém a aprovação do Compras e os destinos/baias já programados."""
    orig = buscar(db, ag_id, travar=True)
    _exigir_status(orig, {St.APROVADO, St.DESTINO_DEFINIDO, St.NA_FILA}, "reagendar por chuva")
    nova_data = dados.nova_data or proximo_dia_util(orig.data)
    if not eh_dia_util(nova_data):
        raise RegraNegocioError("A nova data precisa ser dia útil", codigo="DIA_NAO_UTIL")

    orig.status = St.REAGENDADO
    orig.motivo_nao_recebimento = Motivo.CHUVA
    descargas = [Descarga(local=d.local, baia_id=d.baia_id) for d in orig.descargas]
    novo = Agendamento(
        fornecedor_id=orig.fornecedor_id, data=nova_data, horario=dados.novo_horario,
        acondicionamento=orig.acondicionamento, peso_kg=orig.peso_kg,
        nota_fiscal_id=orig.nota_fiscal_id, carga_adubo=orig.carga_adubo,
        origem_dado=orig.origem_dado,
        nf_arquivo_url=orig.nf_arquivo_url, nf_numero=orig.nf_numero, nf_chave=orig.nf_chave,
        pedido_compra=orig.pedido_compra, analisado_por=orig.analisado_por,
        analisado_em=orig.analisado_em, ciente_risco_chuva=True,
        status=St.DESTINO_DEFINIDO if descargas else St.APROVADO,
        origem=Origem.CHUVA, prioritario=True, reagendado_de_id=orig.id,
        descargas=descargas,
    )
    db.add(novo)
    db.commit()
    notificacao_service.notificar(db, buscar(db, novo.id), TipoNotificacao.REAGENDADO_CHUVA)  # NOVO
    return buscar(db, novo.id)


# ------------------------------------------------------------------ compras: conferência (NOVO)

def conferencia(db: Session, ag_id: int) -> dict:
    """Tudo que o Compras precisa para decidir: a nota lida e checagens automáticas.
    A decisão é humana: o sistema só aponta o que conferiu."""
    ag = buscar(db, ag_id)
    if not ag.nota_fiscal_id:
        raise RegraNegocioError("Agendamento sem nota fiscal vinculada", codigo="SEM_NOTA")
    nota = buscar_nota(db, ag.nota_fiscal_id)
    v = []
    v.append({"item": "Chave de acesso", "ok": chave_valida(nota.chave),
              "detalhe": "dígito verificador confere" if chave_valida(nota.chave)
              else "dígito verificador NÃO confere"})
    v.append({"item": "Emitente = fornecedor do agendamento",
              "ok": nota.fornecedor_id == ag.fornecedor_id,
              "detalhe": f"CNPJ {nota.fornecedor.cnpj} ({nota.fornecedor.nome})"})
    v.append({"item": "Peso informado na nota", "ok": nota.peso_bruto_kg is not None,
              "detalhe": f"{nota.peso_bruto_kg} kg" if nota.peso_bruto_kg else "nota sem peso"})
    v.append({"item": "Itens lidos da nota", "ok": bool(nota.itens),
              "detalhe": f"{len(nota.itens)} item(ns)" if nota.itens else "nenhum item identificado"})
    v.append({"item": "Alertas da leitura", "ok": not [a for a in nota.alertas
                                                       if "cadastrado automaticamente" not in a],
              "detalhe": "; ".join(nota.alertas) or "nenhum"})
    v.append({"item": "Fornecedor com e-mail para aviso", "ok": bool(ag.fornecedor.email),
              "detalhe": ag.fornecedor.email or "sem e-mail: o aviso só ficará registrado"})
    return {"agendamento": ag, "nota": nota, "verificacoes": v, "pedido_compra": None}


# ------------------------------------------------------------------ consultas

def listar(db: Session, data: Optional[date] = None, status: Optional[St] = None,
           fornecedor_id: Optional[int] = None,
           fornecedor_ids: Optional[list[int]] = None) -> list[Agendamento]:
    stmt = select(Agendamento).options(
        selectinload(Agendamento.descargas).selectinload(Descarga.baia),
        selectinload(Agendamento.fornecedor))
    if data:
        stmt = stmt.where(Agendamento.data == data)
    if status:
        stmt = stmt.where(Agendamento.status == status)
    if fornecedor_id:
        stmt = stmt.where(Agendamento.fornecedor_id == fornecedor_id)
    if fornecedor_ids is not None:
        stmt = stmt.where(Agendamento.fornecedor_id.in_(fornecedor_ids))
    return list(db.scalars(stmt.order_by(Agendamento.data, Agendamento.horario, Agendamento.id)))


def aguardando_destino(db: Session, data: Optional[date] = None) -> list[Agendamento]:
    """Caixa de entrada do armazém: aprovados pelo Compras que ainda não têm baia.
    É o "aviso" pedido pelo responsável: Compras liberou, o armazém programa onde parar."""
    ags = listar(db, data=data, status=St.APROVADO)
    ordem_h = {h: i for i, h in enumerate(Horario)}
    return sorted(ags, key=lambda a: (a.data, not a.prioritario, ordem_h[a.horario], a.id))


def fila_do_dia(db: Session, data: date, local: Optional[LocalFisico] = None) -> list[Agendamento]:
    """Ordem de atendimento da regra nova: reagendados por chuva primeiro,
    depois por horário agendado, depois por quem chegou antes."""
    ags = [a for a in listar(db, data=data) if a.status in STATUS_EM_ABERTO]
    if local:
        ags = [a for a in ags if any(d.local == local for d in a.descargas)]
    chegada_max = datetime.max.replace(tzinfo=config.TZ)
    ordem_h = {h: i for i, h in enumerate(Horario)}
    return sorted(ags, key=lambda a: (not a.prioritario, ordem_h[a.horario],
                                      a.horario_chegada or chegada_max, a.id))