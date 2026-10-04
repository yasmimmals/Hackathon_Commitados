export type PerfilUsuario = "FORNECEDOR" | "COMPRAS" | "ARMAZEM" | "ADMIN";

export type EmpresaUsuario = { id: number; nome: string; cnpj: string };

export type UsuarioApi = {
  id: number;
  email: string;
  nome: string;
  perfil: PerfilUsuario;
  /** Só para FORNECEDOR: a empresa cujos agendamentos ele enxerga. */
  fornecedor: EmpresaUsuario | null;
};

export type SessaoApi = {
  token: string;
  tipo: "Bearer";
  /** Segundos Unix. */
  expira_em: number;
  usuario: UsuarioApi;
};

export type LoginIn = { email: string; senha: string };

/** Fornecedor informa empresa e CNPJ; Compras e Armazém, o código interno. */
export type CadastroIn = {
  perfil: Exclude<PerfilUsuario, "ADMIN">;
  nome: string;
  email: string;
  senha: string;
  empresa?: string;
  cnpj?: string;
  codigo_interno?: string;
};
