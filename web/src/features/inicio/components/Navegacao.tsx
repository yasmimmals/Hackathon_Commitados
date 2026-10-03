import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Menu, X } from "lucide-react";
import { MENU, SITE_COCAPEC } from "../constants";
import LogoCocapec from "@/shared/components/ui/LogoCocapec";

const CLASSE_CONTATO =
  "inline-flex items-center justify-center rounded-full bg-site-verde px-12 py-3 text-xs font-bold text-white shadow-sm transition-colors hover:bg-site-verde-escuro focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-verde focus-visible:ring-offset-2";

export default function Navegacao() {
  const [aberto, setAberto] = useState(false);

  return (
    <header className="bg-white shadow-[0_2px_6px_rgba(0,0,0,0.08)]">
      <div className="mx-auto flex max-w-[1300px] items-center justify-between gap-6 px-4 py-2.5">
        <Link to="/" aria-label="COCAPEC — página inicial" className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-azul">
          <LogoCocapec />
        </Link>

        <nav aria-label="Principal" className="hidden items-center gap-7 lg:flex">
          <ul className="flex items-center gap-5 xl:gap-6">
            {MENU.map(({ rotulo, submenu }) => (
              <li key={rotulo}>
                <a
                  href={SITE_COCAPEC}
                  className={`flex items-center gap-1.5 whitespace-nowrap text-[13px] font-semibold text-site-azul hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-azul ${submenu ? "" : "ml-4"}`}
                >
                  {rotulo}
                  {submenu && (
                    <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-site-azul" aria-hidden>
                      <ChevronDown className="h-2.5 w-2.5" />
                    </span>
                  )}
                </a>
              </li>
            ))}
          </ul>
          <a href={SITE_COCAPEC} className={CLASSE_CONTATO}>Contato</a>
        </nav>

        <button
          type="button"
          onClick={() => setAberto((a) => !a)}
          aria-expanded={aberto}
          aria-controls="menu-movel"
          className="rounded-lg p-2 text-site-azul hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-azul lg:hidden"
        >
          {aberto ? <X className="h-6 w-6" aria-hidden /> : <Menu className="h-6 w-6" aria-hidden />}
          <span className="sr-only">{aberto ? "Fechar menu" : "Abrir menu"}</span>
        </button>
      </div>

      {aberto && (
        <nav id="menu-movel" aria-label="Principal" className="border-t border-gray-100 px-4 pb-4 lg:hidden">
          <ul className="divide-y divide-gray-100">
            {MENU.map(({ rotulo }) => (
              <li key={rotulo}>
                <a href={SITE_COCAPEC} className="block py-3 text-sm font-semibold text-site-azul">{rotulo}</a>
              </li>
            ))}
          </ul>
          <a href={SITE_COCAPEC} className={`${CLASSE_CONTATO} mt-2 w-full`}>Contato</a>
        </nav>
      )}
    </header>
  );
}
