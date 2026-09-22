# Fluxo Principal 1: Coordenador
Objetivo do fluxo: permitir que a coordenação gerencie alunos, acompanhe jornada, consulte indicadores e mantenha a base institucional atualizada.

### Persona: Camila, Coordenadora de Projetos

RFs relacionados: RF001, RF002, RF003, RF004, RF008, RF009, RF010

Telas principais: Homepage do Coordenador, Dashboard Geral dos Alunos, Listagem de Alunos, Cadastro de Aluno, Perfil do Aluno, Registro de Frequência

Endpoints principais: `/alunos`, `/alunos/:id`, `/alunos/:id/perfil`, `/avaliacoes`, `/indicadores`, `/alunos/:id/entregas`, `/dashboard`, `/alunos/:id/historico`

---

### Etapas do fluxo
1. A coordenadora acessa a plataforma pela tela de login.
2. O sistema direciona para a Homepage do Coordenador.
3. A coordenadora acessa a Listagem de Alunos.
4. O sistema exibe os alunos cadastrados e permite busca ou filtragem.
5. A coordenadora cadastra um novo aluno ou seleciona um aluno existente.
6. Ao cadastrar, o sistema valida CPF único e campos obrigatórios.
7. Após o cadastro, o aluno aparece na listagem.
8. A coordenadora acessa o Perfil do Aluno.
9. O sistema exibe histórico consolidado do aluno, incluindo dados pessoais, programas, indicadores, entregas e histórico profissional.
10. A coordenadora registra frequência, indicadores ou entregas vinculadas ao aluno.
11. O sistema valida regras como vínculo com programa/evento, escala de avaliação de 1 a 5 e data de entrega não futura.
12. A coordenadora acessa o Dashboard Geral dos Alunos.
13. O sistema apresenta indicadores agregados calculados dinamicamente a partir dos dados reais.
14. A coordenadora utiliza os dados para acompanhar desempenho, risco de evasão e impacto institucional.

#### Resultado esperado
A coordenadora consegue cadastrar, localizar, consultar e acompanhar um aluno de ponta a ponta, com dados persistidos, regras de negócio aplicadas e impacto refletido no dashboard.

#### Evidências esperadas
- Cadastro válido retorna HTTP 201.
- CPF duplicado retorna HTTP 409.
- Listagem de alunos retorna HTTP 200.
- Perfil consolidado retorna HTTP 200.
- Registro de indicadores inválidos retorna HTTP 400.
- Dashboard retorna HTTP 200 com indicadores agregados.

---

# Fluxo Principal 2: Aluno Ativo

Objetivo do fluxo: permitir que o aluno ativo acompanhe sua trajetória no programa e atualize seus dados cadastrais no Portal do Aluno.

---

### Persona: Luana, Aluna Ativa

RF relacionado: RF005

RNs relacionadas: RN07, RN09

Telas principais: Homepage do Aluno, Dashboard de Desempenho, Meu Perfil - Aluno, Portal do Aluno

Endpoint principal: `/alunos/:id/portal`

---

Etapas do fluxo
1. A aluna acessa a plataforma pela tela de login.
2. O sistema direciona para a Homepage do Aluno.
3. A homepage apresenta saudação personalizada, programa atual e próximos eventos, aulas ou mentorias.
4. A aluna acessa o Dashboard de Desempenho.
5. O sistema exibe informações de evolução, como soft skills, hard skills e próximas atividades.
6. A aluna acessa a tela Meu Perfil.
7. O sistema exibe seus dados cadastrais permitidos.
8. A aluna atualiza informações como nome, contato ou endereço.
9. O sistema envia a atualização para o endpoint `/alunos/:id/portal`.
10. O sistema aceita apenas campos permitidos e ignora campos restritos.
11. A aluna retorna ao perfil e visualiza os dados atualizados.
12. O sistema mantém histórico, indicadores e observações apenas para visualização, sem permitir edição pelo aluno.

#### Resultado esperado
A aluna ativa consegue acessar seu portal, visualizar informações da própria jornada e atualizar apenas dados cadastrais permitidos, sem acessar dados de outros alunos ou alterar registros institucionais.

#### Evidências esperadas
- Atualização de dados permitidos retorna HTTP 200.
- Campos restritos são ignorados ou bloqueados.
- O portal exibe apenas dados do próprio aluno.
- A separação entre rotas administrativas e Portal do Aluno é respeitada.

---
# Fluxo Principal 3: Ex-Aluno

Objetivo do fluxo: permitir que o ex-aluno mantenha vínculo com a Pulse Mais, consulte seu histórico e atualize dados pessoais ou profissionais relevantes.

---

### Persona: Pedro, Ex-Aluno
RFs relacionados: RF005, RF010

RN relacionada: RN09

Telas principais: Homepage do Ex-Aluno, Meu Perfil - Ex-Aluno, Oportunidades, Conquistas e Certificados, Perfil Ex-Aluno

Endpoints principais: `/alunos/:id/portal`, `/alunos/:id/historico`

---

### Etapas do fluxo
1. O ex-aluno acessa a plataforma pela tela de login.
2. O sistema direciona para a Homepage do Ex-Aluno.
3. A homepage apresenta oportunidades, histórico e conquistas relacionadas à jornada na Pulse Mais.
4. O ex-aluno acessa Meu Perfil.
5. O sistema exibe os dados cadastrais do próprio ex-aluno.
6. O ex-aluno atualiza informações permitidas, como contato, endereço ou dados de perfil.
7. O sistema envia a atualização para `/alunos/:id/portal`.
8. O sistema garante que apenas os próprios dados sejam acessados ou alterados.
9. O ex-aluno acessa seu histórico profissional ou seção de conquistas.
10. O sistema consulta `/alunos/:id/historico`.
11. O sistema exibe histórico de empregabilidade pós-formação, conquistas e registros associados.
12. O ex-aluno acessa oportunidades disponíveis no ecossistema Pulse Mais.
13. O sistema mantém o vínculo do egresso com a rede, sem permitir edição de registros institucionais sensíveis.

#### Resultado esperado
O ex-aluno consegue manter seus dados atualizados, consultar sua trajetória pós-formação e visualizar oportunidades, preservando o isolamento dos dados individuais.

#### Evidências esperadas
- Atualização no portal retorna HTTP 200.
- O sistema isola os dados do próprio aluno.
- Consulta ao histórico profissional retorna HTTP 200.
- O ex-aluno não acessa dados de outros alunos.
- Dados institucionais permanecem protegidos contra edição indevida.

---

# Checklist de Entregáveis Obrigatórios do Artefato 10

Este checklist consolida os entregáveis exigidos para o Artefato 10 e indica como cada item será evidenciado no projeto. O objetivo é garantir que a implementação dos fluxos principais esteja conectada à documentação, aos testes, ao README, ao Kanban e à rastreabilidade técnica.

| Entregável obrigatório | Documento/seção relacionada | Responsável principal | Evidência esperada | Status |
|---|---|---|---|---|
| Sistema web rodando com fluxos principais completos ponta a ponta | Seção 4.2 do WAD | Front-end / integração | Fluxos de Coordenador, Aluno Ativo e Ex-Aluno executáveis no ambiente local | Planejado |
| Preenchimento da seção 3.9 - Matriz de Rastreabilidade | Seção 3.9 do WAD | Responsável pela RTM | Matriz relacionando persona, RF, RN, endpoint, tela, teste e evidência | Concluído |
| Preenchimento da seção 4.2 - Segunda versão da aplicação web | Seção 4.2 do WAD | Responsável pelo WAD / equipe | Descrição da segunda versão, funcionalidades implementadas e evidências dos fluxos | Planejado |
| Preenchimento das seções 5.1, 5.2 e 5.3 | Seções 5.1, 5.2 e 5.3 do WAD | Responsáveis por testes | Estratégia de testes, casos automatizados e evidências de execução | Planejado |
| Atualização da seção 3.1.3 - RNF | Seção 3.1.3 do WAD | Responsável por RNF | RNFs revisados para contexto de integração e operação | Planejado |
| Atualização da seção 3.1.4 - RF para RN para Endpoint | Seção 3.1.4 do WAD | Responsável por requisitos/endpoints | Relação atualizada entre requisitos, regras de negócio e endpoints | Planejado |
| Atualização da seção 3.2.1 - Casos de uso | Seção 3.2.1 do WAD | Responsável por requisitos / documentação | Casos de uso coerentes com fluxos e endpoints implementados | Planejado |
| Atualização da seção 3.6 - Banco de Dados | Seção 3.6 do WAD | Responsável por banco de dados | Modelagem revisada conforme implementação real | Planejado |
| Atualização da seção 3.7 - WebAPI | Seção 3.7 do WAD | Responsável por WebAPI | Endpoints documentados com métodos, finalidade e vínculos com RF/RN | Planejado |
| Atualização do README.md | README.md na raiz do projeto | Responsável pelo README | Instruções de execução, dependências, testes e contexto do sistema | Planejado |
| Atualização do backlog do Kanban | Kanban do grupo | Grupo | Cards atualizados com status real das atividades | Planejado |
| Relatório de Desenvolvimento da segunda versão | Seção 4.2 do WAD / documento de apoio | Equipe | Registro do que foi implementado, pendências, dificuldades e próximos passos | Planejado |
| Testes automatizados da WebAPI | Seções 5.1, 5.2 e 5.3 do WAD / código de testes | Responsáveis por testes | Testes Jest/Supertest versionados e executados | Planejado |
| Documentação atualizada da WebAPI e da arquitetura | Seções 3.7 e documentação de arquitetura | Responsáveis por WebAPI/arquitetura | Rotas, camadas, diagramas e decisões técnicas atualizados | Planejado |
| Revisão da modelagem do banco conforme implementação real | Seção 3.6 do WAD | Responsável por banco de dados | Modelo coerente com entidades, relações e endpoints usados | Planejado |
| Evolução dos RNFs para integração e operação | Seção 3.1.3 do WAD | Responsável por RNF | RNFs descritos de forma verificável e alinhados à entrega integrada | Planejado |
| RTM técnica completa | Seção 3.9 do WAD | Responsável pela RTM | Rastreabilidade entre RF, RN, endpoint, tela, teste e evidência | Concluído |

---

# Organização do Backlog Visual

Com base nos fluxos principais definidos para Coordenador, Aluno Ativo e Ex-Aluno, o backlog visual deve separar o que é obrigatório para o Artefato 10, o que melhora a experiência e o que pode ficar como ajuste secundário.

### Itens Obrigatórios

| Item visual | Perfil | Fluxo relacionado | Prioridade | Dependência | Status sugerido |
|---|---|---|---|---|---|
| Tela de Login | Todos | Entrada no sistema | Alta | Definição dos perfis de usuário | A fazer |
| Homepage do Coordenador | Coordenador | Acesso inicial da coordenação | Alta | Dados básicos do dashboard | A fazer |
| Listagem de Alunos | Coordenador | Buscar e selecionar alunos | Alta | Endpoint `/alunos` | A fazer |
| Filtros de alunos | Coordenador | Buscar alunos por critérios | Alta | Endpoint `/alunos?nome=&cpf=&email=&ativo=` | A fazer |
| Tela de Cadastro de Aluno | Coordenador | Cadastrar novo aluno | Alta | Endpoint `POST /alunos` | A fazer |
| Tela de Perfil do Aluno | Coordenador | Consultar histórico consolidado | Alta | Endpoint `/alunos/:id/perfil` | A fazer |
| Área de registro de frequência/indicadores | Coordenador | Registrar acompanhamento | Alta | Endpoints `/indicadores` e `/avaliacoes` | A fazer |
| Área de entregas do aluno | Coordenador | Registrar atividades entregues | Alta | Endpoint `/alunos/:id/entregas` | A fazer |
| Dashboard Geral dos Alunos | Coordenador | Visualizar impacto institucional | Alta | Endpoint `/dashboard` | A fazer |
| Homepage do Aluno Ativo | Aluno Ativo | Entrada no portal do aluno | Alta | Dados do aluno e programa atual | A fazer |
| Dashboard de Desempenho do Aluno | Aluno Ativo | Acompanhar evolução | Alta | Dados de indicadores e atividades | A fazer |
| Tela Meu Perfil - Aluno Ativo | Aluno Ativo | Atualizar dados permitidos | Alta | Endpoint `/alunos/:id/portal` | A fazer |
| Homepage do Ex-Aluno | Ex-Aluno | Entrada no portal do egresso | Alta | Dados de histórico e oportunidades | A fazer |
| Tela Meu Perfil - Ex-Aluno | Ex-Aluno | Atualizar dados permitidos | Alta | Endpoint `/alunos/:id/portal` | A fazer |
| Tela de Histórico/Conquistas | Ex-Aluno | Consultar trajetória pós-formação | Alta | Endpoint `/alunos/:id/historico` | A fazer |
| Tela de Oportunidades | Ex-Aluno | Visualizar oportunidades da rede | Alta | Dados de oportunidades disponíveis | A fazer |
| Estados de erro | Todos | Tratamento de falhas | Alta | Respostas 400, 404, 409 da API | A fazer |
| Estados de carregamento | Todos | Feedback durante requisições | Alta | Chamadas assíncronas da API | A fazer |
| Estados vazios | Todos | Ausência de dados | Alta | Retornos vazios da API | A fazer |

### Melhorias

| Item visual | Perfil | Fluxo relacionado | Prioridade | Dependência | Status sugerido |
|---|---|---|---|---|---|
| Padronização de botões | Todos | Todos os fluxos | Média | Guia visual existente | A fazer |
| Padronização de cards | Todos | Dashboards, listagens e oportunidades | Média | Componentes definidos | A fazer |
| Melhor hierarquia visual dos dashboards | Coordenador e Aluno Ativo | Consulta de indicadores | Média | Dados exibidos nas telas | A fazer |
| Feedback visual após cadastro ou atualização | Coordenador, Aluno Ativo e Ex-Aluno | Salvar dados | Média | Integração com API | A fazer |
| Mensagens de validação em formulários | Coordenador, Aluno Ativo e Ex-Aluno | Cadastro e atualização | Média | Regras de negócio mapeadas | A fazer |
| Ajuste de responsividade | Todos | Uso em diferentes telas | Média | Telas principais estruturadas | A fazer |
| Organização visual do Perfil do Aluno | Coordenador | Consulta consolidada | Média | Dados de histórico disponíveis | A fazer |
| Destaque para indicadores críticos | Coordenador | Identificar risco ou impacto | Média | Dados do dashboard | A fazer |
| Separação clara entre dados editáveis e somente leitura | Aluno Ativo e Ex-Aluno | Portal do Aluno | Média | RN09 e RF005 | A fazer |

### Não Prioritários

| Item visual | Perfil | Fluxo relacionado | Prioridade | Dependência | Status sugerido |
|---|---|---|---|---|---|
| Animações de transição entre telas | Todos | Navegação geral | Baixa | Fluxos principais concluídos | Opcional |
| Microinterações em botões | Todos | Ações secundárias | Baixa | Componentes finalizados | Opcional |
| Ilustrações decorativas adicionais | Todos | Telas de boas-vindas | Baixa | Identidade visual consolidada | Opcional |
| Refinamento avançado de gráficos | Coordenador e Aluno Ativo | Dashboards | Baixa | Dashboard funcional concluído | Opcional |
| Personalização visual por perfil | Todos | Homepages específicas | Baixa | Telas obrigatórias concluídas | Opcional |
| Tela avançada de preferências do usuário | Todos | Perfil individual | Baixa | Escopo futuro | Opcional |

### Backlog Visual Consolidado

| Categoria | Quantidade de itens | Critério de execução |
|---|---:|---|
| Obrigatórios | 19 | Necessários para demonstrar os fluxos principais do Artefato 10 |
| Melhorias | 9 | Aumentam clareza, consistência e usabilidade |
| Não prioritários | 6 | Podem ser adiados sem prejudicar a entrega principal |

### Priorização Recomendada

1. Implementar primeiro as telas obrigatórias dos três perfis.
2. Garantir estados de carregamento, erro e ausência de dados.
3. Validar se cada tela obrigatória está ligada a um endpoint ou requisito da RTM.
4. Aplicar melhorias de UX após os fluxos estarem navegáveis.
5. Deixar animações, refinamentos visuais avançados e personalizações para depois da integração.

---
# Priorização do Backlog Visual

A priorização deve considerar o que é indispensável para demonstrar o Artefato 10 com qualidade, o que depende da API, o que valida os três perfis principais e o que pode ser deixado para depois sem comprometer a entrega.

### Critérios de Priorização

| Prioridade | Critério | Decisão prática |
|---|---|---|
| Alta | Bloqueia fluxo principal, demonstração ou integração com API | Fazer primeiro |
| Média | Melhora clareza, usabilidade ou consistência, mas não bloqueia a entrega | Fazer depois dos fluxos obrigatórios |
| Baixa | Refinamento visual ou recurso secundário | Fazer apenas se sobrar tempo |

### Backlog Priorizado

| Ordem | Item visual | Perfil | Fluxo relacionado | Prioridade | Dependência | Justificativa |
|---:|---|---|---|---|---|---|
| 1 | Tela de Login | Todos | Entrada no sistema | Alta | Definição dos perfis | Necessária para iniciar a navegação por perfil |
| 2 | Homepage do Coordenador | Coordenador | Acesso inicial da coordenação | Alta | Dados básicos do sistema | É a porta de entrada do principal perfil operacional |
| 3 | Listagem de Alunos | Coordenador | Buscar e selecionar alunos | Alta | `GET /alunos` | Base para acessar cadastro, perfil e histórico |
| 4 | Filtros de alunos | Coordenador | Buscar alunos por critérios | Alta | `GET /alunos?nome=&cpf=&email=&ativo=` | Necessário para demonstrar consulta e gestão eficiente |
| 5 | Tela de Cadastro de Aluno | Coordenador | Cadastrar novo aluno | Alta | `POST /alunos` | Valida RF001 e RN01, uma das principais funções do sistema |
| 6 | Tela de Perfil do Aluno | Coordenador | Consultar histórico consolidado | Alta | `GET /alunos/:id/perfil` | Central para demonstrar SSOT e histórico consolidado |
| 7 | Área de registro de frequência/indicadores | Coordenador | Registrar acompanhamento | Alta | `POST /indicadores`, `POST /avaliacoes` | Valida acompanhamento da jornada e regras de indicadores |
| 8 | Área de entregas do aluno | Coordenador | Registrar atividades entregues | Alta | `GET/POST /alunos/:id/entregas` | Complementa o histórico do aluno e valida RF003 |
| 9 | Dashboard Geral dos Alunos | Coordenador | Visualizar impacto institucional | Alta | `GET /dashboard` | Evidencia o valor institucional da plataforma |
| 10 | Homepage do Aluno Ativo | Aluno Ativo | Entrada no portal do aluno | Alta | Dados do aluno e programa atual | Representa o acesso do aluno ao próprio portal |
| 11 | Dashboard de Desempenho do Aluno | Aluno Ativo | Acompanhar evolução | Alta | Dados de indicadores e atividades | Demonstra acompanhamento individual da jornada |
| 12 | Tela Meu Perfil - Aluno Ativo | Aluno Ativo | Atualizar dados permitidos | Alta | `PUT /alunos/:id/portal` | Valida RF005, RN07 e RN09 |
| 13 | Homepage do Ex-Aluno | Ex-Aluno | Entrada no portal do egresso | Alta | Dados do histórico do egresso | Demonstra continuidade do vínculo após formação |
| 14 | Tela Meu Perfil - Ex-Aluno | Ex-Aluno | Atualizar dados permitidos | Alta | `PUT /alunos/:id/portal` | Garante autonomia do egresso sobre dados permitidos |
| 15 | Tela de Histórico/Conquistas | Ex-Aluno | Consultar trajetória pós-formação | Alta | `GET /alunos/:id/historico` | Valida histórico pós-formação e empregabilidade |
| 16 | Tela de Oportunidades | Ex-Aluno | Visualizar oportunidades da rede | Alta | Dados de oportunidades disponíveis | Sustenta a proposta de manter vínculo com a rede Pulse Mais |
| 17 | Estados de carregamento | Todos | Feedback durante requisições | Alta | Chamadas assíncronas da API | Necessário para uso compreensível durante integração |
| 18 | Estados de erro | Todos | Tratamento de falhas | Alta | Respostas 400, 404, 409 da API | Necessário para demonstrar robustez e validação |
| 19 | Estados vazios | Todos | Ausência de dados | Alta | Retornos vazios da API | Evita telas quebradas ou sem orientação ao usuário |
| 20 | Feedback visual após cadastro ou atualização | Coordenador, Aluno Ativo e Ex-Aluno | Salvar dados | Média | Integração com API | Melhora percepção de sucesso nas ações do usuário |
| 21 | Mensagens de validação em formulários | Coordenador, Aluno Ativo e Ex-Aluno | Cadastro e atualização | Média | Regras de negócio mapeadas | Reduz erro de uso e reforça regras como CPF duplicado e campos obrigatórios |
| 22 | Padronização de botões | Todos | Todos os fluxos | Média | Guia visual existente | Melhora consistência sem bloquear funcionalidade |
| 23 | Padronização de cards | Todos | Dashboards, listagens e oportunidades | Média | Componentes definidos | Melhora leitura de dados e repetição visual |
| 24 | Melhor hierarquia visual dos dashboards | Coordenador e Aluno Ativo | Consulta de indicadores | Média | Dados exibidos nas telas | Facilita compreensão dos indicadores |
| 25 | Organização visual do Perfil do Aluno | Coordenador | Consulta consolidada | Média | Dados de histórico disponíveis | Melhora navegação em uma tela com muitos dados |
| 26 | Separação clara entre dados editáveis e somente leitura | Aluno Ativo e Ex-Aluno | Portal do Aluno | Média | RN09 e RF005 | Reduz risco de confusão sobre permissões |
| 27 | Destaque para indicadores críticos | Coordenador | Identificar risco ou impacto | Média | Dados do dashboard | Ajuda na leitura de risco de evasão e impacto |
| 28 | Ajuste de responsividade | Todos | Uso em diferentes telas | Média | Telas principais estruturadas | Importante para qualidade, mas posterior à funcionalidade |
| 29 | Animações de transição entre telas | Todos | Navegação geral | Baixa | Fluxos principais concluídos | Não bloqueia entrega nem avaliação principal |
| 30 | Microinterações em botões | Todos | Ações secundárias | Baixa | Componentes finalizados | Refinamento estético secundário |
| 31 | Ilustrações decorativas adicionais | Todos | Telas de boas-vindas | Baixa | Identidade visual consolidada | Não agrega validação funcional direta |
| 32 | Refinamento avançado de gráficos | Coordenador e Aluno Ativo | Dashboards | Baixa | Dashboard funcional concluído | Pode ser feito depois que os dados já estiverem corretos |
| 33 | Personalização visual por perfil | Todos | Homepages específicas | Baixa | Telas obrigatórias concluídas | Desejável, mas não essencial para entrega |
| 34 | Tela avançada de preferências do usuário | Todos | Perfil individual | Baixa | Escopo futuro | Fora do núcleo avaliável do Artefato 10 |

### Ordem Recomendada por Dia
#### 02/06

| Ordem | Item |
|---:|---|
| 1 | Tela de Login |
| 2 | Homepage do Coordenador |
| 3 | Listagem de Alunos |
| 4 | Tela de Cadastro de Aluno |
| 5 | Tela de Perfil do Aluno |
| 6 | Homepage do Aluno Ativo |
| 7 | Homepage do Ex-Aluno |

#### 03/06

| Ordem | Item |
|---:|---|
| 1 | Finalizar Fluxo Principal 1 do Coordenador |
| 2 | Filtros de alunos |
| 3 | Registro de frequência/indicadores |
| 4 | Área de entregas |
| 5 | Dashboard Geral dos Alunos |
| 6 | Estados de carregamento, erro e vazio iniciais |

#### 08/06

| Ordem | Item |
|---:|---|
| 1 | Dashboard de Desempenho do Aluno |
| 2 | Meu Perfil - Aluno Ativo |
| 3 | Meu Perfil - Ex-Aluno |
| 4 | Histórico/Conquistas do Ex-Aluno |
| 5 | Tela de Oportunidades |
| 6 | Revisão de consistência entre os três perfis |

#### 09/06

| Ordem | Item |
|---:|---|
| 1 | Integrar telas obrigatórias com endpoints reais |
| 2 | Substituir mocks disponíveis |
| 3 | Validar respostas 200, 201, 204, 400, 404 e 409 |
| 4 | Ajustar estados de carregamento, erro e vazio |

#### 10/06

| Ordem | Item |
|---:|---|
| 1 | Corrigir bugs críticos |
| 2 | Aplicar feedback visual após cadastro ou atualização |
| 3 | Melhorar mensagens de validação |
| 4 | Padronizar botões e cards |
| 5 | Melhorar hierarquia visual dos dashboards |
| 6 | Separar visualmente campos editáveis e somente leitura |

#### 11/06

| Ordem | Item |
|---:|---|
| 1 | Validar demonstração dos três perfis |
| 2 | Ajustar responsividade básica |
| 3 | Corrigir textos, alinhamentos e inconsistências visuais |
| 4 | Preparar evidências visuais |
| 5 | Deixar itens de baixa prioridade como opcionais |

---
# Mapear a Rastreabilidade Inicial

Com base na seção 3.9 - Matriz de Rastreabilidade (RTM) do WAD, os fluxos principais podem ser rastreados da seguinte forma.

| Fluxo | Persona | RF/US relacionado | RN relacionada | Endpoint | Tela/Componente | Entregável do Artefato 10 |
|---|---|---|---|---|---|---|
| Fluxo Principal 1 - Gestão e acompanhamento de alunos | Camila, Coordenadora | RF001 / US01 | RN01 | `POST /alunos` | Tela Cadastro de Aluno | Sistema web com fluxo ponta a ponta |
| Fluxo Principal 1 - Gestão e acompanhamento de alunos | Camila, Coordenadora | RF001 / US01 | RN02 | `DELETE /alunos/:id` | Tela Perfil do Aluno | Sistema web com fluxo ponta a ponta |
| Fluxo Principal 1 - Gestão e acompanhamento de alunos | Camila, Coordenadora | RF001 | Não aplicável | `GET /alunos` | Tela Lista de Alunos | Sistema web com fluxo ponta a ponta |
| Fluxo Principal 1 - Gestão e acompanhamento de alunos | Camila, Coordenadora | RF001 | RN01 | `PUT /alunos/:id` | Tela Perfil do Aluno | Sistema web com fluxo ponta a ponta |
| Fluxo Principal 1 - Gestão e acompanhamento de alunos | Camila, Coordenadora | RF002 / US02 | RN03 | `POST /indicadores` | Tela Registro de Frequência | Sistema web com fluxo ponta a ponta |
| Fluxo Principal 1 - Gestão e acompanhamento de alunos | Camila, Coordenadora | RF002 / US02 | RN10 | `POST /avaliacoes` | Tela Registro de Frequência | Sistema web com fluxo ponta a ponta |
| Fluxo Principal 1 - Gestão e acompanhamento de alunos | Camila, Coordenadora | RF002 | Não aplicável | `GET /avaliacoes` | Tela Registro de Frequência | Sistema web com fluxo ponta a ponta |
| Fluxo Principal 1 - Gestão e acompanhamento de alunos | Camila, Coordenadora | RF003 | RN04 | `POST /alunos/:id/entregas` | Tela Perfil do Aluno | Sistema web com fluxo ponta a ponta |
| Fluxo Principal 1 - Gestão e acompanhamento de alunos | Camila, Coordenadora | RF003 | Não aplicável | `GET /alunos/:id/entregas` | Tela Perfil do Aluno | Sistema web com fluxo ponta a ponta |
| Fluxo Principal 1 - Gestão e acompanhamento de alunos | Camila, Coordenadora | RF004 / US03 | Não aplicável | `GET /alunos/:id/perfil` | Tela Perfil do Aluno | Sistema web com fluxo ponta a ponta |
| Fluxo Principal 1 - Gestão e acompanhamento de alunos | Camila, Coordenadora | RF008 | Não aplicável | `GET /dashboard` | Tela Dashboard Institucional | Sistema web com fluxo ponta a ponta |
| Fluxo Principal 1 - Gestão e acompanhamento de alunos | Camila, Coordenadora | RF009 | Não aplicável | `GET /alunos?nome=&cpf=&email=&ativo=` | Tela Lista de Alunos | Sistema web com fluxo ponta a ponta |
| Fluxo Principal 1 - Gestão e acompanhamento de alunos | Camila, Coordenadora | RF010 | Não aplicável | `POST /alunos/:id/historico` | Tela Perfil do Aluno | Sistema web com fluxo ponta a ponta |
| Fluxo Principal 1 - Gestão e acompanhamento de alunos | Camila, Coordenadora | RF010 | Não aplicável | `GET /alunos/:id/historico` | Tela Perfil do Aluno | Sistema web com fluxo ponta a ponta |
| Fluxo Principal 2 - Portal do Aluno Ativo | Luana, Aluna Ativa | RF005 | RN07, RN09 | `PUT /alunos/:id/portal` | Tela Portal do Aluno / Meu Perfil - Aluno | Sistema web com fluxo ponta a ponta |
| Fluxo Principal 3 - Portal do Ex-Aluno | Pedro, Ex-Aluno | RF005 | RN09 | `PUT /alunos/:id/portal` | Tela Portal do Aluno / Meu Perfil - Ex-Aluno | Sistema web com fluxo ponta a ponta |
| Fluxo Principal 3 - Portal do Ex-Aluno | Pedro, Ex-Aluno | RF010 | Não aplicável | `GET /alunos/:id/historico` | Tela Perfil Ex-Aluno / Histórico e Conquistas | Sistema web com fluxo ponta a ponta |

### Relação entre Fluxos e Documentação

| Fluxo | Documentação relacionada | Justificativa da relação |
|---|---|---|
| Fluxo Principal 1 - Coordenador | Seção 3.1.4, seção 3.2.1, seção 3.6, seção 3.7, seção 3.9, seção 4.2, README.md e Kanban | O fluxo depende de RF/RN, casos de uso, banco de dados, endpoints, RTM, execução da segunda versão, instruções de uso e cards atualizados. |
| Fluxo Principal 2 - Aluno Ativo | Seção 3.1.3, seção 3.1.4, seção 3.2.1, seção 3.7, seção 3.9, seção 4.2, README.md e Kanban | O fluxo depende de permissões do Portal do Aluno, RF005, RN07, RN09, endpoint `/alunos/:id/portal`, rastreabilidade e registro no planejamento visual. |
| Fluxo Principal 3 - Ex-Aluno | Seção 3.1.3, seção 3.1.4, seção 3.2.1, seção 3.7, seção 3.9, seção 4.2, README.md e Kanban | O fluxo depende de isolamento dos dados do próprio aluno, atualização de perfil, histórico de empregabilidade e coerência com a documentação da segunda versão. |
| Todos os fluxos | Seções 5.1, 5.2 e 5.3 do WAD | Os fluxos devem ser validados por testes automatizados, testes funcionais ou evidências de execução relacionadas aos casos de teste da RTM. |
| Todos os fluxos | Relatório de Desenvolvimento da segunda versão | O relatório deve registrar quais fluxos foram implementados, quais limitações permaneceram e quais evidências comprovam a entrega. |

### Rastreabilidade por Fluxo

#### Fluxo Principal 1 - Coordenador

| Elemento | Conteúdo |
|---|---|
| Persona | Camila, Coordenadora |
| Objetivo | Gerenciar alunos, registrar acompanhamento e consultar indicadores institucionais |
| User Stories relacionadas | US01, US02, US03 |
| Requisitos funcionais | RF001, RF002, RF003, RF004, RF008, RF009, RF010 |
| Regras de negócio | RN01, RN02, RN03, RN04, RN10 |
| Telas | Homepage do Coordenador, Lista de Alunos, Cadastro de Aluno, Perfil do Aluno, Registro de Frequência, Dashboard Institucional |
| Endpoints | `/alunos`, `/alunos/:id`, `/alunos/:id/perfil`, `/indicadores`, `/avaliacoes`, `/alunos/:id/entregas`, `/dashboard`, `/alunos/:id/historico` |
| Testes relacionados | CT01, CT02, CT03, CT04, CT05, CT06, CT14, CT16, CT17, CT18, CT19, CT21 |
| Evidência esperada | Cadastro, consulta, atualização, registro de acompanhamento e visualização de indicadores funcionando ponta a ponta |

#### Fluxo Principal 2 - Aluno Ativo

| Elemento | Conteúdo |
|---|---|
| Persona | Luana, Aluna Ativa |
| Objetivo | Acessar o portal, acompanhar a própria jornada e atualizar dados permitidos |
| User Stories relacionadas | Relacionada ao Portal do Aluno |
| Requisitos funcionais | RF005 |
| Regras de negócio | RN07, RN09 |
| Telas | Homepage do Aluno Ativo, Dashboard de Desempenho, Meu Perfil - Aluno, Portal do Aluno |
| Endpoints | `/alunos/:id/portal` |
| Testes relacionados | CT10 |
| Evidência esperada | Atualização permitida de dados cadastrais e isolamento dos dados do próprio aluno |

#### Fluxo Principal 3 - Ex-Aluno

| Elemento | Conteúdo |
|---|---|
| Persona | Pedro, Ex-Aluno |
| Objetivo | Manter dados atualizados, consultar histórico pós-formação e visualizar oportunidades |
| User Stories relacionadas | Relacionada ao Portal do Aluno e empregabilidade |
| Requisitos funcionais | RF005, RF010 |
| Regras de negócio | RN09 |
| Telas | Homepage do Ex-Aluno, Meu Perfil - Ex-Aluno, Histórico/Conquistas, Oportunidades, Perfil Ex-Aluno |
| Endpoints | `/alunos/:id/portal`, `/alunos/:id/historico` |
| Testes relacionados | CT10, CT18 |
| Evidência esperada | Atualização do próprio perfil e consulta ao histórico de empregabilidade pós-formação |

### Pendências Identificadas na Rastreabilidade

| Pendência | Impacto | Responsável sugerido | Prazo recomendado |
|---|---|---|---|
| Confirmar se as telas de Oportunidades e Conquistas possuem endpoint próprio ou dados mockados | Pode afetar a integração do Fluxo do Ex-Aluno | Responsável por WebAPI/front-end | Até 08/06 |
| Confirmar se o Dashboard de Desempenho do Aluno usa endpoint próprio ou dados derivados de avaliações/indicadores | Pode afetar a implementação do Fluxo do Aluno Ativo | Responsável por WebAPI/front-end | Até 08/06 |
| Confirmar se o login será apenas visual/simulado ou integrado | Afeta a separação real entre perfis | Responsável por arquitetura/API/front-end | Até 08/06 |
| Confirmar se o registro de frequência será representado por `/indicadores`, `/avaliacoes` ou ambos | Evita inconsistência entre tela e API | Responsável por RTM/API | Até 08/06 |
| Confirmar se exclusão de aluno será demonstrada ou apenas documentada | Pode reduzir escopo da demonstração do Coordenador | Responsável pelo fluxo Coordenador | Até 08/06 |
