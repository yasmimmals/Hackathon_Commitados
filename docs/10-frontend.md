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
   - Acompanhar status em *Meus Agendamentos*, cancelar e avisar atraso (modal com horas, minutos e motivo; o aviso vai para a equipe do armazém).
   - Consultar previsão agrometeorológica.
   - Cabeçalho específico com busca rápida por placa/NF e botão de ação rápida.

2. **Compras (`compras@cocapec.com.br`):**
   - *Fila de Validação*: conferência de NF-e contra pedidos de compra e aprovação/reprovação com justificativa.
   - *Histórico de Validações*: consulta aos pareceres emitidos.

3. **Responsável pelo Armazém (`armazem@cocapec.com.br`):**
   - *Recebimento*: agenda do dia, alocação de baia, quadro de atrasos avisados e os três marcos do caminhão (Caminhão chegou, Iniciar descarregamento e Caminhão saiu, com chapas e equipamentos). A agenda se atualiza sozinha a cada minuto.
   - *Boletim de Produção*: fechamento de diárias, horas trabalhadas e chapas alocados.
   - *Painel Gerencial*: abas Próximas semanas, Plano de escala, Custo do chapeiro, Sobra ou falta, Tempo do caminhão (média mensal de espera e descarga) e Boletins. Os cálculos vêm do backend (`/api/v1/painel`).

4. **Administrador (`admin@cocapec.com.br`):**
   - Acesso irrestrito a todos os módulos das três áreas de negócio.
   - Sub-barra de navegação padronizada e estável, organizada pelos quatro módulos (Fornecedor, Compras, Armazém e Geral).
   - Acesso exclusivo à área de **Documentação Geral** (`/documentacao`).

---

## 4. Acessibilidade e Idioma

- **Central de Acessibilidade** (`src/shared/acessibilidade/`), aberta pelo botão no canto da tela ou por `Alt + A`. As preferências ficam salvas no navegador e são aplicadas no `<html>` como atributos `data-*`, então valem em todas as telas.
  - Perfis prontos: baixa visão, daltonismo, dislexia, foco (TDAH), mobilidade reduzida e leitor de tela.
  - Tema claro, escuro ou alto contraste; tamanho do texto; fonte para dislexia; espaçamento; máscara de leitura; links destacados; foco reforçado; botões maiores; cursor grande; menos movimento; leitura em voz alta.
  - **Daltonismo:** troca as cores do site inteiro e dos gráficos pela paleta Okabe-Ito, escolhendo o par que a pessoa confunde (vermelho e verde, ou azul e amarelo). A troca é feita redefinindo as variáveis de cor do Tailwind em `globals.css`. Campos com erro ganham borda tracejada e links em texto ficam sublinhados, para não depender só da cor.
  - **Simular visão (para testes):** filtros SVG que mostram a tela como uma pessoa com protanopia, deuteranopia ou tritanopia a vê.
- **Gráficos** (`src/shared/components/graficos/`): cada gráfico tem versão em tabela, resumo para leitor de tela, navegação por teclado e download.
- **Idioma:** o sistema é só em português (pt-BR).

---

## 5. Como Executar e Validar

1. **Instalar Dependências:**
   ```bash
   npm install
   ```
   Variáveis de ambiente (em `web/.env.local`): `NEXT_PUBLIC_API_URL`, endereço da API; sem ela, o front usa `http://127.0.0.1:8000/api/v1`.

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
