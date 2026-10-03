import { Ban, Boxes, FlaskConical, Mountain, Package, PackageOpen, Sprout, type LucideIcon } from "lucide-react";
import type { Acondicionamento, Categoria, Horario, NovaEntrega } from "./types";

/** Janelas de descarga programada. */
export const HORARIOS: Horario[] = ["08:00", "10:00", "13:00", "15:00"];

export const CATEGORIAS: { key: Categoria; rotulo: string; descricao: string; icone: LucideIcon }[] = [
  { key: "adubo",     rotulo: "Adubo / Fertilizante", descricao: "Exige consulta à previsão de chuva", icone: Sprout },
  { key: "corretivo", rotulo: "Corretivo de Solo",    descricao: "Calcário, gesso agrícola",           icone: Mountain },
  { key: "defensivo", rotulo: "Defensivo Agrícola",   descricao: "Herbicidas, fungicidas, inseticidas", icone: FlaskConical },
  { key: "outros",    rotulo: "Outros Insumos",       descricao: "Sementes, embalagens, diversos",     icone: PackageOpen },
];

export const ACONDICIONAMENTOS: { key: Acondicionamento; rotulo: string; icone: LucideIcon }[] = [
  { key: "paletizado", rotulo: "Paletizado",      icone: Package },
  { key: "bigbag",     rotulo: "Big Bag",         icone: Boxes },
  { key: "batido",     rotulo: "Granel (Batido)", icone: Ban },
];

/** Carga líquida máxima aceita por veículo, em toneladas. */
export const PESO_MAXIMO_T = 50;

export const TAMANHO_MAXIMO_NF_MB = 10;

/** Agendamento programado: a partir de amanhã (no mesmo dia, use "Agendar na Hora"). */
export const ANTECEDENCIA_MINIMA_DIAS = 1;
export const ANTECEDENCIA_MAXIMA_DIAS = 30;

export const ENTREGA_VAZIA: NovaEntrega = {
  data: "", horario: "", categoria: "", acondicionamento: "", peso: "", notaFiscal: null, cienteChuva: false,
};
