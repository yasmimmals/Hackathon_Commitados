"""Parâmetros de negócio num lugar só. Mudou a regra? Muda aqui."""
import os
from datetime import date, time
from decimal import Decimal
from zoneinfo import ZoneInfo

TZ = ZoneInfo("America/Sao_Paulo")

# Grade de horários (dossiê, seção 4) e quando cada janela "termina"
# (usado para saber se ainda dá para agendar no balcão)
GRADE = {
    "08:00": (time(8, 0), time(10, 0)),
    "10:00": (time(10, 0), time(13, 0)),
    "13:00": (time(13, 0), time(15, 0)),
    "15:00": (time(15, 0), time(17, 30)),
}

# Até 2 caminhões unitizados por horário; batido ocupa o horário sozinho
CAPACIDADE_POR_HORARIO = 2

# Dossiê: o limite vale para a cooperativa inteira, não por armazém
ESCOPO_CAPACIDADE = "global"

# Cancelamento só com antecedência mínima (conversa com o stakeholder)
HORAS_MINIMAS_CANCELAMENTO = 24

# Feriados sem recebimento (preencher com o calendário da cooperativa)
FERIADOS: set[date] = {
    date(2026, 10, 12), date(2026, 11, 2), date(2026, 11, 15),
    date(2026, 11, 20), date(2026, 12, 25),
}

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "/app/uploads")

# ---- Previsão de chuva (só afeta carga que vai para o pátio de adubos) ----
# Franca-SP. Fonte: Open-Meteo (gratuita, sem chave de API)
CLIMA_LATITUDE = -20.5386
CLIMA_LONGITUDE = -47.4009
CLIMA_URL = "https://api.open-meteo.com/v1/forecast"
CLIMA_CACHE_MINUTOS = 30
# A partir deste % a carga de adubo não pode ser agendada naquele horário
LIMIAR_BLOQUEIO_CHUVA = int(os.getenv("LIMIAR_BLOQUEIO_CHUVA", "80"))

# ---- Programação antecipada: estimativas de ordem de grandeza (dossiê, seções 7 e 9) ----
# Não são medições. Servem para o armazém se preparar e para estimar a equipe do dia.
JORNADA_MINUTOS = 480                 # 8 horas
PRODUTIVIDADE_EQUIPE = 0.90           # informada pelo responsável na conversa
CHAPAS_MINIMO_SE_HA_BATIDO = 5        # uma carga batida exige 5 chapas juntos
MINUTOS_EQUIPE_POR_VOLUME = 5         # ciclo completo por palete/big bag (tirar, levar, guardar)
MINUTOS_CAMINHAO_POR_VOLUME = 1.5     # só a retirada do caminhão (10 paletes = 15 min)
MINUTOS_BATIDO_ATE_10T = 40           # 200 sacas de 50 kg
MINUTOS_BATIDO_ACIMA_10T = 50         # 28 t a granel
MINUTOS_MAQUINA = 20                  # adubadeira ou implemento
VOLUMES_PADRAO = {"PALETIZADO": 10, "BIG_BAG": 20}   # quando a nota não permite estimar

# ---- Boletim diário (dossiê, seção 8) ----
PISO_DIARIA = Decimal("90.1731")       # diária completa: é o piso que forma o custo
# A Cocapec preenche UM boletim geral por dia (informado pelo responsável; a folha dos
# chapas também não separa armazém: LOCAL = FRANCA). O dossiê fala em um por armazém:
# para esse modo, troque para True. Nunca há os dois no mesmo dia.
BOLETIM_POR_ARMAZEM = False
LIMITE_CHAPAS_POR_BOLETIM = 20         # o formulário de papel tem 20 linhas
# Atenção: a planilha mostra "Meia diária R$ 45,0786", mas a fórmula dela (J65) nunca usa
# esse valor: meia diária conta como 0,5 diária equivalente x piso (= 45,08655).

# ---- E-mail para o fornecedor ----
# Sem SMTP_HOST, os avisos ficam só registrados (status SIMULADA). No docker-compose,
# o Mailpit recebe tudo e mostra em http://localhost:8025 (caixa de teste, não envia de verdade).
SMTP_HOST = os.getenv("SMTP_HOST") or None
SMTP_PORT = int(os.getenv("SMTP_PORT", "1025"))
SMTP_REMETENTE = os.getenv("SMTP_REMETENTE", "recebimento@cocapec.com.br")
# ---- Login ----
# Segredo que assina os tokens. Em produção, defina AUTH_SECRET no ambiente.
AUTH_SECRET = os.getenv("AUTH_SECRET", "cocapec-dev-troque-este-segredo")
TOKEN_VALIDADE_HORAS = int(os.getenv("TOKEN_VALIDADE_HORAS", "12"))
# Cadastro de COMPRAS e ARMAZEM exige este código (o fornecedor se cadastra livremente)
CODIGO_CADASTRO_INTERNO = os.getenv("CODIGO_CADASTRO_INTERNO", "COCAPEC-INTERNO")
SENHA_MINIMA = 8
