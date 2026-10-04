import type { EmpresaUsuario } from "@/shared/services";

export type Perfil = "fornecedor" | "compras" | "armazem" | "administrador";

export type Usuario = {
  id: number;
  email: string;
  nome: string;
  perfil: Perfil;
  admin: boolean;
  empresa?: string;
  fornecedor: EmpresaUsuario | null;
};
