"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/** Faixa fixa enquanto o aparelho estiver sem internet. */
export default function AvisoConexao() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const atualizar = () => setOffline(!navigator.onLine);
    atualizar();
    window.addEventListener("online", atualizar);
    window.addEventListener("offline", atualizar);
    return () => {
      window.removeEventListener("online", atualizar);
      window.removeEventListener("offline", atualizar);
    };
  }, []);

  if (!offline) return null;
  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-center gap-2 bg-gray-900 px-4 py-2.5 text-center text-sm text-white shadow-lg print:hidden"
    >
      <WifiOff className="h-4 w-4 shrink-0 text-site-amarelo" aria-hidden />
      Sem conexão: as telas já abertas continuam disponíveis; dados novos carregam quando a internet voltar.
    </div>
  );
}
