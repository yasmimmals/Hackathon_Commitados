import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { Usuario } from "./types";
import { USUARIOS_DEMO } from "./usuariosDemo";

type Auth = {
  usuario: Usuario | null;
  entrar: (email: string, senha: string) => Usuario;
  sair: () => void;
};

const CHAVE_SESSAO = "cocapec.sessao";

function lerSessao(): Usuario | null {
  try {
    const bruto = localStorage.getItem(CHAVE_SESSAO);
    return bruto ? (JSON.parse(bruto) as Usuario) : null;
  } catch {
    return null;
  }
}

function salvarSessao(usuario: Usuario | null) {
  try {
    if (usuario) localStorage.setItem(CHAVE_SESSAO, JSON.stringify(usuario));
    else localStorage.removeItem(CHAVE_SESSAO);
  } catch {
    // Armazenamento indisponível (aba anônima, bloqueio): a sessão vale só nesta aba.
  }
}

const AuthContext = createContext<Auth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(lerSessao);

  const entrar = useCallback((email: string, senha: string) => {
    const encontrado = USUARIOS_DEMO.find((u) => u.email === email.trim().toLowerCase());
    if (!encontrado || !senha) {
      throw new Error("E-mail ou senha inválidos.");
    }
    salvarSessao(encontrado);
    setUsuario(encontrado);
    return encontrado;
  }, []);

  const sair = useCallback(() => {
    salvarSessao(null);
    setUsuario(null);
  }, []);

  const valor = useMemo(() => ({ usuario, entrar, sair }), [usuario, entrar, sair]);
  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return auth;
}
