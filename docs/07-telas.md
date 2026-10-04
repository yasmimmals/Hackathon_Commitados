---
title: Telas do Sistema
status: completo
---

As telas do sistema estão organizadas pelos perfis de atuação. O login de demonstração permite entrar em cada um dos papéis (Fornecedor, Compras, Armazém e Administrador). O Administrador vê o menu de todos os perfis e a Documentação.

| Perfil | Tela | O que faz | Estado |
| --- | --- | --- | --- |
| **Fornecedor** | Meus Agendamentos | Acompanha os agendamentos, cancela (até 24 h antes) e avisa atraso em um modal (horas e minutos, motivo opcional) | Pronta, integrada |
| **Fornecedor** | Agendar Entrega | Anexa a NF (XML ou PDF), informa o acondicionamento e escolhe data e horário pela regra de ocupação | Pronta, integrada |
| **Fornecedor** | Agendar na Hora | Encaixe do caminhão que chegou sem agendamento, se houver vaga | Pronta, integrada |
| **Fornecedor** | Previsão de Chuva | Previsão do tempo para as janelas (Open-Meteo) | Pronta, integrada |
| **Todos** | Login de demonstração por perfil | Entrada por perfil e cadastro | Pronta, integrada |
| **Compras** | Fila de Validação | Confere a NF contra o pedido de compra, aprova (com o número do pedido) ou recusa com motivo | Pronta, integrada |
| **Compras** | Histórico de Validações | Consulta das aprovações e recusas | Pronta, integrada |
| **Armazém** | Recebimento (Agenda do dia) | Define armazém e baia; vê os avisos de atraso; registra **Caminhão chegou**, **Iniciar descarregamento** e **Caminhão saiu** (com chapas e equipamentos); marca não comparecimento e reocupa vagas liberadas. Atualiza sozinha a cada minuto | Pronta, integrada |
| **Armazém** | Boletim Agrometeorológico | Condições e previsão do tempo para o pátio | Pronta, integrada |
| **Armazém** | Boletim de Produção | Produção e equipe do dia, regra do piso e complemento; fechar, reabrir e exportar em Excel | Pronta, integrada |
| **Armazém** | Painel Gerencial | Abas Próximas semanas, Plano de escala, Custo do chapeiro, Sobra ou falta, Tempo do caminhão (média mensal de espera e descarga) e Boletins | Pronta, integrada |
| **Administrador** | Documentação Geral (`/documentacao`) | Esta documentação | Pronta, integrada |

Em todas as telas há a **Central de Acessibilidade** (botão no canto inferior ou `Alt + A`): tema claro, escuro ou alto contraste, tamanho do texto, cores para daltonismo, fonte para dislexia, leitura em voz alta e outros ajustes.

Algumas rotas de detalhe ainda mostram a tela "Em construção", porque a ação acontece direto no card da lista: `/fornecedor/agendamentos/:id/reagendar`, `/fornecedor/agendamentos/:id/cancelar`, `/compras/validacoes/:id` e `/armazem/recebimento/:id`.

A rota `/documentacao` é restrita ao Administrador no menu e por redirecionamento de rota. Esse controle é do front; a proteção dos dados é feita pela API.
