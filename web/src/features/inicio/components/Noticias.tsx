import { CalendarDays } from "lucide-react";
import { NOTICIAS, SITE_COCAPEC } from "../constants";
import { useIdioma } from "../i18n";

export default function Noticias() {
  const { textos } = useIdioma();
  const { noticias } = textos;
  const formatarData = (iso: string) =>
    new Date(`${iso}T12:00:00`).toLocaleDateString(textos.lang, { day: "2-digit", month: "2-digit", year: "numeric" });

  return (
    <section aria-labelledby="noticias-titulo" className="bg-[#ececec] py-8">
      <div className="mx-auto max-w-[1300px] px-4">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
          <h2 id="noticias-titulo" className="w-fit border-b-[3px] border-site-amarelo pb-1 text-3xl font-black italic text-site-azul">
            {noticias.titulo}
          </h2>
          <p className="text-sm text-gray-800 sm:ml-12">{noticias.subtitulo}</p>
          <a
            href={SITE_COCAPEC}
            className="inline-flex w-fit items-center justify-center rounded-full bg-site-verde px-8 py-3 text-xs font-bold text-white shadow-sm transition-colors hover:bg-site-verde-escuro focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-verde focus-visible:ring-offset-2 sm:ml-auto"
          >
            {noticias.mais}
          </a>
        </header>

        <ul className="grid gap-6 md:grid-cols-3">
          {NOTICIAS.map(({ id, data, icone: Icone, capa }) => (
            <li key={id}>
              <a
                href={SITE_COCAPEC}
                className="group block overflow-hidden rounded-md bg-white shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-azul"
              >
                <div className={`flex h-48 items-center justify-center bg-gradient-to-br ${capa}`}>
                  <Icone className="h-16 w-16 text-white/80 transition-transform group-hover:scale-110" aria-hidden />
                </div>
                <div className="p-4">
                  <p className="mb-1 flex items-center gap-1 text-xs text-gray-500">
                    <CalendarDays className="h-3.5 w-3.5" aria-hidden /> {formatarData(data)}
                  </p>
                  <h3 className="font-bold text-site-azul group-hover:underline">{noticias.itens[id].titulo}</h3>
                  <p className="mt-1 text-sm text-gray-600">{noticias.itens[id].resumo}</p>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
