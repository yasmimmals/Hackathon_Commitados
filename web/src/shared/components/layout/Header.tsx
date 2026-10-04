import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Building2, LogOut, Menu, Plus, Search, ShieldCheck, X } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import type { Perfil } from "@/features/auth/types";
import LogoCocapec from "@/shared/components/ui/LogoCocapec";
import { GRUPOS, itemMenuAtivo, menuDoPerfil } from "@/routes/rotas";

const CLASSE_PILULA =
  "inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-white px-4 py-1.5 text-[13px] font-semibold text-site-azul shadow-sm transition-colors hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-site-azul";

const CLASSE_CTA =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-site-verde px-6 py-3 text-xs font-bold text-white shadow-sm transition-colors hover:bg-site-verde-escuro focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-verde focus-visible:ring-offset-2";

const GRUPOS_ADMIN = [
  {
    nome: "Fornecedor",
    itens: [
      { href: "/fornecedor/agendamentos", rotulo: "Meus Agendamentos" },
      { href: "/fornecedor/agendar", rotulo: "Agendar Entrega" },
      { href: "/fornecedor/agendar-na-hora", rotulo: "Agendar na Hora" },
      { href: "/fornecedor/previsao", rotulo: "Previsão de Chuva" },
    ],
  },
  {
    nome: "Compras",
    itens: [
      { href: "/compras/validacoes", rotulo: "Fila de Validação" },
      { href: "/compras/historico", rotulo: "Histórico de Validações" },
    ],
  },
  {
    nome: "Armazém",
    itens: [
      { href: "/armazem/recebimento", rotulo: "Recebimento" },
      { href: "/armazem/clima", rotulo: "Boletim Agrometeorológico" },
      { href: "/armazem/boletim", rotulo: "Boletim de Produção" },
      { href: "/armazem/painel", rotulo: "Painel Gerencial" },
    ],
  },
  {
    nome: "Geral",
    itens: [{ href: "/documentacao", rotulo: "Documentação" }],
  },
];

export default function Header() {
  const { usuario, sair } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [menuAberto, setMenuAberto] = useState(false);

  const [ultimoPath, setUltimoPath] = useState(pathname);
  if (pathname !== ultimoPath) {
    setUltimoPath(pathname);
    setMenuAberto(false);
  }

  if (!usuario) return null;

  const isAdministrador = Boolean(usuario.admin || usuario.perfil === "administrador");
  const area: Perfil = isAdministrador ? "administrador" : usuario.perfil;
  const perfil = GRUPOS[area];
  const fornecedor = !isAdministrador && usuario.perfil === "fornecedor";
  const perfilMenu = isAdministrador ? "administrador" : area;
  const itens = menuDoPerfil(perfilMenu);
  const hrefAtivo = itemMenuAtivo(perfilMenu, pathname)?.href;

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get("q")?.toString().trim() ?? "";
    navigate(q ? `/fornecedor/agendamentos?q=${encodeURIComponent(q)}` : "/fornecedor/agendamentos");
  };

  const handleSair = () => {
    navigate("/", { replace: true });
    setTimeout(() => {
      sair();
    }, 50);
  };

  return (
    <header className="print:hidden">
      <div className="border-t-2 border-gray-700 bg-site-azul text-white">
        <div className="mx-auto flex max-w-[1300px] flex-wrap items-center justify-between gap-3 px-4 py-2.5">
          <p className="flex min-w-0 items-center gap-2 text-[13px]">
            {isAdministrador ? (
              <ShieldCheck className="h-4 w-4 shrink-0 text-site-amarelo" aria-hidden />
            ) : (
              <Building2 className="h-4 w-4 shrink-0 text-site-amarelo" aria-hidden />
            )}
            <span className="font-bold">{fornecedor ? "CNPJ:" : "Usuário:"}</span>
            <span className="truncate">
              {fornecedor ? (usuario.empresa ?? usuario.nome) : isAdministrador ? "Administrador" : usuario.nome}
            </span>
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
            <Link to={isAdministrador ? "/documentacao" : perfil.base} className={CLASSE_PILULA}>
              Espaço {isAdministrador ? "Administrador" : perfil.rotulo}
            </Link>
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
          <div className="flex items-center gap-3">
            <Link
              to={isAdministrador ? "/documentacao" : perfil.base}
              aria-label="Voltar para o início"
              className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-azul"
            >
              <LogoCocapec />
            </Link>
            {isAdministrador && (
              <span className="hidden sm:inline-flex items-center rounded-md bg-sky-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-site-azul">
                Visão Gerencial
              </span>
            )}
          </div>

          {!isAdministrador && (
            <nav aria-label="Navegação principal" className="hidden items-center gap-3 lg:flex max-w-[850px] xl:max-w-none overflow-x-auto py-1">
              <ul className="flex flex-wrap items-center gap-x-1 gap-y-0.5">
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
          )}

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

        {isAdministrador && (
          <div className="hidden lg:block border-t border-gray-100 bg-slate-50/90 shadow-inner">
            <div className="mx-auto max-w-[1300px] px-4 py-2">
              <nav aria-label="Navegação de gestão" className="flex items-center justify-between gap-4 overflow-x-auto">
                <div className="flex items-center gap-4 flex-wrap">
                  {GRUPOS_ADMIN.map((grupo, idx) => (
                    <div key={grupo.nome} className="flex items-center gap-1.5">
                      {idx > 0 && <span className="h-4 w-px bg-gray-300 mr-2 shrink-0" aria-hidden />}
                      <span className="font-bold text-[10px] uppercase tracking-wider text-gray-400 shrink-0">
                        {grupo.nome}:
                      </span>
                      <div className="flex items-center gap-1">
                        {grupo.itens.map((item) => {
                          const ativo = item.href === hrefAtivo;
                          return (
                            <Link
                              key={item.href}
                              to={item.href}
                              aria-current={ativo ? "page" : undefined}
                              className={`whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                                ativo
                                  ? "bg-site-azul text-white shadow-xs"
                                  : "text-gray-700 hover:bg-white hover:text-site-azul hover:shadow-xs"
                              }`}
                            >
                              {item.rotulo}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </nav>
            </div>
          </div>
        )}

        {menuAberto && (
          <nav id="menu-sistema" aria-label="Navegação principal" className="border-t border-gray-100 px-4 pb-4 lg:hidden">
            {isAdministrador ? (
              <div className="space-y-4 py-3">
                {GRUPOS_ADMIN.map((grupo) => (
                  <div key={grupo.nome} className="space-y-1">
                    <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Módulo {grupo.nome}
                    </p>
                    <ul className="space-y-0.5">
                      {grupo.itens.map((item) => {
                        const ativo = item.href === hrefAtivo;
                        return (
                          <li key={item.href}>
                            <Link
                              to={item.href}
                              aria-current={ativo ? "page" : undefined}
                              className={`block rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                                ativo ? "bg-site-azul text-white font-bold" : "text-site-azul hover:bg-sky-50"
                              }`}
                            >
                              {item.rotulo}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <ul className="divide-y divide-gray-100">
                  {itens.map((item) => {
                    const ativo = item.href === hrefAtivo;
                    return (
                      <li key={item.href}>
                        <Link
                          to={item.href}
                          aria-current={ativo ? "page" : undefined}
                          className={`block border-l-4 py-3 pl-3 text-sm font-semibold text-site-azul ${
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
                  <Link to="/fornecedor/agendar" className={`${CLASSE_CTA} mt-2 w-full`}>
                    <Plus className="h-4 w-4" aria-hidden /> Novo Agendamento
                  </Link>
                )}
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
