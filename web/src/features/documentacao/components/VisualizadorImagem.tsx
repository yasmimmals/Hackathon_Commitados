import { useState, useEffect, useRef, useCallback } from "react";
import { ZoomIn, ZoomOut, Maximize2, Download, X, Eye, RotateCcw } from "lucide-react";

type Props = {
  src: string;
  alt: string;
  legenda?: string;
  larguraMaximaPreview?: string;
};

export default function VisualizadorImagem({
  src,
  alt,
  legenda,
  larguraMaximaPreview = "max-w-full",
}: Props) {
  const [aberto, setAberto] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [posicao, setPosicao] = useState({ x: 0, y: 0 });
  const [arrastando, setArrastando] = useState(false);
  const [inicioArrasto, setInicioArrasto] = useState({ x: 0, y: 0 });
  const [erroCarregamento, setErroCarregamento] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const resetarZoom = useCallback(() => {
    setZoom(1);
    setPosicao({ x: 0, y: 0 });
  }, []);

  const aplicarZoomReal = useCallback(() => {
    setZoom(1.8);
    setPosicao({ x: 0, y: 0 });
  }, []);

  const handleZoomIn = () => setZoom((z) => Math.min(Number((z + 0.3).toFixed(1)), 5));
  const handleZoomOut = () => setZoom((z) => Math.max(Number((z - 0.3).toFixed(1)), 0.4));

  useEffect(() => {
    if (!aberto) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAberto(false);
      if (e.key === "+" || e.key === "=") handleZoomIn();
      if (e.key === "-" || e.key === "_") handleZoomOut();
      if (e.key === "0") resetarZoom();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [aberto, resetarZoom]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoom((z) => Math.min(Number((z + 0.2).toFixed(1)), 5));
    } else {
      setZoom((z) => Math.max(Number((z - 0.2).toFixed(1)), 0.4));
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setArrastando(true);
    setInicioArrasto({ x: e.clientX - posicao.x, y: e.clientY - posicao.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!arrastando) return;
    setPosicao({
      x: e.clientX - inicioArrasto.x,
      y: e.clientY - inicioArrasto.y,
    });
  };

  const handleMouseUp = () => setArrastando(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setArrastando(true);
      setInicioArrasto({
        x: e.touches[0].clientX - posicao.x,
        y: e.touches[0].clientY - posicao.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!arrastando || e.touches.length !== 1) return;
    setPosicao({
      x: e.touches[0].clientX - inicioArrasto.x,
      y: e.touches[0].clientY - inicioArrasto.y,
    });
  };

  const handleTouchEnd = () => setArrastando(false);

  if (erroCarregamento) {
    return (
      <div className="my-6 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-gray-500">
        <p className="font-semibold text-gray-700">Diagrama em construção</p>
        <p className="mt-1 text-xs text-gray-500">{legenda || alt}</p>
      </div>
    );
  }

  return (
    <figure className="my-6">
      <div
        onClick={() => {
          resetarZoom();
          setAberto(true);
        }}
        className={`group relative flex justify-center cursor-zoom-in overflow-hidden rounded-2xl border border-gray-200 bg-white p-3 shadow-sm transition-all hover:border-site-azul hover:shadow-md ${larguraMaximaPreview}`}
      >
        <img
          src={src}
          alt={alt}
          onError={() => setErroCarregamento(true)}
          className="max-h-[620px] w-auto max-w-full rounded-xl object-contain shadow-xs transition-transform duration-200 group-hover:scale-[1.01]"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 transition-opacity group-hover:opacity-100 backdrop-blur-2xs">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/95 px-5 py-2.5 text-xs font-bold text-site-azul shadow-xl">
            <Eye className="h-4 w-4" /> Clique para abrir em tela cheia com zoom
          </span>
        </div>
      </div>

      {legenda && (
        <figcaption className="mt-2 text-center text-xs text-gray-600 font-medium">
          {legenda}
        </figcaption>
      )}

      {aberto && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex flex-col bg-slate-950/90 backdrop-blur-sm select-none"
        >
          <header className="flex items-center justify-between border-b border-gray-800 bg-gray-900/90 px-4 py-3 text-white">
            <div className="flex items-center gap-3">
              <h2 className="max-w-md truncate text-sm font-semibold">{legenda || alt}</h2>
              <span className="rounded-md bg-gray-800 px-2.5 py-0.5 text-xs font-mono font-bold text-sky-400">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={handleZoomOut}
                title="Reduzir zoom (-)"
                className="rounded-lg p-2 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-site-azul"
              >
                <ZoomOut className="h-4 w-4" />
                <span className="sr-only">Reduzir</span>
              </button>

              <button
                type="button"
                onClick={handleZoomIn}
                title="Aumentar zoom (+)"
                className="rounded-lg p-2 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-site-azul"
              >
                <ZoomIn className="h-4 w-4" />
                <span className="sr-only">Aumentar</span>
              </button>

              <button
                type="button"
                onClick={resetarZoom}
                title="Tamanho Normal (100%)"
                className="rounded-lg p-2 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-site-azul"
              >
                <RotateCcw className="h-4 w-4" />
                <span className="sr-only">Resetar zoom</span>
              </button>

              <button
                type="button"
                onClick={aplicarZoomReal}
                title="Zoom de Alta Definição (180%)"
                className="hidden sm:inline-flex items-center gap-1 rounded-lg bg-gray-800 px-2.5 py-1.5 text-xs font-semibold hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-site-azul"
              >
                <Maximize2 className="h-3.5 w-3.5" />
                HD 180%
              </button>

              <a
                href={src}
                download
                title="Baixar imagem em resolução máxima"
                className="rounded-lg p-2 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-site-verde"
              >
                <Download className="h-4 w-4" />
                <span className="sr-only">Baixar</span>
              </a>

              <button
                type="button"
                onClick={() => setAberto(false)}
                title="Fechar (Esc)"
                className="ml-2 rounded-lg bg-red-600/80 p-2 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-white"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Fechar</span>
              </button>
            </div>
          </header>

          <div
            ref={containerRef}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="flex-1 cursor-grab overflow-hidden active:cursor-grabbing flex items-center justify-center p-4"
            style={{ touchAction: "none" }}
          >
            <div
              className="inline-block rounded-2xl bg-white p-3 md:p-6 shadow-2xl transition-transform duration-75 ease-out select-none border border-gray-200"
              style={{
                transform: `translate(${posicao.x}px, ${posicao.y}px) scale(${zoom})`,
                transformOrigin: "center center",
              }}
            >
              <img
                src={src}
                alt={alt}
                draggable={false}
                className="max-h-[80vh] max-w-[88vw] object-contain select-none"
              />
            </div>
          </div>

          <footer className="border-t border-gray-800 bg-gray-900/90 px-4 py-2 text-center text-xs text-gray-400">
            Dica: use a <strong>roda do mouse</strong> ou os botões de <strong>+ e -</strong> para ampliar. Clique e arraste para explorar o diagrama em detalhes.
          </footer>
        </div>
      )}
    </figure>
  );
}
