import { useEffect, useState } from "react";
import { consultarDisponibilidade, mensagemDeErro, type SlotDisponibilidade } from "@/shared/services";

type Resultado = { chave: string; slots?: SlotDisponibilidade[]; erro?: string };

export function useDisponibilidade(data: string, notaFiscalId?: number) {
  const chave = data ? `${data}|${notaFiscalId ?? ""}` : "";
  const [resultado, setResultado] = useState<Resultado>({ chave: "" });

  useEffect(() => {
    if (!chave) return;
    let ativo = true;
    consultarDisponibilidade(data, notaFiscalId).then(
      (slots) => ativo && setResultado({ chave, slots }),
      (erro) => ativo && setResultado({ chave, erro: mensagemDeErro(erro) }),
    );
    return () => {
      ativo = false;
    };
  }, [chave, data, notaFiscalId]);

  const atual = resultado.chave === chave ? resultado : undefined;
  return { slots: atual?.slots ?? [], carregando: !!chave && !atual, erro: atual?.erro };
}
