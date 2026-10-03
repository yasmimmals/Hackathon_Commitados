import {
  ANTECEDENCIA_MAXIMA_DIAS, ANTECEDENCIA_MINIMA_DIAS, CATEGORIAS, PESO_MAXIMO_T, TAMANHO_MAXIMO_NF_MB,
} from "../constants";
import { vagasNoHorario } from "../data/disponibilidadeMock";
import type { ErrosEntrega, NovaEntrega } from "../types";

const EXTENSOES_NF = [".pdf", ".xml"];
const DIAS_SEMANA_CURTOS = ["dom.", "seg.", "ter.", "qua.", "qui.", "sex.", "sáb."];

/** Data local (não UTC) em AAAA-MM-DD, deslocada em `dias`. */
export function dataIso(dias = 0) {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

export const dataMinima = () => dataIso(ANTECEDENCIA_MINIMA_DIAS);
export const dataMaxima = () => dataIso(ANTECEDENCIA_MAXIMA_DIAS);

/** "2026-10-05" → "seg., 05/10/2026" */
export function formatarData(iso: string) {
  const [ano, mes, dia] = iso.split("-");
  const diaSemana = new Date(`${iso}T12:00:00`).getDay();
  return `${DIAS_SEMANA_CURTOS[diaSemana]}, ${dia}/${mes}/${ano}`;
}

/** Aceita só dígitos e uma vírgula com até 2 casas, ex.: "28,50". */
export function mascararPeso(valor: string) {
  const [inteiro = "", ...resto] = valor.replace(/\./g, ",").replace(/[^\d,]/g, "").split(",");
  const decimais = resto.join("").slice(0, 2);
  return resto.length ? `${inteiro.slice(0, 3)},${decimais}` : inteiro.slice(0, 3);
}

export const pesoEmToneladas = (peso: string) => Number(peso.replace(",", "."));

export function formatarTamanho(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Retorna a mensagem de erro do arquivo, ou `undefined` se ele for aceito. */
export function validarNotaFiscal(arquivo: File): string | undefined {
  const nome = arquivo.name.toLowerCase();
  if (!EXTENSOES_NF.some((ext) => nome.endsWith(ext))) return "Envie a NF em PDF ou XML.";
  if (arquivo.size > TAMANHO_MAXIMO_NF_MB * 1024 * 1024) return `O arquivo passa de ${TAMANHO_MAXIMO_NF_MB} MB.`;
  if (arquivo.size === 0) return "O arquivo está vazio.";
  return undefined;
}

export const rotuloCategoria = (key: NovaEntrega["categoria"]) => CATEGORIAS.find((c) => c.key === key)?.rotulo ?? "";

/** A ordem das checagens segue a ordem dos campos na tela (foco no primeiro erro). */
export function validarEntrega(entrega: NovaEntrega): ErrosEntrega {
  const erros: ErrosEntrega = {};

  if (!entrega.data) erros.data = "Escolha a data da entrega.";
  else if (entrega.data < dataMinima() || entrega.data > dataMaxima()) {
    erros.data = `Escolha uma data entre amanhã e os próximos ${ANTECEDENCIA_MAXIMA_DIAS} dias.`;
  }

  if (!erros.data) {
    if (!entrega.horario) erros.horario = "Escolha um horário.";
    else if (vagasNoHorario(entrega.data, entrega.horario) === 0) erros.horario = "Este horário não tem mais vagas.";
  }

  if (!entrega.categoria) erros.categoria = "Escolha a categoria da carga.";
  if (!entrega.acondicionamento) erros.acondicionamento = "Escolha o tipo de acondicionamento.";

  const peso = pesoEmToneladas(entrega.peso);
  if (!entrega.peso || !(peso > 0)) erros.peso = "Informe o peso da carga em toneladas.";
  else if (peso > PESO_MAXIMO_T) erros.peso = `O peso máximo por veículo é ${PESO_MAXIMO_T} t.`;

  if (entrega.categoria === "adubo" && !entrega.cienteChuva) {
    erros.cienteChuva = "Confirme que consultou a previsão de chuva.";
  }

  if (!entrega.notaFiscal) erros.notaFiscal = "Anexe a nota fiscal (PDF ou XML).";
  else {
    const erroArquivo = validarNotaFiscal(entrega.notaFiscal);
    if (erroArquivo) erros.notaFiscal = erroArquivo;
  }

  return erros;
}

/** Protocolo simulado até a integração com o backend. */
export const gerarProtocolo = () => `#AG-${88300 + Math.floor(Math.random() * 700)}`;
