---
title: Perfis e Permissões
status: completo
---

O sistema tem perfis de acesso bem definidos, onde cada usuário visualiza e opera as telas condizentes com sua função. Previsão do tempo, SAP e prestador dos chapas são atores externos, sem login.

| Perfil | Pode | Não acessa |
| --- | --- | --- |
| **Fornecedor** | Agendar entrega com NF, carga e ciência de chuva (Adubo); agendar na hora; consultar, reagendar e cancelar os próprios agendamentos; ver a previsão de chuva; avisar atraso à equipe do armazém | Validação de nota, recebimento, boletim, painel e dados de outros fornecedores |
| **Compras** | Ver a fila de agendamentos, validar os itens da NF contra o pedido de compra, recusar com motivo, consultar o histórico de validações | Operação do pátio, boletim, painel e criação de agendamentos |
| **Responsável pelo Armazém / Controle de Estoque** | Definir armazém de destino, ver os avisos de atraso, registrar chegada, início e fim da descarga (com chapas e equipamentos), conferir a carga contra a NF, lançar a produção, abrir e fechar o boletim do dia, consultar o painel gerencial | Dados de outros perfis e a validação de notas |
| **Administrador** | Acesso irrestrito a todas as visões (Fornecedor, Compras, Armazém) e à Documentação Geral do sistema | - |

As regras de acesso devem valer na API, e não só no front: esconder uma tela não impede que alguém chame o endpoint. O login único retorna o perfil e redireciona para a página inicial correspondente.

**Decisões tomadas (conforme o código):**
- **Painel gerencial:** a API libera para Compras e Armazém (e Administrador). No menu, ele aparece para o Responsável pelo Armazém e para o Administrador.
- **Armazéns:** o Responsável pelo Armazém vê a agenda de todos os armazéns e pode filtrar por um deles.
- **Logins:** cada pessoa se cadastra na tela de cadastro. O fornecedor informa o CNPJ da empresa; Compras e Armazém precisam do código interno da Cocapec.
- **Agendar na hora:** o caminhão que chega sem agendamento pode ser encaixado pelo próprio fornecedor (tela Agendar na Hora) ou pelo armazém; havendo vaga, entra; sem vaga, fica registrado o não recebimento por falta de vaga.
- **Aviso de atraso:** o fornecedor avisa pela tela Meus Agendamentos, e o aviso aparece para a equipe do armazém na agenda do dia.
