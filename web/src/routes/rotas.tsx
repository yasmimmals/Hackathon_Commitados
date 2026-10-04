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
import PaginaDocumentacao from "@/features/documentacao/PaginaDocumentacao";
import EmConstrucao from "@/shared/components/ui/EmConstrucao";
import { TELAS_EM_CONSTRUCAO as TELAS } from "./telasEmConstrucao";

type Rota = {
  path: string;
  element: ReactNode;
  menu?: string;
};

type GrupoRotas = {
  rotulo: string;
  base: string;
  rotas: Rota[];
};

export type ItemMenu = { href: string; rotulo: string };

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
  administrador: {
    rotulo: "Administrador",
    base: "/documentacao",
    rotas: [
      { path: "", element: <PaginaDocumentacao />, menu: "Documentação" },
      { path: ":slug", element: <PaginaDocumentacao /> },
    ],
  },
};

/** Itens do menu do perfil, com o caminho completo (base + rota). */
export function menuDoPerfil(perfil: Perfil): ItemMenu[] {
  // Controle só do front (demonstração). O Administrador vê todos os menus mais Documentação.
  if (perfil === "administrador") {
    const todosItens: ItemMenu[] = [
      ...menuDoPerfil("fornecedor"),
      ...menuDoPerfil("compras"),
      ...menuDoPerfil("armazem"),
      { href: "/documentacao", rotulo: "Documentação" },
    ];
    return todosItens;
  }

  const { base, rotas } = GRUPOS[perfil];
  return rotas
    .filter((r) => r.menu)
    .map((r) => ({ href: r.path ? `${base}/${r.path}` : base, rotulo: r.menu! }));
}

/** Item do menu correspondente à URL atual (o mais específico vence). */
export function itemMenuAtivo(perfil: Perfil, pathname: string): ItemMenu | undefined {
  return menuDoPerfil(perfil)
    .filter((i) => pathname === i.href || pathname.startsWith(i.href + "/"))
    .sort((a, b) => b.href.length - a.href.length)[0];
}
