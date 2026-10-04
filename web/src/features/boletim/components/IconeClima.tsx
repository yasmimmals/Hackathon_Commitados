import { CloudDrizzle, CloudLightning, CloudRain, CloudSun, Sun } from "lucide-react";
import type { IconeClima as TipoIcone } from "../types";

const icones = {
  sol: { Icone: Sun, cor: "text-amber-500", corClara: "text-amber-300" },
  nublado: { Icone: CloudSun, cor: "text-gray-500", corClara: "text-white" },
  garoa: { Icone: CloudDrizzle, cor: "text-sky-500", corClara: "text-sky-100" },
  chuva: { Icone: CloudRain, cor: "text-sky-600", corClara: "text-sky-100" },
  tempestade: { Icone: CloudLightning, cor: "text-indigo-600", corClara: "text-amber-200" },
} satisfies Record<TipoIcone, unknown>;

type IconeClimaProps = {
  tipo: TipoIcone;
  claro?: boolean;
  className?: string;
};

export default function IconeClima({ tipo, claro = false, className = "h-6 w-6" }: IconeClimaProps) {
  const { Icone, cor, corClara } = icones[tipo];
  return <Icone className={`${className} ${claro ? corClara : cor}`} aria-hidden />;
}
