---
title: Frontend
status: rascunho
---

# Arquitetura e Implementação Web

Este documento descreve a estrutura, tecnologias, fluxos de navegação e componentes do frontend do projeto **Recebimento Inteligente (Cocapec)**, localizado na pasta `web/`.

## Tecnologias e Bibliotecas
- **Framework:** Next.js (versão 16 com Turbopack / App Router).
- **Roteamento SPA:** React Router DOM (v7) integrado via rota coringa `src/app/[[...rota]]/page.tsx` no componente `SpaCliente`.
- **Linguagem & Tipagem:** React 19, TypeScript 5.
- **Estilização:** Tailwind CSS v4, Lucide React (ícones).
- **Comunicação HTTP:** Axios com interceptors de autenticação e tratamento padronizado de erros (`ErroApi`).
- **Renderização de Markdown:** `react-markdown` com plugin `remark-gfm`.

## Estrutura de Pastas (`web/src`)
- `app/`: Ponto de entrada do Next.js contendo `layout.tsx`, `globals.css` e a rota `[[...rota]]`.
- `features/`: Módulos de domínio e funcionalidades do sistema:
  - `agendamentos/`: Listagem e acompanhamento das entregas pelo fornecedor.
  - `agendar-entrega/`: Formulário de novo agendamento com upload de nota e seleção de horários.
  - `agendar-na-hora/`: Agendamento de caminhões chegados sem aviso prévio.
  - `armazem-recebimento/`: Gestão do pátio, agenda do dia e controle de entrada/saída.
  - `auth/`: Telas de Login, Cadastro, `AuthContext` e acessos de demonstração.
  - `boletim/`: Consulta da previsão do tempo e boletim agrometeorológico (Open-Meteo).
  - `boletim-producao/`: Lançamento e fechamento da produção diária dos chapas.
  - `compras-validacao/`: Fila e histórico de validação de notas fiscais.
  - `documentacao/`: Área de visualização da documentação técnica e diagramas da solução.
  - `inicio/`: Página inicial institucional (portal Cocapec).
  - `painel-gerencial/`: Visão analítica de saldo de diárias e custo das operações.
  - `suporte-balanca/`: Dúvidas frequentes e suporte ao motorista.
- `routes/`: Definição central de rotas (`rotas.tsx`), proteção de perfis (`RotaProtegida.tsx`) e roteador principal (`AppRotas.tsx`).
- `shared/`: Componentes reutilizáveis (Layout, Header, Footer, UI) e serviços de API.

## Variáveis de Ambiente
O frontend utiliza as seguintes variáveis de ambiente (configuradas via `.env.local`):
- `NEXT_PUBLIC_API_URL`: URL base da API FastAPI (ex.: `http://127.0.0.1:8000/api/v1`).

## Perfis do Login de Demonstração
A autenticação conta com credenciais de demonstração pré-configuradas no seed:
1. **Fornecedor** (`fornecedor@cocapec.com.br`): Gerencia seus agendamentos e envia notas.
2. **Compras** (`compras@cocapec.com.br`): Valida pedidos contra notas fiscais.
3. **Responsável pelo Armazém** (`armazem@cocapec.com.br`): Opera o recebimento, fecha boletins e visualiza o painel gerencial.
4. **Administrador** (`admin@cocapec.com.br`): Visão global com acesso a todos os menus e à **Documentação Geral**.

## Como Executar
1. Instalar as dependências:
   ```bash
   npm install
   ```
2. Executar o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
3. Acessar a aplicação em `http://localhost:3000`.
