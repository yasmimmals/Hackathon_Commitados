import axios, { AxiosError } from "axios";

/**
 * Cliente HTTP da API do backend (FastAPI).
 * Todas as rotas ficam sob /api/v1. Swagger: http://localhost:8000/swagger
 *
 * Para apontar para outra máquina, defina no .env.local:
 *   NEXT_PUBLIC_API_URL=http://192.168.0.10:8000/api/v1
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
export const api = axios.create({
  baseURL: API_URL,
  timeout: 30_000,
});
/** Formato único de erro do backend (app/core/error_handlers.py). */
export type ErroApiCorpo = {
  codigo: string;
  mensagem: string;
  detalhes: Record<string, unknown>;
};

/**
 * Erro normalizado: 409 = regra de negócio | 404 = não encontrado | 422 = dados inválidos.
 * Use `codigo` para tratar casos específicos (ex.: "VAGA_OCUPADA", "BAIA_DUPLICADA").
 */
export class ErroApi extends Error {
  constructor(
    public readonly status: number,
    public readonly codigo: string,
    mensagem: string,
    public readonly detalhes: Record<string, unknown> = {},
  ) {
    super(mensagem);
    this.name = "ErroApi";
  }
}

/** Texto para exibir ao usuário a partir de qualquer erro (ErroApi ou inesperado). */
export function mensagemDeErro(erro: unknown): string {
  if (erro instanceof Error && erro.message) return erro.message;
  return "Ocorreu um erro inesperado. Tente novamente.";
}

api.interceptors.response.use(
  (resposta) => resposta,
  (erro: AxiosError<Partial<ErroApiCorpo>>) => {
    const corpo = erro.response?.data;
    if (erro.response && corpo?.codigo) {
      return Promise.reject(
        new ErroApi(erro.response.status, corpo.codigo, corpo.mensagem ?? erro.message, corpo.detalhes ?? {}),
      );
    }
    if (erro.response) {
      return Promise.reject(new ErroApi(erro.response.status, "HTTP", erro.message));
    }
    return Promise.reject(new ErroApi(0, "SEM_CONEXAO", "Não foi possível conectar ao servidor"));
  },
);
