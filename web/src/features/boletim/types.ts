export type StatusJanela = "aberta" | "atencao" | "fechada";

export type SeloJanela = "coberta" | "aberta" | "fechado";

export type IconeClima = "sol" | "nublado" | "chuva" | "tempestade" | "garoa";

export type DiaPrevisao = {
  dia: string;
  /** Data no formato AAAA-MM-DD. */
  iso: string;
  data: string;
  icone: IconeClima;
  max: number;
  min: number;
  chuvaMm: number;
  probabilidade: number;
  janela: string;
  status: StatusJanela;
  selo: SeloJanela;
};

export type CondicaoAtual = {
  temperatura: number;
  sensacao: number;
  umidade: number;
  descricao: string;
  icone: IconeClima;
  ventoKmh: number;
  ventoDirecao: string;
};

export type ChuvaHoje = {
  mm: number;
  probabilidade: number;
  /** Primeira hora (a partir de agora) com probabilidade ≥ 50%, ex.: "14h". */
  inicioEstimado: string | null;
  /** Maior intensidade horária prevista para o resto do dia (mm/h). */
  picoMmH: number;
};

export type Clima = {
  atualizadoEm: string;
  atual: CondicaoAtual;
  chuvaHoje: ChuvaHoje;
  previsao: DiaPrevisao[];
  chuvaUltimos7Dias: number;
  chuvaProximos7Dias: number;
  mes: string;
};
