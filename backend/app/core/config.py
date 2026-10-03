"""Parâmetros de negócio num lugar só. Mudou a regra? Muda aqui."""
import os
from datetime import date, time
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