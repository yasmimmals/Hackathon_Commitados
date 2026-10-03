class RegraNegocioError(Exception):
    """Violação de regra de negócio -> HTTP 409.

    codigo:   identificador estável para o frontend tratar o caso (ex.: VAGA_OCUPADA)
    extra:    vai na resposta como `detalhes` (ex.: horários alternativos sugeridos)
    """

    def __init__(self, mensagem: str, extra: dict | None = None,
                 codigo: str = "REGRA_NEGOCIO"):
        super().__init__(mensagem)
        self.extra = extra or {}
        self.codigo = codigo


class NaoEncontradoError(Exception):
    """Recurso inexistente -> HTTP 404."""