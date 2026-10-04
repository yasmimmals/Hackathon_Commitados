---
title: Relatório Gerencial
status: completo
---

# Tarefa 3: Análise de Sobra ou Falta de Chapas (Cocapec)

**Equipe Commitados** · Hackathon Uni-FACEF 2026 · Solução Recebimento Inteligente

---

## 1. Resposta Executiva à Direção

> **Conclusão:** Não existe um excesso ou escassez contínuo ao longo do ano, mas sim um **forte desequilíbrio sazonal** entre os meses de safra e entressafra:
> - **Nos meses de entressafra (Outubro a Março):** Há **SOBRA sistemática** de chapas alocadas no recebimento (média de 7 a 8 chapas excedentes no cenário de carga pesada).
> - **Nos meses de pico operacional (Junho a Setembro):** Há **RISCO DE FALTA E FALTA CRÍTICA** de mão de obra, especialmente na descarga de fertilizantes e adubo a granel/sacaria no Armazém de Adubo.
> - **Origem da Ociosidade Financeira:** O custo da sobra nas diárias de recebimento é mensurado no novo sistema pelo **complemento da diária** (garantia do piso de **R$ 90,1731** pago quando a produção do dia não atinge o valor mínimo).

---

## 2. Indicadores Consolidados da Análise Histórica

Cruzando dia útil a dia útil o efetivo presente em folha com os volumes de notas fiscais que exigem descarga manual/mecanizada ($\ge 500\text{ kg}$):

| Período / Armazém | Perfil da Carga | Demanda Média (Caminhões/Dia) | Efetivo Presente Médio | Chapas Necessários (Cenário Pesado) | Diagnóstico | Ação Recomendada |
|---|---|---|---|---|---|---|
| **Outubro a Março (Geral)** | Cargas fracionadas / Loja e Insumos | 4 a 6 caminhões | 10 a 12 chapas | 2,3 a 3,5 chapas | **SOBRA (Folga > 7 chapas)** | Remanejar equipe para expedição e carregamento a cooperados |
| **Junho a Setembro (Adubo / Fertilizantes)** | Cargas batidas de 20t a 35t | 16 a 24 caminhões | 6 a 8 chapas | 10,4 a 14,0 chapas | **RISCO DE FALTA / FALTA** | Agendamento prévio escalonado de janelas para evitar filas de espera |
| **Pátio de Máquinas (Ano Todo)** | Tratores e Implementos (Paletizados) | 1 a 3 carretas | Operador + 1 chapa | 1 a 2 chapas | **EQUILÍBRIO** | Operação pontual com apoio de empilhadeira |
| **Loja e Peças (Ano Todo)** | Peças, EPIs e miudezas | Distribuição contínua | 1 a 2 chapas | 1 chapa | **EQUILÍBRIO** | Recebimento rápido em doca dedicada |

---

## 3. Metodologia de Cálculo

A análise foi estruturada em duas abordagens complementares implementadas no `painel_service.py`:

### 3.1. Abordagem Histórica (Base Prévia 2022–2026)
1. **Capacidade Útil de um Chapa:**
   $$\text{Capacidade Diária} = 480\text{ min (jornada)} \times 90\% \text{ (produtividade)} = 432\text{ minutos úteis/dia}$$
2. **Faixas de Esforço por Caminhão (Dossiê Seção 9):**
   - **Cenário Leve:** $120\text{ chapa-minutos}$ por caminhão (mercadoria paletizada/big bag).
   - **Cenário Pesado:** $250\text{ chapa-minutos}$ por caminhão (carga batida em sacaria de 50 kg / adubo).
3. **Classificação do Saldo Diário:**
   - **FALTA:** Quando o efetivo presente não atende sequer a demanda do cenário leve ($Saldo_{leve} < 0$).
   - **RISCO DE FALTA:** Quando atende o cenário leve, mas falta gente no cenário pesado ($Saldo_{pesado} < 0$).
   - **SOBRA:** Quando há 2 ou mais chapas sobrando mesmo considerando todas as cargas como pesadas ($Saldo_{pesado} \ge 2$).
   - **EQUILÍBRIO:** Quando o efetivo está dentro da margem de segurança operacional.

### 3.2. Abordagem em Tempo Real (Boletim Diário no Sistema)
Na nova plataforma, a sobra real e o custo da ociosidade não dependem de estimativas, pois são mensurados pelo **Fechamento do Boletim de Produção**:
$$\text{Complemento Pago} = \max\left(0, (\text{Diárias Equivalentes} \times \text{R\$ } 90,1731) - \text{Produção Total}\right)$$
- Sempre que o valor produzido por tonelada não atinge a garantia do piso, o sistema calcula e rateia o complemento.
- O percentual pago em complemento reflete com 100% de precisão as horas improdutivas e a ociosidade da equipe.

---

## 4. Tratamento de Inconsistências dos Dados Históricos

| Inconsistência Detectada | Impacto | Tratamento Aplicado no Código |
|---|---|---|
| Meses de Ago/2025 e Dez/2025 com abas vazias na folha | Lacuna de oferta de mão de obra | Descartados da correlação direta sem interpolação artificial para não falsear as médias |
| Dias atípicos com mais de 30 chapas (acertos contábeis) | Picos artificiais de presença | Filtrados automaticamente pela flag `suspeito = True` e dias não-úteis |
| CNPJ duplicado e notas com código interno do fornecedor | Cruzamento impossível entre catálogo e XML | Associação realizada estritamente via número do Pedido de Compra (PO) |
| Cargas sem especificação de acondicionamento nas NFs antigas | Incerteza entre paletizado ou carga batida | Utilização de modelo bi-fatorial: Cenário Leve vs. Cenário Pesado |

---

## 5. Recomendações Práticas para a Gestão da Cocapec

1. **Adoção Obrigatória do Agendamento por Faixas Horárias:**
   Evita o acúmulo de caminhões nas manhãs de segunda e terça-feira, nivelando a curva de descarga ao longo de toda a semana.
2. **Dimensionamento Flexível de Equipe:**
   Ajustar a escala base de chapas no Armazém de Adubo de 8 para 14 profissionais entre junho e setembro, reduzindo para 5 a 6 entre outubro e março.
3. **Acompanhamento dos KPIs pelo Painel Gerencial:**
   Monitorar semanalmente a taxa de complemento do piso na tela de *Painel Gerencial*. Índices de complemento superiores a 15% sinalizam necessidade imediata de remanejamento para a expedição de café ou cooperados.
