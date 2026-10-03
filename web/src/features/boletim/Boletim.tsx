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
import { buscarClima } from "./services/clima";
import type { Clima } from "./types";

type Estado =
  | { tipo: "carregando" }
  | { tipo: "erro" }
  | { tipo: "ok"; clima: Clima };

export default function Boletim() {
  const { usuario } = useAuth();
  const fornecedor = usuario?.perfil === "fornecedor";
  const [estado, setEstado] = useState<Estado>({ tipo: "carregando" });

  const carregar = useCallback(() => {
    let ativo = true;
    buscarClima().then(
      (clima) => ativo && setEstado({ tipo: "ok", clima }),
      () => ativo && setEstado({ tipo: "erro" }),
    );
    return () => {
      ativo = false;
    };
  }, []);

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
  return (
    <div className="space-y-6">
      <BoletimHeader atualizadoEm={clima.atualizadoEm} />
      <CondicoesAtuais clima={clima} />
      <AlertaOperacional hrefReagendar={fornecedor ? "/fornecedor/agendamentos" : "/armazem/recebimento"} />
      <PrevisaoSemanal previsao={clima.previsao} />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <RadarRegional />
        <PainelLateral clima={clima} />
      </div>
      {fornecedor && <CtaSincronizar />}
    </div>
  );
}
