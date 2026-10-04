import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthContext";
import { itemMenuAtivo } from "@/routes/rotas";
import Footer from "./Footer";
import Header from "./Header";
import BarraAcessibilidade from "../ui/BarraAcessibilidade";

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
      <a
        href="#conteudo-principal"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-site-azul focus:px-4 focus:py-2 focus:text-xs focus:font-bold focus:text-white focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-white"
      >
        Pular para o conteúdo principal
      </a>

      <Header />
      <main id="conteudo-principal" className="mx-auto w-full max-w-[1300px] flex-1 px-4 py-6" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
      <BarraAcessibilidade />
    </div>
  );
}
