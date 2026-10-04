import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AlertCircle, Clock, FileText } from "lucide-react";
import type { DocumentoItem } from "../docsMetadata";
import VisualizadorImagem from "./VisualizadorImagem";
import GaleriaUml from "./GaleriaUml";
import ReferenciaApi from "./ReferenciaApi";

type Props = {
  documento: DocumentoItem;
};

function extrairFrontmatter(conteudo: string): {
  frontmatter: Record<string, string>;
  corpo: string;
} {
  const match = conteudo.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, corpo: conteudo };

  const linhas = match[1].split(/\r?\n/);
  const frontmatter: Record<string, string> = {};
  for (const linha of linhas) {
    const separador = linha.indexOf(":");
    if (separador > -1) {
      const chave = linha.slice(0, separador).trim();
      const valor = linha.slice(separador + 1).trim();
      frontmatter[chave] = valor;
    }
  }

  return { frontmatter, corpo: match[2] };
}

export default function VisualizadorDocumento({ documento }: Props) {
  const [conteudo, setConteudo] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    setCarregando(true);
    setErro(false);

    fetch(`/api/documentacao/${documento.slug}.md`)
      .then((res) => {
        if (!res.ok) throw new Error("Documento não encontrado");
        return res.text();
      })
      .then((texto) => {
        setConteudo(texto);
        setCarregando(false);
      })
      .catch(() => {
        setConteudo(null);
        setErro(true);
        setCarregando(false);
      });
  }, [documento.slug]);

  if (carregando) {
    return (
      <div className="flex h-96 items-center justify-center text-sm text-gray-500">
        <Clock className="mr-2 h-5 w-5 animate-spin text-site-azul" />
        Carregando documentação...
      </div>
    );
  }

  if (erro || !conteudo) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
        <FileText className="mx-auto h-10 w-10 text-gray-400" />
        <h3 className="mt-4 text-lg font-bold text-gray-800">
          Documento em construção
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          O arquivo <code>docs/{documento.slug}.md</code> ainda está sendo redigido pela equipe.
        </p>
      </div>
    );
  }

  const { frontmatter, corpo } = extrairFrontmatter(conteudo);
  const status = frontmatter.status || documento.status;
  const isRascunho = status === "rascunho";

  return (
    <article className="max-w-none space-y-6">
      {/* Cabeçalho do Documento */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-site-azul">
            {frontmatter.title || documento.titulo}
          </h1>
        </div>

        {isRascunho && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-300">
            <AlertCircle className="h-3.5 w-3.5" />
            Rascunho
          </span>
        )}
      </header>

      {/* Conteúdo Renderizado do Markdown */}
      <div className="prose prose-slate max-w-none text-gray-800 leading-relaxed">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => (
              <h2 className="mt-6 mb-4 text-xl sm:text-2xl font-bold text-site-azul border-b border-gray-100 pb-2">
                {children}
              </h2>
            ),
            h2: ({ children }) => (
              <h3 className="mt-5 mb-3 text-lg sm:text-xl font-bold text-gray-900">
                {children}
              </h3>
            ),
            h3: ({ children }) => (
              <h4 className="mt-4 mb-2 text-base font-bold text-gray-800">
                {children}
              </h4>
            ),
            p: ({ children }) => <p className="mb-4 text-sm sm:text-base leading-relaxed">{children}</p>,
            ul: ({ children }) => (
              <ul className="mb-4 list-disc pl-6 text-sm sm:text-base space-y-1">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="mb-4 list-decimal pl-6 text-sm sm:text-base space-y-1">{children}</ol>
            ),
            li: ({ children }) => <li className="leading-relaxed">{children}</li>,
            table: ({ children }) => (
              <div className="my-6 overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
                <table className="w-full min-w-[600px] text-left text-xs sm:text-sm">
                  {children}
                </table>
              </div>
            ),
            thead: ({ children }) => (
              <thead className="border-b border-gray-200 bg-gray-50 text-gray-900 font-semibold">
                {children}
              </thead>
            ),
            th: ({ children }) => <th className="px-4 py-3 font-bold">{children}</th>,
            td: ({ children }) => (
              <td className="border-t border-gray-100 px-4 py-3 text-gray-700">{children}</td>
            ),
            code: ({ className, children }) => {
              const isInline = !className;
              if (isInline) {
                return (
                  <code className="rounded bg-sky-50 px-1.5 py-0.5 font-mono text-xs font-semibold text-site-azul border border-sky-200">
                    {children}
                  </code>
                );
              }
              return (
                <div className="my-4 overflow-x-auto rounded-xl bg-gray-900 p-4 text-xs font-mono text-gray-100 shadow-sm">
                  <pre>
                    <code>{children}</code>
                  </pre>
                </div>
              );
            },
            blockquote: ({ children }) => (
              <blockquote className="my-4 border-l-4 border-site-azul bg-sky-50/50 p-4 rounded-r-lg text-sm text-gray-700 italic">
                {children}
              </blockquote>
            ),
          }}
        >
          {corpo}
        </ReactMarkdown>
      </div>

      {/* Componentes Especiais Integrados */}
      {documento.especial === "bpmn" && (
        <section className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-xl font-bold text-site-azul mb-2">Diagrama de Processos (BPMN)</h3>
          <p className="text-sm text-gray-600 mb-4">
            Visualização ampliada do fluxo de recebimento de mercadorias e do boletim diário. Clique na imagem para abrir o visualizador em alta definição.
          </p>
          <VisualizadorImagem
            src="/api/documentacao/assets/bpmn.png"
            alt="Processos de Recebimento de Mercadorias e Boletim Diário — BPMN"
            legenda="docs/assets/bpmn.png — Diagrama BPMN da Solução"
          />
        </section>
      )}

      {documento.especial === "uml" && (
        <section className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-xl font-bold text-site-azul mb-2">Diagrama de Casos de Uso (UML)</h3>
          <p className="text-sm text-gray-600 mb-4">
            Modelagem funcional de casos de uso por ator. Clique na imagem para abrir o visualizador em alta definição.
          </p>
          <VisualizadorImagem
            src="/api/documentacao/assets/uml-casos-de-uso.png"
            alt="Casos de uso por ator — Recebimento Inteligente Cocapec"
            legenda="docs/assets/uml-casos-de-uso.png — Diagrama de Casos de Uso"
          />
        </section>
      )}

      {documento.especial === "der" && (
        <section className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-xl font-bold text-site-azul mb-2">Diagrama Entidade-Relacionamento (DER)</h3>
          <p className="text-sm text-gray-600 mb-4">
            Estrutura relacional do banco de dados PostgreSQL com 16 tabelas distribuídas entre agendamento, boletim e dados históricos. Clique na imagem para abrir o visualizador em alta definição.
          </p>
          <VisualizadorImagem
            src="/api/documentacao/assets/der.png"
            alt="Modelo de Dados (DER) — Cocapec Recebimento Inteligente"
            legenda="docs/assets/der.png — Diagrama Entidade-Relacionamento da Solução"
          />
        </section>
      )}

      {documento.especial === "api" && (
        <section className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-xl font-bold text-site-azul mb-4">Endpoints da API (FastAPI)</h3>
          <ReferenciaApi />
        </section>
      )}
    </article>
  );
}
