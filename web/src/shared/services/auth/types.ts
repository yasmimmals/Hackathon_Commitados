export type PerfilUsuario = "FORNECEDOR" | "COMPRAS" | "ARMAZEM" | "ADMIN";

export type EmpresaUsuario = { id: number; nome: string; cnpj: string };

export type UsuarioApi = {
  id: number;
  email: string;
  nome: string;
  perfil: PerfilUsuario;
  fornecedor: EmpresaUsuario | null;
};

export type SessaoApi = {
  token: string;
  tipo: "Bearer";
  expira_em: number;
  usuario: UsuarioApi;
};

export type LoginIn = { email: string; senha: string };

export type CadastroIn = {
  perfil: Exclude<PerfilUsuario, "ADMIN">;
  nome: string;
  email: string;
  senha: string;
  empresa?: string;
  cnpj?: string;
  codigo_interno?: string;
};
