import type { Usuario } from "./types";

/** Acessos de demonstração enquanto não há backend (qualquer senha é aceita). */
export const USUARIOS_DEMO: Usuario[] = [
  {
    email: "fornecedor@cocapec.com.br",
    nome: "Fertilizantes Vale do Café",
    perfil: "fornecedor",
    empresa: "Fertilizantes Vale do Café Ltda (14.285.390/0001-44)",
  },
  { email: "compras@cocapec.com.br", nome: "Equipe de Compras", perfil: "compras" },
  { email: "armazem@cocapec.com.br", nome: "Responsável Armazém Franca", perfil: "armazem" },
];
