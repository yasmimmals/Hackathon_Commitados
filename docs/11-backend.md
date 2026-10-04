---
title: Backend 
status: rascunho
---

# API, Modelagem e Serviços

*Baseado nos diagramas do backend; confirmar com a equipe de backend.*

Este documento resume a especificação técnica e a arquitetura do backend construído com FastAPI, SQLAlchemy, Alembic e PostgreSQL.

## 1. Atores e Responsabilidades
- **Fornecedor:** Realiza solicitações de agendamento de descarga anexando notas fiscais (XML/PDF), consulta seus agendamentos, solicita cancelamentos e reagendamentos.
- **Compras:** Valida os itens das notas fiscais contra os pedidos de compra correspondentes, autorizando ou recusando a entrega com justificativa.
- **Armazém / Estoque:** Confere mercadorias, inspeciona condições físicas, registra tempos reais de início e fim da descarga, aloca baias, controla presença de chapas e consolida boletins diários.
- **Administrador:** Gerencia parâmetros globais e monitora o funcionamento de ponta a ponta.

## 2. Classes e Relacionamentos
- `Fornecedor`: Dados cadastrais e CNPJ único, vinculado a múltiplas notas fiscais e agendamentos.
- `NotaFiscal`: Dados da NF-e (chave de acesso, número, série, peso, volumes, valor e itens).
- `Agendamento`: Liga fornecedor, nota fiscal, data, horário e status do agendamento.
- `Descarga`: Registra horários de entrada e saída, baia utilizada, equipamentos e contagem de chapas por armazém.
- `Baia`: Doca física disponível para recebimento por armazém.
- `Equipamento`: Máquinas e ferramentas operacionais (empilhadeiras, transpaleteiras, etc.).
- `BoletimDiario`: Consolidação de produção diária, chapas presentes e cálculos de remuneração.
- `BoletimProducao`: Itens movimentados e seus tipos de remuneração unitária.
- `BoletimChapa`: Associação dos chapas presentes na diária (integral ou meia).
- `Chapa`: Matrícula e identificador do trabalhador.
- `Notificacao`: Registro dos avisos enviados ou simulados aos fornecedores.

## 3. Estados do Agendamento
1. `SOLICITADO`: Criado pelo fornecedor, aguardando validação de Compras.
2. `APROVADO`: Validado e confirmado para o horário agendado.
3. `RECUSADO`: Rejeitado por divergência ou falta de pedido de compra.
4. `CANCELADO`: Cancelado pelo fornecedor (com marcação de tardio se < 24h).
5. `EM_DESCARGA`: Caminhão presente na baia iniciando a operação.
6. `CONCLUIDO`: Descarga finalizada e registrada no sistema.
7. `NAO_COMPARECEU`: Caminhão ausente na janela estipulada.

## 4. Estados do Boletim e Regra do Piso
- **Estados do Boletim:** `ABERTO` (recebendo lançamentos do dia) e `FECHADO` (após conferência e cálculo do piso/complemento).
- **Regra do Piso:** Garante remuneração mínima de **R$ 90,1731** por diária equivalente (`diárias = chapas - 0,5 * meias`). Quando o valor produzido por diária é inferior ao piso, o sistema calcula e aplica o `complemento`.

## 5. Sequência do Recebimento
1. Fornecedor submete nota e seleciona horário.
2. Compras analisa conformidade da nota fiscal.
3. Caminhão se apresenta na portaria/balança no dia agendado.
4. Armazém direciona para a baia designada e registra a entrada.
5. Descarga é executada com apoio da equipe de chapas e maquinário.
6. Armazém registra o encerramento da descarga, liberando a vaga.

## 6. Implantação com Docker Compose
A stack do backend é provisionada via Docker Compose:
- **`backend`**: Serviço FastAPI rodando na porta `8000`.
- **`db`**: PostgreSQL 16 Alpine na porta `5435` com volume persistente.
- **`adminer`**: Interface visual de gerenciamento de banco na porta `8080`.
- **`mailpit`**: Servidor SMTP e interface web para teste de e-mails na porta `8025`.
