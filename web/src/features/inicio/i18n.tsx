"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Idioma = "pt" | "en";

const CHAVE_IDIOMA = "cocapec.idioma";

/** Todos os textos estruturados da aplicação em PT e EN */
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
    login: {
      titulo: "Supplier Portal",
      descricao1: "Supplier, this service was designed to stand by your side, streamlining shipment scheduling at the Franca/SP Terminal and tracking invoice validation.",
      descricao2: "If you need assistance with access, our team is always ready to help.",
      slogan: "Together, we grow more!",
      conectadoComo: "Connected as",
      continuar: "Continue",
      trocarConta: "Switch account",
      email: "Email",
      senha: "Password",
      mostrarSenha: "Show password",
      ocultarSenha: "Hide password",
      sessaoExpirada: "Your session expired. Please sign in again.",
      acessarJa: "Sign in now",
      semAcesso: "Don't have an account yet?",
      criarCadastro: "Register now",
      demoTitulo: "Demo accounts",
      demoDescricao: "Password for all:",
      demoClique: "Click a profile to autofill:",
      voltarInicio: "Back to home page",
    },
    layoutAcesso: {
      slogan: "The finest coffee is here",
      subtitulo: "Franca/SP Logistics Terminal cargo scheduling and receiving portal",
    },
  },
} satisfies Record<Idioma, unknown>;

export type Textos = (typeof TEXTOS)["pt"];

type ContextoIdioma = {
  idioma: Idioma;
  textos: Textos;
  alternar: () => void;
  definirIdioma: (novo: Idioma) => void;
};

const IdiomaContext = createContext<ContextoIdioma | null>(null);

function idiomaSalvo(): Idioma {
  try {
    return localStorage.getItem(CHAVE_IDIOMA) === "en" ? "en" : "pt";
  } catch {
    return "pt";
  }
}

// Dicionário de tradução automática global para todas as páginas e componentes
const TERMOS_PT_EN: [string, string][] = [
  // Textos longos
  [
    "Fornecedor, este serviço foi pensado para estar ao seu lado, agilizando o agendamento das entregas no Terminal Franca/SP e o acompanhamento da validação das suas notas fiscais.",
    "Supplier, this service was designed to stand by your side, streamlining shipment scheduling at the Franca/SP Terminal and tracking invoice validation.",
  ],
  [
    "Se precisar de ajuda com o acesso, nossa equipe estará sempre pronta para auxiliar.",
    "If you need assistance with access, our team is always ready to help.",
  ],
  ["Juntos, crescemos mais!", "Together, we grow more!"],
  ["O melhor café está aqui", "The finest coffee is here"],
  [
    "Portal de agendamento e recebimento de cargas do Terminal Logístico Franca/SP",
    "Franca/SP Logistics Terminal cargo scheduling and receiving portal",
  ],
  ["Escolha seu perfil de acesso ao portal de agendamento.", "Choose your access profile for the scheduling portal."],
  ["Sua sessão expirou. Entre novamente.", "Your session expired. Please sign in again."],
  ["Ainda não tem acesso?", "Don't have an account yet?"],
  ["Acessos de demonstração", "Demo accounts"],
  ["Senha de todos:", "Password for all:"],
  ["Clique em um perfil para preencher:", "Click a profile to autofill:"],
  ["Voltar para a página inicial", "Back to home page"],
  ["Pular para o conteúdo principal", "Skip to main content"],
  ["Vale para todas as telas e fica salvo neste aparelho.", "Applies to all screens and is saved on this device."],
  ["Um toque ajusta tudo. Toque de novo para desfazer.", "One tap adjusts everything. Tap again to undo."],
  ["Gráficos com paleta segura (Okabe-Ito).", "Charts with accessible palette (Okabe-Ito)."],
  ["Atkinson Hyperlegible: letras que não se confundem.", "Atkinson Hyperlegible: distinct letterforms."],
  ["Mais espaço entre letras, palavras e linhas.", "More space between letters, words, and lines."],
  ["Destaca só a faixa onde está o mouse.", "Highlights only the line under cursor."],
  ["Contorno grosso no item selecionado pelo teclado.", "Thick outline on keyboard-focused elements."],
  ["Alvos de toque com no mínimo 44 px.", "Touch targets with at least 44px."],
  ["Desliga animações e transições.", "Turns off animations and transitions."],
  ["Selecione qualquer trecho e ele é lido em voz alta.", "Select any text to have it read aloud."],
  ["Este navegador não oferece leitura em voz alta.", "This browser does not support text-to-speech."],
  ["Informe o código interno fornecido pela COCAPEC.", "Enter the internal code provided by COCAPEC."],
  ["O CNPJ precisa ter 14 dígitos.", "CNPJ must contain 14 digits."],
  ["Informe a razão social da empresa.", "Enter the company trade name."],
  ["As senhas não conferem.", "Passwords do not match."],
  ["Informe um e-mail válido.", "Enter a valid email address."],
  ["Informe seu nome.", "Enter your full name."],
  ["A senha precisa de pelo menos 8 caracteres.", "Password must be at least 8 characters."],
  ["Nenhum agendamento encontrado", "No shipments found"],
  ["Nenhum registro encontrado", "No records found"],

  // Áreas e Navegação
  ["Espaço do Fornecedor", "Supplier Portal"],
  ["Espaço Fornecedor", "Supplier Area"],
  ["Espaço Cooperado", "Member Area"],
  ["Espaço Administrador", "Admin Area"],
  ["Espaço Comprador", "Buyer Area"],
  ["Espaço Armazém", "Warehouse Area"],
  ["Meus Agendamentos", "My Shipments"],
  ["Agendar Entrega", "Schedule Delivery"],
  ["Agendar na Hora", "Instant Scheduling"],
  ["Previsão de Chuva", "Rain Forecast"],
  ["Fila de Validação", "Validation Queue"],
  ["Histórico de Validações", "Validation History"],
  ["Recebimento", "Receiving"],
  ["Boletim Agrometeorológico", "Agrometeorological Bulletin"],
  ["Boletim de Produção", "Production Bulletin"],
  ["Painel Gerencial", "Management Dashboard"],
  ["Visão Gerencial", "Managerial View"],
  ["Documentação", "Documentation"],
  ["Central de Acessibilidade", "Accessibility Center"],
  ["Acessibilidade", "Accessibility"],
  ["Página inicial", "Home page"],
  ["Página Inicial", "Home page"],

  // Login e Cadastro
  ["Acessar já", "Sign in now"],
  ["Criar cadastro", "Register"],
  ["Criar conta", "Create account"],
  ["Conectado como", "Connected as"],
  ["Continuar", "Continue"],
  ["Trocar conta", "Switch account"],
  ["Ocultar senha", "Hide password"],
  ["Mostrar senha", "Show password"],
  ["Razão social", "Company Name"],
  ["Razão Social", "Company Name"],
  ["Nome completo", "Full Name"],
  ["Confirmar senha", "Confirm password"],
  ["Já tem uma conta?", "Already have an account?"],
  ["Entrar com sua conta", "Sign in with your account"],
  ["Código interno", "Internal code"],
  ["Perfil de acesso", "Access profile"],
  ["Fornecedor", "Supplier"],
  ["Comprador", "Buyer"],
  ["Resp. pelo armazém", "Warehouse Mgr."],
  ["Agenda entregas da empresa", "Schedules company deliveries"],
  ["Mesa de Compras: valida notas", "Purchasing Desk: validates invoices"],
  ["Recebimento e boletim", "Receiving and bulletin"],

  // Acessibilidade
  ["Perfis prontos", "Presets"],
  ["Visão", "Vision"],
  ["Tema", "Theme"],
  ["Claro", "Light"],
  ["Escuro", "Dark"],
  ["Alto contraste", "High contrast"],
  ["Tamanho do texto", "Text size"],
  ["Cores para daltonismo", "Colorblind colors"],
  ["Cursor grande", "Large cursor"],
  ["Leitura", "Reading"],
  ["Fonte para dislexia", "Dyslexia font"],
  ["Espaçamento de leitura", "Reading spacing"],
  ["Máscara de leitura", "Reading guide"],
  ["Destacar links", "Highlight links"],
  ["Navegação e movimento", "Navigation & motion"],
  ["Foco reforçado", "Enhanced focus"],
  ["Botões maiores", "Larger buttons"],
  ["Reduzir movimento", "Reduce motion"],
  ["Ouvir", "Audio & Speech"],
  ["Ler esta página", "Read this page"],
  ["Parar", "Stop"],
  ["Ler ao selecionar", "Read on select"],
  ["Velocidade da voz", "Voice speed"],
  ["Restaurar padrão", "Reset to default"],

  // Status
  ["Em análise", "Under review"],
  ["EM ANÁLISE", "UNDER REVIEW"],
  ["Em trânsito", "In transit"],
  ["EM TRÂNSITO", "IN TRANSIT"],
  ["Pendente", "Pending"],
  ["PENDENTE", "PENDING"],
  ["Aprovado", "Approved"],
  ["APROVADO", "APPROVED"],
  ["Reprovado", "Rejected"],
  ["REPROVADO", "REJECTED"],
  ["Rejeitado", "Rejected"],
  ["REJEITADO", "REJECTED"],
  ["Concluído", "Completed"],
  ["CONCLUÍDO", "COMPLETED"],
  ["Cancelado", "Cancelled"],
  ["CANCELADO", "CANCELLED"],
  ["Descarregado", "Unloaded"],
  ["DESCARREGADO", "UNLOADED"],
  ["Validado", "Validated"],
  ["VALIDADO", "VALIDATED"],
  ["Aguardando", "Awaiting"],
  ["AGUARDANDO", "AWAITING"],

  // Ações e botões
  ["Novo Agendamento", "New Shipment"],
  ["Salvar", "Save"],
  ["Cancelar", "Cancel"],
  ["Voltar", "Back"],
  ["Filtrar", "Filter"],
  ["Limpar filtros", "Clear filters"],
  ["Limpar", "Clear"],
  ["Confirmar", "Confirm"],
  ["Confirmar agendamento", "Confirm shipment"],
  ["Baixar comprovante", "Download receipt"],
  ["Baixar PDF", "Download PDF"],
  ["Imprimir", "Print"],
  ["Exportar CSV", "Export CSV"],
  ["Exportar", "Export"],
  ["Visualizar", "View"],
  ["Ver detalhes", "View details"],
  ["Detalhes", "Details"],
  ["Editar", "Edit"],
  ["Excluir", "Delete"],
  ["Remover", "Remove"],
  ["Anexar NF", "Attach Invoice"],
  ["Enviar", "Submit"],
  ["Enviar Nota Fiscal", "Submit Invoice"],
  ["Sim", "Yes"],
  ["Não", "No"],
  ["Fechar", "Close"],
  ["Avançar", "Next"],
  ["Anterior", "Previous"],
  ["Próximo", "Next"],
  ["Sair", "Sign out"],
  ["Buscar", "Search"],
  ["Pesquisar", "Search"],

  // Campos e labels
  ["Nota Fiscal", "Invoice"],
  ["Número da NF", "Invoice Number"],
  ["Número da Nota", "Invoice Number"],
  ["Chave de Acesso", "Access Key"],
  ["Série", "Series"],
  ["Transportadora", "Carrier"],
  ["Motorista", "Driver"],
  ["Placa do veículo", "Vehicle Plate"],
  ["Placa do Veículo", "Vehicle Plate"],
  ["Placa", "Plate"],
  ["Produto", "Product"],
  ["Tipo de carga", "Cargo Type"],
  ["Tipo de Carga", "Cargo Type"],
  ["Peso (kg)", "Weight (kg)"],
  ["Peso total", "Total weight"],
  ["Peso Líquido", "Net Weight"],
  ["Quantidade", "Quantity"],
  ["Quantidade (sacas)", "Quantity (bags)"],
  ["Data agendada", "Scheduled Date"],
  ["Data Agendada", "Scheduled Date"],
  ["Janela de horário", "Time Window"],
  ["Janela", "Window"],
  ["Horário", "Time"],
  ["Data", "Date"],
  ["Ações", "Actions"],
  ["Observações", "Notes"],
  ["Observação", "Note"],
  ["Comprovante", "Receipt"],
  ["Total", "Total"],
  ["Valor Total", "Total Amount"],
  ["Valor", "Value"],
  ["Terminal", "Terminal"],
  ["Armazém", "Warehouse"],
  ["Docas", "Docks"],
  ["Doca", "Dock"],
  ["Capacidade", "Capacity"],
  ["Ocupação", "Occupancy"],
  ["Filtros", "Filters"],
  ["Filtrar por", "Filter by"],
  ["Todos", "All"],
  ["Todas", "All"],
  ["Carregando...", "Loading..."],
  ["Carregando", "Loading"],
  ["Sucesso!", "Success!"],
  ["Sucesso", "Success"],
  ["Erro", "Error"],
  ["Usuário:", "User:"],
  ["Administrador", "Administrator"],
  ["E-mail", "Email"],
  ["Senha", "Password"],
];

const textosOriginais = new WeakMap<Node, string>();

function traduzirString(orig: string): string {
  let resultado = orig;
  for (const [pt, en] of TERMOS_PT_EN) {
    if (resultado.includes(pt)) {
      resultado = resultado.split(pt).join(en);
    }
  }
  return resultado;
}

function processarNoTexto(node: Text, idioma: Idioma) {
  const pai = node.parentElement;
  if (!pai) return;
  const tag = pai.tagName.toUpperCase();
  if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT" || tag === "CODE") return;

  if (idioma === "en") {
    let original = textosOriginais.get(node);
    if (original === undefined) {
      original = node.nodeValue ?? "";
      textosOriginais.set(node, original);
    }
    const traduzido = traduzirString(original);
    if (traduzido !== node.nodeValue) {
      node.nodeValue = traduzido;
    }
  } else {
    const original = textosOriginais.get(node);
    if (original !== undefined) {
      if (node.nodeValue !== original) {
        node.nodeValue = original;
      }
      textosOriginais.delete(node);
    }
  }
}

function processarElemento(el: Element, idioma: Idioma) {
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    if (idioma === "en") {
      let orig = el.getAttribute("data-orig-placeholder");
      if (orig === null && el.placeholder) {
        orig = el.placeholder;
        el.setAttribute("data-orig-placeholder", orig);
      }
      if (orig) {
        const traduzido = traduzirString(orig);
        if (el.placeholder !== traduzido) el.placeholder = traduzido;
      }
    } else {
      const orig = el.getAttribute("data-orig-placeholder");
      if (orig !== null) {
        el.placeholder = orig;
        el.removeAttribute("data-orig-placeholder");
      }
    }
  }
}

function aplicarTraducaoNaArvore(raiz: Node, idioma: Idioma) {
  if (raiz.nodeType === Node.TEXT_NODE) {
    processarNoTexto(raiz as Text, idioma);
    return;
  }
  if (raiz.nodeType === Node.ELEMENT_NODE) {
    processarElemento(raiz as Element, idioma);
    const walker = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let atual = walker.nextNode();
    while (atual) {
      if (atual.nodeType === Node.TEXT_NODE) {
        processarNoTexto(atual as Text, idioma);
      } else if (atual.nodeType === Node.ELEMENT_NODE) {
        processarElemento(atual as Element, idioma);
      }
      atual = walker.nextNode();
    }
  }
}

export function IdiomaProvider({ children }: { children: ReactNode }) {
  const [idioma, setIdioma] = useState<Idioma>(idiomaSalvo);

  // Sincroniza lang e executa tradução do sistema em todo o DOM
  useEffect(() => {
    document.documentElement.lang = TEXTOS[idioma].lang;

    // Aplica na árvore atual do documento
    aplicarTraducaoNaArvore(document.body, idioma);

    if (idioma === "en") {
      const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
          if (m.type === "childList") {
            for (let i = 0; i < m.addedNodes.length; i++) {
              aplicarTraducaoNaArvore(m.addedNodes[i], "en");
            }
          } else if (m.type === "characterData") {
            processarNoTexto(m.target as Text, "en");
          }
        }
      });
      observer.observe(document.body, { childList: true, subtree: true, characterData: true });
      return () => observer.disconnect();
    } else {
      aplicarTraducaoNaArvore(document.body, "pt");
    }
  }, [idioma]);

  const definirIdioma = (novo: Idioma) => {
    setIdioma(novo);
    try {
      localStorage.setItem(CHAVE_IDIOMA, novo);
    } catch {
      // Sem armazenamento
    }
  };

  const alternar = () => {
    setIdioma((atual) => {
      const novo = atual === "pt" ? "en" : "pt";
      try {
        localStorage.setItem(CHAVE_IDIOMA, novo);
      } catch {
        // Sem armazenamento
      }
      return novo;
    });
  };

  return (
    <IdiomaContext.Provider value={{ idioma, textos: TEXTOS[idioma], alternar, definirIdioma }}>
      {children}
    </IdiomaContext.Provider>
  );
}

export function useIdioma() {
  const contexto = useContext(IdiomaContext);
  if (!contexto) throw new Error("useIdioma deve ser usado dentro de <IdiomaProvider>");
  return contexto;
}
