---
title: Backend
status: completo
---

# API, Modelagem e Serviços

Este documento apresenta a especificação técnica e a arquitetura do backend construído em Python com **FastAPI**, **SQLAlchemy**, **Alembic** e banco de dados **PostgreSQL**.

---

## 1. Atores e Responsabilidades

- **Fornecedor:** Submete solicitações de agendamento de descarga com upload de notas fiscais (XML/PDF), consulta o status de cada carga e solicita reagendamentos quando necessário.
- **Compras:** Valida os itens das notas fiscais confrontando-os com os pedidos de compra correspondentes, autorizando ou recusando a entrega com justificativa formal.
- **Armazém / Estoque:** Confere mercadorias fisicamente, inspeciona condições de entrega, registra os marcos temporais de descarga (chegada, início, fim), designa baias físicas, aponta chapas e consolida o boletim diário.
- **Administrador / Gerência:** Visualiza relatórios analíticos, taxa de ociosidade de chapas, evolução histórica e a documentação completa da plataforma.

---

## 2. Entidades Principais e Relacionamentos

- `Fornecedor`: Cadastro da empresa com razão social e CNPJ único.
- `NotaFiscal`: Dados estruturados da NF-e (chave de acesso de 44 dígitos, número, série, peso, volumes, valor e itens).
- `Agendamento`: Núcleo do sistema, vinculando fornecedor, nota fiscal, data, janela horária e status do fluxo.
- `Descarga`: Registra horários de início e término real, baia utilizada, equipamentos alocados e número de chapas empregados.
- `Baia`: Doca física disponível para recebimento por armazém (Adubo, Insumos, Pátio de Máquinas, Loja).
- `Equipamento`: Empilhadeiras, transpaleteiras e plataformas utilizadas no descarregamento.
- `BoletimDiario`: Consolidação do dia de trabalho, chapas presentes, total de toneladas e cálculo do piso/complemento.
- `BoletimChapa`: Registro dos profissionais que atuaram na diária (integral ou meia).
- `RecebimentoHistorico`: Tabela de dados históricos (2022–2026) alimentada pelo script de carga para alimentar os indicadores analíticos.
- `FolhaDiaria`: Histórico de presença e valores diários pagos aos chapas.

---

## 3. Máquina de Estados do Agendamento

```
[SOLICITADO] ──(Compras valida)──> [APROVADO] ──(Chega na baia)──> [EM_DESCARGA] ──(Fim)──> [CONCLUIDO]
     │                                   │
     ├──(Compras recusa)─> [RECUSADO]   ├──(Fornecedor cancela)─> [CANCELADO]
     │                                   │
     └───────────────────────────────────┴──(Não comparece na janela)─> [NAO_COMPARECEU]
```

1. `SOLICITADO`: Criado pelo fornecedor com upload de nota fiscal, aguardando análise de Compras.
2. `APROVADO`: Autorizado pela Mesa de Compras; vaga reservada na agenda do armazém.
3. `RECUSADO`: Rejeitado por divergência fiscal ou ausência de pedido de compra ativo.
4. `CANCELADO`: Cancelado pelo fornecedor (identificado como tardio se comunicado com menos de 24h).
5. `EM_DESCARGA`: Caminhão posicionado na doca indicada e operação iniciada.
6. `CONCLUIDO`: Descarga finalizada com assinatura de conferência e liberação da vaga.
7. `NAO_COMPARECEU`: Caminhão ausente na janela estipulada.

---

## 4. Regra de Remuneração e Garantia do Piso

O sistema implementa o fechamento automático da produção de acordo com a Convenção Coletiva e as diretrizes da Cocapec:
- **Piso Garantido por Diária:** **R$ 90,1731** por diária equivalente.
- **Cálculo das Diárias Equivalentes:**
  $$\text{Diárias} = \text{Chapas Integrais} + (0,5 \times \text{Meias Diárias})$$
- **Aplicação do Complemento:**
  Se a produção total atingir um valor por diária inferior a R$ 90,1731, o sistema calcula a diferença e a divide entre os profissionais, garantindo transparência contábil e eliminação de erros manuais.

---

## 5. Módulo do Painel Gerencial (Tarefa 3)

O backend conta com serviços analíticos dedicados em `app/services/painel_service.py` e `app/controllers/painel_controller.py`:
- **Cruzamento Histórico:** Cruza dia a dia a demanda de notas fiscais com a folha diária de pagamento de chapas.
- **Identificação da Sazonalidade:** Classifica cada mês em `SOBRA`, `EQUILIBRIO`, `RISCO_DE_FALTA` ou `FALTA`.
- **Métricas em Tempo Real:** Conecta-se diretamente aos boletins diários para mensurar o valor exato pago em complemento (horas ociosas).
- **Carga de Dados Automatizada:** Script `backend/scripts/carregar_historico.py` com suporte à migração das planilhas de pedidos e notas para o PostgreSQL.

---

## 6. Notificações Automáticas de Validação

Sempre que a equipe de Compras aprova ou recusa um agendamento:
1. O backend registra a alteração de status e a justificativa no banco de dados.
2. É disparado um e-mail transacional via SMTP para a caixa de correio do fornecedor.
3. Em ambiente de homologação e desenvolvimento, os e-mails são capturados em tempo real pelo **Mailpit** (disponível em `http://localhost:8025`).

---

## 7. Orquestração com Docker Compose

A infraestrutura completa é executada via Docker Compose:
- **`backend`**: Aplicação FastAPI rodando na porta `8000`.
- **`db`**: PostgreSQL 16 na porta `5435` com volume persistente `pgdata`.
- **`adminer`**: Gerenciador de banco web na porta `8080`.
- **`mailpit`**: Servidor SMTP e visualizador web de e-mails na porta `8025` (porta SMTP `1025`).
