---
title: Arquitetura e Tecnologia
status: completo
---

O sistema tem três camadas principais (Front, API e Banco de Dados) mais duas integrações externas fundamentais. O backend roda conteinerizado via Docker.

| Camada | Tecnologia | Papel |
| --- | --- | --- |
| **Front** | Next.js, React e TypeScript | Telas por perfil, design responsivo e área de `/documentacao` |
| **API** | FastAPI (Python 3.11) | Regras de negócio, agendamento, recebimento e programação de chapas |
| **Banco de Dados** | PostgreSQL com migrações Alembic | Persistência relacional, rastreabilidade e campo `origem_dado` |
| **Previsão do Tempo** | Open-Meteo (externo) | Probabilidade de chuva em tempo real para agendamento no Adubo |
| **SAP** | Sistema ERP da Cocapec (externo) | Fornece os pedidos de compra consultados na validação da NF |

O backend lê a nota fiscal em XML ou PDF, calcula a disponibilidade de horários com a regra de ocupação e estima os chapas recomendados por dia e armazém, com jornada de 480 minutos e 90% de produtividade (mínimo de 5 se houver carga batida). Os testes automatizados (pytest) cobrem agendamento, nota fiscal e programação.
