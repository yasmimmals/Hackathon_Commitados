import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Search, Truck, UserCheck } from "lucide-react";
import { SITE_COCAPEC } from "../constants";
import { useIdioma } from "../i18n";

const CLASSE_ESPACO =
  "inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-site-azul shadow-sm transition-colors hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-site-azul";

export default function BarraSuperior() {
  const { idioma, textos, alternar } = useIdioma();
  const [busca, setBusca] = useState("");

  // O portal não tem busca própria: pesquisa no site institucional.
  const pesquisar = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const termo = busca.trim();
    if (!termo) return;
    window.open(`https://www.google.com/search?q=${encodeURIComponent(`site:cocapec.com.br ${termo}`)}`, "_blank", "noopener");
  };

  return (
    <div className="border-t-2 border-gray-700 bg-site-azul">
      <div className="mx-auto flex max-w-[1300px] flex-wrap items-center justify-between gap-3 px-4 py-2.5">
        <form role="search" onSubmit={pesquisar} className="relative w-full sm:w-[415px]">
          <label htmlFor="busca-site" className="sr-only">{textos.buscaRotulo}</label>
          <input
            id="busca-site"
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder={textos.buscaRotulo}
            className="w-full rounded-full border-2 border-site-azul-escuro bg-site-azul-escuro/60 py-1.5 pl-5 pr-11 text-[13px] text-white placeholder:text-white/90 focus-visible:border-white focus-visible:outline-none"
          />
          <button
            type="submit"
            aria-label={textos.buscaBotao}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <Search className="h-5 w-5" aria-hidden />
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <a href={SITE_COCAPEC} className={CLASSE_ESPACO}>
            {textos.espacoCooperado} <UserCheck className="h-4 w-4 text-site-verde" aria-hidden />
          </a>
          <Link to="/login" className={CLASSE_ESPACO}>
            {textos.espacoFornecedor} <Truck className="h-4 w-4 text-site-verde" aria-hidden />
          </Link>
          <span className="ml-2 flex items-center gap-3 text-sm font-bold text-white">
            {(["pt", "en"] as const).map((opcao) =>
              opcao === idioma ? (
                <span
                  key={opcao}
                  aria-label={textos.idiomaAtual}
                  className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white"
                >
                  {opcao.toUpperCase()}
                </span>
              ) : (
                <button
                  key={opcao}
                  type="button"
                  onClick={alternar}
                  lang={opcao === "en" ? "en" : "pt-BR"}
                  aria-label={textos.mudarIdioma}
                  className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  {opcao.toUpperCase()}
                </button>
              ),
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
