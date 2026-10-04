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

Os status abaixo são os do enum `StatusAgendamento` (`backend/app/models/models.py`), e as transições são as permitidas em `backend/app/services/agendamento_service.py`.

```
PENDENTE ──(Compras aprova)──> APROVADO ──(armazém define destino)──> DESTINO_DEFINIDO
    │                              │                                        │
    │                              │                                (Caminhão chegou)
    │                              │                                        ▼
    │                              │                                     NA_FILA
    │                              │                                        │
    │                              │                           (Iniciar descarregamento)
    │                              │                                        ▼
    │                              │                                   EM_DESCARGA
    │                              │                                        │
    │                              │                   (Caminhão saiu na última descarga)
    │                              │                                        ▼
    │                              │                                    CONCLUIDO
    ├──(Compras rejeita)──> REJEITADO
    ├──(fornecedor cancela, até 24h antes)──> CANCELADO        (de PENDENTE, APROVADO ou DESTINO_DEFINIDO)
    ├──(não veio na janela)──> NAO_COMPARECEU                  (de PENDENTE, APROVADO ou DESTINO_DEFINIDO)
    └──(chuva no Adubo)──> REAGENDADO + novo agendamento prioritário  (de APROVADO, DESTINO_DEFINIDO ou NA_FILA)
```

1. `PENDENTE`: criado pelo fornecedor com a nota fiscal, aguardando o Compras. O balcão (caminhão sem agendamento) também começa aqui quando há vaga.
2. `APROVADO`: o Compras conferiu a NF contra o pedido de compra.
3. `DESTINO_DEFINIDO`: o armazém escolheu o armazém (ou mais de um) e a baia.
4. `NA_FILA`: chegada registrada (marco 1).
5. `EM_DESCARGA`: pelo menos uma descarga iniciada (marco 2).
6. `CONCLUIDO`: todas as descargas com saída registrada (marco 3), com chapas e equipamentos.
7. `REJEITADO`: recusado pelo Compras, ou balcão sem vaga (motivo `SEM_VAGA`).
8. `CANCELADO`: cancelado pelo fornecedor; só é aceito até 24 horas antes do horário.
9. `NAO_COMPARECEU`: o caminhão não veio; só pode ser marcado depois do fim da janela.
10. `REAGENDADO`: substituído por um novo agendamento (origem `CHUVA`, prioritário e fora do limite do horário).

**Aviso de atraso.** Antes da chegada (`PENDENTE`, `APROVADO` ou `DESTINO_DEFINIDO`), o fornecedor pode avisar atraso pelo `POST /agendamentos/{id}/atraso`, com minutos (de 5 a 600) e motivo opcional. O aviso fica nas colunas `atraso_minutos`, `atraso_motivo` e `atraso_informado_em` e aparece para a equipe do armazém na agenda do dia. Ele não muda o status.

---

## 4. Regra de Remuneração e Garantia do Piso

A conta está em `backend/app/services/boletim_calculo.py` e é a mesma da planilha da Cocapec (célula J65):

```
diárias equivalentes = nº de chapas − 0,5 × meias diárias
valor por diária     = produção total ÷ diárias equivalentes
se valor por diária < R$ 90,1731:
    total a pagar = R$ 90,1731 × diárias equivalentes
    complemento   = total a pagar − produção total
senão:
    total a pagar = produção total;  complemento = 0      (não há teto)
```

- Os valores são calculados em `Decimal`, sem arredondar no meio da conta; só a apresentação arredonda para 2 casas. Assim o exemplo do dossiê fecha: R$ 918,20 de produção, R$ 991,90 pagos, R$ 73,71 de complemento.
- O complemento é do boletim do dia como um todo, e não por pessoa. É ele que mede quanto se pagou acima do que a equipe produziu, e é o número usado no painel.
- O preço unitário de cada linha é copiado no lançamento: um reajuste na tabela não muda boletins anteriores.

---

## 5. Módulo do Painel Gerencial (Tarefa 3)

O backend conta com serviços analíticos dedicados em `app/services/painel_service.py` e `app/controllers/painel_controller.py`:
- **Cruzamento Histórico:** Cruza dia a dia a demanda de notas fiscais com a folha diária de pagamento de chapas.
- **Identificação da Sazonalidade:** Classifica cada mês em `SOBRA`, `EQUILIBRIO`, `RISCO_DE_FALTA` ou `FALTA`.
- **Métricas em Tempo Real:** Conecta-se diretamente aos boletins diários para mensurar o valor exato pago em complemento (horas ociosas).
- **Carga de Dados Automatizada:** Script `backend/scripts/carregar_historico.py` com suporte à migração das planilhas de pedidos e notas para o PostgreSQL.
- **Dados de demonstração:** `backend/scripts/popular_demo.py` gera 4 semanas de operação simulada (boletins fechados, descargas com os três marcos, não recebimentos e agendamentos futuros), tudo com `origem_dado = TESTE`. Rodar de novo substitui a simulação anterior, e `--limpar` apaga só ela; dados históricos e registros ao vivo não são tocados.

---

## 6. Notificações Automáticas de Validação

Sempre que a equipe de Compras aprova ou recusa um agendamento:
1. O backend registra a alteração de status e a justificativa no banco de dados.
2. É disparado um e-mail transacional via SMTP para a caixa de correio do fornecedor.
3. Em ambiente de homologação e desenvolvimento, os e-mails são capturados em tempo real pelo **Mailpit** (disponível em `http://localhost:8025`).

---

## 7. Orquestração com Docker Compose

A infraestrutura completa é executada via Docker Compose. Ao subir, o container do backend aplica as migrações (`alembic upgrade head`) e popula as tabelas de referência (`scripts/seed.py`). O `docker-compose.yml` da raiz inclui o Mailpit; o `backend/docker-compose.yaml` sobe só banco, API e Adminer.
- **`backend`**: Aplicação FastAPI rodando na porta `8000`.
- **`db`**: PostgreSQL 16 na porta `5435` com volume persistente `pgdata`.
- **`adminer`**: Gerenciador de banco web na porta `8080`.
- **`mailpit`**: Servidor SMTP e visualizador web de e-mails na porta `8025` (porta SMTP `1025`).
