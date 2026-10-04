---
title: Perfis e Permissões
status: completo
---

O sistema tem perfis de acesso bem definidos, onde cada usuário visualiza e opera as telas condizentes com sua função. Previsão do tempo, SAP e prestador dos chapas são atores externos, sem login.

| Perfil | Pode | Não acessa |
| --- | --- | --- |
| **Fornecedor** | Agendar entrega com NF, carga e ciência de chuva (Adubo); agendar na hora; consultar, reagendar e cancelar os próprios agendamentos; ver a previsão de chuva | Validação de nota, recebimento, boletim, painel e dados de outros fornecedores |
| **Compras** | Ver a fila de agendamentos, validar os itens da NF contra o pedido de compra, recusar com motivo, consultar o histórico de validações | Operação do pátio, boletim, painel e criação de agendamentos |
| **Responsável pelo Armazém / Controle de Estoque** | Definir armazém de destino, registrar comparecimento, chegada, entrada e saída, conferir a carga contra a NF, lançar a produção, abrir e fechar o boletim do dia, consultar o painel gerencial | Dados de outros perfis e a validação de notas |
| **Administrador** | Acesso irrestrito a todas as visões (Fornecedor, Compras, Armazém) e à Documentação Geral do sistema | - |

As regras de acesso devem valer na API, e não só no front: esconder uma tela não impede que alguém chame o endpoint. O login único retorna o perfil e redireciona para a página inicial correspondente.

**Pontos em aberto para a equipe:**
- O painel gerencial é só do Responsável pelo Armazém, ou Compras também o vê?
- Cada Responsável pelo Armazém vê apenas o seu armazém ou todos?
- Quem cria os logins de Compras e do armazém, e o fornecedor se cadastra sozinho?
- Quem abre a tela de agendar na hora quando o caminhão chega sem agendamento?
