---
title: Referência da API
status: completo
---

# Referência da API REST

A API do **Recebimento Inteligente Cocapec** é construída com **FastAPI** e segue o padrão RESTful, disponibilizando endpoints para todas as etapas do fluxo de agendamento, validação fiscal, pátio e inteligência analítica.

---

## 1. Informações Gerais

- **Base URL (Local):** `http://localhost:8000/api/v1`
- **Formato das Requisições e Respostas:** `application/json`
- **Upload de Arquivos:** `multipart/form-data` (para notas fiscais em XML e DANFE em PDF)
- **Convenção de Códigos HTTP:**
  - `200 OK`: Requisição processada com sucesso.
  - `201 Created`: Recurso criado com sucesso.
  - `400 Bad Request`: Parâmetros ou regras de negócio inválidas.
  - `401 Unauthorized` / `403 Forbidden`: Falha de autenticação ou escopo insuficiente.
  - `422 Unprocessable Entity`: Erro de validação de payload pelo Pydantic.
  - `500 Internal Server Error`: Erro interno no servidor.

---

## 2. Visão Geral dos Grupos de Endpoints

### 2.1. Agendamentos (`/agendamentos`)

| Método | Endpoint | Perfil | Descrição |
|---|---|---|---|
| `GET` | `/agendamentos/` | Fornecedor, Armazém, Admin | Lista agendamentos com filtros por status, data e empresa |
| `POST` | `/agendamentos/` | Fornecedor | Cria nova solicitação com envio de XML/PDF e escolha de horário |
| `POST` | `/agendamentos/na-hora` | Fornecedor, Armazém | Registra agendamento imediato para caminhão que já está na fila |
| `GET` | `/agendamentos/{id}` | Todos | Detalhes do agendamento, nota fiscal vinculada e histórico |
| `PUT` | `/agendamentos/{id}/cancelar` | Fornecedor | Cancela agendamento (calcula se foi com antecedência $\ge 24\text{h}$) |
| `PUT` | `/agendamentos/{id}/reagendar` | Fornecedor | Altera a data/horário para nova janela disponível |

### 2.2. Mesa de Compras (`/compras`)

| Método | Endpoint | Perfil | Descrição |
|---|---|---|---|
| `GET` | `/compras/validacoes` | Compras, Admin | Lista notas pendentes de conferência fiscal |
| `POST` | `/compras/validacoes/{id}/aprovar` | Compras | Aprova a entrega e autoriza a entrada no armazém |
| `POST` | `/compras/validacoes/{id}/reprovar` | Compras | Reprova a entrega registrando motivo e notificando o fornecedor |
| `GET` | `/compras/historico` | Compras, Admin | Consulta o histórico de pareceres emitidos pela mesa |

### 2.3. Pátio e Armazém (`/armazem`)

| Método | Endpoint | Perfil | Descrição |
|---|---|---|---|
| `GET` | `/armazem/agenda` | Armazém, Admin | Consulta a ocupação das docas e horários previstos para o dia |
| `POST` | `/armazem/descargas/{id}/iniciar` | Armazém | Registra chegada na doca e marco inicial da descarga |
| `POST` | `/armazem/descargas/{id}/finalizar` | Armazém | Registra término, chapas alocados e libera a vaga física |
| `GET` | `/armazem/baias` | Armazém, Admin | Lista baias e disponibilidade em tempo real |

### 2.4. Boletim de Produção (`/boletim`)

| Método | Endpoint | Perfil | Descrição |
|---|---|---|---|
| `GET` | `/boletim/hoje` | Armazém, Admin | Retorna o boletim em aberto do dia corrente |
| `POST` | `/boletim/lancamentos` | Armazém | Adiciona apontamento de carga e equipe de chapas |
| `POST` | `/boletim/fechar` | Armazém | Executa fechamento do dia, calcula diárias e aplica complemento do piso |

### 2.5. Painel Gerencial e Indicadores (`/painel`)

| Método | Endpoint | Perfil | Descrição |
|---|---|---|---|
| `GET` | `/painel/sobra-falta/historico` | Admin, Armazém | Cruza notas com folha histórica (2022–2026) e aponta sazonalidade |
| `GET` | `/painel/sobra-falta/sistema` | Admin, Armazém | Mede a ociosidade real via complemento pago no boletim diário |
| `GET` | `/painel/resumo` | Admin | Consolidação dos principais KPIs operacionais da cooperativa |

---

## 3. Exemplo Prático de Requisição

### Aprovação de Agendamento por Compras

```bash
curl -X POST "http://localhost:8000/api/v1/compras/validacoes/12/aprovar" \
  -H "Content-Type: application/json" \
  -d '{
    "pedido_compra": "PC-2026-8841",
    "observacao": "Itens conferidos contra o pedido. Doca liberada para Adubo."
  }'
```

**Resposta (`200 OK`):**
```json
{
  "id": 12,
  "status": "APROVADO",
  "pedido_compra": "PC-2026-8841",
  "data_aprovacao": "2026-10-04T08:30:00-03:00",
  "mensagem": "Agendamento aprovado com sucesso. Notificação enviada ao fornecedor."
}
```

---

## 4. Especificação Interativa OpenAPI / Swagger

A especificação completa em formato OpenAPI 3.0 pode ser consultada tanto de forma estática através da visualização gráfica embutida abaixo (carregada de `docs/fontes/openapi.json`), quanto via Swagger UI interativo no backend em:
- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`
