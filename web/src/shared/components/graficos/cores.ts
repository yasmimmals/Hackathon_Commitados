import { useAcessibilidade } from "@/shared/acessibilidade";

/**
 * Cores dos gráficos conforme o tema e a paleta escolhidos na Central de Acessibilidade.
 * Daltonismo usa Okabe-Ito, a paleta distinguível em todos os tipos de daltonismo.
 */
export type CoresGrafico = {
  series: string[];
  situacao: Record<"SOBRA" | "FALTA" | "RISCO_DE_FALTA" | "ADEQUADO" | "EQUILIBRIO" | "NEUTRO", string>;
  eixo: string;
  grade: string;
  texto: string;
  fundoTooltip: string;
  bordaTooltip: string;
  destaque: string;
  animar: boolean;
};

const BASE = {
  padrao: { series: ["#0a5aa4", "#3f8f22", "#f2b705", "#e8771a", "#7b5ea7", "#0f9fb5", "#6b7280"],
    situacao: { SOBRA: "#e34948", FALTA: "#2a78d6", RISCO_DE_FALTA: "#7fb0ea", ADEQUADO: "#2f9e6b", EQUILIBRIO: "#2f9e6b", NEUTRO: "#9ca3af" } },
  daltonismo: { series: ["#0072B2", "#E69F00", "#009E73", "#D55E00", "#56B4E9", "#CC79A7", "#F0E442"],
    situacao: { SOBRA: "#D55E00", FALTA: "#0072B2", RISCO_DE_FALTA: "#56B4E9", ADEQUADO: "#009E73", EQUILIBRIO: "#009E73", NEUTRO: "#9ca3af" } },
};

const ESCURO_PADRAO = ["#6cb0ff", "#6fd04c", "#f6c945", "#ff9f4a", "#b79cff", "#45d1e6", "#a9b4c6"];
const CONTRASTE = ["#ffe600", "#00e5ff", "#ff7ad9", "#7cff6b", "#ffffff", "#ff9f4a", "#b79cff"];

export function useCores(): CoresGrafico {
  const { prefs } = useAcessibilidade();
  const base = BASE[prefs.paleta];
  const animar = !prefs.reduzirMovimento;
  if (prefs.tema === "alto-contraste") {
    return {
      series: prefs.paleta === "daltonismo" ? base.series : CONTRASTE,
      situacao: { SOBRA: "#ff6b6b", FALTA: "#00e5ff", RISCO_DE_FALTA: "#9fe8ff", ADEQUADO: "#7cff6b", EQUILIBRIO: "#7cff6b", NEUTRO: "#ffffff" },
      eixo: "#ffffff", grade: "#5c5c5c", texto: "#ffffff", fundoTooltip: "#000000", bordaTooltip: "#ffffff",
      destaque: "#ffe600", animar,
    };
  }
  if (prefs.tema === "escuro") {
    return {
      series: prefs.paleta === "daltonismo" ? base.series : ESCURO_PADRAO,
      situacao: prefs.paleta === "daltonismo" ? base.situacao
        : { SOBRA: "#ff7b7a", FALTA: "#6cb0ff", RISCO_DE_FALTA: "#a9cdf5", ADEQUADO: "#5fd39a", EQUILIBRIO: "#5fd39a", NEUTRO: "#8a97ad" },
      eixo: "#a9b4c6", grade: "#2a3a55", texto: "#e7ebf1", fundoTooltip: "#0a1220", bordaTooltip: "#3b4d6b",
      destaque: "#f6c945", animar,
    };
  }
  return {
    series: base.series, situacao: base.situacao,
    eixo: "#6b7280", grade: "#e5e7eb", texto: "#111827", fundoTooltip: "#ffffff", bordaTooltip: "#e5e7eb",
    destaque: "#f2b705", animar,
  };
}
