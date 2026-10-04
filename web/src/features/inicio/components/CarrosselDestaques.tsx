import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarCheck, ChevronLeft, ChevronRight, Sprout, Truck } from "lucide-react";
import { useIdioma } from "../i18n";

const INTERVALO_MS = 6000;

function SlideDiaDeCampo() {
  const t = useIdioma().textos.diaDeCampo;
  return (
    <div className="relative flex h-full overflow-hidden bg-[linear-gradient(135deg,#2f6b2a_0%,#5f8f3a_45%,#8aa95a_100%)]">
      <div
        aria-hidden
        className="absolute inset-0 opacity-30 [background:repeating-linear-gradient(160deg,transparent_0_18px,rgba(20,60,20,0.6)_18px_26px)]"
      />
      <div className="relative flex flex-1 flex-col justify-between p-6 pb-12 md:p-8 md:pb-12">
        <span className="w-fit rounded-full bg-emerald-900/70 px-3 py-1 text-xs font-bold text-white">{t.selo}</span>
        <div>
          <p className="flex items-center gap-2 text-3xl font-black italic text-white drop-shadow md:text-5xl">
            <Sprout className="h-10 w-10 text-site-amarelo md:h-14 md:w-14" aria-hidden /> {t.linha1}
          </p>
          <p className="text-5xl font-black leading-none text-site-amarelo drop-shadow-[0_3px_0_#1f4d1a] md:text-7xl">{t.linha2}</p>
          <p className="mt-1 w-fit rounded-md border-2 border-site-amarelo bg-white px-3 text-lg font-black text-site-verde">COCAPEC</p>
        </div>
        <p className="max-w-md text-base italic text-white drop-shadow md:text-2xl">
          {t.texto}
        </p>
      </div>
      <div className="relative hidden w-[26%] flex-col items-center justify-between bg-site-verde/90 pb-8 pt-16 sm:flex">
        <p className="text-center leading-none text-white">
          <span className="block text-3xl font-light md:text-5xl">{t.circuito}</span>
          <span className="block text-4xl font-black italic md:text-6xl">2026</span>
        </p>
        <p className="flex h-36 w-36 items-center justify-center rounded-full border-4 border-site-amarelo bg-emerald-950 p-4 text-center text-sm font-black italic text-white md:h-44 md:w-44 md:text-lg">
          {t.confira}
        </p>
      </div>
    </div>
  );
}

function SlidePortalFornecedor() {
  const t = useIdioma().textos.portal;
  return (
    <div className="relative flex h-full flex-col justify-center gap-4 overflow-hidden bg-[linear-gradient(120deg,#084a87_0%,#0a5aa4_55%,#4ea72e_100%)] p-6 pb-12 text-white md:p-10 md:pb-12">
      <Truck aria-hidden className="absolute -right-6 bottom-0 h-56 w-56 text-white/10 md:h-80 md:w-80" />
      <span className="w-fit rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wide">{t.selo}</span>
      <p className="max-w-xl text-3xl font-black italic leading-tight md:text-5xl">
        {t.chamada}
      </p>
      <p className="max-w-lg text-sm text-white/90 md:text-lg">
        {t.texto}
      </p>
      <Link
        to="/login"
        className="inline-flex w-fit items-center gap-2 rounded-full bg-site-amarelo px-6 py-3 text-sm font-bold text-site-azul-escuro shadow hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-site-azul"
      >
        <CalendarCheck className="h-4 w-4" aria-hidden /> {t.botao}
      </Link>
    </div>
  );
}

const SLIDES = [
  { id: "diaDeCampo", Conteudo: SlideDiaDeCampo },
  { id: "portal", Conteudo: SlidePortalFornecedor },
] as const;

export default function CarrosselDestaques() {
  const { textos } = useIdioma();
  const c = textos.carrossel;
  const [atual, setAtual] = useState(0);
  const [pausado, setPausado] = useState(false);

  const ir = (indice: number) => setAtual((indice + SLIDES.length) % SLIDES.length);

  useEffect(() => {
    const reduzirMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (pausado || reduzirMovimento) return;
    const timer = setInterval(() => setAtual((i) => (i + 1) % SLIDES.length), INTERVALO_MS);
    return () => clearInterval(timer);
  }, [pausado]);

  const botaoSeta =
    "flex h-8 w-8 items-center justify-center rounded-full border border-white/70 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white";

  return (
    <section
      aria-roledescription={c.tipo}
      aria-label={c.rotulo}
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
      className="relative h-[340px] overflow-hidden rounded-lg shadow-md md:h-[400px]"
    >
      <div className="absolute inset-x-0 top-0 z-10 h-4 bg-site-verde" aria-hidden />
      {SLIDES.map(({ id, Conteudo }, i) => (
        <div
          key={id}
          role="group"
          aria-roledescription={c.tipoSlide}
          aria-label={c.posicao(i + 1, SLIDES.length, textos[id].titulo)}
          hidden={i !== atual}
          className="absolute inset-0"
        >
          <Conteudo />
        </div>
      ))}
      <div className="absolute inset-x-0 bottom-0 z-10 h-4 bg-site-verde" aria-hidden />

      <div className="absolute right-4 top-6 z-20 flex gap-1 rounded-full bg-black/25 p-1">
        <button type="button" onClick={() => ir(atual - 1)} aria-label={c.anterior} className={botaoSeta}>
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </button>
        <button type="button" onClick={() => ir(atual + 1)} aria-label={c.proximo} className={botaoSeta}>
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
        {SLIDES.map(({ id }, i) => (
          <button
            key={id}
            type="button"
            onClick={() => ir(i)}
            aria-label={c.irPara(i + 1)}
            aria-current={i === atual}
            className={`h-3 w-3 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
              i === atual ? "bg-site-amarelo" : "bg-white/70 hover:bg-white"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
