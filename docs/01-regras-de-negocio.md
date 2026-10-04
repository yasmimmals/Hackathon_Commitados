---
title: Regras de Negócio
status: completo
---

As regras abaixo vêm do dossiê da Cocapec e das decisões da equipe, e são as mesmas que aparecem no BPMN e no UML.

**Armazéns físicos e depósitos do SAP.** Os armazéns são Insumos, Adubo, Pátio de Máquinas e Loja. O depósito do SAP não é o local físico:

| Depósito SAP | Armazém físico |
| --- | --- |
| FER | Adubo |
| MAQ | Pátio de Máquinas |
| AGR | Insumos |
| PEC, ALI, MED, ACE | Loja |
| MATGeral | Dentro de Insumos |
| MATProv, MATReser | Nunca recebem mercadoria |

**Chapas por caminhão.** Abaixo de 500 kg, nenhum. Carga batida, 5. Paletizado ou big bag, 2. Máquina, 1 operador mais ao menos 1 chapa.

**Horários.** As entregas são agendadas às 08h, 10h, 13h e 15h. Carga batida ocupa o horário sozinha; as demais admitem até 2 caminhões, com um limite global para a cooperativa toda.

**Agendamento e cancelamento.** O cancelamento é permitido a qualquer momento. Com menos de 24 horas é cancelamento tardio, e o fornecedor perde a preferência em reagendamentos. Quem não comparece perde a prioridade. Caminhão retido por chuva no Adubo é reagendado para o próximo dia útil, com prioridade e fora do limite de horários.

**Divergência na nota.** O comprador decide por telefone, fora do sistema, se a carga é recebida.

**Boletim diário.** O boletim é geral, uma vez por dia (não por armazém), e registra toda a movimentação do dia. Os chapas da descarga não se somam ao longo do dia: o efetivo do dia vem do boletim, que é fechado no dia seguinte.

**Remuneração com piso.**

```
diárias equivalentes = nº de chapas - (0,5 * meias diárias)
valor por diária = produção / diárias equivalentes
```

Se o valor por diária for menor que R$ 90,1731, o total pago é 90,1731 vezes as diárias equivalentes, e o complemento é o total menos a produção. O custo da operação é o total do boletim, e não R$ 180 (custo com encargos) nem R$ 99 a 113 (diária base da folha). A conferência usa até 20 pessoas, sem repetição e sem efetivos.
