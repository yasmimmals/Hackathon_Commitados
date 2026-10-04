import axios, { AxiosError } from "axios";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1";
export const api = axios.create({
  baseURL: API_URL,
  timeout: 30_000,
});

let tokenAtual: string | null = null;
const aoExpirar = new Set<() => void>();

export function definirToken(token: string | null) {
  tokenAtual = token;
}

export function aoExpirarSessao(callback: () => void) {
  aoExpirar.add(callback);
  return () => {
    aoExpirar.delete(callback);
  };
}

api.interceptors.request.use((config) => {
  if (tokenAtual) config.headers.Authorization = `Bearer ${tokenAtual}`;
  return config;
});
export type ErroApiCorpo = {
  codigo: string;
  mensagem: string;
  detalhes: Record<string, unknown>;
};

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

export function mensagemDeErro(erro: unknown): string {
  if (erro instanceof ErroApi && erro.codigo === "VALIDACAO") {
    const primeiro = (erro.detalhes.erros as { msg?: string }[] | undefined)?.[0]?.msg;
    if (primeiro) return primeiro.replace(/^Value error, /, "");
  }
  if (erro instanceof Error && erro.message) return erro.message;
  return "Ocorreu um erro inesperado. Tente novamente.";
}

api.interceptors.response.use(
  (resposta) => resposta,
  (erro: AxiosError<Partial<ErroApiCorpo>>) => {
    const corpo = erro.response?.data;
    if (erro.response?.status === 401 && tokenAtual && !erro.config?.url?.startsWith("/auth/login")) {
      aoExpirar.forEach((callback) => callback());
    }
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
