import { Link } from "react-router-dom";
import { BookOpen, AlertCircle, X } from "lucide-react";
import { GRUPOS_DOCUMENTACAO, type DocumentoItem } from "../docsMetadata";

type Props = {
  slugAtivo: string;
  onSelecionar?: (slug: string) => void;
  abertoMobile?: boolean;
  onFecharMobile?: () => void;
};

export default function MenuLateralDocumentacao({
  slugAtivo,
  onSelecionar,
  abertoMobile = false,
  onFecharMobile,
}: Props) {
  const renderItem = (doc: DocumentoItem) => {
    const ativo = doc.slug === slugAtivo;
    const isRascunho = doc.status === "rascunho";

    return (
      <li key={doc.slug}>
        <Link
          to={`/documentacao/${doc.slug}`}
          onClick={() => {
            onSelecionar?.(doc.slug);
            onFecharMobile?.();
          }}
          className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
            ativo
              ? "bg-site-azul text-white shadow-sm"
              : "text-gray-700 hover:bg-sky-50 hover:text-site-azul"
          }`}
        >
          <span className="truncate">{doc.titulo}</span>
          {isRascunho && (
            <span
              title="Documento em status de Rascunho"
              className={`ml-2 inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold ${
                ativo
                  ? "bg-white/20 text-white"
                  : "bg-amber-100 text-amber-800 border border-amber-300"
              }`}
            >
              Rascunho
            </span>
          )}
        </Link>
      </li>
    );
  };

  const conteudoMenu = (
    <nav className="space-y-6">
      <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
        <BookOpen className="h-5 w-5 text-site-azul" />
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-site-azul">
          Documentação Geral
        </h2>
      </div>

      <div className="space-y-5">
        {GRUPOS_DOCUMENTACAO.map((grupo) => (
          <div key={grupo.titulo} className="space-y-1.5">
            <h3 className="px-2 text-[11px] font-bold uppercase tracking-wider text-gray-700">
              {grupo.titulo}
            </h3>
            <ul className="space-y-0.5">
              {grupo.itens.map(renderItem)}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );

  return (
    <>
      <aside className="hidden lg:block w-72 shrink-0 border-r border-gray-200 bg-white p-4">
        <div className="sticky top-6">{conteudoMenu}</div>
      </aside>

      {abertoMobile && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={onFecharMobile}
          />
          <aside className="relative z-10 w-80 max-w-[85vw] overflow-y-auto bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
              <span className="text-sm font-bold text-gray-700">Navegação</span>
              <button
                type="button"
                onClick={onFecharMobile}
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {conteudoMenu}
          </aside>
        </div>
      )}
    </>
  );
}
