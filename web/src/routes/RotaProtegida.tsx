import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthContext";
import { GRUPOS } from "./rotas";
import type { Perfil } from "@/features/auth/types";

/** Libera as rotas filhas apenas para o perfil informado (o ADMIN acessa todas as áreas). */
export default function RotaProtegida({ perfil }: { perfil: Perfil }) {
  const { usuario } = useAuth();
  const location = useLocation();

  if (!usuario) {
    return <Navigate to="/login" replace state={{ de: location.pathname + location.search }} />;
  }
  if (usuario.perfil !== perfil && !usuario.admin) {
    return <Navigate to={GRUPOS[usuario.perfil].base} replace />;
  }
  return <Outlet />;
}
