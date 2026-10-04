import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/features/auth/AuthContext";
import AlertaOperacional from "./components/AlertaOperacional";
import BoletimHeader from "./components/cabecalho/BoletimHeader";
import CondicoesAtuais from "./components/condicoes/CondicoesAtuais";
import CtaSincronizar from "./components/CtaSincronizar";
import { BoletimCarregando, BoletimErro } from "./components/EstadosCarregamento";
import PainelLateral from "./components/lateral/PainelLateral";
import PrevisaoSemanal from "./components/previsao/PrevisaoSemanal";
import RadarRegional from "./components/radar/RadarRegional";
import { buscarClima, UNIDADES, type Unidade } from "./services/clima";
import type { Clima } from "./types";

type Estado =
  | { tipo: "carregando" }
  | { tipo: "erro" }
  | { tipo: "ok"; clima: Clima };

export default function Boletim() {
  const { usuario } = useAuth();
  const fornecedor = usuario?.perfil === "fornecedor";
  const [estado, setEstado] = useState<Estado>({ tipo: "carregando" });
  const [unidade, setUnidade] = useState<Unidade>("matriz");

  const carregar = useCallback(() => {
    let ativo = true;
    buscarClima(unidade).then(
      (clima) => ativo && setEstado({ tipo: "ok", clima }),
      () => ativo && setEstado({ tipo: "erro" }),
    );
    return () => {
      ativo = false;
    };
  }, [unidade]);

  useEffect(carregar, [carregar]);

  if (estado.tipo === "carregando") return <BoletimCarregando />;

  if (estado.tipo === "erro") {
    return (
      <BoletimErro
        onTentarNovamente={() => {
          setEstado({ tipo: "carregando" });
          carregar();
        }}
      />
    );
  }

  const { clima } = estado;

  const trocarUnidade = (nova: Unidade) => {
    setUnidade(nova);
    setEstado({ tipo: "carregando" });
  };

  const exportarPdf = () => {
    const anterior = document.title;
    const hoje = new Date().toLocaleDateString("pt-BR").replace(/\//g, "-");
    document.title = `Boletim agrometeorologico - ${UNIDADES[unidade].cidade.replace("/", "-")} - ${hoje}`;
    const restaurar = () => {
      document.title = anterior;
      window.removeEventListener("afterprint", restaurar);
    };
    window.addEventListener("afterprint", restaurar);
    window.print();
  };

  return (
    <div className="space-y-6">
      <p className="hidden text-xs text-gray-600 print:block">
        COCAPEC • Boletim gerado em {new Date().toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
        {usuario && ` por ${usuario.nome}`} • Dados: Open-Meteo
      </p>
      <BoletimHeader atualizadoEm={clima.atualizadoEm} unidade={unidade} onUnidade={trocarUnidade} onExportarPdf={exportarPdf} />
      <CondicoesAtuais clima={clima} />
      <AlertaOperacional hrefReagendar={fornecedor ? "/fornecedor/agendamentos" : "/armazem/recebimento"} />
      <PrevisaoSemanal previsao={clima.previsao} cidade={UNIDADES[unidade].cidade} />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <RadarRegional />
        <PainelLateral clima={clima} />
      </div>
      {fornecedor && (
        <div className="print:hidden">
          <CtaSincronizar />
        </div>
      )}
    </div>
  );
}
