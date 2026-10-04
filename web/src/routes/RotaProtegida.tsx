import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthContext";
import { GRUPOS } from "./rotas";
import type { Perfil } from "@/features/auth/types";

export default function RotaProtegida({ perfil }: { perfil: Perfil }) {
  const { usuario } = useAuth();
  const location = useLocation();

  if (!usuario) {
    return <Navigate to="/login" replace state={{ de: location.pathname + location.search }} />;
  }
  // Controle só do front (demonstração). A proteção real exige autenticação no backend.
  // A área de documentação (perfil "administrador") só é acessível por administradores.
  // Outros perfis são redirecionados para a página inicial do próprio perfil.
  if (perfil === "administrador") {
    if (!usuario.admin && usuario.perfil !== "administrador") {
      return <Navigate to={GRUPOS[usuario.perfil].base} replace />;
    }
    return <Outlet />;
  }

  if (usuario.perfil !== perfil && !usuario.admin) {
    return <Navigate to={GRUPOS[usuario.perfil].base} replace />;
  }

  return <Outlet />;
}
