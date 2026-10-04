export type DocumentoItem = {
  slug: string;
  titulo: string;
  subtitulo?: string;
  status: "completo" | "rascunho";
  especial?: "bpmn" | "uml" | "der" | "api";
};

export type GrupoDocumentacao = {
  titulo: string;
  itens: DocumentoItem[];
};

export const GRUPOS_DOCUMENTACAO: GrupoDocumentacao[] = [
  {
    titulo: "1. Visão geral e regras",
    itens: [
      { slug: "00-visao-geral", titulo: "Visão Geral", status: "completo" },
      { slug: "01-regras-de-negocio", titulo: "Regras de Negócio", status: "completo" },
      { slug: "02-perfis-e-permissoes", titulo: "Perfis e Permissões", status: "completo" },
    ],
  },
  {
    titulo: "2. Arquitetura",
    itens: [
      { slug: "06-arquitetura", titulo: "Arquitetura e Tecnologia", status: "completo" },
    ],
  },
  {
    titulo: "3. Processos (BPMN)",
    itens: [
      { slug: "03-processos-bpmn", titulo: "Processos de Negócio (BPMN)", status: "completo", especial: "bpmn" },
    ],
  },
  {
    titulo: "4. Casos de uso e UML",
    itens: [
      { slug: "04-casos-de-uso-uml", titulo: "Casos de Uso (UML)", status: "completo", especial: "uml" },
    ],
  },
  {
    titulo: "5. Modelo de dados (DER)",
    itens: [
      { slug: "05-modelo-de-dados-der", titulo: "Modelo de Dados (DER)", status: "completo", especial: "der" },
    ],
  },
  {
    titulo: "6. Frontend",
    itens: [
      { slug: "10-frontend", titulo: "Frontend Web", status: "completo" },
      { slug: "07-telas", titulo: "Telas do Sistema", status: "completo" },
    ],
  },
  {
    titulo: "7. Backend",
    itens: [
      { slug: "11-backend", titulo: "Backend e Serviços", status: "completo" },
    ],
  },
  {
    titulo: "8. API",
    itens: [
      { slug: "12-api", titulo: "Referência da API REST", status: "completo", especial: "api" },
    ],
  },
  {
    titulo: "9. Relatório Gerencial",
    itens: [
      { slug: "08-relatorio-gerencial", titulo: "Relatório Gerencial", status: "completo" },
    ],
  },
  {
    titulo: "10. Glossário",
    itens: [
      { slug: "09-glossario", titulo: "Glossário de Termos", status: "completo" },
    ],
  },
];

export const TODOS_DOCUMENTOS = GRUPOS_DOCUMENTACAO.flatMap((g) => g.itens);
