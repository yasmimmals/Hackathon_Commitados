import { useEffect, useState } from "react";

export function useMensagemTemporaria(duracaoMs = 6000) {
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    if (!mensagem) return;
    const timer = setTimeout(() => setMensagem(""), duracaoMs);
    return () => clearTimeout(timer);
  }, [mensagem, duracaoMs]);

  return [mensagem, setMensagem] as const;
}
