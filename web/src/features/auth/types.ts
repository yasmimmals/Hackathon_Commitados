import type { EmpresaUsuario } from "@/shared/services";

/** Área do sistema (grupo de rotas). O ADMIN entra pela área do armazém e acessa todas. */
export type Perfil = "fornecedor" | "compras" | "armazem";

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
