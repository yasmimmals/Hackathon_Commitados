import { useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { Menu, BookOpen } from "lucide-react";
import { TODOS_DOCUMENTOS } from "./docsMetadata";
import MenuLateralDocumentacao from "./components/MenuLateralDocumentacao";
import VisualizadorDocumento from "./components/VisualizadorDocumento";

export default function PaginaDocumentacao() {
  const { slug } = useParams<{ slug?: string }>();
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);

  const slugAtual = slug || "00-visao-geral";
  const documento = TODOS_DOCUMENTOS.find((d) => d.slug === slugAtual);

  if (!documento) {
    return <Navigate to="/documentacao/00-visao-geral" replace />;
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-140px)] rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-site-azul" />
          <span className="text-xs font-bold text-gray-700 truncate">
            {documento.titulo}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setMenuMobileAberto(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-site-azul shadow-xs hover:bg-sky-50"
        >
          <Menu className="h-4 w-4" />
          Índice
        </button>
      </div>

      <MenuLateralDocumentacao
        slugAtivo={slugAtual}
        abertoMobile={menuMobileAberto}
        onFecharMobile={() => setMenuMobileAberto(false)}
      />

      <section className="flex-1 p-4 sm:p-6 md:p-10 overflow-y-auto">
        <VisualizadorDocumento documento={documento} />
      </section>
    </div>
  );
}
