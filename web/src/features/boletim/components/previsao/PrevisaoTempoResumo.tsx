import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CloudOff, LoaderCircle } from "lucide-react";
import { buscarClima } from "../../services/clima";
import type { DiaPrevisao } from "../../types";
import PrevisaoSemanal from "./PrevisaoSemanal";

type Estado = { tipo: "carregando" } | { tipo: "erro" } | { tipo: "ok"; dias: DiaPrevisao[] };

/** Previsão do tempo compacta (mesmo modelo do Boletim) que busca os próprios dados. */
export default function PrevisaoTempoResumo({ hrefBoletim }: { hrefBoletim?: string }) {
  const [estado, setEstado] = useState<Estado>({ tipo: "carregando" });

  const carregar = useCallback(() => {
    let ativo = true;
    buscarClima().then(
      (clima) => ativo && setEstado({ tipo: "ok", dias: clima.previsao }),
      () => ativo && setEstado({ tipo: "erro" }),
    );
    return () => {
      ativo = false;
    };
  }, []);

  useEffect(carregar, [carregar]);

  if (estado.tipo !== "ok") {
    return (
      <section className="rounded-3xl bg-white p-4 shadow-sm">
        <h2 className="titulo-secao border-b-[3px] border-site-amarelo pb-2 text-lg">Previsão do tempo</h2>
        {estado.tipo === "carregando" ? (
          <p role="status" className="mt-3 flex items-center gap-2 text-sm text-gray-500">
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> Consultando a previsão…
          </p>
        ) : (
          <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-600">
            <CloudOff className="h-4 w-4 text-gray-400" aria-hidden /> Previsão indisponível.
            <button
              type="button"
              onClick={() => {
                setEstado({ tipo: "carregando" });
                carregar();
              }}
              className="font-semibold text-marca hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca"
            >
              Tentar novamente
            </button>
          </p>
        )}
      </section>
    );
  }

  return (
    <div>
      <PrevisaoSemanal previsao={estado.dias} compacto />
      {hrefBoletim && (
        <Link to={hrefBoletim} className="mt-2 block text-right text-xs font-semibold text-site-azul hover:underline">
          Ver boletim completo
        </Link>
      )}
    </div>
  );
}
