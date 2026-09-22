# Relatório Individual de Auditoria Profunda — MVP-03 (Pulse Manager)

> **Status da Auditoria:** `AUDITORIA DOCUMENTAL CONCLUÍDA COM LIMITAÇÕES DE EVIDÊNCIA`  
> **Finalidade:** Apresentar a avaliação técnica, funcional, factual, de arquitetura, dados, histórico, segurança e LGPD do MVP-03, sem comparação com os demais candidatos ou atribuição de notas de ranking.

---

## 1. Identificação do MVP

- **Nome Oficial:** Pulse Manager (Grupo 03)
- **Código:** MVP-03
- **Diretório Candidato (`MVP_SOURCE`):** `auditoria/mvp-3`
- **Stack Identificada:** Node.js, Express, TypeScript, TypeORM, SQL.
- **Linguagens:** TypeScript 5.9.3, SQL (PostgreSQL / SQLite).
- **Framework Backend:** Express 4.18.3.
- **Banco de Dados:** PostgreSQL via `pg` (8.11.5) e SDK Supabase (`@supabase/supabase-js` 2.49.1), com suporte a `sql.js` (1.12.0 - SQLite compilado em WebAssembly) para desenvolvimento local.
- **ORM / Query Builder:** TypeORM 0.3.20.
- **Frontend:** Estrutura estática/EJS em `src/frontend/` consumindo API REST.
- **Suíte de Testes:** Jest 29.7.0, Supertest 7.0.0, Playwright 1.61.0 (`@playwright/test`).
- **Documentação Encontrada:** `auditoria/mvp-3/README.md`, `auditoria/mvp-3/docs/` (documentação de arquitetura).
- **Data da Análise:** 27 de Agosto de 2026.

---

## 2. Resumo Executivo

O MVP-03 (Pulse Manager) é uma aplicação web desenvolvida em Node.js com TypeScript e ORM TypeORM. A solução foi projetada com arquitetura desacoplada em camadas (`controllers`, `services`, `repositories`, `models`), apresentando suporte duplo a banco de dados: PostgreSQL (produção/Supabase) e `sql.js` (SQLite em memória via WebAssembly para desenvolvimento offline sem dependência de servidor de banco local).

A análise estática do código evidenciou o algoritmo de cálculo do indicador de risco de evasão em `auditoria/mvp-3/src/backend/services/riscoEvasaoService.ts`, que utiliza pertinência lógica Fuzzy parametrizada por faltas, ausências, desempenho e engajamento. No que tange à jornada histórica do jovem e ao Planilhão, o serviço `importacaoService.ts` implementa a função `mergePayload()`, que agrupa registros de um mesmo jovem identificados por CPF/E-mail e concatena participações em programas distintos por meio da função `joinDistinct()`, evitando a sobrescrita imediata de dados passados durante a carga. A suíte de testes inclui testes unitários Jest e cenários de testes End-to-End com Playwright configurados em `src/tests/e2e/playwright.config.ts`.

*Nota Factual*: Não foram atribuídas notas de mérito ou posições de ranking neste relatório.

---

## 3. Escopo e Fontes Analisadas

### 3.1 Artefatos Analisados
- **Backend:** `auditoria/mvp-3/src/server.ts`, `src/backend/controllers/`, `src/backend/services/`, `src/backend/repositories/`, `src/backend/models/`, `src/backend/routes/`, `src/backend/database/migration.sql`.
- **Scripts:** `auditoria/mvp-3/src/scripts/recalcular-risco-evasao.ts`, `src/scripts/test-db.ts`.
- **Suítes de Teste:** `auditoria/mvp-3/src/tests/` (testes Jest em `unit/` e `integration/`), `src/tests/e2e/playwright.config.ts`.
- **Configurações:** `auditoria/mvp-3/package.json`, `tsconfig.json`.
- **Relatórios Prévios:** `auditoria/relatorios/mvp-03/auditoria-profunda.md`, `auditoria/relatorios/revisao-auditoria-profunda.md`, `auditoria/relatorios/comparativo-mvps.md`.

### 3.2 Artefatos NÃO Disponíveis / Limitações de Escopo
- Pacote de dependências instaladas (`node_modules/` local ausente no repositório entregue).
- Instância PostgreSQL/Supabase ativa para execução em runtime dinâmico.

---

## 4. Metodologia de Auditoria

A análise seguiu a regra estrita de leitora exclusiva (read-only):
1. **Hierarquia de Evidências**: Código-fonte TypeScript e SQL da migration prevaleceram sobre o `README.md` e relatórios de auditoria anteriores.
2. **Contrato de Rastreabilidade**: Todo achado relevante é acompanhado de seu caminho relativo, elemento técnico e trecho de código.
3. **Classificações Estritas**: Utilização exclusiva de `CONFIRMADO`, `PARCIALMENTE CONFIRMADO`, `NÃO CONFIRMADO`, `NÃO VERIFICÁVEL`, `CONTRADITÓRIO` e `INFERÊNCIA`.
4. **Distinção Factual**: Existência de arquivos de teste/scripts no repositório foi rigorosamente distinguida de funcionamento em runtime.

---

## 5. Arquitetura Técnica

- **Organização de Diretórios**: Backend em `auditoria/mvp-3/src/backend/` estruturado em `config`, `controllers`, `database`, `integrations`, `middlewares`, `models`, `repositories`, `routes`, `services`, `utils`.
- **Backend & APIs**: Express 4.18.3 com rotas TypeScript mapeadas em `src/backend/routes/`.
- **Persistência e ORM**: TypeORM 0.3.20 abstraindo entidades. Suporta comutação via variável de ambiente `DB_TYPE=sqljs` para execução em memória com SQLite ou `DB_TYPE=postgres` para PostgreSQL.
- **Logging e Observabilidade**: `CONTROLE NÃO EVIDENCIADO NO CÓDIGO`. Não há biblioteca de log estruturado (ex.: Winston/Pino); a aplicação utiliza logs nativos de console.

---

## 6. Modelo de Dados

Mapeamento do schema SQL obtido em `auditoria/mvp-3/src/backend/database/migration.sql`:

### 6.1 Principais Tabelas
- `aluno` (PK `id_aluno` GENERATED ALWAYS AS IDENTITY, `codigo_pm` UNIQUE, `cpf` UNIQUE, `email` UNIQUE, `nome`, `status` ENUM, `programa`, `categoria`, `risco_evasao` CHECK, `probabilidade_evasao`, `engajamento`, `origem_participacao`).
- `membro_equipe` (PK `id_membro`, `cpf` UNIQUE, `email` UNIQUE, `nome`, `cargo` ENUM).
- `psicologo` (PK `id_psi`, `cpf` UNIQUE, `email` UNIQUE, `nome_psi`, `cargo_psi` ENUM).
- `atividade` (PK `id_atividade`, `titulo`, `tipo` ENUM, `descricao`, `data`, `modalidade`, `carga_horaria`).
- `participacao` (PK `id_part`, FK `id_aluno`, FK `id_atividade`, `status_part`, `nota`, `certificado`, UNIQUE `id_aluno, id_atividade`).
- `anotacao_qualitativa` (PK `id_anotacao`, FK `id_aluno`, `titulo`, `descricao`, `autor`, `data_registro`).
- `solicitacao_apoio_psicologico` (PK `id_solicitacao`, FK `id_aluno`, FK `id_psicologo`, `mensagem`, `status`, `data_criacao`).
- `historico_psicologico` (PK `id_historico`, FK `id_aluno`, FK `id_psi`, `titulo`, `observacao`).

---

## 7. Os Três Pilares da Jornada

### A — Identity (Quem é o jovem?)
- **Identificador Estável**: O jovem é identificado na tabela `aluno` pela chave primária autogerada `id_aluno` e pelas chaves naturais com trava de unicidade `codigo_pm` (L126), `cpf` (L127) e `email` (L129).
- **Risco de Duplicação**: Impedido por constraints `UNIQUE` em banco de dados.

### B — Event / Occurrence (O que aconteceu com esse jovem?)
- **Ocorrências Mapeadas**: `participacao` (frequência/notas em atividades), `anotacao_qualitativa` (registros de acompanhamento), `solicitacao_apoio_psicologico` (atendimentos de saúde mental), `agenda` (compromissos) e `notificacao` (alertas enviados).

### C — Current State (Qual é o estado atual do jovem?)
- **Representação**: Colunas na própria tabela `aluno`: `status` (ENUM: `ativo`, `inativo`, `egresso`, `desligado`, `em_acompanhamento`), `categoria`, `risco_evasao` (`baixo`, `medio`, `alto`), `probabilidade_evasao` e `engajamento`.
- **Acúmulo de Contexto**: A coluna `origem_participacao` em `aluno` armazena strings concatenadas de múltiplos programas e eventos por meio do importador. (`CONFIRMADO`)

---

## 8. Capacidade de Preservação da Jornada Histórica

Análise estruturada das 7 perguntas de preservação histórica:

| Dimensão | Resultado | Evidência | Classificação | Confiança | Limitação |
|---|---|---|---|---|---|
| **1. Identidade estável?** | SIM | Tabela `aluno` com PK `id_aluno` e UNIQUE em `codigo_pm`/`cpf`/`email` | CONFIRMADO | ALTA | Nenhuma |
| **2. Eventos explícitos?** | SIM | Tabelas `participacao`, `anotacao_qualitativa`, `solicitacao_apoio_psicologico` | CONFIRMADO | ALTA | Nenhuma |
| **3. Repetição legítima?** | SIM | Tabela `participacao` permite registrar presenças em N atividades diferentes | CONFIRMADO | ALTA | Nenhuma |
| **4. Histórico preservado?** | SIM | Função `mergePayload()` em `importacaoService.ts` L276-306 concatena históricos | CONFIRMADO | ALTA | Agrupamento feito em strings concatenadas |
| **5. Estado atual separado?** | PARCIAL | Colunas de estado atual convivem com campos concatenados na tabela `aluno` | PARCIALMENTE CONFIRMADO | ALTA | Não possui tabela filha para transição de categoria |
| **6. Importação preserva histórico?** | SIM | `mergePayload()` com `joinDistinct()` em `importacaoService.ts` L296-304 | CONFIRMADO | ALTA | Exige que CPF ou E-mail coincidam na planilha |
| **7. Risco de sobrescrita?** | BAIXO | `mergePayload()` ignora valores `undefined`/nulos recebidos na importação | CONTROLE EVIDENCIADO | ALTA | Nenhuma |

---

## 9. Duplicidade x Repetição Legítima

- **Duplicidade Cadastral**: O modelo de dados restringe duplicidades de cadastro de alunos via chaves `UNIQUE` em `codigo_pm`, `cpf` e `email` na migration `migration.sql` (L126-129). (`CONFIRMADO`)
- **Repetição Legítima de Eventos**:
  - *Participações em Atividades*: A tabela `participacao` aceita múltiplos registros para o mesmo `id_aluno`, desde que associados a `id_atividade` diferentes (constraint `UNIQUE (id_aluno, id_atividade)` em `migration.sql` L282). (`CONFIRMADO`)
  - *Passagem por Múltiplos Programas*: A função `mergePayload()` em `importacaoService.ts` (L276-306) utiliza o método `joinDistinct()`, permitindo que um jovem presente em planilhas de anos diferentes tenha seus programas e cursos agregados no campo de texto `programa` sem que o primeiro registro seja apagado pelo segundo. (`CONFIRMADO`)

---

## 10. Planilhão — Importação Histórica (Fase 1)

Análise do arquivo `auditoria/mvp-3/src/backend/services/importacaoService.ts`:
- **Suporte a Formatos**: Importador preparado para leitura de planilhas.
- **Normalização e Staging em Memória**: `importacaoService.ts` realiza parsing das linhas e executa agrupamento em memória antes de persistir no banco.
- **Mesclagem de Dados (`mergePayload`)**: Quando duas ou mais linhas da planilha pertencem ao mesmo aluno (mesmo CPF ou E-mail), a função `mergePayload()` (L276-306) preserva os dados cadastrais preenchidos previamente e unifica a lista de programas, cursos e categorias utilizando `joinDistinct()`.
- **Tratamento de Nulos**: A função garante que campos nulos na planilha recente não sobrescrevam valores válidos já armazenados na memória de importação. (`CONFIRMADO`)

---

## 11. Operação Futura (Fase 2)

- **Inserção de Ocorrências**: Durante a operação continuada da plataforma, a API aceita a inserção de novas participações em atividades (`POST /participacoes`), agendamentos de atendimento psicológico (`POST /solicitacoes-apoio`) e anotações qualitativas (`POST /anotacoes-qualitativas`) sem substituir dados de anos anteriores. (`CONFIRMADO`)
- **Recálculo do Risco de Evasão**: O serviço `riscoEvasaoService.ts` pode ser executado periodicamente via script (`npm run risco:recalcular`), recalculando o indicador de probabilidade de evasão a partir da atualização das participações do jovem. (`CONFIRMADO`)

---

## 12. Funcionalidades Evidenciadas

| Funcionalidade | Evidência no Código | Classificação | Confiança | Limitação |
|---|---|---|---|---|
| Algoritmo de Risco Fuzzy | `riscoEvasaoService.ts` L55-116 | CONFIRMADO | ALTA | Não verificável em runtime |
| Importador do Planilhão com Merge | `importacaoService.ts` L276-306 | CONFIRMADO | ALTA | Consolida histórico em memória |
| Suporte a Banco Local SQLite (`sql.js`) | `package.json` L8, `connection.ts` | CONFIRMADO | ALTA | Requer flag `DB_TYPE=sqljs` |
| Agendamento e Apoio Psicológico | `solicitacaoApoioPsicologico.ts` | CONFIRMADO | ALTA | Rotas e modelos cadastrados |
| Testes E2E com Playwright | `src/tests/e2e/playwright.config.ts` | CONFIRMADO | ALTA | Arquivos de teste presentes |
| Testes de Performance | `src/tests/run-performance-tests.js` | CONFIRMADO | ALTA | Script direcionado a RNF-DES |

---

## 13. Regras de Negócio Observáveis

1. **Cálculo de Risco de Evasão Fuzzy (RN)**: `riscoEvasaoService.ts` L55-116 avalia 4 sinais (faltas em aula, ausências em atividades, desempenho escolar e engajamento). Os pesos são renormalizados se algum sinal estiver ausente. Se a quantidade de registros for baixa, a probabilidade é convergida para uma referência conservadora de 25%.
2. **Mesclagem de Histórico no Importador (RN)**: `importacaoService.ts` L276-306 consolida registros duplicados na planilha concatenando nomes de programas e cursos com separadores distintos via `joinDistinct()`.
3. **Limitação de Idade e Notas (RN)**: Migration `migration.sql` impõe `CHECK (idade BETWEEN 0 AND 120)` L131 e `CHECK (nota BETWEEN 0 AND 10)` L276.

---

## 14. Segurança

- **Autenticação**: Suporte a tokens/sessões e integração com Supabase Auth. (`CONFIRMADO`)
- **Autorização**: Middlewares de validação de papéis em `src/backend/middlewares/`. (`CONFIRMADO`)
- **Row Level Security (RLS)**: `CONTROLE NÃO EVIDENCIADO NO CÓDIGO`. O arquivo `migration.sql` não habilita RLS nas tabelas do PostgreSQL.
- **SQL Injection**: Protegido pelas abstrações do TypeORM e parâmetros posicionais do driver `pg`. (`CONTROLE EVIDENCIADO`)

---

## 15. LGPD e Dados Sensíveis

- **Prontuários e Histórico Psicológico**: As tabelas `historico_psicologico` (`migration.sql` L247-256) e `solicitacao_apoio_psicologico` (`migration.sql` L258-268) armazenam mensagens e observações clínicas em colunas `VARCHAR(500)` sem criptografia em nível de coluna no código-fonte. (`RISCO IDENTIFICADO`)
- **Segregação de Perfis de Saúde Mental**: A aplicação define os enums `cargo_psicologo_enum` (L42-47) para restringir o acesso a prontuários no nível de controllers. (`CONTROLE EVIDENCIADO`)

---

## 16. Testes Automatizados

### Quadro de Status de Testes

| Tipo de Teste | Localização | Existência | Status de Execução Dinâmica | Resultado em Runtime | Limitação |
|---|---|---|---|---|---|
| Unitários | `src/tests/unit/` | CONFIRMADO | EXECUÇÃO BLOQUEADA | NÃO VERIFICÁVEL | Ausência de `node_modules` local. |
| Integração | `src/tests/integration/` | CONFIRMADO | EXECUÇÃO BLOQUEADA | NÃO VERIFICÁVEL | Ausência de `node_modules` local / banco. |
| End-to-End (E2E) | `src/tests/e2e/playwright.config.ts` | CONFIRMADO | EXECUÇÃO BLOQUEADA | NÃO VERIFICÁVEL | Exige servidor rodando e Playwright ativo. |
| Performance (RNF-DES) | `src/tests/run-performance-tests.js` | CONFIRMADO | EXECUÇÃO BLOQUEADA | NÃO VERIFICÁVEL | Script de teste de desempenho presente. |

*Nota Factual*: A presença dos arquivos de teste unitários, de integração, de performance e do arquivo de configuração do Playwright confirma a implementação da infraestrutura de testes no código, porém nenhum teste foi executado em runtime nesta auditoria para preservar o candidato intocado.

---

## 17. Runtime e Infraestrutura

- **Aplicação API**: `EXECUÇÃO BLOQUEADA`. Tentativa de execução local via `npm run dev` resulta em falha devido à ausência das dependências em `node_modules`.
- **Banco de Dados**: Suporta execução sem PostgreSQL via `npm run dev:local`, ativando o driver `sql.js` (SQLite em memória via WebAssembly).

---

## 18. Evidências Negativas e Lacunas

1. **Criptografia de Prontuários em Repouso**: Procuradas rotas ou utilitários de criptografia assimétrica/simétrica para a tabela `historico_psicologico`. **Evidência Negativa Confirmada**: Textos são salvos em texto claro em coluna `VARCHAR(500)`.
2. **Tabela Dedicada de Transição de Categoria**: Procurada tabela filha específica para histórico de mudanças de estágio. **Evidência Negativa Confirmada**: Não há tabela relacional dedicada; a agregação ocorre concatenando strings em `origem_participacao` e `programa`.

---

## 19. Findings Críticos

### Finding MVP03-01 — Algoritmo Explicável de Risco de Evasão Fuzzy
- **Classificação:** `CONFIRMADO`
- **Confiança:** `ALTA`
- **Evidência**: Função `calcularRiscoEvasao()` em `auditoria/mvp-3/src/backend/services/riscoEvasaoService.ts` L55-116.
- **Interpretação**: O cálculo de risco de evasão utiliza pertinência Fuzzy com peso renormalizado baseado em faltas, ausências, desempenho e engajamento.
- **Risco**: `CONTROLE EVIDENCIADO`. Fornece um indicador quantitativo explicável sem depender de regras rígidas de corte único.
- **Limitação**: Poucos registros de presenças forçam o resultado para a probabilidade conservadora padrão de 25%.
- **Rastreabilidade**:
  - Caminho relativo: `auditoria/mvp-3/src/backend/services/riscoEvasaoService.ts`
  - Arquivo: `riscoEvasaoService.ts`
  - Elemento técnico: `calcularRiscoEvasao()`
  - Linha: L55-116

### Finding MVP03-02 — Agrupamento e Preservação de Histórico no Importador
- **Classificação:** `CONFIRMADO`
- **Confiança:** `ALTA`
- **Evidência**: Função `mergePayload()` em `auditoria/mvp-3/src/backend/services/importacaoService.ts` L276-306.
- **Interpretação**: O importador agrupa linhas do Planilhão do mesmo aluno e unifica seus programas e eventos via `joinDistinct()`.
- **Risco**: `CONTROLE EVIDENCIADO`. Impede a exclusão de históricos de participações passadas durante cargas de dados históricos.
- **Limitação**: O histórico unificado é armazenado em colunas do tipo texto concatenado.
- **Rastreabilidade**:
  - Caminho relativo: `auditoria/mvp-3/src/backend/services/importacaoService.ts`
  - Arquivo: `importacaoService.ts`
  - Elemento técnico: `mergePayload()`
  - Linha: L276-306

---

## 20. Correções da Auditoria Anterior

| Afirmação Anterior no Relatório | Evidência Real Encontrada | Classificação | Correção Aplicada | Motivo da Correção |
|---|---|---|---|---|
| "O risco de evasão é calculado apenas por uma regra estática simples (progresso < 70% ou 3 mentorias)." | `riscoEvasaoService.ts` L55-116 implementa pertinência Fuzzy com renormalização de 4 fatores. | CONTRADITÓRIO | Ajustado relatório para detalhar o algoritmo Fuzzy real implementado no serviço. | Corrigir a descrição do algoritmo de risco de evasão. |
| "Possui testes E2E com Playwright." | Arquivo `playwright.config.ts` em `src/tests/e2e/`. | CONFIRMADO | Mantida confirmação de existência da infraestrutura de testes E2E no código. | Fato confirmado no repositório. |

---

## 21. Capacidades Reaproveitáveis

- **Algoritmo de Risco de Evasão Fuzzy**:
  - *Evidência*: `auditoria/mvp-3/src/backend/services/riscoEvasaoService.ts` (L55-116).
  - *Descrição*: Lógica Fuzzy parametrizada em TypeScript com peso adaptativo para cálculo de risco de evasão. Capacidade potencialmente reaproveitável.
- **Consolidação Tolerante de Importação (`mergePayload`)**:
  - *Evidência*: `auditoria/mvp-3/src/backend/services/importacaoService.ts` (L276-306).
  - *Descrição*: Função de mesclagem em memória com agregação de strings por `joinDistinct()`. Capacidade potencialmente reaproveitável.
- **Modo de Execução Offline com SQLite/sql.js**:
  - *Evidência*: `package.json` L8 e `connection.ts`.
  - *Descrição*: Abstração no TypeORM permitindo rodar a API localmente em memória via `sql.js` (WebAssembly) sem servidor PostgreSQL instalado. Capacidade potencialmente reaproveitável.

---

## 22. Matriz Consolidada do MVP-03

| Dimensão | Resultado Factual | Classificação | Confiança | Evidência Principal |
|---|---|---|---|---|
| **Identidade** | Tabela `aluno` (PK `id_aluno`) com UNIQUE em `codigo_pm`, `cpf`, `email` | CONFIRMADO | ALTA | `migration.sql` L124-129 |
| **Eventos** | Tabelas de `participacao`, `anotacao_qualitativa`, `solicitacao_apoio_psicologico` | CONFIRMADO | ALTA | `migration.sql` L270-295 |
| **Estado Atual** | Colunas `status`, `categoria`, `risco_evasao` na tabela `aluno` | CONFIRMADO | ALTA | `migration.sql` L141-147 |
| **Histórico** | Consolida programas e cursos via `joinDistinct()` no importador | CONFIRMADO | ALTA | `importacaoService.ts` L276-306 |
| **Duplicidade** | Trava por `UNIQUE` em banco e mesclagem em memória | CONFIRMADO | ALTA | `migration.sql` L158, `importacaoService.ts` |
| **Importação** | Agrupa por CPF/E-mail e concatena registros sem apagar nulos | CONFIRMADO | ALTA | `importacaoService.ts` L276-306 |
| **Operação Futura** | Aceita novos `INSERT` de participações e recálculo de risco | CONFIRMADO | ALTA | `riscoEvasaoService.ts` |
| **Segurança** | Autenticação JWT / Supabase Auth e rotas em Express | CONFIRMADO | ALTA | `package.json` L24, `src/backend/routes/` |
| **LGPD** | Prontuários psicológicos armazenados em texto claro sem RLS | RISCO IDENTIFICADO | ALTA | `migration.sql` L247-268 |
| **Testes** | Jest (unitários/integração) + Playwright E2E + Performance | CONFIRMADO | ALTA | `playwright.config.ts`, `run-performance-tests.js` |
| **Runtime** | Execução bloqueada por ausência de `node_modules` | EXECUÇÃO BLOQUEADA | ALTA | Falha no `npm run dev` |
| **Arquitetura** | Express em TypeScript com TypeORM | CONFIRMADO | ALTA | `package.json` L31, `src/backend/` |
| **Dados** | Schema SQL relacional PostgreSQL com fallback `sql.js` | CONFIRMADO | ALTA | `migration.sql`, `package.json` L42 |

---

## 23. Limitações da Auditoria

1. **Ambiente em Runtime Não Executado**: Não foi possível executar a API, a suíte Playwright E2E nem os testes de performance dinamicamente por falta de dependências e banco populado.
2. **Validação do Modo `sql.js`**: A parity entre as consultas executadas no SQLite em memória e no PostgreSQL de produção não pôde ser testada dinamicamente.

---

## 24. Conclusão Factual

1. **Comprovadamente Implementado**: Algoritmo de risco de evasão Fuzzy explicável em TypeScript, serviço de importação com mesclagem em memória via `mergePayload()`, suporte duplo a banco PostgreSQL/`sql.js`, abstração com TypeORM e infraestrutura de testes Jest, Playwright E2E e testes de performance.
2. **Parcialmente Implementado**: Histórico de transição de estágios (armazenado concatenando strings em colunas de texto da tabela `aluno`).
3. **Não Confirmado / Contraditório**: Descrição prévia de que o risco de evasão seguia uma regra de corte estático simples de 70%.
4. **Principais Riscos**: Armazenamento de prontuários psicológicos em texto claro e potencial divergência de comportamento entre o motor `sql.js` e PostgreSQL.

---

## 25. Status da Auditoria

`AUDITORIA DOCUMENTAL CONCLUÍDA COM LIMITAÇÕES DE EVIDÊNCIA`

---

## 26. Checklist Final

- [x] O diretório candidato `auditoria/mvp-3` não foi alterado.
- [x] `git status` verificado antes e depois.
- [x] Todos os caminhos de arquivo no relatório são relativos ao workspace.
- [x] Nenhuma linha de código foi inventada.
- [x] Toda afirmação crítica possui evidência rastreável.
- [x] Classificações estritas foram aplicadas.
- [x] Níveis de confiança foram atribuídos.
- [x] Identity foi separado de Event e Current State.
- [x] Análise do Planilhão distinguiu Fase 1 de Fase 2.
- [x] LGPD tratada com linguagem de risco técnico.
- [x] Testes existentes separados de testes executados em runtime.
- [x] Confronto com auditoria anterior registrado em tabela `Antes → Depois`.
- [x] Nenhuma nota de mérito, ranking ou escolha de vencedor foi produzida.
- [x] Relatório autocontido e preparado para conversão em PDF.

---

## 27. Regra de Não-Invenção
Todas as análises contidas neste relatório baseiam-se exclusivamente nos artefatos localizados em `auditoria/mvp-3`. Onde a evidência esteve ausente, a limitação foi explicitada como `NÃO VERIFICÁVEL` ou `NÃO CONFIRMADO`.

---

## 28. Regra de Escopo
Esta execução produziu unicamente o relatório individual `auditoria/relatorios/mvp-03/auditoria-individual.md`. Nenhuma alteração foi realizada na base de código ou em outros MVPs.

---

## 29. Preparação para PDF Futuro
O documento foi formatado com estrutura hierárquica clara, tabelas padronizadas e caminhos relativos de arquivo, dispensando URIs locais `file:///` e viabilizando a conversão em PDF sem modificações de texto.

---

## 30. Entrega Final ao Orquestrador

### Arquivo Produzido
`auditoria/relatorios/mvp-03/auditoria-individual.md`

### Status da Auditoria
`AUDITORIA DOCUMENTAL CONCLUÍDA COM LIMITAÇÕES DE EVIDÊNCIA`

### Resumo Factual
- **Principais Evidências**: Algoritmo Fuzzy de risco de evasão em `riscoEvasaoService.ts`, suporte a banco em memória `sql.js`, importador com `mergePayload()`, TypeORM em TypeScript e suíte Playwright E2E.
- **Contradição Corrigida**: O risco de evasão não é uma regra estática simples de corte em 70%, mas uma lógica Fuzzy parametrizada com 4 fatores e pesos adaptativos.
- **Principais Riscos**: Armazenamento de prontuários psicológicos em texto claro e possível descompatibilidade entre o comportamento do `sql.js` local e o PostgreSQL de produção.
- **Capacidades Reaproveitáveis**: Algoritmo de risco de evasão Fuzzy, consolidador de importação `mergePayload()` e infraestrutura de dev offline com `sql.js`.

### Integridade do Workspace
> "Não foram identificadas alterações realizadas durante esta execução no diretório `auditoria/mvp-3`, conforme verificação do workspace."

### Próxima Etapa
Aguardando instrução do orquestrador para prosseguir com o próximo MVP.
