---
title: Processos (BPMN)
status: completo
---

O BPMN descreve dois processos: o recebimento de mercadorias, uma vez por caminhão, e o boletim diário com o painel, uma vez por dia.

**Processo 1: recebimento de mercadorias.** Tem quatro raias: Fornecedor, Sistema, Compras e Responsável pelo Armazém.

- O fornecedor anexa a NF (PDF ou XML), informa a carga, aceita a ciência de chuva (Adubo) e escolhe data e horário.
- O sistema verifica se o horário está disponível pela regra de ocupação e reserva a vaga.
- Compras valida os itens da NF contra o pedido de compra e recusa o agendamento com motivo se a nota não estiver conforme.
- No dia, o armazém verifica a autorização e o armazém de destino, o comparecimento e o impedimento por chuva, e registra chegada, entrada e saída.
- Havendo divergência, o comprador decide por telefone (fora do sistema) se a carga é recebida.
- A descarga termina com o registro das chapas e dos equipamentos e o lançamento da produção no boletim aberto do dia.

O fornecedor também pode reagendar ou cancelar. O sistema remarca na próxima janela disponível, e o cancelamento com menos de 24 horas é tardio e retira a preferência em reagendamentos.

**Processo 2: boletim diário e painel.** Roda uma vez por dia, para a operação inteira.

- O responsável abre o boletim do dia anterior, com a produção já lançada.
- Confere a equipe temporária por matrícula (diária completa ou meia), com a presença vinda do prestador dos chapas.
- O sistema valida os dados (até 20 pessoas, sem repetição, sem efetivos) e calcula a produção total e as diárias equivalentes.
- Se o valor por diária ficar abaixo do piso (R$ 90,1731), o total é o piso vezes as diárias equivalentes, com lançamento do complemento; senão, o total é a produção e o complemento é zero.
- O sistema fecha o boletim, gravando preços e piso do dia, e o painel mostra a sobra ou falta de chapas por período, em reais.

A legenda do diagrama usa azul para tarefa de usuário, roxo para tarefa automática do sistema e amarelo tracejado para tarefa manual, fora do sistema. SAP e serviço de previsão do tempo aparecem como participantes externos.

**Pendente no BPMN:** aplicar a regra do boletim geral por dia. Trocar "uma vez por armazém, por dia" por "uma vez por dia" no título do Processo 2, no depósito de dados e na nota da legenda, e tirar "por armazém" da tarefa do painel.
