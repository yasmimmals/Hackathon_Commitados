import type { FaqGrupo } from "../types";

export const TAGS_RAPIDAS: { rotulo: string; termo: string }[] = [
  { rotulo: "Tolerância de Peso",      termo: "tolerância" },
  { rotulo: "Horário da Balança",      termo: "horário" },
  { rotulo: "Carga Batida",            termo: "batida" },
  { rotulo: "Cancelamento Tardio",     termo: "cancelamento" },
  { rotulo: "Chegada fora do horário", termo: "chegar" },
];

export const FAQ: FaqGrupo[] = [
  {
    id: "procedimentos",
    titulo: "Procedimentos de Balança & Pesagem",
    itens: [
      {
        id: "tolerancia",
        pergunta: "Qual é a tolerância máxima de peso na balança da COCAPEC?",
        resposta:
          "A tolerância é de 0,5% entre o peso declarado na NF-e e o peso aferido na balança rodoviária. Acima disso, a carga fica retida para conferência e o setor de compras é acionado antes da liberação da descarga.",
      },
      {
        id: "chegada-antes",
        pergunta: "O que acontece se o caminhão chegar antes ou depois da janela agendada?",
        resposta:
          "Chegadas com até 30 minutos de antecedência entram na fila normalmente. Atrasos acima de 30 minutos perdem a prioridade da janela e o veículo passa a ser encaixado conforme a disponibilidade do pátio (use \"Agendar na Hora\" na portaria).",
      },
      {
        id: "horario",
        pergunta: "Qual o horário de funcionamento da balança rodoviária?",
        resposta:
          "As balanças 01 e 02 operam de segunda a sexta das 07h00 às 18h00 e aos sábados das 07h00 às 12h00. A última pesagem de entrada é feita 1 hora antes do encerramento para garantir a descarga no mesmo dia.",
      },
      {
        id: "cancelamento",
        pergunta: "Posso cancelar um agendamento em cima da hora? Existe cancelamento tardio?",
        resposta:
          "O cancelamento sem penalidade pode ser feito até 4 horas antes da janela em \"Meus Agendamentos\". Após esse prazo ele é registrado como cancelamento tardio e reincidências podem reduzir a prioridade do fornecedor nos próximos agendamentos.",
      },
      {
        id: "documentos-guarita",
        pergunta: "O que é necessário apresentar na guarita de pesagem?",
        resposta:
          "CNH do motorista, DANFE ou chave de acesso da NF-e, código do agendamento e documento do veículo (CRLV). Para cargas perigosas, apresente também a ficha de emergência e o kit obrigatório.",
      },
    ],
  },
  {
    id: "cargas",
    titulo: "Regras de Cargas, Moegas e Chuva",
    itens: [
      {
        id: "chuva",
        pergunta: "Como funciona a suspensão de descarga em caso de chuva?",
        resposta:
          "Descargas de granel na moega são suspensas durante chuva para evitar umidade no produto. Cargas paletizadas em docas cobertas seguem normalmente. O motorista aguarda no pátio e é chamado por WhatsApp quando a operação for retomada.",
      },
      {
        id: "batida-paletizada",
        pergunta: "Qual a diferença no agendamento entre carga batida e carga paletizada/big bag?",
        resposta:
          "Carga batida exige descarga manual e ocupa a doca por mais tempo, por isso usa janelas de 2 horas. Paletizado e big bag usam janelas de 1 hora e podem ser direcionados para docas com empilhadeira.",
      },
    ],
  },
  {
    id: "notas",
    titulo: "Notas Fiscais & Divergências de Pedido",
    itens: [
      {
        id: "nota-recusada",
        pergunta: "Minha nota foi recusada pelo setor de compras. O que devo fazer?",
        resposta:
          "Verifique o motivo da recusa no detalhe do agendamento. Normalmente é divergência de preço, quantidade ou pedido. Emita a carta de correção ou nova NF-e e envie para notasfiscais@cocapec.com.br, ou fale com o comprador pelo WhatsApp.",
      },
    ],
  },
];
