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

class NaoAutenticadoError(Exception):
    """Sem login, token inválido/expirado ou credenciais erradas -> HTTP 401."""

    def __init__(self, mensagem: str, codigo: str = "NAO_AUTENTICADO"):
        super().__init__(mensagem)
        self.codigo = codigo


class AcessoNegadoError(Exception):
    """Logado, mas o perfil não pode fazer isto -> HTTP 403."""

    def __init__(self, mensagem: str = "Seu perfil não tem acesso a este recurso",
                 codigo: str = "ACESSO_NEGADO"):
        super().__init__(mensagem)
        self.codigo = codigo
