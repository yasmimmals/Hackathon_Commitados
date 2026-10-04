import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  aoExpirarSessao, buscarUsuarioAtual, cadastrar as cadastrarApi, definirToken, entrar as entrarApi,
  type CadastroIn, type SessaoApi, type UsuarioApi,
} from "@/shared/services";
import type { Perfil, Usuario } from "./types";

type Auth = {
  usuario: Usuario | null;
  /** true quando o backend recusou o token salvo (a tela de login avisa). */
  sessaoExpirada: boolean;
  entrar: (email: string, senha: string) => Promise<Usuario>;
  cadastrar: (dados: CadastroIn) => Promise<Usuario>;
  sair: () => void;
};

type SessaoSalva = { token: string; expiraEm: number; usuario: Usuario };

const CHAVE_SESSAO = "cocapec.sessao";

const AREA_DO_PERFIL: Record<UsuarioApi["perfil"], Perfil> = {
  FORNECEDOR: "fornecedor",
  COMPRAS: "compras",
  ARMAZEM: "armazem",
  ADMIN: "administrador",
};

const formatarCnpj = (cnpj: string) => cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");

function paraUsuario(u: UsuarioApi): Usuario {
  return {
    id: u.id,
    email: u.email,
    nome: u.nome,
    perfil: AREA_DO_PERFIL[u.perfil],
    admin: u.perfil === "ADMIN",
    empresa: u.fornecedor ? `${u.fornecedor.nome} (${formatarCnpj(u.fornecedor.cnpj)})` : undefined,
    fornecedor: u.fornecedor,
  };
}

function lerSessao(): SessaoSalva | null {
  try {
    const bruto = localStorage.getItem(CHAVE_SESSAO);
    const sessao = bruto ? (JSON.parse(bruto) as SessaoSalva) : null;
    // Sessões do login antigo (sem token) ou vencidas são descartadas.
    if (!sessao?.token || sessao.expiraEm * 1000 <= Date.now()) return null;
    return sessao;
  } catch {
    return null;
  }
}

function salvarSessao(sessao: SessaoSalva | null) {
  try {
    if (sessao) localStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
    else localStorage.removeItem(CHAVE_SESSAO);
  } catch {
    // Armazenamento indisponível (aba anônima, bloqueio): a sessão vale só nesta aba.
  }
}

const AuthContext = createContext<Auth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<SessaoSalva | null>(() => {
    const salva = lerSessao();
    definirToken(salva?.token ?? null); // antes do primeiro request das telas
    return salva;
  });
  const [sessaoExpirada, setSessaoExpirada] = useState(false);

  const aplicar = useCallback((nova: SessaoApi): Usuario => {
    const salva = { token: nova.token, expiraEm: nova.expira_em, usuario: paraUsuario(nova.usuario) };
    definirToken(salva.token);
    salvarSessao(salva);
    setSessao(salva);
    setSessaoExpirada(false);
    return salva.usuario;
  }, []);

  const sair = useCallback(() => {
    definirToken(null);
    salvarSessao(null);
    setSessao(null);
  }, []);

  const entrar = useCallback(
    async (email: string, senha: string) => aplicar(await entrarApi({ email, senha })),
    [aplicar],
  );

  const cadastrar = useCallback(async (dados: CadastroIn) => aplicar(await cadastrarApi(dados)), [aplicar]);

  // Token recusado pelo backend (vencido, usuário desativado): volta ao login com aviso.
  useEffect(
    () =>
      aoExpirarSessao(() => {
        sair();
        setSessaoExpirada(true);
      }),
    [sair],
  );

  // Ao abrir o app com sessão salva, confere o token e atualiza os dados do usuário.
  const token = sessao?.token;
  useEffect(() => {
    if (!token) return;
    let ativo = true;
    buscarUsuarioAtual().then(
      (u) =>
        ativo &&
        setSessao((atual) => {
          if (!atual) return atual;
          const nova = { ...atual, usuario: paraUsuario(u) };
          salvarSessao(nova);
          return nova;
        }),
      () => undefined, // 401 já é tratado por aoExpirarSessao; sem conexão, mantém a sessão
    );
    return () => {
      ativo = false;
    };
  }, [token]);

  const valor = useMemo(
    () => ({ usuario: sessao?.usuario ?? null, sessaoExpirada, entrar, cadastrar, sair }),
    [sessao, sessaoExpirada, entrar, cadastrar, sair],
  );
  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return auth;
}
