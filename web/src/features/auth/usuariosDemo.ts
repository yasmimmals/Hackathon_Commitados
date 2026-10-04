import type { Perfil } from "./types";

/** Acessos de demonstração criados pelo seed do backend (scripts/seed.py). */
export const SENHA_DEMO = "Cocapec@2026";

export const USUARIOS_DEMO: { email: string; perfil: Perfil; rotulo: string }[] = [
  { email: "fornecedor@cocapec.com.br", perfil: "fornecedor", rotulo: "Fornecedor (Sumitomo)" },
  { email: "compras@cocapec.com.br", perfil: "compras", rotulo: "Compras" },
  { email: "armazem@cocapec.com.br", perfil: "armazem", rotulo: "Responsável pelo Armazém" },
  { email: "admin@cocapec.com.br", perfil: "administrador", rotulo: "Administrador (todas as áreas + Documentação)" },
];
