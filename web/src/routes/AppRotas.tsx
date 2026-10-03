import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "@/features/auth/AuthContext";
import Login from "@/features/auth/Login";
import type { Perfil } from "@/features/auth/types";
import LayoutPerfil from "@/shared/components/layout/LayoutPerfil";
import RotaProtegida from "./RotaProtegida";
import { GRUPOS } from "./rotas";

function RedirecionarInicio() {
  const { usuario } = useAuth();
  return <Navigate to={usuario ? GRUPOS[usuario.perfil].base : "/"} replace />;
}

/**
 * Monta o React Router a partir de GRUPOS (ver ./rotas.tsx): cada grupo
 * fica protegido pelo perfil dono e a primeira rota é a página inicial.
 */
export default function AppRotas() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Login />} />

          {(Object.keys(GRUPOS) as Perfil[]).map((perfil) => {
            const { base, rotas } = GRUPOS[perfil];
            return (
              <Route key={perfil} path={base} element={<RotaProtegida perfil={perfil} />}>
                <Route element={<LayoutPerfil />}>
                  <Route index element={<Navigate to={rotas[0].path} replace />} />
                  {rotas.map((r) => (
                    <Route key={r.path} path={r.path} element={r.element} />
                  ))}
                </Route>
              </Route>
            );
          })}

          <Route path="*" element={<RedirecionarInicio />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
