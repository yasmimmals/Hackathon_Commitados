---
title: Referência da API
status: completo
---

# Referência da API REST

A API do **Recebimento Inteligente Cocapec** é feita em **FastAPI**. Todas as rotas ficam sob `/api/v1` e o mapa completo está em `backend/app/routes.py`. A lista abaixo foi conferida contra a especificação gerada pelo próprio backend (`docs/fontes/openapi.json`, 57 operações).

---

## 1. Informações gerais

- **Base URL (local):** `http://localhost:8000/api/v1`
- **Formato:** `application/json`; envio de nota fiscal em `multipart/form-data` (XML ou PDF)
- **Autenticação:** `POST /auth/login` devolve um token, enviado em `Authorization: Bearer <token>`
- **Perfis:** `FORNECEDOR`, `COMPRAS`, `ARMAZEM` e `ADMIN`. O `ADMIN` passa em todas as rotas. O fornecedor só acessa agendamentos da própria empresa (mesmo CNPJ) ou que ele mesmo criou.
- **Atenção:** as rotas marcadas como "sem login" respondem sem token. Para produção, elas devem passar a exigir autenticação; hoje isso fica para depois do hackathon.
- **Erros:** regras de negócio voltam com `codigo` e `mensagem` (por exemplo `TRANSICAO_INVALIDA`, `PRAZO_CANCELAMENTO`, `SEM_VAGA`); `401`/`403` para login ou perfil; `422` para dados inválidos.

---

## 2. Endpoints

### 2.1. Acesso e saúde

| Método | Endpoint | Perfil | Descrição |
|---|---|---|---|
| `GET` | `/health` | sem login | Situação da API e do banco |
| `POST` | `/auth/login` | sem login | Login; devolve token e usuário |
| `POST` | `/auth/cadastro` | sem login | Cadastro; Compras e Armazém exigem o código interno da Cocapec |
| `GET` | `/auth/me` | logado | Usuário da sessão |

### 2.2. Agendamento (fornecedor e Compras)

| Método | Endpoint | Perfil | Descrição |
|---|---|---|---|
| `POST` | `/agendamentos/nota-fiscal` | sem login | Envia a NF (XML ou PDF); o sistema lê fornecedor, peso, volumes e itens |
| `GET` | `/agendamentos/nota-fiscal/{nota_id}` | sem login | Dados lidos da nota |
| `GET` | `/agendamentos/disponibilidade` | sem login | Vagas por horário (regra de ocupação) e previsão de chuva para adubo |
| `POST` | `/agendamentos` | Fornecedor | Cria o agendamento (status `PENDENTE`) |
| `GET` | `/agendamentos` | logado | Lista, com filtros de data, status e fornecedor |
| `GET` | `/agendamentos/{ag_id}` | logado | Detalhe do agendamento |
| `POST` | `/agendamentos/{ag_id}/cancelar` | Fornecedor | Cancela, até 24 h antes do horário |
| `POST` | `/agendamentos/{ag_id}/atraso` | Fornecedor | Avisa atraso (minutos e motivo); aparece para a equipe do armazém |
| `GET` | `/agendamentos/{ag_id}/notificacoes` | logado | E-mails enviados ao fornecedor sobre o agendamento |
| `GET` | `/agendamentos/{ag_id}/conferencia` | sem login | Itens da NF lado a lado com o pedido de compra |
| `POST` | `/agendamentos/{ag_id}/aprovar` | Compras | Aprova, informando o pedido de compra (status `APROVADO`) |
| `POST` | `/agendamentos/{ag_id}/rejeitar` | Compras | Recusa com motivo (status `REJEITADO`) |

### 2.3. Armazém (operador do pátio)

| Método | Endpoint | Perfil | Descrição |
|---|---|---|---|
| `GET` | `/armazem/programacao` | Armazém | Caminhões previstos e chapas recomendados por dia e armazém |
| `GET` | `/armazem/aguardando-destino` | Armazém | Aprovados pelo Compras que ainda não têm armazém e baia |
| `GET` | `/armazem/fila` | Armazém | Fila do dia, por armazém |
| `POST` | `/armazem/balcao` | Fornecedor, Armazém | Caminhão que chegou sem agendar: agenda na hora se houver vaga; senão registra não recebimento por falta de vaga |
| `PUT` | `/armazem/agendamentos/{ag_id}/destinos` | Armazém | Define um ou mais armazéns e a baia de cada um |
| `POST` | `/armazem/agendamentos/{ag_id}/chegada` | Armazém | Marco 1: caminhão chegou (status `NA_FILA`) |
| `POST` | `/armazem/agendamentos/{ag_id}/entrada` | Armazém | Marco 2: início da descarga em um armazém (status `EM_DESCARGA`) |
| `POST` | `/armazem/agendamentos/{ag_id}/saida` | Armazém | Marco 3: fim da descarga, com chapas e equipamentos; na última, status `CONCLUIDO` |
| `POST` | `/armazem/agendamentos/{ag_id}/nao-compareceu` | Armazém | Não comparecimento, depois do fim da janela |
| `POST` | `/armazem/agendamentos/{ag_id}/reagendar-chuva` | Armazém | Reagenda por chuva, com prioridade e fora do limite do horário |

### 2.4. Cadastros

| Método | Endpoint | Perfil | Descrição |
|---|---|---|---|
| `GET` / `POST` | `/cadastros/baias` | sem login / Armazém | Lista e cria baias (docas) por armazém |
| `PATCH` | `/cadastros/baias/{baia_id}/ativa` | Armazém | Ativa ou desativa uma baia |
| `GET` | `/cadastros/equipamentos` | sem login | Catálogo de equipamentos (seção 6 do dossiê) |
| `GET` / `POST` | `/cadastros/chapas` | sem login / Armazém | Lista e cadastra chapas por matrícula |
| `GET` | `/cadastros/tipos-item` | sem login | Os 14 tipos de item do boletim, com preço unitário |
| `GET` / `POST` | `/fornecedores` | sem login / Compras, Armazém | Lista e cadastra fornecedores |

### 2.5. Boletim diário (Tarefa 2)

Todas as rotas exigem o perfil Armazém.

| Método | Endpoint | Descrição |
|---|---|---|
| `POST` | `/boletins` | Abre o boletim do dia (geral, um por dia) |
| `GET` | `/boletins` | Lista por período |
| `GET` | `/boletins/{boletim_id}` | Detalhe com o cálculo |
| `PUT` | `/boletins/{boletim_id}/producao` | Lança a produção por tipo de item (descarga, remoção, transferência) |
| `PUT` | `/boletins/{boletim_id}/equipe` | Lança a equipe por matrícula, com meia diária |
| `POST` | `/boletins/{boletim_id}/fechar` | Fecha e congela os totais (piso e complemento) |
| `POST` | `/boletins/{boletim_id}/reabrir` | Volta para rascunho |
| `GET` | `/boletins/{boletim_id}/excel` | Exporta o boletim no formato da planilha da Cocapec |

### 2.6. Painel gerencial (Tarefa 3)

Todas as rotas exigem o perfil Compras ou Armazém.

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/painel/resumo` | Resumo dos indicadores do período |
| `GET` | `/painel/sobra-falta` | Sobra ou falta de chapas: histórico (folha × SAP) e sistema (complemento do boletim) |
| `GET` | `/painel/cargas` | Cargas recebidas por dia e por armazém |
| `GET` | `/painel/tempos` | Tempo médio de espera (chegada → entrada) e de descarga (entrada → saída) |
| `GET` | `/painel/chapas-por-recebimento` | Chapas por descarga comparados à norma |
| `GET` | `/painel/utilizacao` | Utilização das baias e equipamentos |
| `GET` | `/painel/fornecedores` | Fornecedores com maior volume |
| `GET` | `/painel/movimento` | Horários e dias de maior movimento |
| `GET` | `/painel/nao-recebimentos` | Não recebimentos por motivo |
| `GET` | `/painel/custo` | Custo da mão de obra dos chapas (total dos boletins) |
| `GET` | `/painel/qualidade-dados` | Inconsistências encontradas nos dados |
| `GET` | `/painel/previsao` | Previsão das próximas semanas (caminhões e chapas recomendados) |
| `GET` | `/painel/custo-mensal` | Custo mensal da folha e custo por caminhão |
| `GET` | `/painel/plano-escala` | Plano de escala mensal e simulação com equipe fixa |

---

## 3. Exemplo: aprovação pelo Compras

```bash
curl -X POST "http://localhost:8000/api/v1/agendamentos/12/aprovar" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"pedido_compra": 26841, "analisado_por": "compras"}'
```

A resposta é o agendamento atualizado, com `status: "APROVADO"`. O fornecedor recebe um e-mail; sem `SMTP_HOST` configurado, o aviso fica registrado como `SIMULADA`.

---

## 4. Especificação OpenAPI

A especificação completa (parâmetros e esquemas de cada rota) aparece abaixo, carregada de `docs/fontes/openapi.json`. Com o backend rodando, também está em:
- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`

Para atualizar o arquivo depois de mudar a API: `curl http://localhost:8000/openapi.json -o docs/fontes/openapi.json`.
