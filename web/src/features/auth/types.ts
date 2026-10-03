export type Perfil = "fornecedor" | "compras" | "armazem";

export type Usuario = {
  email: string;
  nome: string;
  perfil: Perfil;
  empresa?: string;
};
