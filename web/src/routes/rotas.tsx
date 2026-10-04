import type { ReactNode } from "react";
import type { Perfil } from "@/features/auth/types";
import MeusAgendamentos from "@/features/agendamentos/MeusAgendamentos";
import AgendarEntrega from "@/features/agendar-entrega/AgendarEntrega";
import AgendarNaHora from "@/features/agendar-na-hora/AgendarNaHora";
import Boletim from "@/features/boletim/Boletim";
import AgendaDoDia from "@/features/armazem-recebimento/AgendaDoDia";
import BoletimProducao from "@/features/boletim-producao/BoletimProducao";
import FilaValidacao from "@/features/compras-validacao/FilaValidacao";
import HistoricoValidacoes from "@/features/compras-validacao/HistoricoValidacoes";
import PainelGerencial from "@/features/painel-gerencial/PainelGerencial";
import SuporteBalanca from "@/features/suporte-balanca/SuporteBalanca";
import EmConstrucao from "@/shared/components/ui/EmConstrucao";
import { TELAS_EM_CONSTRUCAO as TELAS } from "./telasEmConstrucao";

type Rota = {
  /** Caminho relativo à base do grupo (sem barra inicial). */
  path: string;
  element: ReactNode;
  /** Rótulo no menu do cabeçalho; sem ele a rota não aparece no menu. */
  menu?: string;
};

type GrupoRotas = {
  rotulo: string;
  /** Prefixo do grupo: só o perfil dono do grupo acessa as rotas abaixo dele. */
  base: string;
  /** A primeira rota é a página inicial do perfil. */
  rotas: Rota[];
};

export type ItemMenu = { href: string; rotulo: string };

/**
 * Fonte única das rotas do sistema: cada grupo pertence a um perfil e
 * define rotas, menu e página inicial. Para criar uma tela, adicione uma
 * entrada em `rotas` (com `menu` se ela deve aparecer no cabeçalho).
 */
export const GRUPOS: Record<Perfil, GrupoRotas> = {
  fornecedor: {
    rotulo: "Fornecedor",
    base: "/fornecedor",
    rotas: [
      { path: "agendamentos", element: <MeusAgendamentos />, menu: "Meus Agendamentos" },
      { path: "agendamentos/:id/reagendar", element: <EmConstrucao {...TELAS.reagendarEntrega} /> },
      { path: "agendamentos/:id/cancelar", element: <EmConstrucao {...TELAS.cancelarAgendamento} /> },
      { path: "agendar", element: <AgendarEntrega />, menu: "Agendar Entrega" },
      { path: "agendar-na-hora", element: <AgendarNaHora />, menu: "Agendar na Hora" },
      { path: "previsao", element: <Boletim />, menu: "Previsão de Chuva" },
      { path: "suporte", element: <SuporteBalanca />, menu: "Dúvidas & Suporte Balança" },
    ],
  },
  compras: {
    rotulo: "Compras",
    base: "/compras",
    rotas: [
      { path: "validacoes", element: <FilaValidacao />, menu: "Fila de Validação" },
      { path: "validacoes/:id", element: <EmConstrucao {...TELAS.validarAgendamento} /> },
      { path: "historico", element: <HistoricoValidacoes />, menu: "Histórico de Validações" },
    ],
  },
  armazem: {
    rotulo: "Responsável pelo Armazém",
    base: "/armazem",
    rotas: [
      { path: "recebimento", element: <AgendaDoDia />, menu: "Recebimento" },
      { path: "recebimento/:id", element: <EmConstrucao {...TELAS.recebimentoCaminhao} /> },
      { path: "clima", element: <Boletim />, menu: "Boletim Agrometeorológico" },
      { path: "boletim", element: <BoletimProducao />, menu: "Boletim de Produção" },
      { path: "painel", element: <PainelGerencial />, menu: "Painel Gerencial" },
    ],
  },
};

/** Itens do menu do perfil, com o caminho completo (base + rota). */
export function menuDoPerfil(perfil: Perfil): ItemMenu[] {
  const { base, rotas } = GRUPOS[perfil];
  return rotas
    .filter((r) => r.menu)
    .map((r) => ({ href: `${base}/${r.path}`, rotulo: r.menu! }));
}

/** Item do menu correspondente à URL atual (o mais específico vence). */
export function itemMenuAtivo(perfil: Perfil, pathname: string): ItemMenu | undefined {
  return menuDoPerfil(perfil)
    .filter((i) => pathname === i.href || pathname.startsWith(i.href + "/"))
    .sort((a, b) => b.href.length - a.href.length)[0];
}
