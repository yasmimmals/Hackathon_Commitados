# Recebimento Inteligente · Cocapec

**Agendamento e recebimento de cargas no Terminal Logístico de Franca/SP, com um painel que responde, em reais, se a equipe de chapas está sobrando ou faltando.**

Desenvolvido pela equipe **Commitados** no **X Hackathon Uni-FACEF** (3 e 4 de outubro de 2026).

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![React](https://img.shields.io/badge/React-19-61DAFB) ![FastAPI](https://img.shields.io/badge/FastAPI-Python_3.11-009688) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791) ![Docker](https://img.shields.io/badge/Docker-Compose-2496ED)

<p align="center">
  <img src="docs\assets\logo.png" alt="Painel gerencial com sobra e falta de chapas por mês" width="80%">
</p>

---

## O problema

Hoje o recebimento é anotado à mão (um PDF com cerca de 200 lançamentos) e não há registro de horário de chegada nem de descarga. Sem esse dado, ninguém consegue dizer se a quantidade de chapas escalada por dia está certa.

## A solução

O sistema cobre o fluxo inteiro, do agendamento ao pagamento:

1. **Fornecedor** agenda a entrega, envia a nota fiscal (XML ou PDF) e escolhe a janela de horário.
2. **Compras** confere a nota contra o pedido de compra e aprova ou recusa, com justificativa. O fornecedor é avisado por e-mail.
3. **Armazém** registra chegada, início e fim da descarga, a doca e os chapas usados.
4. **Boletim diário** fecha a produção e o pagamento dos chapas, com piso de R$ 90,1731 por diária e complemento calculado automaticamente.
5. **Painel gerencial** cruza o histórico (2022–2026) com a folha e mostra sobra, falta, custo e previsão de escala, considerando a previsão de chuva.

Com o check-in do armazém, o sistema passa a medir os tempos que hoje são apenas estimados, e a análise de sobra e falta fica mais precisa a cada dia de uso.

<!-- Opcional: prints das telas por perfil -->
<!--
| Fornecedor | Compras | Armazém |
|---|---|---|
| ![](docs/img/fornecedor.png) | ![](docs/img/compras.png) | ![](docs/img/armazem.png) |
-->

---

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 16 (Turbopack), React 19, TypeScript, Tailwind CSS 4, React Router 7, MUI X Charts, PWA |
| Backend | Python 3.11, FastAPI, SQLAlchemy 2, Alembic, pdfplumber, pandas |
| Banco | PostgreSQL 16 |
| Infra local | Docker Compose, Mailpit (e-mails de teste), Adminer (banco) |
| Integrações | Open-Meteo (previsão de chuva), SAP da Cocapec (pedidos de compra) |

> **Por que Next.js e React Router juntos?** O Next.js serve a aplicação e a API da documentação. A interface é uma SPA: uma rota coringa do App Router entrega o app, e o React Router 7 cuida da navegação e do controle de acesso por perfil.

---

## Estrutura

```
Hackathon_Commitados/
├── backend/            # API FastAPI
│   ├── app/            # controllers, models, services, core
│   ├── migrations/     # Alembic
│   ├── scripts/        # seed, carga do histórico, dados de demonstração
│   ├── tests/          # pytest
│   └── dados/          # planilhas da Cocapec (não versionadas)
├── web/                # Frontend Next.js
│   └── src/
│       ├── app/        # App Router (rota coringa da SPA e API de docs)
│       ├── features/   # um módulo por tela/domínio
│       ├── routes/     # rotas e controle de acesso por perfil
│       └── shared/     # layout, acessibilidade, serviços HTTP, utilitários
├── docs/               # documentação (também exibida em /documentacao)
└── docker-compose.yml
```

---

## Como rodar

### Pré-requisitos

- Docker e Docker Compose
- Node.js 20 ou superior

### 1. Variáveis de ambiente

O `docker-compose.yml` lê o `.env` da pasta onde é executado, então ele precisa ficar na raiz do projeto:

```bash
# Linux / macOS
cp backend/.env.example .env
```

```powershell
# Windows (PowerShell)
Copy-Item backend\.env.example .env
```

### 2. Backend, banco e serviços

Execute **a partir da raiz do projeto** (não de dentro de `backend/`):

```bash
docker compose up --build -d
```

Na subida, o container aplica as migrations e popula as tabelas de referência automaticamente.

| Serviço | Endereço |
|---|---|
| API | http://localhost:8000/api/v1 |
| Documentação da API (Swagger) | http://localhost:8000/swagger |
| Mailpit (e-mails enviados) | http://localhost:8025 |
| Adminer (banco) | http://localhost:8080 |
| PostgreSQL | localhost:5435 (porta diferente da padrão para não conflitar com um Postgres local) |

### 3. Dados (opcional)

```bash
# histórico de recebimentos e folha da Cocapec (requer as planilhas em backend/dados/)
docker compose exec backend python -m scripts.carregar_historico dados/DADOS_HACKATHON_2026

# agendamentos e boletins de demonstração
docker compose exec backend python -m scripts.popular_demo

# remove só os dados de demonstração
docker compose exec backend python -m scripts.popular_demo --limpar
```

> As planilhas da Cocapec são confidenciais e estão no `.gitignore`. Sem elas, o sistema funciona normalmente com os dados de demonstração, mas o painel gerencial não terá o histórico de 2022–2026.

### 4. Frontend

```bash
cd web
npm install
npm run dev
```

Acesse http://localhost:3000. A URL da API vem de `NEXT_PUBLIC_API_URL` (padrão `http://127.0.0.1:8000/api/v1`).

### 5. Testes

```bash
docker compose exec backend pytest
cd web && npm run build     # valida tipagem e build
```

---

## Acessos de demonstração

Senha de todos: `Cocapec@2026`

| Perfil | E-mail | O que acessa |
|---|---|---|
| Fornecedor | fornecedor@cocapec.com.br | Agendar entrega, agendar na hora, meus agendamentos, previsão de chuva |
| Compras | compras@cocapec.com.br | Fila de validação e histórico |
| Armazém | armazem@cocapec.com.br | Recebimento, boletim de produção, painel gerencial |
| Administrador | admin@cocapec.com.br | Todos os módulos e a documentação |

> Essas contas existem só no ambiente local de demonstração. Troque as senhas antes de qualquer implantação real.

**Roteiro sugerido para conhecer o sistema:** entre como Fornecedor e agende uma entrega → como Compras, aprove a nota → como Armazém, registre a descarga e feche o boletim → veja o resultado no painel gerencial. Os e-mails enviados aparecem no Mailpit.

---

## Acessibilidade

Todas as telas têm uma **Central de Acessibilidade** (botão no canto inferior direito ou `Alt + A`):

- temas claro, escuro e alto contraste
- tamanho do texto e fonte para dislexia
- cores para daltonismo
- máscara de leitura e foco reforçado
- leitura em voz alta
- português e inglês

---

## Documentação

A documentação completa está em [`docs/`](docs/) e também pode ser lida dentro do sistema, em `/documentacao` (perfil Administrador).

| Documento | Conteúdo |
|---|---|
| Visão geral | Problema, solução e tarefas do hackathon |
| Regras de negócio | Janelas, ocupação, piso e complemento |
| Perfis e permissões | O que cada perfil pode fazer |
| Processos (BPMN) | Fluxo do agendamento ao boletim |
| Casos de uso (UML) | Atores e casos de uso |
| Modelo de dados (DER) | Entidades e relacionamentos |
| Arquitetura | Camadas e integrações |
| Telas | Telas por perfil |
| Relatório gerencial | Sobra ou falta de chapas: lógica e evidências |
| Glossário | Termos da operação |
| Frontend | Estrutura e execução do `web/` |
| Backend | Entidades, estados e serviços |
| API | Endpoints |

---

## Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `docker compose` não encontra variáveis | `.env` não está na raiz | Refaça o passo 1 a partir da raiz do projeto |
| Frontend carrega, mas nada aparece | API fora do ar ou URL errada | Confira http://localhost:8000/swagger e o `NEXT_PUBLIC_API_URL` |
| Painel gerencial vazio | Histórico não carregado | Rode `scripts.carregar_historico` (passo 3) |
| Porta já em uso | Outro serviço nas portas 3000, 8000, 8025, 8080 ou 5435 | Pare o serviço ou altere a porta no `docker-compose.yml` |

---

## Equipe Commitados

| Nome | Papel |
|---|---|
| Hugo | Frontend |
| Sofia | Documentação e frontend |
| Yasmin | Banco de dados e backend |
| Heitor | Backend e banco de dados |

**X Hackathon Uni-FACEF 2026** · Desafio Cocapec
