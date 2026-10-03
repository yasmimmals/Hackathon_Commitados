/**
 * Telas ainda não implementadas: título e ações previstas exibidas
 * pelo componente <EmConstrucao />. Remova a entrada ao implementar a tela.
 */
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
  filaValidacao: {
    titulo: "Fila de Validação",
    acoes: ["Listar agendamentos pendentes de validação de NF"],
  },
  validarAgendamento: {
    titulo: "Validar Agendamento",
    acoes: [
      "Ver NF anexada e comparar com o pedido de compra (SAP)",
      "Aprovar agendamento",
      "Recusar agendamento (motivo obrigatório)",
    ],
  },
  historicoValidacoes: {
    titulo: "Histórico de Validações",
    acoes: ["Consultar validações aprovadas e recusadas"],
  },
  agendaDoDia: {
    titulo: "Recebimento — Agenda do Dia",
    acoes: [
      "Ver a agenda do dia e o armazém de destino (verificar autorização)",
      "Registrar comparecimento ou não comparecimento",
      "Definir quem ocupa a vaga liberada",
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
  boletimProducao: {
    titulo: "Boletim de Produção",
    acoes: [
      "Abrir o boletim do dia anterior",
      "Conferir equipe temporária (diária completa ou meia)",
      "Validar dados (até 20, sem repetição, sem efetivos)",
      "Fechar o boletim (cálculo de produção e piso, complemento ou pagamento)",
    ],
  },
  painelGerencial: {
    titulo: "Painel Gerencial",
    acoes: ["Sobra ou falta de chapas por armazém e período, em R$"],
  },
} satisfies Record<string, { titulo: string; acoes: string[] }>;
