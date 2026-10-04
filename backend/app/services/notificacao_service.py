"""Avisos por e-mail ao fornecedor nas etapas que mudam a vida dele:
aprovado, reprovado (com motivo), doca definida e reagendado por chuva.

Todo aviso é GRAVADO (tabela notificacoes), mesmo sem servidor de e-mail: vira histórico
e prova de que o fornecedor foi informado. O envio é tentado só se SMTP_HOST existir.
Falha de e-mail nunca desfaz a operação de negócio (aprovar, reprovar...).
"""
import logging
import smtplib
from email.message import EmailMessage

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core import config
from app.models import (
    Agendamento, MotivoNaoRecebimento as M, Notificacao, StatusNotificacao as SN,
    TipoNotificacao as T,
)

log = logging.getLogger(__name__)

MOTIVO_LEGIVEL = {
    M.DIVERGENCIA_NF_PEDIDO: "os itens da nota fiscal não conferem com o pedido de compra",
    M.SEM_PEDIDO: "não há pedido de compra correspondente a esta nota fiscal",
    M.REJEITADO_COMPRAS: "a entrega não foi autorizada pelo setor de Compras",
    M.OUTRO: "outro motivo (veja a observação)",
}


def _docas(ag: Agendamento) -> str:
    return "; ".join(f"{d.baia.nome if d.baia else d.local.value}" for d in ag.descargas) or "a definir"


def _montar(ag: Agendamento, tipo: T) -> tuple[str, str]:
    nf, quando = ag.nf_numero or "-", f"{ag.data:%d/%m/%Y} às {ag.horario.value}"
    ola = f"Olá, {ag.fornecedor.nome}.\n\n"
    rodape = "\n\nCocapec - Recebimento de Mercadorias\n(mensagem automática, não responda)"
    if tipo == T.APROVADO:
        corpo = (f"O setor de Compras aprovou a entrega da NF {nf}, agendada para {quando}.\n"
                 "Em seguida o armazém informará a doca onde o caminhão deve parar.")
        if ag.carga_adubo:
            corpo += ("\n\nAtenção: a descarga de adubo é feita em pátio aberto. Se chover, ela "
                      "será reagendada para o próximo dia útil, com prioridade.")
        return f"Cocapec: entrega aprovada - NF {nf} ({quando})", ola + corpo + rodape
    if tipo == T.REPROVADO:
        corpo = (f"A entrega da NF {nf}, agendada para {quando}, NÃO foi aprovada.\n\n"
                 f"Motivo: {MOTIVO_LEGIVEL.get(ag.motivo_nao_recebimento, '-')}.\n"
                 f"Observação do setor de Compras: {ag.observacao_compras or '-'}\n\n"
                 "O horário foi liberado. Depois de resolver a pendência, envie a nota "
                 "novamente pela plataforma e faça um novo agendamento.")
        return f"Cocapec: entrega NÃO aprovada - NF {nf}", ola + corpo + rodape
    if tipo == T.DESTINO_DEFINIDO:
        corpo = (f"A descarga da NF {nf} está programada para {quando}.\n"
                 f"Local de descarga: {_docas(ag)}.\n\n"
                 "Apresente-se na portaria no horário agendado.")
        return f"Cocapec: doca definida - NF {nf} ({quando})", ola + corpo + rodape
    corpo = (f"Por causa da chuva, a descarga da NF {nf} foi reagendada para {quando}, "
             f"com PRIORIDADE na fila.\nLocal de descarga: {_docas(ag)}.")
    return f"Cocapec: descarga reagendada por chuva - NF {nf} ({quando})", ola + corpo + rodape


def _enviar(destinatario: str, assunto: str, corpo: str) -> None:
    msg = EmailMessage()
    msg["From"], msg["To"], msg["Subject"] = config.SMTP_REMETENTE, destinatario, assunto
    msg.set_content(corpo)
    with smtplib.SMTP(config.SMTP_HOST, config.SMTP_PORT, timeout=5) as smtp:
        smtp.send_message(msg)


def notificar(db: Session, ag: Agendamento, tipo: T) -> Notificacao:
    assunto, corpo = _montar(ag, tipo)
    destinatario = ag.fornecedor.email
    status, erro = SN.SIMULADA, None
    if not destinatario:
        status = SN.SEM_DESTINATARIO
    elif config.SMTP_HOST:
        try:
            _enviar(destinatario, assunto, corpo)
            status = SN.ENVIADA
        except Exception as e:             # e-mail fora do ar não pode travar o recebimento
            status, erro = SN.FALHOU, str(e)
            log.warning("Falha ao enviar e-mail para %s: %s", destinatario, e)
    n = Notificacao(agendamento_id=ag.id, tipo=tipo, destinatario=destinatario,
                    assunto=assunto, corpo=corpo, status=status, erro=erro)
    db.add(n)
    db.commit()
    return n


def listar(db: Session, agendamento_id: int) -> list[Notificacao]:
    return list(db.scalars(select(Notificacao).where(Notificacao.agendamento_id == agendamento_id)
                           .order_by(Notificacao.id)))