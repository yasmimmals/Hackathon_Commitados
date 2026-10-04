export const TELAS_EM_CONSTRUCAO = {
  reagendarEntrega: {
    titulo: "Reagendar Entrega",
    acoes: ["Escolher nova data e horário disponível"],
  },
  cancelarAgendamento: {
    titulo: "Solicitar Cancelamento",
    acoes: [
      "Informar motivo",
      "Cancelamento tardio quando faltar menos de 24h para a janela",
    ],
  },
  validarAgendamento: {
    titulo: "Validar Agendamento",
    acoes: [
      "Ver NF anexada e comparar com o pedido de compra (SAP)",
      "Aprovar agendamento",
      "Recusar agendamento (motivo obrigatório)",
    ],
  },
  recebimentoCaminhao: {
    titulo: "Recebimento do Caminhão",
    acoes: [
      "Registrar chegada e entrada (início da descarga)",
      "Verificar chuva no Adubo e reagendar com encaixe",
      "Conferir a carga contra a NF e registrar divergência com motivo",
      "Concluir descarga e registrar saída",
      "Registrar chapas que atuaram e equipamentos",
      "Lançar produção no boletim aberto",
    ],
  },
} satisfies Record<string, { titulo: string; acoes: string[] }>;
