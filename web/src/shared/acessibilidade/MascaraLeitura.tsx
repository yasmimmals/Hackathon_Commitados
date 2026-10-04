"use client";

import { useEffect, useState } from "react";

/**
 * Máscara de leitura: escurece a tela e deixa visível só uma faixa que segue o mouse
 * (ou o dedo). Ajuda quem perde a linha ao ler (dislexia, TDAH, baixa visão).
 */
export default function MascaraLeitura() {
  const [y, setY] = useState<number | null>(null);
  useEffect(() => {
    const mover = (e: PointerEvent) => setY(e.clientY);
    window.addEventListener("pointermove", mover, { passive: true });
    return () => window.removeEventListener("pointermove", mover);
  }, []);
  if (y == null) return null;
  const faixa = 72;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-30 print:hidden">
      <div className="absolute inset-x-0 top-0 bg-[rgba(0,0,0,0.5)]" style={{ height: Math.max(0, y - faixa / 2) }} />
      <div className="absolute inset-x-0 border-y-2 border-site-amarelo" style={{ top: y - faixa / 2, height: faixa }} />
      <div className="absolute inset-x-0 bottom-0 bg-[rgba(0,0,0,0.5)]" style={{ top: y + faixa / 2 }} />
    </div>
  );
}
