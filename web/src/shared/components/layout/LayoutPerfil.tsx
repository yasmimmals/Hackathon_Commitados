import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthContext";
import { itemMenuAtivo } from "@/routes/rotas";
import Footer from "./Footer";
import Header from "./Header";

const TITULO_PADRAO = "COCAPEC • Agendamento de Cargas";

export default function LayoutPerfil() {
  const { usuario } = useAuth();
  const { pathname } = useLocation();

  useEffect(() => {
    const item = usuario && itemMenuAtivo(usuario.perfil, pathname);
    document.title = item
      ? `${item.rotulo} | COCAPEC Agendamentos`
      : TITULO_PADRAO;
  }, [usuario, pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-fundo">
      <Header />
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-[22px]">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
