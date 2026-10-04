import { useState, useEffect, useRef, useCallback } from "react";
import { ZoomIn, ZoomOut, Maximize2, Download, X, Eye } from "lucide-react";

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

  const ajustarLargura = useCallback(() => {
    if (containerRef.current) {
      setZoom(1.5);
      setPosicao({ x: 0, y: 0 });
    }
  }, []);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.3, 5));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.3, 0.5));

  // Fechar com tecla ESC
  useEffect(() => {
    if (!aberto) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAberto(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [aberto]);

  // Roda do mouse para zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoom((z) => Math.min(z + 0.2, 5));
    } else {
      setZoom((z) => Math.max(z - 0.2, 0.5));
    }
  };

  // Arraste do mouse
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

  // Arraste por toque (mobile)
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
      {/* Miniatura clicável */}
      <div
        onClick={() => {
          resetarZoom();
          setAberto(true);
        }}
        className={`group relative cursor-zoom-in overflow-hidden rounded-xl border border-gray-200 bg-white p-2 shadow-sm transition-all hover:border-site-azul hover:shadow-md ${larguraMaximaPreview}`}
      >
        <img
          src={src}
          alt={alt}
          onError={() => setErroCarregamento(true)}
          className="max-h-[500px] w-full rounded-lg object-contain"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-xs font-bold text-site-azul shadow-lg">
            <Eye className="h-4 w-4" /> Clique para ampliar e interagir
          </span>
        </div>
      </div>

      {legenda && (
        <figcaption className="mt-2 text-center text-xs text-gray-600">
          {legenda}
        </figcaption>
      )}

      {/* Modal de Zoom */}
      {aberto && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-sm"
        >
          {/* Barra de Ferramentas Superior */}
          <header className="flex items-center justify-between border-b border-gray-800 bg-gray-950/80 px-4 py-3 text-white">
            <div className="flex items-center gap-3">
              <h2 className="max-w-md truncate text-sm font-semibold">{legenda || alt}</h2>
              <span className="rounded bg-gray-800 px-2 py-0.5 text-xs text-gray-300">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleZoomOut}
                title="Reduzir zoom (-)"
                className="rounded-lg p-2 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-site-verde"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                title="Aumentar zoom (+)"
                className="rounded-lg p-2 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-site-verde"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={ajustarLargura}
                title="Ajustar à tela"
                className="rounded-lg p-2 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-site-verde"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
              <a
                href={src}
                download
                title="Baixar imagem original"
                className="rounded-lg p-2 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-site-verde"
              >
                <Download className="h-4 w-4" />
              </a>
              <button
                type="button"
                onClick={() => setAberto(false)}
                title="Fechar (Esc)"
                className="ml-2 rounded-lg bg-red-600/80 p-2 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </header>

          {/* Área Interativa com Pan & Zoom */}
          <div
            ref={containerRef}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="flex-1 cursor-grab overflow-hidden active:cursor-grabbing"
            style={{ touchAction: "none" }}
          >
            <div
              className="flex h-full w-full items-center justify-center transition-transform duration-75 ease-out"
              style={{
                transform: `translate(${posicao.x}px, ${posicao.y}px) scale(${zoom})`,
              }}
            >
              <img
                src={src}
                alt={alt}
                draggable={false}
                className="max-h-[85vh] max-w-[90vw] select-none rounded shadow-2xl"
              />
            </div>
          </div>

          {/* Rodapé com dicas */}
          <footer className="border-t border-gray-800 bg-gray-950/80 px-4 py-2 text-center text-xs text-gray-400">
            Use a roda do mouse para dar zoom, clique e arraste para navegar pelo diagrama ou pressione <strong>Esc</strong> para fechar.
          </footer>
        </div>
      )}
    </figure>
  );
}
