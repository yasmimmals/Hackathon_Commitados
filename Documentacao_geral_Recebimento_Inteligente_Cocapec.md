# Documentação geral — Recebimento Inteligente (Cocapec)

Equipe Commitados · Hackathon Uni-FACEF 2026 · Oct 3, 2026 · @Sofia

## Estrutura no front

A documentação fica na pasta `/docs` do repositório, em arquivos Markdown, e o front a exibe numa rota `/documentacao`. Assim existe uma única fonte, e ela já cumpre a entrega obrigatória do relatório gerencial em `/docs`.

| Arquivo em /docs | Conteúdo | Fonte | Status |
| --- | --- | --- | --- |
| `00-visao-geral.md` | Cliente, problema, escopo e tarefas | Dossiê | Rascunho abaixo |
| `01-regras-de-negocio.md` | Armazéns, chapas, horários, boletim e piso | Dossiê | Rascunho abaixo |
| `02-perfis-e-permissoes.md` | O que cada login acessa | UML e BPMN | Rascunho abaixo |
| `03-processos-bpmn.md` | BPMN do recebimento e do boletim | draw.io | Falta aplicar o boletim geral por dia no BPMN |
| `04-casos-de-uso-uml.md` | UML por ator | draw.io | Versão 5 gerada |
| `05-modelo-de-dados-der.md` | DER do banco | Backend | A levantar |
| `06-arquitetura.md` | Camadas, tecnologias e integrações | Código | Rascunho abaixo |
| `07-telas.md` | Telas por perfil e seu estado | Front | Rascunho abaixo |
| `08-relatorio-gerencial.md` | Resposta da Tarefa 3 | Análise do histórico | Estrutura pronta, números pendentes |
| `09-glossario.md` | Termos do domínio | Dossiê | Rascunho abaixo |

Os diagramas ficam em `/docs/assets`, exportados do draw.io em SVG ou PNG (Arquivo, Exportar como). Os arquivos `.drawio` editáveis ficam em `/docs/fontes`, para que qualquer pessoa da equipe possa atualizar um diagrama sem refazê-lo.

Na rota `/documentacao`, um menu lateral lista os arquivos na ordem da tabela, e cada item renderiza o Markdown correspondente, com as imagens dos diagramas ampliáveis.

## Visão geral

O Recebimento Inteligente organiza a entrega de mercadorias de fornecedores à Cocapec e mostra se a quantidade de chapas alocada está sobrando ou faltando. Foi desenvolvido pela equipe Commitados no X Hackathon Uni-FACEF, em 3 e 4 de outubro de 2026.

- **Problema.** Hoje o registro é manual (um PDF com cerca de 200 lançamentos, de abril a julho de 2026) e não existe histórico de horários de chegada ou de descarga.

- **Solução.** Um sistema em que o fornecedor agenda a entrega, Compras valida a nota, o armazém registra o recebimento e o boletim diário registra a produção e o pagamento dos chapas, com piso e complemento.

- **Tarefa 1.** Agendamento e recebimento, do fornecedor ao armazém.

- **Tarefa 2.** [confirmar o enunciado da Tarefa 2 no dossiê]

- **Tarefa 3.** Painel gerencial e relatório que respondem se as chapas estão sobrando ou faltando, em reais.

As integrações com o SAP da Cocapec e com o serviço de previsão do tempo são externas ao sistema.

## Regras de negócio

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

$$
\text{diárias equivalentes} = \text{nº de chapas} - 0{,}5 \times \text{meias diárias}
$$

$$
\text{valor por diária} = \text{produção} \div \text{diárias equivalentes}
$$

Se o valor por diária for menor que R$ 90,1731, o total pago é 90,1731 vezes as diárias equivalentes, e o complemento é o total menos a produção. O custo da operação é o total do boletim, e não R$ 180 (custo com encargos) nem R$ 99 a 113 (diária base da folha). A conferência usa até 20 pessoas, sem repetição e sem efetivos.

## Perfis e permissões

O sistema tem três perfis de login, e cada um vê apenas as telas da sua função. Previsão do tempo, SAP e prestador dos chapas são atores externos, sem login.

| Perfil | Pode | Não acessa |
| --- | --- | --- |
| Fornecedor | Agendar entrega com NF, carga e ciência de chuva (Adubo); agendar na hora; consultar, reagendar e cancelar os próprios agendamentos; ver a previsão de chuva | Validação de nota, recebimento, boletim, painel e dados de outros fornecedores |
| Compras | Ver a fila de agendamentos, validar os itens da NF contra o pedido de compra, recusar com motivo, consultar o histórico de validações | Operação do pátio, boletim, painel e criação de agendamentos |
| Responsável pelo Armazém / Controle de Estoque | Definir armazém de destino, registrar comparecimento, chegada, entrada e saída, conferir a carga contra a NF, lançar a produção, abrir e fechar o boletim do dia, consultar o painel gerencial | Dados de outros perfis e a validação de notas |

As regras de acesso devem valer na API, e não só no front: esconder uma tela não impede que alguém chame o endpoint. O login único retorna o perfil e redireciona para a página inicial correspondente.

**Pontos em aberto para a equipe:**

- O painel gerencial é só do Responsável pelo Armazém, ou Compras também o vê?

- Cada Responsável pelo Armazém vê apenas o seu armazém ou todos?

- Quem cria os logins de Compras e do armazém, e o fornecedor se cadastra sozinho?

- Quem abre a tela de agendar na hora quando o caminhão chega sem agendamento?

## Processos (BPMN)

O BPMN descreve dois processos: o recebimento de mercadorias, uma vez por caminhão, e o boletim diário com o painel, uma vez por dia. A imagem fica em `/docs/assets/bpmn.png` (inserir aqui) e o arquivo editável em `/docs/fontes`.

**Processo 1: recebimento de mercadorias.** Tem quatro raias: Fornecedor, Sistema, Compras e Responsável pelo Armazém.

- O fornecedor anexa a NF (PDF ou XML), informa a carga, aceita a ciência de chuva (Adubo) e escolhe data e horário.

- O sistema verifica se o horário está disponível pela regra de ocupação e reserva a vaga.

- Compras valida os itens da NF contra o pedido de compra e recusa o agendamento com motivo se a nota não estiver conforme.

- No dia, o armazém verifica a autorização e o armazém de destino, o comparecimento e o impedimento por chuva, e registra chegada, entrada e saída.

- Havendo divergência, o comprador decide por telefone (fora do sistema) se a carga é recebida.

- A descarga termina com o registro das chapas e dos equipamentos e o lançamento da produção no boletim aberto do dia.

O fornecedor também pode reagendar ou cancelar. O sistema remarca na próxima janela disponível, e o cancelamento com menos de 24 horas é tardio e retira a preferência em reagendamentos.

**Processo 2: boletim diário e painel.** Roda uma vez por dia, para a operação inteira.

- O responsável abre o boletim do dia anterior, com a produção já lançada.

- Confere a equipe temporária por matrícula (diária completa ou meia), com a presença vinda do prestador dos chapas.

- O sistema valida os dados (até 20 pessoas, sem repetição, sem efetivos) e calcula a produção total e as diárias equivalentes.

- Se o valor por diária ficar abaixo do piso (R$ 90,1731), o total é o piso vezes as diárias equivalentes, com lançamento do complemento; senão, o total é a produção e o complemento é zero.

- O sistema fecha o boletim, gravando preços e piso do dia, e o painel mostra a sobra ou falta de chapas por período, em reais.

A legenda do diagrama usa azul para tarefa de usuário, roxo para tarefa automática do sistema e amarelo tracejado para tarefa manual, fora do sistema. SAP e serviço de previsão do tempo aparecem como participantes externos.

**Pendente no BPMN:** aplicar a regra do boletim geral por dia. Trocar "uma vez por armazém, por dia" por "uma vez por dia" no título do Processo 2, no depósito de dados e na nota da legenda, e tirar "por armazém" da tarefa do painel.

## Casos de uso (UML)

O diagrama de casos de uso mostra o que cada ator faz no sistema; a ordem das etapas está no BPMN. A imagem fica em `/docs/assets/uml.png` (inserir aqui) e o arquivo editável em `/docs/fontes` (`UML-Cocapec-v5.drawio`).

| Ator | Casos de uso principais |
| --- | --- |
| Fornecedor | Agendar entrega, consultar meus agendamentos, reagendar entrega, solicitar cancelamento (informar motivo) |
| Compras | Validar itens da NF contra o pedido de compra, consultar histórico de validações |
| Responsável pelo Armazém | Verificar autorização e armazém de destino, verificar comparecimento, registrar chegada, entrada e saída, conferir carga contra a NF, definir quem ocupa a vaga liberada, encaixar caminhão sem agendamento, fechar o boletim, consultar o painel |
| Previsão do Tempo (externo) | Fornece a previsão usada em Consultar previsão de chuva |
| SAP (externo) | Fornece o pedido de compra usado na validação da NF |
| Prestador dos Chapas (externo) | Fornece a presença usada em Conferir equipe temporária |

Como ler o diagrama:

- **I (include)** é uma parte que sempre acontece dentro do caso de uso.

- **E (extend)** é uma variação condicional, com a condição entre colchetes, por exemplo [há divergência].

- Os nomes seguem o BPMN, exceto as consultas e os atalhos de fluxo (Verificar comparecimento, Verificar chuva no Adubo, Encaixar caminhão sem agendamento), que existem apenas no UML.

- Fornecedor, Compras e Responsável pelo Armazém ficam dentro da fronteira do sistema. Os atores externos ficam fora, em raias separadas.

## Modelo de dados (DER)

O DER tem 16 tabelas em três grupos e foi montado a partir do diagrama de classes do backend, que a equipe gerou do código dos models e services. O arquivo editável é `/docs/fontes/DER-Cocapec.drawio`, e a imagem fica em `/docs/assets/der.png` (inserir aqui).

**Tabelas por grupo.**

| Tabela | Grupo | Chaves e relações |
| --- | --- | --- |
| `fornecedores` | Agendamento e descarga | PK id; cnpj único; tem 0 ou mais notas, agendamentos e recebimentos históricos |
| `notas_fiscais` | Agendamento e descarga | PK id; chave única; FK fornecedor_id |
| `agendamentos` | Agendamento e descarga | PK id; FK fornecedor_id, nota_fiscal_id e reagendado_de_id (a própria tabela); no máximo 1 agendamento ativo por nota |
| `descargas` | Agendamento e descarga | PK id; FK agendamento_id e baia_id (opcional); uma por armazém |
| `baias` | Agendamento e descarga | PK id; docas de cada armazém |
| `equipamentos` | Agendamento e descarga | PK id; codigo único; ligado às descargas por código (json), sem FK |
| `notificacoes` | Agendamento e descarga | PK id; FK agendamento_id; e-mails ao fornecedor |
| `boletins_diarios` | Boletim diário | PK id; um boletim por dia; coluna local opcional (ver pendências) |
| `boletim_producoes` | Boletim diário | PK id; FK boletim_id e tipo_item_id |
| `boletim_chapas` | Boletim diário | PK composta (boletim_id, chapa_id), deduzida; até 20 por boletim; meia_diaria |
| `chapas` | Boletim diário | PK id; matricula única |
| `tipos_item` | Boletim diário | PK id; descricao única; preço unitário |
| `recebimentos_historico` | Dados históricos | PK id; FK fornecedor_id opcional |
| `pedido_itens` | Dados históricos | PK id; ligado a produtos e fornecedores por código, sem FK |
| `produtos` | Dados históricos | PK codigo; depósito e armazém |
| `folha_diaria` | Dados históricos | PK data; chapas presentes e valor pago por dia |

O fornecedor tem notas fiscais e agendamentos. O agendamento gera descargas (uma por armazém, porque um caminhão pode descarregar em mais de um) e notificações, e pode apontar para o agendamento que o originou. Cada descarga encosta em uma baia opcional. O boletim contém linhas de produção, ligadas a um tipo de item, e até 20 chapas por dia.

O campo `origem_dado` (HISTORICO, SISTEMA ou TESTE) aparece em `fornecedores` no diagrama de classes. Confirmar se as demais tabelas também o têm, porque o painel precisa exibi-lo ao lado de cada número.

**Pontos a confirmar com o backend.** A coluna `boletins_diarios.local` é opcional: como o boletim agora é geral por dia, ela deve sair e `data` deve ser única (o diagrama de estados já chama o boletim de "um geral por dia"). Os nomes das chaves estrangeiras e a chave composta de `boletim_chapas` foram deduzidos das relações. Para conferir o schema real, use o Adminer (porta 8080 do Docker Compose) ou o diagrama ER do DBeaver.

## Arquitetura e tecnologia

O sistema tem três camadas, front, API e banco, mais duas integrações externas. O backend roda via Docker.

| Camada | Tecnologia | Papel |
| --- | --- | --- |
| Front | Next.js, React e TypeScript | Telas por perfil e, em breve, a rota `/documentacao` |
| API | FastAPI | Regras de negócio, agendamento, recebimento e programação de chapas |
| Banco | PostgreSQL com migrações Alembic | Persistência, com o campo `origem_dado` em todo registro |
| Previsão do tempo | Open-Meteo (externo) | Probabilidade de chuva para o agendamento e o reagendamento |
| SAP | Sistema da Cocapec (externo) | Pedido de compra consultado na validação da NF |

O backend lê a nota fiscal em XML ou PDF, calcula a disponibilidade de horários com a regra de ocupação e estima os chapas recomendados por dia e armazém, com jornada de 480 minutos e 90% de produtividade (mínimo de 5 se houver carga batida). Os testes automatizados (pytest) cobrem agendamento, nota fiscal e programação.

## Telas do sistema

As telas de agendamento já existem, mas ainda usam dados simulados; as de Compras, Armazém, Boletim e Painel estão em construção. O login de demonstração entra por perfil (fornecedor, compras ou armazém).

| Perfil | Tela | Estado |
| --- | --- | --- |
| Fornecedor | Meus Agendamentos | Pronta, dados simulados |
| Fornecedor | Agendar Entrega | Pronta, dados simulados |
| Fornecedor | Agendar na Hora | Pronta, dados simulados |
| Fornecedor | Previsão de Chuva | Pronta, consulta a Open-Meteo de verdade |
| A definir | Suporte Balança | Pronta, dados simulados |
| Todos | Login de demonstração por perfil | Pronta |
| Compras | Fila de validação, validar e histórico | Em construção |
| Armazém | Agenda do dia e recebimento do caminhão | Em construção |
| Armazém | Boletim de Produção | Em construção |
| Armazém | Painel Gerencial | Em construção |

A rota `/documentacao`, descrita no início deste documento, entra como uma nova área do menu, visível a todos os perfis, a menos que a equipe decida restringi-la.

## Relatório gerencial e origem dos dados

O relatório gerencial responde à pergunta da Tarefa 3, se a quantidade de chapas alocada está sobrando ou faltando, e é um artefato obrigatório: sem ele a equipe é eliminada. Vale 30% da nota e é o primeiro critério de desempate. Ele fica em `/docs/08-relatorio-gerencial.md` e tem cinco partes:

- A resposta, em uma frase, com o valor em reais.

- Os números que a sustentam, por armazém e por período.

- O método usado.

- O tratamento das inconsistências encontradas nos dados.

- A origem de cada informação do painel, no histórico da Cocapec ou em registros de teste da equipe.

A estrutura do relatório está pronta, mas os números ainda dependem da análise do histórico de recebimento e das chapas presentes por dia.

O painel gerencial deve mostrar a sobra ou falta de chapas em reais e exibir, ao lado de cada valor, o campo `origem_dado` (HISTORICO, SISTEMA ou TESTE). Os arquivos da Cocapec não podem ir para o repositório: o relatório e o painel citam apenas valores agregados.

**A decidir:** o boletim é geral por dia, mas a Tarefa 3 pede os números no mínimo por armazém. O painel deve mostrar o total geral e a quebra por armazém, obtida por rateio, com o critério declarado no relatório.

## Glossário

| Termo | Significado |
| --- | --- |
| Chapa | Trabalhador que carrega e descarrega mercadoria; o efetivo temporário é pago por diária |
| Diária equivalente | Número de chapas menos 0,5 por meia diária |
| Piso | Valor mínimo por diária equivalente, R$ 90,1731 |
| Complemento | Diferença entre o total pago pelo piso e a produção, quando a produção por diária fica abaixo do piso |
| Boletim diário | Registro geral do dia com produção, chapas presentes e valores, fechado no dia seguinte |
| Carga batida | Carga a granel ou em sacas (200 sacas batidas, 28 t a granel batido); ocupa o horário sozinha e pede 5 chapas |
| Paletizado e big bag | Cargas unitizadas; pedem 2 chapas por caminhão |
| Armazém | Local físico de recebimento: Insumos, Adubo, Pátio de Máquinas ou Loja |
| Depósito SAP | Código do SAP (FER, MAQ, AGR, PEC, ALI, MED, ACE, MATGeral), que não é o local físico |
| Cancelamento tardio | Cancelamento com menos de 24 horas; o fornecedor perde a preferência em reagendamentos |
| Encaixe | Reagendamento com prioridade para o próximo dia útil, usado quando a chuva impede a descarga no Adubo |
| `origem_dado` | Campo de todo registro: HISTORICO (Cocapec), SISTEMA ou TESTE (equipe) |
