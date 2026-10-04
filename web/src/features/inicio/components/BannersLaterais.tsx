import { Coffee, Tractor } from "lucide-react";
import { useIdioma } from "../i18n";

const CLASSE_BANNER =
  "relative flex h-[160px] overflow-hidden rounded-lg shadow-md transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-azul focus-visible:ring-offset-2 md:h-[188px]";

export default function BannersLaterais() {
  const { banners } = useIdioma().textos;
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
      <a
        href="https://www.senhorcafe.com.br"
        target="_blank"
        rel="noreferrer"
        className={`${CLASSE_BANNER} bg-[radial-gradient(circle_at_75%_45%,#a0522d_0%,#5c2e12_45%,#3b1d0b_100%)]`}
      >
        <span className="relative z-10 flex flex-col justify-between p-5 text-white">
          <span className="text-sm font-semibold">{banners.lojaOnline}</span>
          <span className="font-serif text-4xl font-black italic leading-none text-amber-100 md:text-5xl">
            Senhor
            <br />
            Café
          </span>
          <span className="text-sm font-bold">www.senhorcafe.com.br</span>
        </span>
        <Coffee aria-hidden className="absolute -right-4 top-1/2 h-36 w-36 -translate-y-1/2 text-amber-200/40 md:h-44 md:w-44" />
      </a>

      <a
        href="https://www.cocapec.com.br"
        className={`${CLASSE_BANNER} bg-[linear-gradient(110deg,#1e2a78_0%,#2b3a9a_55%,#c62839_55%,#d93a3a_100%)]`}
      >
        <span className="relative z-10 flex flex-col justify-between p-5 text-white">
          <span className="text-xs font-bold uppercase leading-tight tracking-widest">
            {banners.forte1}
            <br />
            {banners.forte2}
          </span>
          <span>
            <span className="block text-sm">{banners.concessionaria}</span>
            <span className="block text-3xl font-black md:text-4xl">{banners.oficial}</span>
          </span>
          <span className="text-lg font-bold tracking-wider">mahindra</span>
        </span>
        <Tractor aria-hidden className="absolute -right-3 bottom-2 h-32 w-32 text-red-200 md:h-40 md:w-40" />
      </a>
    </div>
  );
}
