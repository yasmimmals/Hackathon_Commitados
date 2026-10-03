import { CloudDrizzle, CloudLightning, CloudRain, CloudSun, Sun } from "lucide-react";
import type { IconeClima as TipoIcone } from "../types";

const icones = {
  sol: { Icone: Sun, cor: "text-amber-500" },
  nublado: { Icone: CloudSun, cor: "text-gray-500" },
  garoa: { Icone: CloudDrizzle, cor: "text-sky-500" },
  chuva: { Icone: CloudRain, cor: "text-sky-600" },
  tempestade: { Icone: CloudLightning, cor: "text-indigo-600" },
} satisfies Record<TipoIcone, unknown>;

export default function IconeClima({ tipo }: { tipo: TipoIcone }) {
  const { Icone, cor } = icones[tipo];
  return <Icone className={`h-6 w-6 ${cor}`} aria-hidden />;
}
