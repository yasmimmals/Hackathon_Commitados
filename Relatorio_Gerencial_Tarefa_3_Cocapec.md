# Relatório Gerencial — Tarefa 3: sobra ou falta de chapas (Cocapec)

Equipe Commitados · Hackathon Uni-FACEF 2026 · Oct 3, 2026 · @Sofia

## Resposta

**[PREENCHER APÓS A ANÁLISE]** As chapas alocadas estão **[sobrando | faltando]**: de [mês/ano] a [mês/ano], o saldo é de **R$ [valor] de [sobra | falta]**, ou [N] diárias equivalentes. O desequilíbrio se concentra em [armazém(ns)] e nos meses de [meses].

A resposta ainda não foi calculada, porque depende da análise do histórico descrita em Método. A conclusão e os valores devem ser inseridos aqui e na seção Números antes da entrega.

## Números

A sobra ou falta é mostrada por armazém e por período, em diárias e em reais. Todas as células abaixo aguardam a análise; a coluna de origem já indica de onde cada número virá.

| Armazém | Período | Diárias necessárias | Diárias presentes | Saldo (diárias) | Saldo (R$) | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| Insumos | Out–mar | [ ] | [ ] | [ ] | [ ] | HISTORICO + rateio |
| Insumos | Abr–set | [ ] | [ ] | [ ] | [ ] | HISTORICO + rateio |
| Adubo | Out–mar | [ ] | [ ] | [ ] | [ ] | HISTORICO + rateio |
| Adubo | Abr–set | [ ] | [ ] | [ ] | [ ] | HISTORICO + rateio |
| Pátio de Máquinas | Out–mar | [ ] | [ ] | [ ] | [ ] | HISTORICO + rateio |
| Pátio de Máquinas | Abr–set | [ ] | [ ] | [ ] | [ ] | HISTORICO + rateio |
| Loja | Out–mar | [ ] | [ ] | [ ] | [ ] | HISTORICO + rateio |
| Loja | Abr–set | [ ] | [ ] | [ ] | [ ] | HISTORICO + rateio |
| **Total geral** | Todo o período | [ ] | [ ] | [ ] | [ ] | HISTORICO |

Saldo positivo é sobra e saldo negativo é falta. A conversão para reais usa o piso por diária equivalente:

$$
\text{Saldo em reais} = (\text{diárias presentes} - \text{diárias necessárias}) \times 90{,}1731
$$

Quando a análise estiver pronta, acrescentar aqui um gráfico do saldo por mês, para mostrar a sazonalidade entre outubro e março e o resto do ano.

## Método

Comparamos, dia a dia, as chapas que a operação exigiria com as que estavam presentes, e convertemos a diferença em reais pelo piso de R$ 90,1731 por diária.

- **Demanda por dia e armazém.** Partimos do histórico de recebimento (41.779 linhas, 12.073 pedidos, jun/2022 a set/2026). Cada depósito do SAP foi traduzido para o armazém físico: FER para Adubo, MAQ para Pátio de Máquinas, AGR para Insumos e PEC, ALI, MED e ACE para Loja. MATGeral entra em Insumos, e MATProv e MATReser ficam de fora porque nunca recebem mercadoria. Agrupamos por data de recebimento e armazém, com peso e itens.

- **Chapas necessárias.** Aplicamos as normas da Cocapec: nenhuma chapa abaixo de 500 kg, 5 para carga batida, 2 para paletizado ou big bag, e 1 operador mais ao menos 1 chapa para máquina. Os tempos estimados por tipo de carga, divididos por uma jornada de 480 minutos com 90% de produtividade, dão a necessidade em diárias, com mínimo de 5 quando há carga batida.

- **Chapas presentes.** Usamos as pessoas presentes por dia em `chapas_por_dia.csv` (2025 e 2026), descontando as da operação de café. O efetivo do dia vem do boletim e não é somado ao longo do dia. Meia diária conta 0,5.

- **Rateio por armazém.** A folha de chapas não é separada por armazém. Distribuímos as chapas presentes de cada dia entre os armazéns na proporção da necessidade calculada para eles naquele dia. Esse critério é uma convenção nossa, não uma medição.

- **Saldo em reais.** Saldo é presentes menos necessárias, em diárias, multiplicado por R$ 90,1731. O custo considerado é o total do boletim (piso por diária equivalente), e não R$ 180 (custo com encargos) nem R$ 99 a 113 (diária base da folha). Agregamos por semana e por mês para mostrar a sazonalidade.

Na operação nova, o boletim é geral e diário. Um complemento alto e frequente indica gente ociosa (sobra). Uma produção por diária bem acima do piso, de forma recorrente, indica falta.

## Inconsistências nos dados

Encontramos oito problemas nos dados, e o tratamento de cada um está na tabela. Os tratamentos são propostos e devem ser confirmados pela equipe antes da entrega; a lista é parcial.

| Inconsistência | Efeito na análise | Tratamento proposto |
| --- | --- | --- |
| Folha de chapas sem agosto e dezembro de 2025 (abas vazias) | Sem oferta nesses meses | Excluir os dois meses da comparação, sem estimar valores, e declarar a lacuna |
| Fornecedores: dossiê diz 859, nosso código registra 872 linhas e 870 CNPJs | O CNPJ não identifica um fornecedor sozinho | Usar o código do fornecedor como chave e contar fornecedores distintos por CNPJ |
| Código de produto do XML é o do fornecedor: só 1 de 838 itens casa com o catálogo | Impossível cruzar XML e catálogo | Ligar item e produto pelo pedido de compra, não pelo código |
| Mesmo produto em mais de um depósito; 4% dos pedidos vão para mais de um depósito | Risco de contar o mesmo volume em dois armazéns | Atribuir cada linha do pedido ao armazém do seu próprio depósito |
| Espécie e peso da NF são declarados pelo fornecedor | Não servem para contar volumes | Usar o peso do cadastro de produtos vezes a quantidade do pedido |
| PDF de especificação traz tempos e grade de horários diferentes do dossiê | Duas versões da mesma regra | Prevalece o dossiê |
| Planilha de movimentação com campos vazios, unidades misturadas, duplicidades e erros de digitação (aviso do LEIA-ME) | Volume e peso podem estar errados | Levantamento pendente: registrar quantas linhas foram corrigidas ou descartadas |
| Nenhum registro histórico de horário de chegada, de descarga ou de chapas por descarga | Tempos e chapas por carga não podem ser medidos | Usar as estimativas do dossiê e declará-las como estimativas |

## Origem das informações do painel

Cada número do painel vem do histórico da Cocapec, de parâmetros do dossiê ou de registros de teste da equipe, e o painel deve exibir essa origem ao lado do valor. Todo registro do sistema já traz o campo `origem_dado` (`HISTORICO`, `SISTEMA` ou `TESTE`).

| Informação | Origem | Observação |
| --- | --- | --- |
| Volume e sazonalidade de recebimento | HISTORICO (Cocapec) | Planilha de pedidos e notas fiscais, jun/2022 a set/2026 |
| Chapas presentes e valor pago por dia | HISTORICO (Cocapec) | `chapas_por_dia.csv`, 2025 e 2026, sem quebra por armazém |
| Chapas por tipo de carga, tempos, jornada e produtividade | Dossiê da Cocapec | Parâmetros e estimativas, não medições |
| Piso de R$ 90,1731 por diária | Dossiê da Cocapec | Regra de remuneração do Boletim Diário |
| Agendamentos, chegadas, entradas, saídas e chapas por descarga no sistema | TESTE (equipe) | Registros feitos pela equipe no hackathon; ainda não há operação real |
| Boletim diário (produção, chapas e complemento) no sistema | TESTE (equipe) | Cálculo do piso e do complemento ainda a implementar |

Os arquivos da Cocapec não estão no repositório, e este relatório cita apenas valores agregados.

## Limitações

A análise tem quatro limites, e o principal tende a mostrar mais sobra do que existe de fato.

- **A demanda cobre só o recebimento.** A mesma equipe também carrega mercadoria para os cooperados, e o boletim registra toda a movimentação do dia. Como a necessidade calculada é menor que a real, a sobra pode estar superestimada e a falta subestimada.

- **A quebra por armazém é um rateio.** A folha de chapas não separa armazéns, então a divisão segue a convenção descrita em Método.

- **Os tempos são estimativas.** Não há registro histórico de horários de chegada ou descarga que permita medi-los.

- **Agosto e dezembro de 2025 ficam sem comparação**, por falta de dados de chapas.
