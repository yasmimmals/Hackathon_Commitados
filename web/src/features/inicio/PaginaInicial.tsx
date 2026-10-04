import BannersLaterais from "./components/BannersLaterais";
import BarraSuperior from "./components/BarraSuperior";
import CarrosselDestaques from "./components/CarrosselDestaques";
import Navegacao from "./components/Navegacao";
import Noticias from "./components/Noticias";

/** Página pública, no padrão do site institucional, com acesso ao Espaço Fornecedor. */
export default function PaginaInicial() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <BarraSuperior />
      <Navegacao />

      <main className="flex-1">
        <div className="mx-auto grid max-w-[1300px] gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <CarrosselDestaques />
          <BannersLaterais />
        </div>

        <div className="bg-site-azul py-6 text-center">
          <p className="mx-auto w-fit border-b-[3px] border-site-amarelo px-2 pb-1 text-xl font-bold italic text-white md:text-3xl">
            COCAPEC: cooperativa que impulsiona o café e o cooperado
          </p>
        </div>

        <Noticias />
      </main>
    </div>
  );
}
