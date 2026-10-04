---
title: Relatório Gerencial
status: completo
---

# Sobra ou falta de chapas: lógica e evidências nos dados

---

## 1. Resposta à pergunta da Cocapec

> *“A quantidade de chapas que a gente aloca todo dia está sobrando ou faltando?”*

Os dados mostram que as duas coisas acontecem, em épocas diferentes, e que a escala não acompanha a demanda.

| 373 | 8,4 chapas | 73% a 97% | R$ 80 a 114 mil |
|---|---|---|---|
| dias úteis cruzados (folha × SAP) | efetivo médio por dia (diárias equivalentes) | dias com sobra mesmo no cenário pesado | sobra valorada ao piso de R$ 90,1731 no período |

- **Sobra é o padrão.** Em 72,9% dos dias o efetivo supera o necessário mesmo supondo todas as cargas pesadas (critério de caminhão mais exigente). No critério mais brando são 97,3%. De novembro a março isso chega a 91,5% dos dias.
- **Falta existe e é sazonal.** De julho a outubro de 2025 (67 dias úteis), com o critério mais exigente houve falta mesmo no cenário leve em 15 dias e risco de falta em 33. Nesse trecho a sobra caiu para 28% dos dias, contra 86% nos demais meses do período.
- **A escala não segue a demanda.** De jan–jun para jul–out de 2025 a demanda foi de 6,9 para 19,1 NF ≥ 500 kg por dia (×2,8), e o efetivo foi de 8,1 para 7,9 chapas. A correlação mensal entre efetivo e demanda é -0,11: praticamente nula.
- **O que ainda não é certeza:** quantos caminhões cada nota fiscal representa. Por isso o relatório sempre mostra dois limites (seção 6). A sobra é robusta nos dois; a falta no pico só aparece no limite superior.

---

## 2. As fontes e o que cada uma prova

| Arquivo | O que foi verificado nele | Uso no cálculo |
|---|---|---|
| `chapas_por_dia_2025.xlsx` e `_2026.xlsx` | 20 abas mensais com o valor pago a cada chapa em cada dia (CHAPA_01…). Um valor perto de 50% da diária indica meia diária. | Efetivo real do dia, em diárias equivalentes |
| `chapas_por_dia.csv` | 428 dias, só com a contagem de chapas e o total pago. Faltam 22 dias que existem nas planilhas. | Referência; as planilhas são a fonte principal |
| `pedido_recebimento_notafiscal.xlsx` | 41.779 linhas, 18.373 notas fiscais (chave de acesso), de 01/06/2022 a 22/09/2026. Só 5 dias com recebimento em fim de semana. | Demanda: quantas cargas chegaram por dia útil |
| `boletim_diario_chapas.xlsx` | Modelo do boletim: preços por tipo de item, diária completa R$ 90,1731 e as fórmulas do complemento (células J64, J65 e J66). | Piso e custo; confere a fórmula da seção 8 |
| `registro_manual_recebimento.pdf` | 10 páginas, de 23/04/2026 a 03/07/2026, 8 colunas (fornecedor, produto, qtd, NF, valor, data e dois recebedores). Nenhuma coluna de horário. | Prova que tempo de descarga e tipo de carga não são registrados hoje |
| `mapa_relacoes_sap.jpeg` | Cadeia Pedido de compra → Recebimento de mercadorias → NF de entrada. O pedido 67281 / recebimento 139827 de 17/09/2026 está igual na planilha. | Confirma que “Data Recebimento” é a data do recebimento |
| `recebimento_inteligente_cocapec.pdf` | Descrição do projeto: check-in, tempos reais e indicadores (colaboradores utilizados, custo estimado). | Contexto: o sistema novo passa a medir o que hoje é estimado |
| `equipamentos_descarga.xlsx` e `estoque_*.xlsx` | Equipamentos (paleteira, empilhadeira a gás, carrinho, transpaleteira) e posição de estoque. | Não entram no cálculo de chapas |

---

## 3. Fatos verificados nos dados

Cada item abaixo foi conferido diretamente nos arquivos. “Medido” é o que está nos dados; “calculado” é o que deriva deles; “premissa” é decisão nossa ou informação da Cocapec.

| # | Fato | Como foi verificado | Tipo |
|---|---|---|---|
| 1 | A folha de 2025/2026 tem 450 dias distintos nas planilhas e 428 no CSV. 22 dias estão só nas planilhas (por exemplo, jan/2025 tem 5 dias no CSV e 22 nas planilhas). | Reconstrução dia a dia das 20 abas mensais e comparação com o CSV. Onde os dois existem, batem na contagem e no valor. | Medido |
| 2 | Há abas com nome trocado. “AGOSTO 2025” é idêntica a “SETEMBRO 2025”, “DEZEMBRO 2025” é idêntica a “NOVEMBRO 2025”, e “JULHO 2027” e “AGOSTO 2027” contêm jul e ago de 2026. Logo, não existe folha de ago/2025 nem de dez/2025. | Comparação das datas e dos valores de cada aba. | Medido |
| 3 | A meia diária está registrada, mas no valor, não na contagem. Nos dias úteis, 104 pessoa-dias (3,2%) foram pagos por cerca de 0,5 diária. Nos sábados, 365 de 495 (74%). O CSV conta todos como 1 chapa. | Valor pago ÷ diária base do mês (a moda dos dias úteis). | Medido |
| 4 | Contar a meia diária como 0,5 reduz o efetivo médio de dias úteis de 8,64 para 8,39 (−2,9%). | Diárias equivalentes = soma de min(valor ÷ diária, 1) por chapa. | Calculado |
| 5 | A diária base da folha é R$ 78,84 (jan–fev/2025), R$ 99,19 (mar/2025–jan/2026) e R$ 112,76 (a partir de fev/2026). O piso do boletim é R$ 90,1731. São valores diferentes: R$ 99,19 = 1,10 × piso. | Moda do valor pago em dias úteis, por mês. | Medido |
| 6 | O campo Peso repete o peso do pedido em cada linha: uma única nota chega a 16.016.000 kg. Usamos o máximo por nota (e não a soma), e o peso só serve para o corte de 500 kg. 51,2% das notas têm 500 kg ou mais; 6,8% não têm peso. | Distribuição do peso por chave de acesso. | Medido |
| 7 | Nem o SAP nem o registro manual trazem horário ou acondicionamento (batido, palete, big bag). Os tempos e o tipo de carga vêm do dossiê e são estimativas. | Colunas do SAP e das 10 páginas do registro manual. | Medido |
| 8 | O trabalho de sábado não é recebimento. Há 75 sábados na folha, com 6,6 chapas em média, e apenas 5 dias de fim de semana com nota no SAP. | Cruzamento de datas folha × SAP. | Medido |
| 9 | A demanda é sazonal e se repete: média de 17 a 20 NF ≥ 500 kg por dia útil em jul–out/2025, contra 6 a 9 em jan–jun (gráfico da seção 7). | SAP, médias mensais de 2023, 2024 e 2025. | Medido |

---

## 4. A lógica (a mesma da equipe)

**Passo 1, demanda:** cada caminhão vale chapas da equipe × minutos de descarga (chapa-minutos), e D é a soma do dia.
**Passo 2, necessário:** o maior entre o que o volume exige e o que o maior caminhão exige ao mesmo tempo.
**Passo 3, gap em R$:** efetivo menos necessário, valorado ao piso do boletim.

```
necessário = máximo( D ÷ 432 , maior caminhão do dia )      432 min = 480 min × 90%
gap        = diárias equivalentes − necessário
sobra      = gap > 0  →  custo = gap × R$ 90,1731
falta      = gap < 0
```

**Por que dois critérios:** a regra “batido = 5 chapas” é a equipe de um caminhão. As descargas acontecem em sequência e a mesma equipe atende várias, então seis batidos no dia não exigem 30 chapas. Os minutos medem por quanto tempo cada equipe fica ocupada, que é a lógica da carga horária (120 horas-pessoa ÷ 8 h = 15 pessoas).

| Parâmetro | Valor | Origem | Tipo |
|---|---|---|---|
| Chapas por carga | batido 5 · paletizado/big bag 2 · abaixo de 500 kg nenhum | Dossiê, seção 7 | Norma |
| Chapa-minutos por caminhão | leve 120 (unitizado) a pesado 250 (batido de 28 t). Referências: 10 paletes = 100, 20 big bags = 200, 200 sacas = 200. | Dossiê, seção 9; faixa adotada no código | Estimativa |
| Jornada | 480 min | Premissa da equipe, a confirmar | Premissa |
| Produtividade | 90% (não é 100% por causa dos dias de chuva) | Informada pela Cocapec | Informada |
| Mínimo do dia | 2 se só unitizado (cenário leve), 5 se houver batido (cenário pesado) | Dossiê, seção 7 | Norma |
| Piso da diária | R$ 90,1731 (meia diária = 0,5 diária) | Boletim e dossiê, seção 8 | Norma |
| Efetivo | diárias equivalentes da folha (meia diária = 0,5) | Planilhas mensais | Medido |
| Demanda (caminhões) | NF ≥ 500 kg por dia útil (limite superior) e fornecedores distintos com NF ≥ 500 kg por dia (limite inferior) | SAP | Calculado |

Como o histórico não diz o acondicionamento, cada dia é calculado em dois cenários: **leve** (todas as cargas unitizadas) e **pesado** (todas batidas). Resultado do dia:

- **FALTA** se o efetivo não cobre nem o cenário leve;
- **RISCO DE FALTA** se cobre o leve, mas não o pesado;
- **SOBRA** se supera até o cenário pesado.

A sobra em R$ usa só essa parte, que existe mesmo no pior caso.

---

## 5. Resultado dia a dia (limite superior de caminhões)

373 dias úteis com folha, de jan/2025 a ago/2026 (sem ago/2025 e dez/2025, que não têm folha). Valores em chapas por dia, média do mês.

> **Gráfico (no PDF original):** barras com o efetivo na folha (diárias equivalentes) por mês, linha do limite superior (1 NF ≥ 500 kg = 1 caminhão), linha do limite inferior (1 fornecedor por dia = 1 caminhão) e faixa do necessário no cenário pesado entre os dois critérios. Os dados do gráfico estão na tabela abaixo.

| Mês | Dias | Efetivo | NF≥500 kg/dia | Forn./dia | Nec. leve | Nec. pesado | Dias de falta | Dias de risco | Dias de sobra | Sobra (R$) |
|---|---|---|---|---|---|---|---|---|---|---|
| jan/25 | 22 | 11,8 | 6,3 | 4,1 | 2,3 | 5,5 | 0 | 0 | 22 | 12.554 |
| fev/25 | 19 | 8,8 | 5,9 | 4,7 | 2,3 | 5,3 | 0 | 1 | 18 | 6.093 |
| mar/25 | 21 | 7,2 | 6,0 | 3,4 | 2,1 | 4,9 | 0 | 2 | 19 | 4.723 |
| abr/25 | 20 | 7,0 | 6,5 | 4,2 | 2,2 | 5,1 | 0 | 2 | 17 | 3.799 |
| mai/25 | 20 | 7,3 | 7,8 | 4,0 | 2,8 | 6,3 | 0 | 3 | 17 | 2.971 |
| jun/25 | 20 | 6,2 | 9,2 | 3,9 | 2,9 | 6,4 | 2 | 5 | 13 | 1.434 |
| jul/25 | 22 | 6,5 | 17,4 | 6,2 | 4,9 | 10,5 | 6 | 10 | 6 | 752 |
| set/25 | 22 | 8,1 | 19,6 | 7,7 | 5,6 | 11,7 | 5 | 12 | 5 | 1.050 |
| out/25 | 23 | 9,0 | 20,3 | 8,5 | 5,7 | 11,9 | 4 | 11 | 8 | 2.031 |
| nov/25 | 18 | 10,6 | 12,8 | 6,0 | 3,8 | 8,2 | 1 | 3 | 14 | 6.129 |
| jan/26 | 21 | 8,7 | 10,2 | 5,3 | 3,1 | 6,8 | 1 | 2 | 18 | 4.703 |
| fev/26 | 19 | 10,1 | 7,8 | 4,4 | 2,5 | 5,6 | 0 | 2 | 17 | 7.790 |
| mar/26 | 22 | 9,4 | 6,1 | 4,3 | 2,3 | 5,3 | 0 | 0 | 22 | 7.996 |
| abr/26 | 20 | 8,2 | 7,0 | 4,1 | 2,2 | 5,3 | 0 | 1 | 19 | 5.207 |
| mai/26 | 20 | 8,1 | 8,8 | 4,5 | 2,7 | 5,9 | 0 | 4 | 16 | 4.033 |
| jun/26 | 21 | 8,2 | 9,5 | 4,1 | 3,1 | 6,7 | 0 | 6 | 15 | 4.042 |
| jul/26 | 22 | 8,3 | 14,8 | 5,1 | 4,3 | 9,3 | 2 | 7 | 13 | 2.453 |
| ago/26 | 21 | 8,0 | 12,7 | 6,6 | 3,6 | 7,7 | 0 | 8 | 13 | 2.535 |
| **Total** | **373** | **8,4** | **10,6** | **5,1** | **3,3** | **7,2** | **21** | **80** | **272** | **80.295** |

*A sobra em R$ de cada mês é a soma, dos dias com sobra, de (efetivo − necessário pesado) × R$ 90,1731. Nas colunas “Nec.”, o necessário já respeita o mínimo de 2 (leve) ou 5 (pesado) chapas.*

---

## 6. Dois limites para o número de caminhões

O SAP registra notas, não caminhões. Uma nota pode ser um caminhão inteiro, mas um mesmo fornecedor pode mandar vários caminhões no dia (cada um com sua nota), e um caminhão pode trazer várias notas. Por isso calculamos dois limites:

- **Limite superior:** 1 nota fiscal com 500 kg ou mais = 1 caminhão. É a aproximação usada no código e no dossiê.
- **Limite inferior:** 1 fornecedor por dia = 1 caminhão (se o fornecedor mandou vários, conta um só).

| Resultado (90% de produtividade) | Limite superior (NF) | Limite inferior (fornecedor/dia) |
|---|---|---|
| Caminhões por dia útil, média do período | 10,6 (jul–out/2025: 19,1) | 5,1 (jul–out/2025: 7,5) |
| Dias de FALTA (nem o cenário leve cobre) | 21 (5,6%) | 0 (0,0%) |
| Dias de RISCO DE FALTA | 80 (21,4%) | 10 (2,7%) |
| Dias de SOBRA mesmo no cenário pesado | 272 (72,9%) | 363 (97,3%) |
| Sobra valorada ao piso, no período | R$ 80.294,99 | R$ 113.950,35 |

**Como ler:** a sobra aparece nos dois limites, então é conclusão firme. A falta no pico (jul–out) só aparece no limite superior. O dossiê fala em pico real de cerca de 15 caminhões por dia: no limite inferior o pico de 2025 chegou a 15; no superior, a 49. O número verdadeiro está entre os dois, e o **check-in do sistema novo** (chegada, início e fim da descarga) vai resolver essa dúvida com dado medido.

---

## 7. Sazonalidade e capacidade da grade

> **Gráfico (no PDF original):** NF ≥ 500 kg por dia útil, por mês, em 2023, 2024 e 2025, com duas linhas de referência: pico citado no dossiê (~15 por dia) e capacidade da grade (~8 por dia). Em 2025 a curva sobe de ~6 (jan–mai) para ~17–20 (jul–out) e cai para ~9 em dez.

O padrão se repete nos três anos: demanda baixa no primeiro semestre e pico de agosto a outubro, e o nível de base cresce de um ano para o outro. A grade de agendamento comporta cerca de 8 caminhões por dia (4 horários × 2 unitizados). Desde 2025, 59% dos dias úteis têm 8 ou mais NF ≥ 500 kg e 27% têm 15 ou mais, então a tensão entre grade e demanda é real, mesmo no limite inferior, onde o pico de 2025 chega a 15 fornecedores por dia.

---

## 8. Conferência da fórmula do custo (boletim de 17/11/2025, Adubo)

A única amostra de boletim confere, passo a passo, com a fórmula da planilha (J64 = produção ÷ diárias; J65 = máximo(J64; piso) × diárias; J66 = J65 − produção):

| Passo | Cálculo | Resultado |
|---|---|---|
| Produção | 2.848 itens × R$ 0,3224 | R$ 918,20 |
| Diárias equivalentes | 11 chapas em diária completa | 11,0 |
| Valor por diária | 918,20 ÷ 11 | R$ 83,47 (abaixo do piso) |
| Total a pagar | 11 × R$ 90,1731 | R$ 991,90 |
| **Complemento** | 991,90 − 918,20 | **R$ 73,71** (0,82 diária) |

Duas observações. Primeiro, a planilha mostra “Meia diária R$ 45,0786”, mas a fórmula J65 só usa o piso H38 e conta meia diária como 0,5 nas diárias equivalentes (0,5 × R$ 90,1731 = R$ 45,0866). Segundo, a folha desse dia lista 12 chapas e R$ 1.190,31, e o boletim de Adubo lista 11 matrículas: a folha cobre toda a operação e o boletim só o Adubo. Esta amostra **não** serve para calibrar os minutos de descarga, porque as 2.848 sacas do boletim não aparecem nas notas do SAP desse dia (o SAP lista 4 notas de 500 kg ou mais).

---

## 9. Sensibilidade à produtividade

O valor oficial é 90%. 80% representa mais dias de chuva e 100% mostra por que ele não é usado. 70% ficou da primeira versão.

| Produtividade | Min. úteis por chapa | Sobra (NF) | Falta (NF) | Risco (NF) | Sobra em R$ (NF) | Sobra (forn./dia) |
|---|---|---|---|---|---|---|
| 70% | 336 | 61,7% | 10,2% | 28,2% | R$ 66.776,76 | 94,6% |
| 80% | 384 | 68,1% | 6,7% | 25,2% | R$ 73.815,20 | 96,2% |
| **90% (Cocapec)** | **432** | **72,9%** | **5,6%** | **21,4%** | **R$ 80.294,99** | **97,3%** |
| 100% (não usado) | 480 | 78,6% | 3,2% | 18,2% | R$ 85.682,75 | 97,6% |

A conclusão qualitativa não muda com a produtividade: a sobra continua entre 62% e 79% dos dias no limite superior. O que muda é a quantidade de dias de falta no pico.

---

## 10. Limites que declaramos

- Os tempos e as chapas por carga vêm do dossiê e são estimativas; o SAP não traz horário nem acondicionamento. O sistema novo passa a medir.
- Os 90% de produtividade vêm da Cocapec e já consideram os dias de chuva. A jornada de 8 h é premissa nossa.
- A equipe também carrega cooperados e trabalha aos sábados sem recebimento. O nosso “necessário” é um mínimo, e a sobra real tende a ser menor que a calculada. A medida definitiva da ociosidade é o complemento do boletim.
- O histórico mostra a operação com fila; o sistema novo opera com agendamento obrigatório. São regimes diferentes.
- Faltam folha de ago/2025 e dez/2025 e as folhas posteriores a ago/2026; os recebimentos do SAP vão até 22/09/2026.
- A média do dia esconde a concentração por janela: dois batidos seguidos de manhã podem exigir mais gente ao mesmo tempo do que o cálculo diário indica.

---

## 11. Origem dos dados do painel

O regulamento pede que a origem de cada informação esteja declarada. Todo registro do banco tem o campo `origem_dado`, e o painel separa as três origens:

| Origem | O que é | Período | Onde aparece |
|---|---|---|---|
| `HISTORICO` | Dados da Cocapec carregados do pacote do hackathon: 18.434 recebimentos (uma linha por nota fiscal) e a folha diária dos chapas (428 dias, do `chapas_por_dia.csv`). As análises deste relatório usaram também as planilhas mensais da folha, que têm 450 dias. | Recebimentos de 01/06/2022 a 22/09/2026; folha de 02/01/2025 a 31/08/2026 | Abas "Custo do chapeiro", "Próximas semanas", "Plano de escala" e a parte histórica de "Sobra ou falta" |
| `TESTE` | Simulação de uso do sistema gerada pela equipe com `backend/scripts/popular_demo.py`: 22 boletins diários fechados (R$ 19.084,42 pagos, dos quais R$ 1.481,07 de complemento), descargas com chegada, entrada e saída, não recebimentos e agendamentos futuros. A demanda segue o mesmo modelo de previsão do painel, e os tempos e chapas seguem as estimativas das seções 7 e 9 do dossiê. | 4 semanas, de 08/09/2026 a 02/10/2026, mais agendamentos das 2 semanas seguintes | Abas "Tempo do caminhão" e "Boletins", a parte "sistema" de "Sobra ou falta" (complemento dos boletins fechados) e os indicadores que dependem do sistema (tempos, chapas por descarga, não recebimentos) |
| `SISTEMA` | O que for registrado ao vivo na plataforma (agendamentos, boletins, chegadas e descargas). | A partir da implantação | Em todas as abas, junto com os dados de teste |

Os números das seções 1 a 10 vêm só do histórico (`HISTORICO`). A simulação (`TESTE`) serve para demonstrar o sistema funcionando e não entra na resposta sobre sobra ou falta de chapas. Ela pode ser apagada a qualquer momento (`python -m scripts.popular_demo --limpar`) sem afetar o histórico nem os registros ao vivo.
