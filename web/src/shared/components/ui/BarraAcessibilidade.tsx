import { useState, useEffect } from "react";
import { Eye, Type, ZoomIn, ZoomOut } from "lucide-react";

export default function BarraAcessibilidade() {
  const [altoContraste, setAltoContraste] = useState(false);
  const [tamanhoFonte, setTamanhoFonte] = useState<"normal" | "grande" | "extragrande">("normal");

  useEffect(() => {
    const root = document.documentElement;
    if (altoContraste) {
      root.classList.add("alto-contraste");
    } else {
      root.classList.remove("alto-contraste");
    }
  }, [altoContraste]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("fonte-normal", "fonte-grande", "fonte-extragrande");
    root.classList.add(`fonte-${tamanhoFonte}`);
  }, [tamanhoFonte]);

  const aumentarFonte = () => {
    if (tamanhoFonte === "normal") setTamanhoFonte("grande");
    else if (tamanhoFonte === "grande") setTamanhoFonte("extragrande");
  };

  const diminuirFonte = () => {
    if (tamanhoFonte === "extragrande") setTamanhoFonte("grande");
    else if (tamanhoFonte === "grande") setTamanhoFonte("normal");
  };

  return (
    <aside
      aria-label="Opções de Acessibilidade"
      className="fixed bottom-4 right-4 z-40 flex items-center gap-1.5 rounded-full border border-gray-300 bg-white/95 px-3 py-1.5 shadow-lg backdrop-blur-xs transition-all hover:bg-white"
    >
      <span className="text-[11px] font-bold text-gray-700 mr-1 hidden sm:inline">
        Acessibilidade:
      </span>

      <button
        type="button"
        onClick={() => setAltoContraste((c) => !c)}
        aria-pressed={altoContraste}
        title={altoContraste ? "Desativar alto contraste" : "Ativar alto contraste"}
        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
          altoContraste
            ? "bg-black text-yellow-300 ring-2 ring-yellow-400"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        <Eye className="h-3.5 w-3.5" aria-hidden />
        <span className="sr-only">Alternar alto contraste</span>
      </button>

      <button
        type="button"
        onClick={diminuirFonte}
        disabled={tamanhoFonte === "normal"}
        title="Diminuir tamanho da fonte"
        className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-700 hover:bg-gray-200 disabled:opacity-40"
      >
        <ZoomOut className="h-3.5 w-3.5" aria-hidden />
        <span className="sr-only">Diminuir fonte</span>
      </button>

      <button
        type="button"
        onClick={aumentarFonte}
        disabled={tamanhoFonte === "extragrande"}
        title="Aumentar tamanho da fonte"
        className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-700 hover:bg-gray-200 disabled:opacity-40"
      >
        <ZoomIn className="h-3.5 w-3.5" aria-hidden />
        <span className="sr-only">Aumentar fonte</span>
      </button>
    </aside>
  );
}
