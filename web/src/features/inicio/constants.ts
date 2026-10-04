import { Building2, Coffee, TrendingUp, type LucideIcon } from "lucide-react";
import type { Textos } from "./i18n";

/** Site institucional: destino dos itens que não fazem parte do portal de agendamento. */
export const SITE_COCAPEC = "https://www.cocapec.com.br";

/** Itens do menu; os rótulos vêm de TEXTOS.pt.menu. */
export const MENU: { id: keyof Textos["menu"]; submenu: boolean }[] = [
  { id: "cocapec", submenu: true },
  { id: "governanca", submenu: true },
  { id: "unidades", submenu: true },
  { id: "servicos", submenu: true },
  { id: "cafes", submenu: true },
  { id: "agenda", submenu: false },
];

export type Noticia = {
  /** Chave dos textos em TEXTOS.pt.noticias.itens. */
  id: keyof Textos["noticias"]["itens"];
  /** AAAA-MM-DD, formatada em pt-BR. */
  data: string;
  icone: LucideIcon;
  /** Fundo da capa (sem imagens no projeto ainda). */
  capa: string;
};

/** Conteúdo de exemplo até haver integração com as notícias do site. */
export const NOTICIAS: Noticia[] = [
  { id: "mercado", data: "2026-10-03", icone: Coffee, capa: "from-amber-900 via-amber-700 to-orange-400" },
  { id: "armazenagem", data: "2026-10-01", icone: Building2, capa: "from-sky-800 via-sky-600 to-emerald-400" },
  { id: "bolsa", data: "2026-09-29", icone: TrendingUp, capa: "from-slate-950 via-blue-900 to-emerald-600" },
];
