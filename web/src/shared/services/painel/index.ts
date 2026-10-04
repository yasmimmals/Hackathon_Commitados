import { api } from "@/shared/services/api";

/* Painel gerencial (Tarefa 3). Todos os números vêm calculados do backend (/api/v1/painel). */

export type Situacao = "SOBRA" | "ADEQUADO" | "EQUILIBRIO" | "RISCO_DE_FALTA" | "FALTA";

export type Precisao = {
  erro_medio_percentual: number | null;
  meses_testados: number;
  detalhe: { mes: string; previsto: number; real: number; erro_percentual: number }[];
  como_ler: string;
};

export type SemanaPrevista = {
  semana: string;
  dias_uteis: number;
  caminhoes_dia_previsto: number;
  caminhoes_dia_faixa: [number, number];
  caminhoes_ja_agendados: number;
  chapas_recomendados: number;
  chapas_recomendados_faixa: [number, number];
  equipe_atual: number | null;
  acao: string;
  custo_previsto: number;
  custo_com_equipe_atual: number;
};

export type Previsao = {
  gerado_em: string;
  semanas: SemanaPrevista[];
  precisao: Precisao;
  equipe_atual: number | null;
  diaria_atual: number | null;
  referencia: string | null;
  reserva_outras_atividades: number;
  premissas: string[];
};

export type MesPlano = {
  mes: string;
  rotulo: string;
  dias_uteis: number;
  caminhoes_dia_previsto: number;
  equipe_recomendada: number;
  equipe_pratica_atual: number | null;
  situacao_pratica_atual: Situacao | null;
  custo_recomendado: number;
  custo_pratica_atual: number;
  equipe_simulada?: number;
  situacao_simulada?: Situacao;
  custo_simulado?: number;
};

export type PlanoEscala = {
  gerado_em: string;
  meses: MesPlano[];
  resumo: {
    custo_plano_recomendado: number;
    custo_pratica_atual: number;
    diferenca: number;
    meses_com_risco_na_pratica_atual: string[];
    frase: string;
    custo_simulado?: number;
    meses_com_falta_simulada?: string[];
    meses_com_sobra_simulada?: string[];
  };
  precisao: Precisao;
  diaria_atual: number;
  reserva_outras_atividades: number;
  premissas: string[];
};

export type MesCusto = {
  mes: string;
  dias_com_folha: number;
  parcial: boolean;
  valor_pago: number;
  diarias_pagas: number;
  valor_por_diaria: number | null;
  caminhoes_recebidos: number;
  custo_por_caminhao: number | null;
  equipe_media: number | null;
  equipe_necessaria_estimada: number | null;
};

export type CustoMensal = {
  mensal: MesCusto[];
  total_pago: number;
  custo_medio_por_caminhao: number | null;
  reajuste_da_diaria: { de: number; para: number; variacao_percentual: number; periodo: string } | null;
  meses_sem_folha: string[];
  premissas: string[];
};

export type MesSobraFalta = {
  mes: string;
  dias_uteis: number;
  chapas_presentes_media: number;
  caminhoes_dia_media: number;
  chapas_necessarios_leve: number;
  chapas_necessarios_pesado: number;
  saldo_leve: number;
  saldo_pesado: number;
  situacao: Situacao;
  custo_sobra_estimado: number;
};

export type SobraFalta = {
  historico: {
    resposta: string;
    meses_com_sobra: string[];
    meses_com_risco_de_falta: string[];
    custo_sobra_estimado_total: number;
    diaria_mediana_folha: number;
    mensal: MesSobraFalta[];
    premissas: string[];
  };
  sistema: {
    boletins_fechados: number;
    complemento_total: number | string;
    percentual_pago_sem_producao: number | null;
    premissas: string[];
  };
};

const limpo = (p: Record<string, number | undefined>) =>
  Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined && !Number.isNaN(v)));

export async function obterPrevisao(p: { semanas?: number; reserva?: number } = {}): Promise<Previsao> {
  const { data } = await api.get<Previsao>("/painel/previsao", { params: limpo(p) });
  return data;
}

export async function obterPlanoEscala(
  p: { meses?: number; reserva?: number; equipe_fixa?: number } = {},
): Promise<PlanoEscala> {
  const { data } = await api.get<PlanoEscala>("/painel/plano-escala", { params: limpo(p) });
  return data;
}

export async function obterCustoMensal(): Promise<CustoMensal> {
  const { data } = await api.get<CustoMensal>("/painel/custo-mensal");
  return data;
}

export async function obterSobraFalta(): Promise<SobraFalta> {
  const { data } = await api.get<SobraFalta>("/painel/sobra-falta");
  return data;
}
