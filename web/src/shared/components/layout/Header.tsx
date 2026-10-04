import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Building2, LogOut, Menu, Plus, Search, X } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import type { Perfil } from "@/features/auth/types";
import LogoCocapec from "@/shared/components/ui/LogoCocapec";
import { GRUPOS, itemMenuAtivo, menuDoPerfil } from "@/routes/rotas";

const CLASSE_PILULA =
  "inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-white px-4 py-1.5 text-[13px] font-semibold text-site-azul shadow-sm transition-colors hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-site-azul";

const CLASSE_CTA =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-site-verde px-6 py-3 text-xs font-bold text-white shadow-sm transition-colors hover:bg-site-verde-escuro focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-verde focus-visible:ring-offset-2";

/** Cabeçalho do sistema no padrão do site institucional (barra azul + barra branca). */
export default function Header() {
  const { usuario, sair } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [menuAberto, setMenuAberto] = useState(false);

  // Fecha o menu do celular ao navegar.
  const [ultimoPath, setUltimoPath] = useState(pathname);
  if (pathname !== ultimoPath) {
    setUltimoPath(pathname);
    setMenuAberto(false);
  }

  if (!usuario) return null;

  // O ADMIN navega por todas as áreas: o menu acompanha a área aberta.
  const area: Perfil = usuario.admin
    ? ((Object.keys(GRUPOS) as Perfil[]).find((p) => pathname.startsWith(GRUPOS[p].base)) ?? usuario.perfil)
    : usuario.perfil;
  const perfil = GRUPOS[area];
  const fornecedor = area === "fornecedor";
  const itens = menuDoPerfil(area);
  const hrefAtivo = itemMenuAtivo(area, pathname)?.href;

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get("q")?.toString().trim() ?? "";
    navigate(q ? `/fornecedor/agendamentos?q=${encodeURIComponent(q)}` : "/fornecedor/agendamentos");
  };

  const handleSair = () => {
    sair();
    navigate("/", { replace: true });
  };

  return (
    <header>
      <div className="border-t-2 border-gray-700 bg-site-azul text-white">
        <div className="mx-auto flex max-w-[1300px] flex-wrap items-center justify-between gap-3 px-4 py-2.5">
          <p className="flex min-w-0 items-center gap-2 text-[13px]">
            <Building2 className="h-4 w-4 shrink-0 text-site-amarelo" aria-hidden />
            <span className="font-bold">{fornecedor ? "CNPJ:" : "Usuário:"}</span>
            <span className="truncate">{usuario.empresa ?? usuario.nome}</span>
          </p>

          {fornecedor && (
            <form role="search" onSubmit={handleSearch} className="relative order-3 w-full md:order-none md:w-[380px]">
              <input
                type="search"
                name="q"
                aria-label="Pesquisar agendamento"
                placeholder="Pesquisar agendamento, nota fiscal, placa..."
                className="w-full rounded-full border-2 border-site-azul-escuro bg-site-azul-escuro/60 py-1.5 pl-5 pr-11 text-[13px] text-white placeholder:text-white/85 focus-visible:border-white focus-visible:outline-none"
              />
              <button
                type="submit"
                aria-label="Buscar"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <Search className="h-5 w-5" aria-hidden />
              </button>
            </form>
          )}

          <div className="flex items-center gap-3">
            <Link to={perfil.base} className={CLASSE_PILULA}>
              Espaço {perfil.rotulo}
            </Link>
            <span
              aria-label="Idioma: português"
              className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-xs font-bold"
            >
              PT
            </span>
            <button
              type="button"
              onClick={handleSair}
              title="Sair"
              className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[13px] font-semibold hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <LogOut className="h-4 w-4" aria-hidden /> Sair
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-[0_2px_6px_rgba(0,0,0,0.08)]">
        <div className="mx-auto flex max-w-[1300px] items-center justify-between gap-6 px-4 py-2.5">
          <Link
            to={perfil.base}
            aria-label="Voltar para o início"
            className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-azul"
          >
            <LogoCocapec />
          </Link>

          <nav aria-label="Navegação principal" className="hidden items-center gap-6 lg:flex">
            <ul className="flex items-center gap-1">
              {itens.map((item) => {
                const ativo = item.href === hrefAtivo;
                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      aria-current={ativo ? "page" : undefined}
                      className={`block whitespace-nowrap border-b-[3px] px-3 py-2 text-[13px] font-semibold text-site-azul transition-colors hover:border-site-amarelo/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-azul ${
                        ativo ? "border-site-amarelo" : "border-transparent"
                      }`}
                    >
                      {item.rotulo}
                    </Link>
                  </li>
                );
              })}
            </ul>
            {fornecedor && (
              <Link to="/fornecedor/agendar" className={CLASSE_CTA}>
                <Plus className="h-4 w-4" aria-hidden /> Novo Agendamento
              </Link>
            )}
          </nav>

          <button
            type="button"
            onClick={() => setMenuAberto((a) => !a)}
            aria-expanded={menuAberto}
            aria-controls="menu-sistema"
            className="rounded-lg p-2 text-site-azul hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-azul lg:hidden"
          >
            {menuAberto ? <X className="h-6 w-6" aria-hidden /> : <Menu className="h-6 w-6" aria-hidden />}
            <span className="sr-only">{menuAberto ? "Fechar menu" : "Abrir menu"}</span>
          </button>
        </div>

        {menuAberto && (
          <nav id="menu-sistema" aria-label="Navegação principal" className="border-t border-gray-100 px-4 pb-4 lg:hidden">
            <ul className="divide-y divide-gray-100">
              {itens.map((item) => {
                const ativo = item.href === hrefAtivo;
                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      aria-current={ativo ? "page" : undefined}
                      className={`block border-l-4 py-3 pl-3 text-sm font-semibold text-site-azul ${ativo ? "border-site-amarelo" : "border-transparent"}`}
                    >
                      {item.rotulo}
                    </Link>
                  </li>
                );
              })}
            </ul>
            {fornecedor && (
              <Link to="/fornecedor/agendar" className={`${CLASSE_CTA} mt-2 w-full`}>
                <Plus className="h-4 w-4" aria-hidden /> Novo Agendamento
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
