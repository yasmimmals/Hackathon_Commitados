import { useEffect, useState } from "react";
import { mensagemDeErro } from "@/shared/services";

export function useCarga<T>(buscar: () => Promise<T>, chave: string) {
  const [estado, setEstado] = useState<{ chave: string; dados?: T; erro?: string }>({ chave: "" });
  useEffect(() => {
    let ativo = true;
    buscar().then(
      (dados) => ativo && setEstado({ chave, dados }),
      (erro) => ativo && setEstado({ chave, erro: mensagemDeErro(erro) }),
    );
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave]);
  const atual = estado.chave === chave ? estado : undefined;
  return { dados: atual?.dados ?? estado.dados, erro: atual?.erro, carregando: !atual };
}

export const COR = {
  SOBRA: "#e34948",
  FALTA: "#2a78d6",
  RISCO_DE_FALTA: "#7fb0ea",
  ADEQUADO: "#2f9e6b",
  EQUILIBRIO: "#2f9e6b",
  NEUTRO: "#9ca3af",
} as const;

export const ROTULO_SITUACAO: Record<string, string> = {
  SOBRA: "Sobra",
  ADEQUADO: "Adequado",
  EQUILIBRIO: "Equilíbrio",
  RISCO_DE_FALTA: "Risco de falta",
  FALTA: "Falta",
};

export const corDaSituacao = (s?: string | null) => (s && s in COR ? COR[s as keyof typeof COR] : COR.NEUTRO);

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
export const rotuloMes = (aaaaMm: string) => {
  const [a, m] = aaaaMm.split("-");
  return `${MESES[Number(m) - 1]}/${a.slice(2)}`;
};

export const diaMes = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
