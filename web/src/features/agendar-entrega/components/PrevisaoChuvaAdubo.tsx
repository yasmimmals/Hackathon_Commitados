import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, CloudOff, CloudRain, LoaderCircle } from "lucide-react";
import IconeClima from "@/features/boletim/components/IconeClima";
import { STATUS_JANELA } from "@/features/boletim/constants";
import { buscarClima } from "@/features/boletim/services/clima";
import type { DiaPrevisao } from "@/features/boletim/types";
import { dataMinima, formatarData } from "../utils/agendamento";
import Secao from "./Secao";

type Estado =
  | { tipo: "carregando" }
  | { tipo: "erro" }
  | { tipo: "ok"; dias: DiaPrevisao[] };

type PrevisaoChuvaAduboProps = {
  numero: number;
  data: string;
  ciente: boolean;
  erro?: string;
  onEscolherData: (data: string) => void;
  onCiente: (ciente: boolean) => void;
};

const AVISO_STATUS = {
  aberta: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  atencao: "bg-amber-50 text-amber-800 ring-amber-200",
  fechada: "bg-red-50 text-red-800 ring-red-200",
} satisfies Record<DiaPrevisao["status"], string>;


export default function PrevisaoChuvaAdubo({ numero, data, ciente, erro, onEscolherData, onCiente }: PrevisaoChuvaAduboProps) {
  const [estado, setEstado] = useState<Estado>({ tipo: "carregando" });

  const carregar = useCallback(() => {
    let ativo = true;
    buscarClima().then(
      (clima) => ativo && setEstado({ tipo: "ok", dias: clima.previsao.filter((d) => d.iso >= dataMinima()) }),
      () => ativo && setEstado({ tipo: "erro" }),
    );
    return () => {
      ativo = false;
    };
  }, []);

  useEffect(carregar, [carregar]);

  const diaEscolhido = estado.tipo === "ok" ? estado.dias.find((d) => d.iso === data) : undefined;

  return (
    <Secao
      numero={numero}
      titulo="Previsão de chuva (Adubo)"
      descricao="Adubo é sensível à umidade. Consulte a previsão para Franca/SP antes de confirmar."
      aside={
        <Link to="/fornecedor/previsao" className="text-xs font-semibold text-marca hover:underline">
          Ver boletim completo
        </Link>
      }
    >
      {estado.tipo === "carregando" && (
        <p role="status" className="flex items-center gap-2 text-sm text-gray-500">
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> Consultando a previsão…
        </p>
      )}

      {estado.tipo === "erro" && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg bg-gray-50 px-3 py-2.5 text-sm text-gray-600">
          <CloudOff className="h-4 w-4 text-gray-400" aria-hidden />
          Não foi possível consultar a previsão agora.
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
        </div>
      )}

      {estado.tipo === "ok" && (
        <>
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6" aria-label="Previsão dos próximos dias">
            {estado.dias.map((d) => {
              const ativo = d.iso === data;
              return (
                <li key={d.iso}>
                  <button
                    type="button"
                    onClick={() => onEscolherData(d.iso)}
                    aria-pressed={ativo}
                    title={`${d.janela} • usar esta data`}
                    className={[
                      "flex w-full flex-col items-center gap-0.5 rounded-lg border bg-white px-1 py-2 text-center transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca",
                      ativo ? "border-marca ring-1 ring-marca" : `${STATUS_JANELA[d.status].borda} hover:bg-gray-50`,
                    ].join(" ")}
                  >
                    <span className="text-[11px] font-bold uppercase text-gray-700">{d.dia}</span>
                    <span className="text-[10px] text-gray-400">{d.data}</span>
                    <IconeClima tipo={d.icone} />
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-gray-700">
                      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_JANELA[d.status].ponto}`} aria-hidden />
                      {d.probabilidade}%
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-3">
            {!data ? (
              <p className="text-xs text-gray-500">Escolha a data na etapa 1 ou clique em um dia acima.</p>
            ) : diaEscolhido ? (
              <p className={`flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm ring-1 ${AVISO_STATUS[diaEscolhido.status]}`}>
                {diaEscolhido.status === "fechada" ? (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                ) : (
                  <CloudRain className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                )}
                <span>
                  <strong>{formatarData(data)}:</strong> {diaEscolhido.chuvaMm} mm, {diaEscolhido.probabilidade}% de chance de chuva.{" "}
                  {diaEscolhido.janela}.
                  {diaEscolhido.status === "fechada" && " Recomendamos escolher outra data para evitar reagendamento na portaria."}
                </span>
              </p>
            ) : (
              <p className="rounded-lg bg-gray-50 px-3 py-2.5 text-xs text-gray-600">
                A previsão cobre apenas os próximos dias. Para {formatarData(data)}, consulte o boletim novamente perto da
                entrega: com chuva, a descarga de adubo pode ser reagendada.
              </p>
            )}
          </div>
        </>
      )}

      <div className="mt-4 border-t border-gray-100 pt-4">
        <label className="flex items-start gap-2 text-xs text-gray-700">
          <input
            id="cienteChuva"
            type="checkbox"
            checked={ciente}
            onChange={(e) => onCiente(e.target.checked)}
            aria-invalid={!!erro}
            aria-describedby={erro ? "cienteChuva-erro" : undefined}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 accent-marca"
          />
          Consultei a previsão de chuva e estou ciente de que, em caso de chuva no dia, a descarga de adubo pode ser
          remanejada para doca coberta ou reagendada pela cooperativa.
        </label>
        {erro && <p id="cienteChuva-erro" className="mt-1 text-xs text-red-600">{erro}</p>}
      </div>
    </Secao>
  );
}
