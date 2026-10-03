import { Building2, Coffee, TrendingUp, type LucideIcon } from "lucide-react";

/** Site institucional: destino dos itens que não fazem parte do portal de agendamento. */
export const SITE_COCAPEC = "https://www.cocapec.com.br";

export const MENU: { rotulo: string; submenu: boolean }[] = [
  { rotulo: "COCAPEC", submenu: true },
  { rotulo: "Governança e Transparência", submenu: true },
  { rotulo: "Unidades de Negócios", submenu: true },
  { rotulo: "Serviços", submenu: true },
  { rotulo: "Nossos Cafés", submenu: true },
  { rotulo: "Agenda", submenu: false },
];

export type Noticia = {
  titulo: string;
  resumo: string;
  data: string;
  icone: LucideIcon;
  /** Fundo da capa (sem imagens no projeto ainda). */
  capa: string;
};

/** Conteúdo de exemplo até haver integração com as notícias do site. */
export const NOTICIAS: Noticia[] = [
  {
    titulo: "Mercado do café: acompanhe o fechamento da semana",
    resumo: "Resumo das cotações do arábica e os fatores que movimentaram o mercado.",
    data: "03/10/2026",
    icone: Coffee,
    capa: "from-amber-900 via-amber-700 to-orange-400",
  },
  {
    titulo: "Estrutura de armazenagem em Franca/SP",
    resumo: "Conheça o terminal logístico que recebe insumos e fertilizantes dos fornecedores.",
    data: "01/10/2026",
    icone: Building2,
    capa: "from-sky-800 via-sky-600 to-emerald-400",
  },
  {
    titulo: "Bolsa de Nova York: o que observar nas cotações",
    resumo: "Entenda os indicadores que o cooperado deve acompanhar ao longo da safra.",
    data: "29/09/2026",
    icone: TrendingUp,
    capa: "from-slate-950 via-blue-900 to-emerald-600",
  },
];
