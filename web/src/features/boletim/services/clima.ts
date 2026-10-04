import type { Clima, DiaPrevisao, IconeClima, SeloJanela, StatusJanela } from "../types";

export const UNIDADES = {
  matriz: { nome: "Complexo Logístico Franca - Matriz", cidade: "Franca/SP", latitude: -20.5386, longitude: -47.4008 },
  pedregulho: { nome: "Unidade Pedregulho", cidade: "Pedregulho/SP", latitude: -20.2569, longitude: -47.4767 },
  patrocinio: { nome: "Unidade Patrocínio Paulista", cidade: "Patrocínio Paulista/SP", latitude: -20.6394, longitude: -47.2817 },
} as const;

export type Unidade = keyof typeof UNIDADES;

const TIMEZONE = "America/Sao_Paulo";
const VALIDADE_CACHE_MS = 10 * 60 * 1000;

const cache = new Map<Unidade, { em: number; clima: Promise<Clima> }>();

type RespostaOpenMeteo = {
  current: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    weather_code: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
  };
  hourly: {
    time: string[];
    precipitation_probability: number[];
    precipitation: number[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    precipitation_probability_max: number[];
  };
};

const DIAS_SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const PONTOS_CARDEAIS = ["N", "NE", "L", "SE", "S", "SO", "O", "NO"];


function descreverCodigo(codigo: number): string {
  if (codigo === 0) return "Céu limpo";
  if (codigo === 1) return "Predomínio de sol";
  if (codigo === 2) return "Sol entre nuvens";
  if (codigo === 3) return "Nublado";
  if (codigo === 45 || codigo === 48) return "Nevoeiro";
  if (codigo >= 51 && codigo <= 57) return "Garoa";
  if (codigo >= 61 && codigo <= 67) return codigo >= 65 ? "Chuva forte" : "Chuva";
  if (codigo >= 80 && codigo <= 82) return codigo === 82 ? "Pancadas fortes" : "Pancadas de chuva";
  if (codigo >= 95) return "Tempestade";
  return "Tempo instável";
}

function iconeDoCodigo(codigo: number): IconeClima {
  if (codigo >= 95) return "tempestade";
  if ((codigo >= 61 && codigo <= 67) || (codigo >= 80 && codigo <= 82)) return "chuva";
  if (codigo >= 51 && codigo <= 57) return "garoa";
  if (codigo <= 1) return "sol";
  return "nublado";
}

function pontoCardeal(graus: number) {
  return PONTOS_CARDEAIS[Math.round(graus / 45) % 8];
}

function arredondar(valor: number, casas = 0) {
  const fator = 10 ** casas;
  return Math.round(valor * fator) / fator;
}

/** Maior probabilidade de chuva entre as horas [de, ate) do dia informado. */
function probabilidadeNoPeriodo(dados: RespostaOpenMeteo, dia: string, de: number, ate: number) {
  let maior = 0;
  dados.hourly.time.forEach((t, i) => {
    const hora = Number(t.slice(11, 13));
    if (t.startsWith(dia) && hora >= de && hora < ate) {
      maior = Math.max(maior, dados.hourly.precipitation_probability[i] ?? 0);
    }
  });
  return maior;
}

/** Regras operacionais COCAPEC: converte a previsão em janela de descarga. */
function classificarDia(
  dados: RespostaOpenMeteo,
  dia: string,
  codigo: number,
  chuvaMm: number,
  probabilidade: number,
): { janela: string; status: StatusJanela; selo: SeloJanela } {
  if (codigo >= 95) {
    return { janela: "Tempestade prevista — somente docas cobertas", status: "fechada", selo: "coberta" };
  }
  if (chuvaMm >= 10 || probabilidade >= 70) {
    return { janela: "Pátio externo fechado", status: "fechada", selo: "fechado" };
  }
  if (chuvaMm >= 5 || probabilidade >= 40) {
    const manha = probabilidadeNoPeriodo(dados, dia, 7, 12);
    const tarde = probabilidadeNoPeriodo(dados, dia, 12, 18);
    if (manha < 30) return { janela: "Manhã (07h–11h) favorável", status: "atencao", selo: "coberta" };
    if (tarde < 30) return { janela: "Tarde (12h–17h) favorável", status: "atencao", selo: "coberta" };
    return { janela: "Instável o dia todo", status: "atencao", selo: "coberta" };
  }
  if (probabilidade <= 10 && chuvaMm === 0) {
    return { janela: "Ideal para grãos ensacados e granel", status: "aberta", selo: "aberta" };
  }
  return { janela: "Dia todo liberado (todas moegas)", status: "aberta", selo: "aberta" };
}

/** Condições atuais e previsão de 7 dias da unidade, via Open-Meteo (com cache por unidade). */
export function buscarClima(unidade: Unidade = "matriz"): Promise<Clima> {
  const atual = cache.get(unidade);
  if (atual && Date.now() - atual.em <= VALIDADE_CACHE_MS) return atual.clima;
  const clima = consultarOpenMeteo(unidade);
  cache.set(unidade, { em: Date.now(), clima });
  // Falha não fica em cache: a próxima chamada tenta de novo.
  clima.catch(() => {
    if (cache.get(unidade)?.clima === clima) cache.delete(unidade);
  });
  return clima;
}

async function consultarOpenMeteo(unidade: Unidade): Promise<Clima> {
  const { latitude, longitude } = UNIDADES[unidade];
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    timezone: TIMEZONE,
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m",
    hourly: "precipitation_probability,precipitation",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max",
    past_days: "7",
    forecast_days: "7",
  });

  const resposta = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!resposta.ok) {
    throw new Error(`Open-Meteo respondeu ${resposta.status}`);
  }
  const dados = (await resposta.json()) as RespostaOpenMeteo;

  const { current, daily, hourly } = dados;
  const hoje = current.time.slice(0, 10);
  const horaAtual = current.time.slice(0, 13);
  const indiceHoje = daily.time.indexOf(hoje);

  const previsao: DiaPrevisao[] = daily.time.slice(indiceHoje).map((dia, n) => {
    const i = indiceHoje + n;
    const codigo = daily.weather_code[i];
    const chuvaMm = arredondar(daily.precipitation_sum[i] ?? 0, 1);
    const probabilidade = daily.precipitation_probability_max[i] ?? 0;
    const diaSemana = new Date(`${dia}T12:00:00Z`).getUTCDay();
    return {
      iso: dia,
      dia: n === 0 ? "Hoje" : n === 1 ? "Amanhã" : DIAS_SEMANA[diaSemana],
      data: `${dia.slice(8, 10)}/${dia.slice(5, 7)}`,
      icone: iconeDoCodigo(codigo),
      max: arredondar(daily.temperature_2m_max[i]),
      min: arredondar(daily.temperature_2m_min[i]),
      chuvaMm,
      probabilidade,
      ...classificarDia(dados, dia, codigo, chuvaMm, probabilidade),
    };
  });

  let inicioEstimado: string | null = null;
  let picoMmH = 0;
  hourly.time.forEach((t, i) => {
    if (!t.startsWith(hoje) || t.slice(0, 13) < horaAtual) return;
    picoMmH = Math.max(picoMmH, hourly.precipitation[i] ?? 0);
    if (!inicioEstimado && (hourly.precipitation_probability[i] ?? 0) >= 50) {
      inicioEstimado = `${t.slice(11, 13)}h`;
    }
  });

  const soma = (valores: number[]) => arredondar(valores.reduce((total, v) => total + (v ?? 0), 0));

  return {
    atualizadoEm: current.time.slice(11, 16),
    atual: {
      temperatura: arredondar(current.temperature_2m),
      sensacao: arredondar(current.apparent_temperature),
      umidade: current.relative_humidity_2m,
      descricao: descreverCodigo(current.weather_code),
      icone: iconeDoCodigo(current.weather_code),
      ventoKmh: arredondar(current.wind_speed_10m),
      ventoDirecao: pontoCardeal(current.wind_direction_10m),
    },
    chuvaHoje: {
      mm: previsao[0]?.chuvaMm ?? 0,
      probabilidade: previsao[0]?.probabilidade ?? 0,
      inicioEstimado,
      picoMmH: arredondar(picoMmH, 1),
    },
    previsao,
    chuvaUltimos7Dias: soma(daily.precipitation_sum.slice(0, indiceHoje)),
    chuvaProximos7Dias: soma(daily.precipitation_sum.slice(indiceHoje)),
    mes: MESES[Number(hoje.slice(5, 7)) - 1],
  };
}
