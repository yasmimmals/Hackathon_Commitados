export type FiltroPainel = {
  inicio?: string;
  fim?: string;
  local?: string;
  limite?: number;
};

export type ResumoPainel = {
  fonte: string;
  resposta_direcao: string;
  kpis: {
    total_cargas: number;
    chapas_presentes_media: number;
    diaria_media: number;
    tempo_medio_descarga_min?: number;
    saldo_total_reais?: number;
  };
  periodo: {
    inicio?: string;
    fim?: string;
  };
};

export type SobraFaltaMes = {
  mes: string;
  dias_uteis: number;
  chapas_presentes_media: number;
  caminhoes_dia_media: number;
  chapas_necessarios_leve: number;
  chapas_necessarios_pesado: number;
  saldo_leve: number;
  saldo_pesado: number;
  situacao: "SOBRA" | "RISCO_DE_FALTA" | "FALTA" | "EQUILIBRIO";
  custo_sobra_estimado: number;
};

export type SobraFaltaHistorico = {
  fonte: string;
  resposta: string;
  meses_por_situacao: Record<string, number>;
  meses_com_sobra: string[];
  meses_com_risco_de_falta: string[];
  custo_sobra_estimado_total: number;
  diaria_mediana_folha: number;
  dias_descartados: number;
  mensal: SobraFaltaMes[];
  premissas: string[];
};

export type SobraFaltaSistema = {
  fonte: string;
  total_pago: number;
  complemento_total: number;
  percentual_pago_sem_producao: number;
  dias: Array<{
    data: string;
    producao: number;
    complemento: number;
    total: number;
    chapas: number;
    diarias_ociosas_equivalentes: number;
  }>;
};

export type RespostaSobraFalta = {
  historico: SobraFaltaHistorico;
  sistema: SobraFaltaSistema;
};

export type MovimentoItem = {
  chave: string;
  rotulo: string;
  cargas: number;
  percentual: number;
};

export type MovimentoPainel = {
  por_dia_semana: MovimentoItem[];
  por_faixa_horaria: MovimentoItem[];
  por_mes: MovimentoItem[];
};

export type NaoRecebimentoItem = {
  motivo: string;
  quantidade: number;
  percentual: number;
};

export type TemposPainel = {
  tempo_medio_espera_min: number;
  tempo_medio_descarga_min: number;
  tempo_total_medio_min: number;
  por_local: Record<string, { espera: number; descarga: number }>;
};
