import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { CalendarCheck, ChevronLeft, ChevronRight, Sprout, Truck } from "lucide-react";

const INTERVALO_MS = 6000;

function SlideDiaDeCampo() {
  return (
    <div className="relative flex h-full overflow-hidden bg-[linear-gradient(135deg,#2f6b2a_0%,#5f8f3a_45%,#8aa95a_100%)]">
      {/* Linhas de cafezal ao fundo */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-30 [background:repeating-linear-gradient(160deg,transparent_0_18px,rgba(20,60,20,0.6)_18px_26px)]"
      />
      <div className="relative flex flex-1 flex-col justify-between p-6 pb-12 md:p-8 md:pb-12">
        <span className="w-fit rounded-full bg-emerald-900/70 px-3 py-1 text-xs font-bold text-white">somos coop</span>
        <div>
          <p className="flex items-center gap-2 text-3xl font-black italic text-white drop-shadow md:text-5xl">
            <Sprout className="h-10 w-10 text-site-amarelo md:h-14 md:w-14" aria-hidden /> dia de
          </p>
          <p className="text-5xl font-black leading-none text-site-amarelo drop-shadow-[0_3px_0_#1f4d1a] md:text-7xl">Campo</p>
          <p className="mt-1 w-fit rounded-md border-2 border-site-amarelo bg-white px-3 text-lg font-black text-site-verde">COCAPEC</p>
        </div>
        <p className="max-w-md text-base italic text-white drop-shadow md:text-2xl">
          Tecnologia e soluções que impulsionam a eficiência e os resultados da sua produção.
        </p>
      </div>
      <div className="relative hidden w-[26%] flex-col items-center justify-between bg-site-verde/90 py-8 sm:flex">
        <p className="text-center leading-none text-white">
          <span className="block text-3xl font-light md:text-5xl">circuito</span>
          <span className="block text-4xl font-black italic md:text-6xl">2026</span>
        </p>
        <p className="flex h-36 w-36 items-center justify-center rounded-full border-4 border-site-amarelo bg-emerald-950 p-4 text-center text-sm font-black italic text-white md:h-44 md:w-44 md:text-lg">
          Confira a data e local do evento na sua região
        </p>
      </div>
    </div>
  );
}

function SlidePortalFornecedor() {
  return (
    <div className="relative flex h-full flex-col justify-center gap-4 overflow-hidden bg-[linear-gradient(120deg,#084a87_0%,#0a5aa4_55%,#4ea72e_100%)] p-6 pb-12 text-white md:p-10 md:pb-12">
      <Truck aria-hidden className="absolute -right-6 bottom-0 h-56 w-56 text-white/10 md:h-80 md:w-80" />
      <span className="w-fit rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wide">Novo • Portal do Fornecedor</span>
      <p className="max-w-xl text-3xl font-black italic leading-tight md:text-5xl">
        Agende a descarga da sua carga no Terminal Franca/SP
      </p>
      <p className="max-w-lg text-sm text-white/90 md:text-lg">
        Envie a nota fiscal, escolha a janela de horário e acompanhe a validação da Mesa de Compras.
      </p>
      <Link
        to="/login"
        className="inline-flex w-fit items-center gap-2 rounded-full bg-site-amarelo px-6 py-3 text-sm font-bold text-site-azul-escuro shadow hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-site-azul"
      >
        <CalendarCheck className="h-4 w-4" aria-hidden /> Acessar Espaço Fornecedor
      </Link>
    </div>
  );
}

const SLIDES: { titulo: string; conteudo: ReactNode }[] = [
  { titulo: "Dia de Campo COCAPEC — Circuito 2026", conteudo: <SlideDiaDeCampo /> },
  { titulo: "Portal do Fornecedor", conteudo: <SlidePortalFornecedor /> },
];

export default function CarrosselDestaques() {
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
      aria-roledescription="carrossel"
      aria-label="Destaques"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
      className="relative h-[340px] overflow-hidden rounded-lg shadow-md md:h-[400px]"
    >
      <div className="absolute inset-x-0 top-0 z-10 h-4 bg-site-verde" aria-hidden />
      {SLIDES.map((slide, i) => (
        <div
          key={slide.titulo}
          role="group"
          aria-roledescription="slide"
          aria-label={`${i + 1} de ${SLIDES.length}: ${slide.titulo}`}
          hidden={i !== atual}
          className="absolute inset-0"
        >
          {slide.conteudo}
        </div>
      ))}
      <div className="absolute inset-x-0 bottom-0 z-10 h-4 bg-site-verde" aria-hidden />

      <div className="absolute right-4 top-6 z-20 flex gap-1 rounded-full bg-black/25 p-1">
        <button type="button" onClick={() => ir(atual - 1)} aria-label="Destaque anterior" className={botaoSeta}>
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </button>
        <button type="button" onClick={() => ir(atual + 1)} aria-label="Próximo destaque" className={botaoSeta}>
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.titulo}
            type="button"
            onClick={() => ir(i)}
            aria-label={`Ir para o destaque ${i + 1}`}
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
