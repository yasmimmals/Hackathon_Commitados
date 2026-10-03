# COCAPEC • Agendamento de Cargas (front-end)

Portal Next.js 16 + React Router 7 + Tailwind CSS 4.

```bash
npm install
npm run dev    # http://localhost:3000
npm run build
npm run lint
```

Login de demonstração: use um dos e-mails listados na tela de login (qualquer senha).

## Como a aplicação funciona

O Next.js serve uma única rota coringa (`src/app/[[...rota]]/page.tsx`) que monta
uma SPA no navegador. Toda a navegação, autenticação e permissão por perfil
ficam no React Router (`src/routes/AppRotas.tsx`).

| Perfil      | Prefixo        |
| ----------- | -------------- |
| Fornecedor  | `/fornecedor/*` |
| Compras     | `/compras/*`    |
| Armazém     | `/armazem/*`    |

## Estrutura

```
src/
├── app/                    # Entrada do Next (layout raiz, CSS global, rota coringa)
├── routes/                 # Mapa de rotas, rota protegida, telas em construção
├── features/               # Uma pasta por funcionalidade
│   ├── auth/               # Login, contexto de sessão, perfis e menus
│   ├── agendamentos/       # Meus Agendamentos
│   ├── agendar-na-hora/    # Encaixe de pátio
│   ├── boletim/            # Boletim agrometeorológico (API Open-Meteo)
│   └── suporte-balanca/    # FAQ e chamados para a balança
├── shared/                 # Reutilizável entre features
│   ├── components/layout/  # Header, Footer, LayoutPerfil
│   ├── components/ui/      # Campo, MensagemStatus, EmConstrucao
│   ├── hooks/              # useMensagemTemporaria
│   └── utils/              # placa, formulário
└── styles/                 # CSS que não é Tailwind (header)
```

Cada feature segue o mesmo formato:

```
features/<nome>/
├── <TelaPrincipal>.tsx     # Componente de página (estado e regras da tela)
├── types.ts                # Tipos da feature
├── components/             # Componentes visuais da tela
├── data/                   # Dados mock / estáticos
├── services/               # Chamadas externas (APIs)
└── utils/                  # Funções puras (validação, filtros, formatação)
```

## Convenções

- **Imports** com alias `@/` (aponta para `src/`) entre pastas; relativos dentro da mesma feature.
- **Cores da marca**: use os tokens do tema (`bg-marca`, `text-marca`, `hover:bg-marca-escuro`,
  `bg-marca-profundo`, `bg-fundo`) definidos em `src/app/globals.css`, nunca o hex direto.
- **Nova tela**: crie a pasta em `features/`, registre a rota em `routes/AppRotas.tsx`
  e o item de menu em `features/auth/perfis.ts`.
- **Tela ainda não pronta**: adicione em `routes/telasEmConstrucao.ts` e use `<EmConstrucao />`.
- Antes de algo virar compartilhado em `shared/`, ele deve ser usado por pelo menos duas features.
