"""Senhas e tokens de acesso, só com a biblioteca padrão (sem dependências novas).

Senha: PBKDF2-HMAC-SHA256 com sal aleatório, guardada como
    pbkdf2_sha256$<iteracoes>$<sal hex>$<hash hex>
Token: <payload base64url>.<assinatura HMAC-SHA256 base64url>, com expiração (`exp`).
"""
import base64
import hashlib
import hmac
import json
import secrets
import time
from typing import Optional

from app.core import config

_ALGORITMO = "pbkdf2_sha256"
_ITERACOES = 260_000


def gerar_hash_senha(senha: str) -> str:
    sal = secrets.token_bytes(16)
    dk = hashlib.pbkdf2_hmac("sha256", senha.encode(), sal, _ITERACOES)
    return f"{_ALGORITMO}${_ITERACOES}${sal.hex()}${dk.hex()}"


def conferir_senha(senha: str, guardado: str) -> bool:
    try:
        algoritmo, iteracoes, sal, esperado = guardado.split("$")
    except ValueError:
        return False
    if algoritmo != _ALGORITMO:
        return False
    dk = hashlib.pbkdf2_hmac("sha256", senha.encode(), bytes.fromhex(sal), int(iteracoes))
    return hmac.compare_digest(dk.hex(), esperado)


def _b64(dados: bytes) -> str:
    return base64.urlsafe_b64encode(dados).rstrip(b"=").decode()


def _de_b64(texto: str) -> bytes:
    return base64.urlsafe_b64decode(texto + "=" * (-len(texto) % 4))


def _assinar(parte: str) -> str:
    return _b64(hmac.new(config.AUTH_SECRET.encode(), parte.encode(), hashlib.sha256).digest())


def gerar_token(usuario_id: int, perfil: str, agora: Optional[float] = None) -> tuple[str, int]:
    """Devolve (token, expira_em em segundos Unix)."""
    expira = int((agora or time.time()) + config.TOKEN_VALIDADE_HORAS * 3600)
    payload = _b64(json.dumps({"sub": usuario_id, "perfil": perfil, "exp": expira},
                              separators=(",", ":")).encode())
    return f"{payload}.{_assinar(payload)}", expira


def ler_token(token: str, agora: Optional[float] = None) -> Optional[dict]:
    """Payload do token se a assinatura confere e ele não expirou; senão None."""
    try:
        payload, assinatura = token.split(".")
    except ValueError:
        return None
    if not hmac.compare_digest(_assinar(payload), assinatura):
        return None
    try:
        dados = json.loads(_de_b64(payload))
    except (ValueError, json.JSONDecodeError):
        return None
    if dados.get("exp", 0) < (agora or time.time()):
        return None
    return dados
