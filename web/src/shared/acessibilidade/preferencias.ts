export type Tema = "padrao" | "escuro" | "alto-contraste";
export type Paleta = "padrao" | "daltonismo";
export type TipoDaltonismo = "vermelho-verde" | "azul-amarelo";
export type SimulacaoVisao = "nenhuma" | "protanopia" | "deuteranopia" | "tritanopia";

export type Preferencias = {
  tema: Tema;
  escalaTexto: number;
  paleta: Paleta;
  tipoDaltonismo: TipoDaltonismo;
  simularVisao: SimulacaoVisao;
  fonteDislexia: boolean;
  espacamento: boolean;
  guiaLeitura: boolean;
  destacarLinks: boolean;
  focoReforcado: boolean;
  alvosGrandes: boolean;
  cursorGrande: boolean;
  reduzirMovimento: boolean;
  lerAoSelecionar: boolean;
  velocidadeVoz: number;
};

export const PADRAO: Preferencias = {
  tema: "padrao",
  escalaTexto: 100,
  paleta: "padrao",
  tipoDaltonismo: "vermelho-verde",
  simularVisao: "nenhuma",
  fonteDislexia: false,
  espacamento: false,
  guiaLeitura: false,
  destacarLinks: false,
  focoReforcado: false,
  alvosGrandes: false,
  cursorGrande: false,
  reduzirMovimento: false,
  lerAoSelecionar: false,
  velocidadeVoz: 1,
};

export const CHAVE_STORAGE = "cocapec:acessibilidade";

export type Perfil = {
  id: string;
  nome: string;
  descricao: string;
  icone: "Glasses" | "Palette" | "Type" | "Focus" | "Hand" | "Ear";
  ajustes: Partial<Preferencias>;
};

export const PERFIS: Perfil[] = [
  { id: "baixa-visao", nome: "Baixa visão", icone: "Glasses",
    descricao: "Texto maior, contraste forte, foco e cursor bem visíveis.",
    ajustes: { escalaTexto: 135, tema: "alto-contraste", focoReforcado: true, destacarLinks: true, cursorGrande: true } },
  { id: "daltonismo", nome: "Daltonismo", icone: "Palette",
    descricao: "Cores seguras para todos os tipos de daltonismo e links que não dependem de cor.",
    ajustes: { paleta: "daltonismo", destacarLinks: true } },
  { id: "dislexia", nome: "Dislexia", icone: "Type",
    descricao: "Fonte de alta legibilidade, mais espaço entre letras e linhas e máscara de leitura.",
    ajustes: { fonteDislexia: true, espacamento: true, guiaLeitura: true, escalaTexto: 115 } },
  { id: "foco", nome: "Foco (TDAH)", icone: "Focus",
    descricao: "Menos movimento na tela e máscara que destaca só a linha que você lê.",
    ajustes: { guiaLeitura: true, reduzirMovimento: true } },
  { id: "motor", nome: "Mobilidade reduzida", icone: "Hand",
    descricao: "Botões maiores, foco reforçado para teclado e sem animações.",
    ajustes: { alvosGrandes: true, focoReforcado: true, reduzirMovimento: true } },
  { id: "leitor", nome: "Cegueira / leitor de tela", icone: "Ear",
    descricao: "Leitura em voz alta ao selecionar, gráficos que se ouvem e navegação por teclado.",
    ajustes: { lerAoSelecionar: true, reduzirMovimento: true, focoReforcado: true } },
];

export function perfilAtivo(p: Preferencias, perfil: Perfil): boolean {
  return Object.entries(perfil.ajustes).every(([k, v]) => p[k as keyof Preferencias] === v);
}

export function carregar(): Preferencias {
  if (typeof window === "undefined") return PADRAO;
  try {
    const salvo = window.localStorage.getItem(CHAVE_STORAGE);
    if (salvo) return { ...PADRAO, ...JSON.parse(salvo) };
  } catch {
  }
  const mq = (q: string) => window.matchMedia?.(q).matches ?? false;
  return {
    ...PADRAO,
    reduzirMovimento: mq("(prefers-reduced-motion: reduce)"),
    tema: mq("(prefers-contrast: more)") ? "alto-contraste" : "padrao",
  };
}

export function salvar(p: Preferencias) {
  try {
    window.localStorage.setItem(CHAVE_STORAGE, JSON.stringify(p));
  } catch {
  }
}

export function aplicarNoDocumento(p: Preferencias) {
  const h = document.documentElement;
  const liga = (attr: string, on: boolean) => (on ? h.setAttribute(attr, "") : h.removeAttribute(attr));
  h.dataset.tema = p.tema;
  h.dataset.paleta = p.paleta;
  h.dataset.daltonismo = p.tipoDaltonismo;
  if (p.simularVisao === "nenhuma") delete h.dataset.simular;
  else h.dataset.simular = p.simularVisao;
  h.style.setProperty("--escala-texto", String(p.escalaTexto / 100));
  liga("data-dislexia", p.fonteDislexia);
  liga("data-espacamento", p.espacamento);
  liga("data-links", p.destacarLinks);
  liga("data-foco", p.focoReforcado);
  liga("data-alvos", p.alvosGrandes);
  liga("data-cursor", p.cursorGrande);
  liga("data-sem-movimento", p.reduzirMovimento);
  h.style.colorScheme = p.tema === "padrao" ? "light" : "dark";
}

export const SCRIPT_ANTES_DE_PINTAR = `(function(){try{
var s=localStorage.getItem(${JSON.stringify(CHAVE_STORAGE)});var p=s?JSON.parse(s):{};
var m=function(q){return window.matchMedia&&window.matchMedia(q).matches};
if(!s){p.reduzirMovimento=m('(prefers-reduced-motion: reduce)');if(m('(prefers-contrast: more)'))p.tema='alto-contraste';}
var h=document.documentElement;h.dataset.tema=p.tema||'padrao';h.dataset.paleta=p.paleta||'padrao';h.dataset.daltonismo=p.tipoDaltonismo||'vermelho-verde';
if(p.simularVisao&&p.simularVisao!=='nenhuma')h.dataset.simular=p.simularVisao;
h.style.setProperty('--escala-texto',String((p.escalaTexto||100)/100));
var f={fonteDislexia:'data-dislexia',espacamento:'data-espacamento',destacarLinks:'data-links',focoReforcado:'data-foco',alvosGrandes:'data-alvos',cursorGrande:'data-cursor',reduzirMovimento:'data-sem-movimento'};
for(var k in f){if(p[k])h.setAttribute(f[k],'');}
h.style.colorScheme=(p.tema&&p.tema!=='padrao')?'dark':'light';
}catch(e){}})();`;
