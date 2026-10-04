import type { EmpresaUsuario } from "@/shared/services";

/** Área do sistema (grupo de rotas). O administrador acessa todas as áreas e a documentação. */
export type Perfil = "fornecedor" | "compras" | "armazem" | "administrador";

export type Usuario = {
  id: number;
  email: string;
  nome: string;
  perfil: Perfil;
  admin: boolean;
  /** Texto do cabeçalho para o fornecedor: "Razão social (CNPJ)". */
  empresa?: string;
  fornecedor: EmpresaUsuario | null;
};
