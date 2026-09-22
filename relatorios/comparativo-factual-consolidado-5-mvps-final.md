# Comparativo Factual Consolidado dos 5 MVPs — Pulse Mais

> **Status:** Matriz Factual Comparativa Congelada  
> **Finalidade:** Consolidar as evidências técnicas e estruturais observáveis dos 5 MVPs auditados, servindo de base factual documental estritamente descritiva para a próxima etapa: **Matriz de Decisão do MVP-Base**.

---

## 1. Objetivo

Este documento consolida as evidências técnicas e funcionais observadas durante a análise dos cinco MVPs da Pulse Mais, registrando a presença ou ausência de estruturas nos arquivos dos repositórios.

O documento responde exclusivamente à pergunta: **"O que foi encontrado nos cinco MVPs e qual é a evidência?"**

Ele **não** responde qual MVP é "melhor", qual deve ser escolhido ou qual possui maior "aderência". O documento não atribui notas, pesos, pontuações ou classificações avaliativas, mantendo-se 100% isento e descritivo.

---

## 2. Contexto de Referência das Prioridades de Produto

A organização do documento utiliza como referência documental as seguintes prioridades de produto da Pulse Mais:

- **P0 — Indicadores & Gestão**: Visualização de métricas da jornada para a Diretoria (Eduardo) e Coordenação (Denise).
- **P0 — Acesso do Aluno**: Acesso direto do aluno para consultar sua evolução, turmas e informações.
- **P1 — Mentoria**: Funcionalidades para o papel do Mentor e interação Mentor ↔ Aluno.
- **Futuro — Psicologia / Apoio Clínico**: Prontuários e acompanhamento de saúde mental (recurso não prioritário na etapa atual).
- **Evoluções Futuras de Engenharia**: Criptografia de coluna em repouso, políticas de Row Level Security (RLS) no PostgreSQL, integrações com APIs de terceiros e observabilidade avançada (requisitos não previstos na especificação original).

---

## 3. Matriz Factual Comparativa Principal

| Dimensão Factual | MVP-01 (PulseConnect) | MVP-02 (Pulsar) | MVP-03 (Pulse Manager) | MVP-04 (NEXUS) | MVP-05 (Pulse Control) | Evidência / Observação |
|---|---|---|---|---|---|---|
| **Identidade Cadastral** | CONFIRMADO | CONFIRMADO | CONFIRMADO | CONFIRMADO | CONFIRMADO | Trava `UNIQUE` em CPF/E-mail nos 5 candidatos |
| **Indicadores / Dashboard** | CONFIRMADO | CONFIRMADO | CONFIRMADO | CONFIRMADO | CONFIRMADO | Controllers/Services com agregações SQL |
| **Acesso do Aluno (Interface)** | CONFIRMADO | CONFIRMADO | CONFIRMADO | CONFIRMADO | CONFIRMADO | Perfis de acesso e views específicas |
| **Perfil / Estrutura do Mentor** | CONFIRMADO | CONFIRMADO | CONFIRMADO | PARCIALMENTE CONFIRMADO | CONFIRMADO | Rotas autenticadas e papéis mapeados |
| **Conectado (Estágio Inicial)** | PARCIALMENTE CONFIRMADO | PARCIALMENTE CONFIRMADO | CONFIRMADO | PARCIALMENTE CONFIRMADO | CONFIRMADO | Mapeamento no schema ou enums |
| **Capacitado (Estágio Formativo)** | CONFIRMADO | CONFIRMADO | CONFIRMADO | CONFIRMADO | CONFIRMADO | Mapeamento no schema ou enums |
| **Transformado (Estágio de Saída)** | PARCIALMENTE CONFIRMADO | CONFIRMADO | CONFIRMADO | PARCIALMENTE CONFIRMADO | CONFIRMADO | Presença de tabelas de emprego/bolsa |
| **Histórico Relacional da Jornada** | CONTRADITÓRIO | CONFIRMADO | CONFIRMADO | CONTRADITÓRIO | CONFIRMADO | Tabela relacional ou sobrescrita estática |
| **Múltiplas Ocorrências (Anos)** | CONTRADITÓRIO | CONFIRMADO | CONFIRMADO | CONTRADITÓRIO | CONFIRMADO | Suporte a N registros por jovem |
| **Importação do Planilhão** | PARCIALMENTE CONFIRMADO | PARCIALMENTE CONFIRMADO | CONFIRMADO | PARCIALMENTE CONFIRMADO | CONFIRMADO | Scripts e serviços de leitura CSV |
| **Empregabilidade** | PARCIALMENTE CONFIRMADO | CONFIRMADO | CONFIRMADO | PARCIALMENTE CONFIRMADO | CONFIRMADO | Tabela dedicada a vínculos profissionais |
| **Ensino Superior / Bolsas** | NÃO CONFIRMADO | CONFIRMADO | CONFIRMADO | NÃO CONFIRMADO | CONFIRMADO | Tabela dedicada a bolsas acadêmicas |
| **Psicologia / Prontuários** | NÃO CONFIRMADO | CONFIRMADO | CONFIRMADO | CONFIRMADO | CONFIRMADO | Tabelas/views para registros clínicos |
| **Testes Automatizados Existentes** | CONFIRMADO | CONFIRMADO | CONFIRMADO | CONFIRMADO | CONFIRMADO | Suítes Jest, Playwright ou Artillery |
| **Autenticação / Autorização** | CONFIRMADO | CONFIRMADO | CONFIRMADO | CONFIRMADO | CONFIRMADO | JWT, sessões e middlewares por perfil |
| **SQL Parametrizado** | CONFIRMADO | CONFIRMADO | CONFIRMADO | CONFIRMADO | CONFIRMADO | Driver `pg` posicional ou ORM |
| **Criptografia em Repouso (Coluna)** | NÃO CONFIRMADO | NÃO CONFIRMADO | NÃO CONFIRMADO | NÃO CONFIRMADO | NÃO CONFIRMADO | Não evidenciada no código |
| **RLS PostgreSQL** | NÃO CONFIRMADO | NÃO CONFIRMADO | NÃO CONFIRMADO | NÃO CONFIRMADO | NÃO CONFIRMADO | Não ativado nas migrações |
| **Runtime (Execução Dinâmica)** | NÃO VERIFICÁVEL | NÃO VERIFICÁVEL | NÃO VERIFICÁVEL | NÃO VERIFICÁVEL | NÃO VERIFICÁVEL | `node_modules` local ausente |

---

## 4. Matriz de Capacidades Observadas em Relação às Prioridades de Produto

A tabela a seguir descreve a **capacidade factual observada** em cada candidato para cada dimensão de produto, sem classificações avaliativas:

| Dimensão de Referência | Prioridade | MVP-01 | MVP-02 | MVP-03 | MVP-04 | MVP-05 |
|---|---|---|---|---|---|---|
| **Indicadores para Gestão** | **P0** | Controllers em `src/backend/controllers/` calculam totais de alunos por fase. | Consultas SQL em controllers agregam dados para o painel da coordenação. | Modelo `dashboardModel.ts` e serviço `riscoEvasaoService.ts` (lógica Fuzzy). | Scripts em `dashboard.js` consomem APIs de métricas de turmas e engajamento. | `dashboardService.ts` agrega totais por categoria e status de emprego/bolsa. |
| **Jornada e Estado Atual** | **P0** | Coluna estática `estagio_jornada` na tabela `aluno` armazena a fase atual. | Consultas relacionais derivam a situação atual a partir de eventos gravados. | Modelo `alunoModel.ts` mantém `status`, `categoria` e nível de risco. | Coluna estática `categoria` na tabela `aluno` armazena o estado atual. | Coluna `categoria_atual` na tabela `jovem` mantida em sincronia com histórico. |
| **Histórico Longitudinal** | **P0** | Atualização de estágio executa `UPDATE` direto na tabela `aluno` (sobrescreve fase). | Tabelas filhas de empregabilidade e ensino superior registram eventos por data. | Função `mergePayload()` consolida histórico de programas em memória. | Atualização de perfil executa `UPDATE` na tabela `aluno` (sobrescreve categoria). | Tabela relacional `categoria` insere nova linha com `categoria_anterior` e autor. |
| **Importação do Planilhão** | **P0** | `importacaoService.ts` lê CSV/XLSX e gera placeholders quando faltam dados. | `importacaoService.js` restrito ao lançamento de frequências por `jovem_id`. | `importacaoService.ts` executa `mergePayload()` unificando programas por CPF. | Rotas executam inserção direta de linhas sem rotina dedicada de reconciliação. | `importService.ts` trata `ConflictError` e atualiza cadastro existente. |
| **Acesso do Aluno** | **P0** | Papel "Aluno" com rotas autenticadas em `alunoController.ts`. | Script `criar-aluno.js` e middlewares de permissão para o perfil Aluno. | Modelo de usuário Aluno com consulta a agenda individual de atividades. | Visão estática HTML dedicada ao Aluno no subdiretório `src/view/aluno/`. | Views SSR em EJS dedicadas ao Aluno para consulta de evolução. |
| **Perfil do Mentor** | **P1** | Papel "Mentor" autenticado com rotas em `historico_profissional`. | Papel "Mentor" autenticado e script de seed `criar-mentor.js`. | Tipo de atividade "mentoria" em `atividade` atribuída ao participante. | Painel de comunicados de turmas manipulado pelo mentor. | Papel "Mentor" com visualização de acompanhamento de turmas. |
| **Fluxo Mentor ↔ Aluno** | **P1** | Rotas HTTP permitem registrar notas de acompanhamento do aluno pelo mentor. | Serviço `exportacaoService.js` gera arquivos `.ics` (iCal) de agendamentos. | Mapeamento de presenciais e notas de atividades de mentoria. | Envio e exibição de comunicados na interface da turma. | Tabelas `vinculo_mentoria` e `sessao_mentoria` registram vigência e presenças. |
| **Capacidade de Engenharia** | — | Estrutura de 3 camadas em TypeScript com testes Supertest. | 35 arquivos de migração SQL idempotentes e testes de carga Artillery. | TypeORM com suporte a execução offline em SQLite via `sql.js`. | Express 5 com manipulação nativa de rotas assíncronas. | Arquitetura Service/Repository com EJS SSR e 27 arquivos de teste Jest. |

---

## 5. Estruturação em Três Camadas Independentes

### 5.1 Camada A — Fatos Observados no Código-Fonte
- **Identificação Cadastral**: Trava de unicidade (`UNIQUE`) em CPF e E-mail confirmada nos schemas SQL das 5 aplicações (`aluno` no MVP-01/03/04, `jovens` no MVP-02 e `jovem` no MVP-05).
- **Indicadores**:
  - **MVP-01**: Rotas de agregações em `alunoController.ts`.
  - **MVP-02**: Queries SQL diretas nos controllers.
  - **MVP-03**: Algoritmo Fuzzy de 4 fatores (faltas, ausências, desempenho e engajamento) em `riscoEvasaoService.ts` L55-116.
  - **MVP-04**: Scripts `dashboard.js` consumindo endpoints de turmas.
  - **MVP-05**: Serviço `dashboardService.ts` (20.9 KB) com agregações por categoria e transformação.
- **Estruturas de Jornada e Histórico**:
  - **MVPs 01 e 04**: Coluna estática escalar (`estagio_jornada` e `categoria`) atualizada por `UPDATE` direto, sem tabela relacional de histórico de estágios.
  - **MVP-02**: Tabelas filhas relacionais `empregabilidade` e `ensino_superior` que aceitam múltiplos registros por `jovem_id`.
  - **MVP-03**: Serviço de importação com agregação de programas por `mergePayload()` e `joinDistinct()`.
  - **MVP-05**: Tabela relacional `categoria` (`src/db/migrate.ts` L72-84) que grava `categoria_adquirida`, `categoria_anterior`, `data_inclusao` e `id_usuario`.
- **Mentoria**:
  - **MVP-02**: Serviço `exportacaoService.js` integrando a biblioteca `ical-generator`.
  - **MVP-05**: Tabelas dedicadas `vinculo_mentoria` e `sessao_mentoria` (`migrate.ts` L201-221).
- **Módulos Clínicos / Psicologia**:
  - **MVP-01**: Não possui tabelas ou rotas de atendimento psicológico.
  - **MVPs 02, 03 e 04**: Tabelas `atendimentos_saude_mental` (MVP-02), `historico_psicologico` (MVP-03) e formulário `prontuario.html` (MVP-04) armazenando registros em texto claro (`TEXT`/`VARCHAR`).
  - **MVP-05**: Tabela `registro_acompanhamento` com enum `visibilidade` (`Publico_Equipe`, `Restrito_Psicologia`) e conteúdo textual em texto claro (`TEXT`).

### 5.2 Camada B — Evidências Ainda Não Verificáveis em Runtime
- **Execução Real dos Testes**: A taxa de aprovação (`passing rate`) das suítes Jest do MVP-01 (27 suítes), MVP-04 e MVP-05 (27 arquivos) é **NÃO VERIFICÁVEL** devido à ausência do pacote `node_modules` local.
- **Runtime de Testes E2E e Carga**: O funcionamento dinâmico dos cenários Playwright (`playwright.config.ts` do MVP-03) e Artillery (`artillery.yml` do MVP-02) depende de execução em ambiente ativo.
- **Desempenho de Dashboard em Carga**: A velocidade de resposta dos painéis com bancos populados por dezenas de milhares de registros é **NÃO VERIFICÁVEL** em análise estática.
- **Comportamento do Importador em Dataset Real**: A tolerância dos importadores a planilhas legadas contendo inconsistências de formatação exige teste de runtime.

### 5.3 Camada C — Requisitos Futuros / Fora do Escopo Original
- **Criptografia de Coluna em Repouso (AES-256 / Envelope Encryption)**: Cifragem para dados de saúde mental ou documentos pessoais.
- **Row Level Security (RLS) no PostgreSQL**: Políticas nativas em nível de banco de dados para isolamento de tenants e papéis.
- **APIs e Integradores Externos**: Webhooks para plataformas de ensino ou sistemas corporativos.
- **Logs Estruturados**: Bibliotecas como Pino ou Winston para exportação de métricas em formato JSON.

---

## 6. Pontos Técnicos e Funcionais Observados

### 6.1 Pontos Técnicos/Funcionais Observados
- **Substituição do Estado da Jornada por UPDATE**: Observado no **MVP-01** (coluna `estagio_jornada`) e **MVP-04** (coluna `categoria`), inviabilizando a auditoria da data de transição entre fases da jornada sem tabela relacional filha.
- **Reconciliação Incompleta do Planilhão**: Observado no **MVP-01** (descarte de linhas conflitantes), **MVP-02** (escopo restrito a presenças) e **MVP-04** (rejeição de duplicatas por constraint `UNIQUE`).

### 6.2 Pontos de Estrutura Técnica Observados
- **Localização do `package.json`**: Situado dentro da subpasta `src/` no **MVP-04** (`auditoria/mvp-4/src/package.json`) e no **MVP-05** (`auditoria/mvp-5/src/package.json`), afastando-se da convenção padrão da raiz do repositório.
- **Linguagem de Desenvolvimento**: O **MVP-02** foi desenvolvido em JavaScript puro (CommonJS) sem TypeScript.

### 6.3 Evolução Futura / Fora do Escopo Original
- Requisitos de criptografia em nível de coluna, políticas de RLS e integrações via API externa, que não constavam das especificações originais dos candidatos.

---

## 7. Artefatos e Capacidades Observadas

| Capacidade Tecnologicamente Evidenciada | MVP de Origem | Evidência Principal no Repositório | Descrição Objetiva |
|---|---|---|---|
| **Testes de Carga com Artillery** | MVP-02 | `auditoria/mvp-2/src/scripts/load-test/artillery.yml` | Arquivos YML de configuração de testes de carga HTTP. |
| **Exportação de Agendas iCal** | MVP-02 | `auditoria/mvp-2/src/services/exportacaoService.js` | Serviço de geração de arquivos `.ics` para sincronização de agendas. |
| **Testes E2E com Playwright** | MVP-03 | `auditoria/mvp-3/src/tests/e2e/playwright.config.ts` | Configuração e suítes de testes End-to-End no navegador. |
| **Execução Local Offline com `sql.js`** | MVP-03 | `auditoria/mvp-3/package.json` L8 e `connection.ts` | Suporte a execução do banco em memória SQLite compilado em WebAssembly. |
| **Algoritmo Fuzzy de Risco de Evasão** | MVP-03 | `auditoria/mvp-3/src/backend/services/riscoEvasaoService.ts` L55-116 | Função de cálculo de risco ponderando faltas, notas, ausências e engajamento. |
| **Tabela Relacional Auditada (`categoria`)** | MVP-05 | `auditoria/mvp-5/src/db/migrate.ts` L72-84 | DDL da tabela que armazena `categoria_adquirida`, `categoria_anterior` e autor. |
| **Importador CSV com Reconciliação** | MVP-05 | `auditoria/mvp-5/src/services/importService.ts` L103-125 | Trata `ConflictError` e atualiza cadastros duplicados por CPF/E-mail. |
| **Controle Patrimonial de Notebooks Doados** | MVP-05 | `auditoria/mvp-5/src/db/migrate.ts` L246 | Schema DDL da tabela `computador_doado` com datas de entrega e devolução. |

---

## 8. Síntese Factual por MVP

### 8.1 MVP-01 (PulseConnect)
- **Capacidades Observadas**: Código TypeScript em 3 camadas (Controllers, Services, Repositories), 27 suítes de testes Jest/Supertest e suporte a múltiplos papéis de acesso.
- **Estruturas Relevantes**: Mapeador de cabeçalhos por aliases flexíveis em `importacaoService.ts`.
- **Comportamentos Técnicos Observados**: A jornada é representada pela coluna estática `estagio_jornada` na tabela `aluno`, que sobrescreve o valor anterior a cada `UPDATE`.
- **Capacidades Ainda Não Verificáveis**: Execução dinâmica das suítes de teste Jest em runtime.
- **Artefatos Reutilizáveis**: Suíte de testes HTTP Supertest e rotina de aliases de cabeçalho.

### 8.2 MVP-02 (Pulsar)
- **Capacidades Observadas**: 35 migrações SQL granulares idempotentes, tabelas relacionais dedicadas para `empregabilidade` e `ensino_superior`.
- **Estruturas Relevantes**: Script de teste de carga Artillery e serviço `exportacaoService.js` para calendários iCal.
- **Comportamentos Técnicos Observados**: Código em JavaScript puro (CommonJS) e importador CSV restrito ao lançamento de frequências de aula.
- **Capacidades Ainda Não Verificáveis**: Execução dos testes de carga Artillery e suíte Jest em runtime.
- **Artefatos Reutilizáveis**: Scripts Artillery YML e gerador `.ics` iCal.

### 8.3 MVP-03 (Pulse Manager)
- **Capacidades Observadas**: Algoritmo de risco de evasão Fuzzy (4 fatores), TypeORM em TypeScript, suporte a execução local com `sql.js` (SQLite em WebAssembly).
- **Estruturas Relevantes**: Importador `mergePayload()` com `joinDistinct()` e suíte E2E com Playwright.
- **Comportamentos Técnicos Observados**: O histórico de programas é concatenado em colunas de texto em memória.
- **Capacidades Ainda Não Verificáveis**: Execução dos testes E2E Playwright e taxa de cobertura dos testes unitários.
- **Artefatos Reutilizáveis**: Algoritmo Fuzzy `riscoEvasaoService.ts`, lógica `mergePayload()` e ambiente dev `sql.js`.

### 8.4 MVP-04 (NEXUS)
- **Capacidades Observadas**: Express 5.2.1 com manipulação nativa de rotas assíncronas e interfaces HTML organizadas por perfil de usuário em `src/view/`.
- **Estruturas Relevantes**: Tabela relacional de `empregabilidade` e rotina de validação/upload de fotos em `aluno.service.ts`.
- **Comportamentos Técnicos Observados**: Categoria do aluno armazenada em coluna estática que sobrescreve fases passadas; `package.json` situado na subpasta `src/`.
- **Capacidades Ainda Não Verificáveis**: Execução dinâmica dos testes Jest e navegabilidade das visões.
- **Artefatos Reutilizáveis**: Estrutura de rotas do Express 5 e validador de imagens base64.

### 8.5 MVP-05 (Pulse Control)
- **Capacidades Observadas**: Tabela relacional `categoria` para histórico auditado da jornada, importador CSV com tratamento de duplicidades e 27 arquivos de teste Jest.
- **Estruturas Relevantes**: Modelagem para `vinculo_mentoria` e `sessao_mentoria`, controle de visibilidade em notas e rastreamento de computadores doados.
- **Comportamentos Técnicos Observados**: Arquivo `package.json` localizado dentro da subpasta `src/`.
- **Capacidades Ainda Não Verificáveis**: Execução em runtime dos 27 arquivos de teste Jest em `documentos/tests/`.
- **Artefatos Reutilizáveis**: DDL da tabela `categoria`, rotina `importService.ts` e módulo `computador_doado`.

---

## 9. Conclusão Factual

O documento consolida as evidências factuais disponíveis sobre os cinco MVPs e constitui a entrada documental para a próxima etapa de decisão. A seleção do MVP-base, seus critérios, pesos, notas e eventuais trade-offs devem ser definidos exclusivamente na **Matriz de Decisão**.

---

## 10. Autoavaliação da Qualidade Documental

| Critério de Qualidade | Avaliação Factual | Ressalvas / Observações |
|---|:---:|---|
| **Rastreabilidade Factual** | **5 / 5** | Todos os pontos são acompanhados de caminhos de arquivos e referências do código-fonte. |
| **Separação entre Fato e Opinião** | **5 / 5** | Remoção de termos avaliativos; uso estrito de classificações factuais. |
| **Cobertura dos 5 MVPs** | **5 / 5** | Todos os 5 candidatos foram detalhados nas matrizes e sínteses individuais. |
| **Clareza das Evidências** | **5 / 5** | Registrados os elementos técnicos exatos localizados nos arquivos do workspace. |
| **Identificação de Pontos Não Verificáveis** | **Ressalva Registrada** | **NÃO VERIFICADO**: A execução em runtime, taxa de aprovação dos testes Jest/Playwright e comportamento com banco em carga não puderam ser verificados devido à ausência de `node_modules` local no ambiente read-only. |
| **Ausência de Julgamento Antecipado** | **5 / 5** | Nenhuma nota, pontuação, ranking ou indicação de candidato vencedor foi produzida. |
| **Nota Geral da Documentação** | **5 / 5** | Entregável em conformidade integral com as instruções de congelamento. |
