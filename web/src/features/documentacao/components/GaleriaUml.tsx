import VisualizadorImagem from "./VisualizadorImagem";

type ItemDiagrama = {
  src: string;
  alt: string;
  legenda: string;
};

const DIAGRAMAS_BACKEND: ItemDiagrama[] = [
  {
    src: "/api/documentacao/assets/backend/uml_casos_de_uso.png",
    alt: "Diagrama de Casos de Uso do Backend",
    legenda: "backend/uml_casos_de_uso — Casos de uso e operações na API",
  },
  {
    src: "/api/documentacao/assets/backend/uml_classes.png",
    alt: "Diagrama de Classes do Backend",
    legenda: "backend/uml_classes — Modelos de dados e entidades SQLAlchemy",
  },
  {
    src: "/api/documentacao/assets/backend/uml_estados_agendamento.png",
    alt: "Máquina de Estados do Agendamento",
    legenda: "backend/uml_estados_agendamento — Transições de status da entrega",
  },
  {
    src: "/api/documentacao/assets/backend/estados_boletim.png",
    alt: "Máquina de Estados do Boletim Diário",
    legenda: "backend/estados_boletim — Ciclo de vida e fechamento do boletim",
  },
  {
    src: "/api/documentacao/assets/backend/sequencia_recebimento.png",
    alt: "Diagrama de Sequência do Recebimento",
    legenda: "backend/sequencia_recebimento — Fluxo temporal na portaria e descarga",
  },
  {
    src: "/api/documentacao/assets/backend/implantacao.png",
    alt: "Diagrama de Implantação",
    legenda: "backend/implantacao — Nós e containers Docker Compose",
  },
  {
    src: "/api/documentacao/assets/backend/enumeracoes.png",
    alt: "Diagrama de Enumerações",
    legenda: "backend/enumeracoes — Enums de perfis, locais e status",
  },
];

export default function GaleriaUml() {
  return (
    <div className="space-y-10">
      {/* Seção 1: UML da equipe */}
      <section className="rounded-xl border border-sky-200 bg-sky-50/50 p-6">
        <div className="mb-4">
          <span className="inline-block rounded-full bg-site-azul px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
            UML da Equipe
          </span>
          <h3 className="mt-2 text-xl font-bold text-site-azul">
            Diagrama de Casos de Uso por Ator
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            Modelagem funcional desenhada pela equipe Commitados mapeando interações dos atores (Fornecedor, Compras, Armazém, SAP e Previsão do Tempo).
          </p>
        </div>

        <VisualizadorImagem
          src="/api/documentacao/assets/uml-casos-de-uso.png"
          alt="Casos de uso por ator — Recebimento Inteligente Cocapec"
          legenda="uml-casos-de-uso — Diagrama de Casos de Uso da Equipe Commitados"
        />
      </section>
    </div>
  );
}
