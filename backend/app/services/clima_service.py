"""Probabilidade de chuva por horário de agendamento (Open-Meteo).

Busca a previsão horária dos próximos 16 dias de uma vez e guarda em cache.
Se a API falhar ou a data estiver além do alcance da previsão, devolve None:
o agendamento NÃO é bloqueado por falha externa, só ganha o aviso de risco.
"""
import logging
from datetime import date, datetime, timedelta
from typing import Optional

import httpx

from app.core import config
from app.models import Horario

log = logging.getLogger(__name__)
_cache: dict = {"em": None, "horas": {}}


def _buscar_previsao_horaria() -> dict[datetime, int]:
    agora = datetime.now(config.TZ)
    if _cache["em"] and agora - _cache["em"] < timedelta(minutes=config.CLIMA_CACHE_MINUTOS):
        return _cache["horas"]
    resp = httpx.get(config.CLIMA_URL, timeout=5, params={
        "latitude": config.CLIMA_LATITUDE,
        "longitude": config.CLIMA_LONGITUDE,
        "hourly": "precipitation_probability",
        "timezone": "America/Sao_Paulo",
        "forecast_days": 16,
    })
    resp.raise_for_status()
    hourly = resp.json()["hourly"]
    horas = {
        datetime.fromisoformat(t).replace(tzinfo=config.TZ): int(p)
        for t, p in zip(hourly["time"], hourly["precipitation_probability"])
        if p is not None
    }
    _cache.update(em=agora, horas=horas)
    return horas


def prob_chuva(data: date, horario: Horario) -> Optional[int]:
    """Maior probabilidade de chuva (%) dentro da janela do horário, ou None."""
    try:
        horas = _buscar_previsao_horaria()
    except Exception as e:  # rede, timeout, formato inesperado
        log.warning("Previsão de chuva indisponível: %s", e)
        return None
    inicio, fim = config.GRADE[horario.value]
    ini = datetime.combine(data, inicio, tzinfo=config.TZ)
    fim = datetime.combine(data, fim, tzinfo=config.TZ)
    janela = [p for h, p in horas.items() if ini <= h < fim]
    return max(janela) if janela else None


def classificar(prob: Optional[int]) -> str:
    """BLOQUEADO (>= limiar) | RISCO (alguma chance ou previsão indisponível) | SEM_RISCO"""
    if prob is None:
        return "RISCO"
    if prob >= config.LIMIAR_BLOQUEIO_CHUVA:
        return "BLOQUEADO"
    return "RISCO" if prob > 0 else "SEM_RISCO"