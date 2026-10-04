---
title: Frontend
status: completo
---

# Arquitetura e Implementação Web

Este documento descreve a estrutura, tecnologias, fluxos de navegação, componentes e recursos PWA do frontend do projeto **Recebimento Inteligente (Cocapec)**, localizado na pasta `web/`.

---

## 1. Tecnologias e Bibliotecas

- **Framework Web:** Next.js 16 (Turbopack, App Router).
- **Roteamento SPA:** React Router DOM (v7) unificado via componente `SpaCliente` na rota coringa `src/app/[[...rota]]/page.tsx`.
- **Linguagem & Tipagem:** React 19, TypeScript 5.
- **Estilização:** Tailwind CSS v4, Lucide React (ícones vetoriais modernos).
- **Suporte a PWA (Progressive Web App):**
  - Service Worker dedicado (`web/public/sw.js`) para cache de assets e resiliência offline.
  - Manifesto web configurado (`web/src/app/manifest.ts`) com ícones maskable (192px e 512px).
  - Alerta de conexão em tempo real (`AvisoConexao.tsx`) avisando perda de conectividade.
- **Comunicação HTTP:** Axios com interceptors de autenticação e tratamento padronizado de erros (`ErroApi`).
- **Visualizador de Documentação Integrado:**
  - `react-markdown` + `remark-gfm` para renderização de tabelas e formatação GFM.
  - Route Handler do Next.js (`/api/documentacao/[...caminho]`) servindo arquivos diretamente da pasta raiz `docs/` (fonte única da verdade, sem duplicação de arquivos).
  - Visualizador modal de diagramas com controle de zoom, arraste (pan) e download.

---

## 2. Estrutura do Projeto (`web/src`)

```
web/src/
├── app/                              # App Router do Next.js
│   ├── api/documentacao/             # API Route Handler que lê e serve docs/ da raiz
│   ├── [[...rota]]/                  # Ponto de montagem da SPA React Router
│   ├── layout.tsx                    # Layout raiz com fontes e componentes PWA
│   ├── manifest.ts                   # Metadados do manifesto PWA
│   └── globals.css                   # Estilos globais e tokens de cores
├── features/                         # Módulos de domínio
│   ├── agendamentos/                 # Meus Agendamentos (visão fornecedor)
│   ├── agendar-entrega/              # Agendamento regular com upload de NF e janela
│   ├── agendar-na-hora/              # Agendamento emergencial de caminhão no pátio
│   ├── armazem-recebimento/          # Gestão de pátio, docas e horários reais
│   ├── auth/                         # Login, cadastro, AuthContext e demonstração
│   ├── boletim/                      # Previsão climática via Open-Meteo
│   ├── boletim-producao/             # Lançamento de produção e rateio de diárias
│   ├── compras-validacao/            # Mesa de compras: aprovação e recusa de NFs
│   ├── documentacao/                 # Hub de documentação técnica restrito ao Administrador
│   ├── inicio/                       # Portal institucional inicial
│   └── painel-gerencial/             # Painel analítico de indicadores e diárias
├── routes/                           # Sistema central de rotas e segurança
│   ├── AppRotas.tsx                  # Definição das rotas e guards
│   ├── RotaProtegida.tsx             # Validação de perfil e autenticação
│   └── rotas.tsx                     # Dicionário de rotas por perfil
└── shared/                           # Componentes e serviços compartilhados
    ├── components/
    │   ├── layout/                   # Header, Footer, LayoutPerfil
    │   ├── pwa/                      # AvisoConexao, RegistroPwa
    │   └── ui/                       # LogoCocapec, MensagemStatus, EmConstrucao
    └── services/                     # Chamadas à API FastAPI e mapeamento de tipos
```

---

## 3. Perfis de Usuário e Controle de Acesso

A aplicação adota separação estrita de escopo por perfil, mantendo o Administrador como perfil especial de auditoria e governança:

1. **Fornecedor (`fornecedor@cocapec.com.br`):**
   - Agendar entrega regular e agendar na hora.
   - Acompanhar status em *Meus Agendamentos*.
   - Consultar previsão agrometeorológica.
   - Cabeçalho específico com busca rápida por placa/NF e botão de ação rápida.

2. **Compras (`compras@cocapec.com.br`):**
   - *Fila de Validação*: conferência de NF-e contra pedidos de compra e aprovação/reprovação com justificativa.
   - *Histórico de Validações*: consulta aos pareceres emitidos.

3. **Responsável pelo Armazém (`armazem@cocapec.com.br`):**
   - *Recebimento*: agenda do dia, alocação de baia e marcos de descarga.
   - *Boletim de Produção*: fechamento de diárias, horas trabalhadas e chapas alocados.
   - *Painel Gerencial*: acompanhamento de saldo de diárias e custo das operações.

4. **Administrador (`admin@cocapec.com.br`):**
   - Acesso irrestrito a todos os módulos das três áreas de negócio.
   - Sub-barra de navegação padronizada e estável, organizada pelos quatro módulos (Fornecedor, Compras, Armazém e Geral).
   - Acesso exclusivo à área de **Documentação Geral** (`/documentacao`).

---

## 4. Como Executar e Validar

1. **Instalar Dependências:**
   ```bash
   npm install
   ```

2. **Executar em Modo de Desenvolvimento:**
   ```bash
   npm run dev
   ```
   Acesse em `http://localhost:3000`.

3. **Verificação de Build e TypeScript:**
   ```bash
   npm run build
   ```
   Gera o bundle otimizado com Turbopack e valida a tipagem sem erros.
