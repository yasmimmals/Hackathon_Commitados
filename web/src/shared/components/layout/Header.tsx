import { Link, useLocation, useNavigate } from "react-router-dom";
import type { FormEvent } from "react";
import { ChevronDown, Leaf, LogOut, Plus, Search } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { GRUPOS, itemMenuAtivo, menuDoPerfil } from "@/routes/rotas";

export default function Header() {
  const { usuario, sair } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  if (!usuario) return null;

  const perfil = GRUPOS[usuario.perfil];
  const fornecedor = usuario.perfil === "fornecedor";
  const itens = menuDoPerfil(usuario.perfil);

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get("q")?.toString().trim() ?? "";
    navigate(
      q
        ? `/fornecedor/agendamentos?q=${encodeURIComponent(q)}`
        : "/fornecedor/agendamentos",
    );
  };

  const handleSair = () => {
    sair();
    navigate("/", { replace: true });
  };

  const hrefAtivo = itemMenuAtivo(usuario.perfil, pathname)?.href;

  return (
    <header className="agenda-header">
      <div className="agenda-header__shell">
        <div className="agenda-header__topbar">
          <div className="agenda-header__company">
            <span className="agenda-header__company-label">
              {fornecedor ? "CNPJ:" : "Usuário:"}
            </span>
            <span>{usuario.empresa ?? usuario.nome}</span>
          </div>

          {fornecedor && (
            <form
              className="agenda-header__search"
              role="search"
              onSubmit={handleSearch}
            >
              <input
                type="search"
                name="q"
                aria-label="Pesquisar agendamento"
                placeholder="Pesquisar agendamento, nota fiscal, placa..."
              />
              <button type="submit" aria-label="Buscar">
                <Search size={18} />
              </button>
            </form>
          )}

          <div className="agenda-header__toolbar">
            <button
              type="button"
              className="agenda-header__lang"
              aria-label="Selecionar idioma"
            >
              <span>PT</span>
              <ChevronDown size={14} />
            </button>

            <Link to={perfil.base} className="agenda-header__supplier">
              Espaço {perfil.rotulo}
            </Link>

            <button
              type="button"
              onClick={handleSair}
              className="agenda-header__avatar"
              aria-label="Sair"
              title="Sair"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>

        <div className="agenda-header__nav">
          <Link
            to={perfil.base}
            className="agenda-header__brand"
            aria-label="Voltar para início"
          >
            <span className="agenda-header__logo" aria-hidden="true">
              <Leaf size={18} />
            </span>
            <span className="agenda-header__brand-text">
              <span className="agenda-header__brand-name">COCAPEC</span>
              <span className="agenda-header__brand-slogan">
                O melhor café está aqui
              </span>
            </span>
          </Link>

          <nav className="agenda-header__menu" aria-label="Navegação principal">
            <ul className="agenda-header__list">
              {itens.map((item) => {
                const ativo = item.href === hrefAtivo;

                return (
                  <li
                    key={item.href}
                    className={`agenda-header__item ${ativo ? "agenda-header__item--active" : ""}`}
                  >
                    <Link
                      to={item.href}
                      aria-current={ativo ? "page" : undefined}
                    >
                      {item.rotulo}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {fornecedor && (
            <Link to="/fornecedor/agendar" className="agenda-header__cta">
              <Plus size={18} aria-hidden="true" />
              Novo Agendamento
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
