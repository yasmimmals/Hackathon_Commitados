class RegraNegocioError(Exception):
    """Violação de regra de negócio -> HTTP 409.
    `extra` vai junto na resposta (ex.: horários alternativos sugeridos)."""

    def __init__(self, mensagem: str, extra: dict | None = None):
        super().__init__(mensagem)
        self.extra = extra or {}


class NaoEncontradoError(Exception):
    """Recurso inexistente -> HTTP 404."""