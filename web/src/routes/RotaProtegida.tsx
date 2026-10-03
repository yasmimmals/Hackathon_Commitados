import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthContext";
import { GRUPOS } from "./rotas";
import type { Perfil } from "@/features/auth/types";

/** Libera as rotas filhas apenas para o perfil informado. */
export default function RotaProtegida({ perfil }: { perfil: Perfil }) {
  const { usuario } = useAuth();
  const location = useLocation();

  if (!usuario) {
    return <Navigate to="/" replace state={{ de: location.pathname + location.search }} />;
  }
  if (usuario.perfil !== perfil) {
    return <Navigate to={GRUPOS[usuario.perfil].base} replace />;
  }
  return <Outlet />;
}
