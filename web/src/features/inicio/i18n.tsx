import type { ReactNode } from "react";

/** Textos estruturados do portal (o sistema é só em português). */
export const TEXTOS = {
  pt: {
    lang: "pt-BR",
    buscaRotulo: "Pesquisar no site",
    buscaBotao: "Pesquisar",
    espacoCooperado: "Espaço Cooperado",
    espacoFornecedor: "Espaço Fornecedor",
    idiomaAtual: "Idioma atual: português",
    mudarIdioma: "Ver o site em inglês",
    paginaInicial: "COCAPEC — página inicial",
    navegacao: "Principal",
    menu: {
      cocapec: "COCAPEC",
      governanca: "Governança e Transparência",
      unidades: "Unidades de Negócios",
      servicos: "Serviços",
      cafes: "Nossos Cafés",
      agenda: "Agenda",
    },
    contato: "Contato",
    abrirMenu: "Abrir menu",
    fecharMenu: "Fechar menu",
    carrossel: {
      rotulo: "Destaques",
      tipo: "carrossel",
      tipoSlide: "slide",
      posicao: (atual: number, total: number, titulo: string) => `${atual} de ${total}: ${titulo}`,
      anterior: "Destaque anterior",
      proximo: "Próximo destaque",
      irPara: (n: number) => `Ir para o destaque ${n}`,
    },
    diaDeCampo: {
      titulo: "Dia de Campo COCAPEC — Circuito 2026",
      selo: "somos coop",
      linha1: "dia de",
      linha2: "Campo",
      texto: "Tecnologia e soluções que impulsionam a eficiência e os resultados da sua produção.",
      circuito: "circuito",
      confira: "Confira a data e local do evento na sua região",
    },
    portal: {
      titulo: "Portal do Fornecedor",
      selo: "Novo • Portal do Fornecedor",
      chamada: "Agende a descarga da sua carga no Terminal Franca/SP",
      texto: "Envie a nota fiscal, escolha a janela de horário e acompanhe a validação da Mesa de Compras.",
      botao: "Acessar Espaço Fornecedor",
    },
    banners: {
      lojaOnline: "loja online",
      forte1: "Forte ao lado",
      forte2: "do produtor",
      concessionaria: "concessionária",
      oficial: "oficial",
    },
    faixa: "COCAPEC: cooperativa que impulsiona o café e o cooperado",
    noticias: {
      titulo: "Notícias",
      subtitulo: "Acesse as últimas notícias sobre o mercado cafeeiro.",
      mais: "Mais notícias",
      itens: {
        mercado: {
          titulo: "Mercado do café: acompanhe o fechamento da semana",
          resumo: "Resumo das cotações do arábica e os fatores que movimentaram o mercado.",
        },
        armazenagem: {
          titulo: "Estrutura de armazenagem em Franca/SP",
          resumo: "Conheça o terminal logístico que recebe insumos e fertilizantes dos fornecedores.",
        },
        bolsa: {
          titulo: "Bolsa de Nova York: o que observar nas cotações",
          resumo: "Entenda os indicadores que o cooperado deve acompanhar ao longo da safra.",
        },
      },
    },
    login: {
      titulo: "Espaço do Fornecedor",
      descricao1: "Fornecedor, este serviço foi pensado para estar ao seu lado, agilizando o agendamento das entregas no Terminal Franca/SP e o acompanhamento da validação das suas notas fiscais.",
      descricao2: "Se precisar de ajuda com o acesso, nossa equipe estará sempre pronta para auxiliar.",
      slogan: "Juntos, crescemos mais!",
      conectadoComo: "Conectado como",
      continuar: "Continuar",
      trocarConta: "Trocar conta",
      email: "E-mail",
      senha: "Senha",
      mostrarSenha: "Mostrar senha",
      ocultarSenha: "Ocultar senha",
      sessaoExpirada: "Sua sessão expirou. Entre novamente.",
      acessarJa: "Acessar já",
      semAcesso: "Ainda não tem acesso?",
      criarCadastro: "Criar cadastro",
      demoTitulo: "Acessos de demonstração",
      demoDescricao: "Senha de todos:",
      demoClique: "Clique em um perfil para preencher:",
      voltarInicio: "Voltar para a página inicial",
    },
    layoutAcesso: {
      slogan: "O melhor café está aqui",
      subtitulo: "Portal de agendamento e recebimento de cargas do Terminal Logístico Franca/SP",
    },
  },
};

export type Textos = (typeof TEXTOS)["pt"];

/** Mantido para não mexer no layout: não há mais troca de idioma. */
export function IdiomaProvider({ children }: { children: ReactNode }) {
  return children;
}

export function useIdioma() {
  return { textos: TEXTOS.pt };
}
