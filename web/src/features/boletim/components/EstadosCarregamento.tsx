import { CloudOff, LoaderCircle } from "lucide-react";

export function BoletimCarregando() {
  return (
    <p role="status" className="flex min-h-[40vh] items-center justify-center gap-2 text-sm text-gray-500">
      <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden /> Carregando dados meteorológicos…
    </p>
  );
}

export function BoletimErro({ onTentarNovamente }: { onTentarNovamente: () => void }) {
  return (
    <div className="mx-auto flex min-h-[40vh] max-w-md flex-col items-center justify-center gap-3 text-center">
      <CloudOff className="h-10 w-10 text-gray-400" aria-hidden />
      <h1 className="text-lg font-bold text-gray-900">Não foi possível carregar o boletim</h1>
      <p className="text-sm text-gray-600">O serviço de meteorologia não respondeu. Tente novamente em instantes.</p>
      <button
        type="button"
        onClick={onTentarNovamente}
        className="rounded-lg bg-marca px-4 py-2 text-sm font-semibold text-white hover:bg-marca-escuro focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca focus-visible:ring-offset-2"
      >
        Tentar novamente
      </button>
    </div>
  );
}
