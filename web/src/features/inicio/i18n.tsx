import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Idioma = "pt" | "en";

const CHAVE_IDIOMA = "cocapec.idioma";

/** Todos os textos da página inicial, em português e inglês (mesma estrutura nos dois). */
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
  },
  en: {
    lang: "en",
    buscaRotulo: "Search the site",
    buscaBotao: "Search",
    espacoCooperado: "Member Area",
    espacoFornecedor: "Supplier Area",
    idiomaAtual: "Current language: English",
    mudarIdioma: "Ver o site em português",
    paginaInicial: "COCAPEC — home page",
    navegacao: "Main",
    menu: {
      cocapec: "COCAPEC",
      governanca: "Governance and Transparency",
      unidades: "Business Units",
      servicos: "Services",
      cafes: "Our Coffees",
      agenda: "Events",
    },
    contato: "Contact",
    abrirMenu: "Open menu",
    fecharMenu: "Close menu",
    carrossel: {
      rotulo: "Highlights",
      tipo: "carousel",
      tipoSlide: "slide",
      posicao: (atual: number, total: number, titulo: string) => `${atual} of ${total}: ${titulo}`,
      anterior: "Previous highlight",
      proximo: "Next highlight",
      irPara: (n: number) => `Go to highlight ${n}`,
    },
    diaDeCampo: {
      titulo: "COCAPEC Field Day — 2026 Tour",
      selo: "we are coop",
      linha1: "field",
      linha2: "Day",
      texto: "Technology and solutions that boost the efficiency and results of your production.",
      circuito: "tour",
      confira: "Check the date and venue of the event in your region",
    },
    portal: {
      titulo: "Supplier Portal",
      selo: "New • Supplier Portal",
      chamada: "Schedule your cargo unloading at the Franca/SP Terminal",
      texto: "Send the invoice, choose a time slot and track the approval by the Purchasing Desk.",
      botao: "Go to Supplier Area",
    },
    banners: {
      lojaOnline: "online store",
      forte1: "Standing strong",
      forte2: "with the producer",
      concessionaria: "official",
      oficial: "dealer",
    },
    faixa: "COCAPEC: the cooperative that drives coffee and its members forward",
    noticias: {
      titulo: "News",
      subtitulo: "Read the latest news about the coffee market.",
      mais: "More news",
      itens: {
        mercado: {
          titulo: "Coffee market: follow the weekly close",
          resumo: "A summary of arabica prices and the factors that moved the market.",
        },
        armazenagem: {
          titulo: "Storage facilities in Franca/SP",
          resumo: "Get to know the logistics terminal that receives inputs and fertilizers from suppliers.",
        },
        bolsa: {
          titulo: "New York exchange: what to watch in the prices",
          resumo: "Understand the indicators members should follow throughout the harvest.",
        },
      },
    },
  },
} satisfies Record<Idioma, unknown>;

export type Textos = (typeof TEXTOS)["pt"];

type ContextoIdioma = { idioma: Idioma; textos: Textos; alternar: () => void };

const IdiomaContext = createContext<ContextoIdioma | null>(null);

function idiomaSalvo(): Idioma {
  try {
    return localStorage.getItem(CHAVE_IDIOMA) === "en" ? "en" : "pt";
  } catch {
    return "pt";
  }
}

export function IdiomaProvider({ children }: { children: ReactNode }) {
  const [idioma, setIdioma] = useState<Idioma>(idiomaSalvo);

  // Leitores de tela e tradutores do navegador usam o lang do documento.
  useEffect(() => {
    document.documentElement.lang = TEXTOS[idioma].lang;
    return () => {
      document.documentElement.lang = "pt-BR";
    };
  }, [idioma]);

  const alternar = () =>
    setIdioma((atual) => {
      const novo = atual === "pt" ? "en" : "pt";
      try {
        localStorage.setItem(CHAVE_IDIOMA, novo);
      } catch {
        // Sem armazenamento: o idioma vale só enquanto a página estiver aberta.
      }
      return novo;
    });

  return <IdiomaContext.Provider value={{ idioma, textos: TEXTOS[idioma], alternar }}>{children}</IdiomaContext.Provider>;
}

export function useIdioma() {
  const contexto = useContext(IdiomaContext);
  if (!contexto) throw new Error("useIdioma deve ser usado dentro de <IdiomaProvider>");
  return contexto;
}
