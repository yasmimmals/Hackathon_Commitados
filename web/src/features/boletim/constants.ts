import type { SeloJanela, StatusJanela } from "./types";

export const MEDIA_HISTORICA_SEMANAL_MM = 72;

export const LIMITE_MOEGA_DESCOBERTA_MM_H = 5;

export const STATUS_JANELA: Record<StatusJanela, { legenda: string; ponto: string; borda: string }> = {
  aberta: { legenda: "Favorável", ponto: "bg-emerald-500", borda: "border-gray-200" },
  atencao: { legenda: "Atenção", ponto: "bg-amber-500", borda: "border-amber-300" },
  fechada: { legenda: "Restrito", ponto: "bg-red-500", borda: "border-red-200" },
};

export const SELOS_JANELA: Record<SeloJanela, { rotulo: string; classe: string }> = {
  coberta: { rotulo: "Prioridade Coberta", classe: "bg-amber-100 text-amber-800" },
  aberta: { rotulo: "Janelas Abertas", classe: "bg-emerald-100 text-emerald-800" },
  fechado: { rotulo: "Pátio Fechado", classe: "bg-gray-100 text-gray-600" },
};

export const INSTRUCOES_MOTORISTAS = [
  { titulo: "Enlonamento Duplo Obrigatório", texto: "Para grãos transportados em carrocerias abertas com previsão de chuva acima de 30% ou 5 mm." },
  { titulo: "Pátio de Triagem e Pré-Recepção", texto: "Em dias de chuva intensa, aguarde sinalização no totem antes de deslocar o veículo até a moega." },
  { titulo: "Tolerância Ampliada", texto: "Motoristas retidos por condições climáticas têm a janela de descarga estendida em até 90 min sem custo." },
];

export const PONTOS_RADAR = [
  { nome: "Franca (Matriz Logística)", x: 300, y: 190, principal: true },
  { nome: "Cristais Paulista", x: 360, y: 125 },
  { nome: "Claraval (MG)", x: 215, y: 135 },
  { nome: "Ibiraci (MG)", x: 425, y: 225 },
  { nome: "Patrocínio Paulista", x: 250, y: 265 },
];
