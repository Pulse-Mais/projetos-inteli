# Relatório Individual de Auditoria Profunda — MVP-01 (PulseConnect)

> **Status da Auditoria:** `AUDITORIA DOCUMENTAL CONCLUÍDA COM LIMITAÇÕES DE EVIDÊNCIA`  
> **Finalidade:** Apresentar a avaliação técnica, funcional, factual, de arquitetura, dados, histórico, segurança e LGPD do MVP-01, sem comparação com os demais candidatos ou atribuição de notas de ranking.

---

## 1. Identificação do MVP

- **Nome Oficial:** PulseConnect (Grupo 01)
- **Código:** MVP-01
- **Diretório Candidato (`MVP_SOURCE`):** `auditoria/mvp-1`
- **Stack Identificada:** Node.js, Express, TypeScript (`tsx`), HTML5 Vanilla, CSS3, JavaScript.
- **Linguagens:** TypeScript 5.8.0, SQL (PostgreSQL), HTML, CSS.
- **Framework Backend:** Express 4.22.2.
- **Banco de Dados:** PostgreSQL via driver nativo `pg` (8.21.0) e SDK Supabase (`@supabase/supabase-js` 2.105.4, `@supabase/ssr` 0.10.3).
- **ORM / Query Builder:** SQL puro parametrizado via `pg` Pool e Client do Supabase (sem ORM pesado tipo Prisma/TypeORM).
- **Frontend:** Server-Side Rendering com EJS (5.0.2) e HTML/JS Vanilla em `src/frontend/pages`.
- **Suíte de Testes:** Jest 29.7.0, Supertest 7.2.2, ts-jest 29.4.10.
- **Documentação Encontrada:** `auditoria/mvp-1/README.md`, `auditoria/mvp-1/documents/` (assets e documentação técnica).
- **Data da Análise:** 27 de Agosto de 2026.

---

## 2. Resumo Executivo

O MVP-01 (PulseConnect) é uma aplicação web completa desenvolvida em Node.js com TypeScript e arquitetura em 3 camadas (Controllers, Services e Repositories). O propósito aparente da solução é centralizar o acompanhamento pedagógico e institucional da Pulse Mais, integrando a gestão de alunos, turmas, mentorias, presença em aulas, vagas de emprego e portal do egresso.

A solução apresenta forte estruturação de código com tipagem TypeScript estrita e 27 arquivos de testes Jest em `auditoria/mvp-1/src/backend/tests/`. No entanto, a análise estática revelou limitações estruturais relevantes no modelo de dados: a jornada dos jovens é representada como uma coluna estática (`estagio_jornada`) na tabela de cadastro do aluno, sem uma tabela relacional de histórico acumulativo de transições ao longo do tempo. Além disso, o importador do Planilhão gera placeholders sintéticos para registros com dados ausentes e descarta registros conflitantes sem camada de reconciliação de histórico.

*Nota Factual*: Não foram atribuídas notas de mérito ou posições de ranking neste relatório.

---

## 3. Escopo e Fontes Analisadas

### 3.1 Artefatos Analisados
- **Backend:** `auditoria/mvp-1/src/backend/server.ts`, `controllers/` (24 arquivos), `services/` (18 arquivos), `repositories/` (22 arquivos), `routes/` (22 arquivos), `middlewares/` (2 arquivos), `db/migrations/migration.sql`.
- **Frontend:** `auditoria/mvp-1/src/frontend/pages/` (HTML/EJS) e assets estáticos.
- **Configurações:** `auditoria/mvp-1/package.json`, `tsconfig.json`.
- **Suítes de Teste:** `auditoria/mvp-1/src/backend/tests/` (27 arquivos Jest).
- **Relatórios Prévios:** `auditoria/relatorios/mvp-01/auditoria-profunda.md`, `auditoria/relatorios/revisao-auditoria-profunda.md`, `auditoria/relatorios/comparativo-mvps.md`.

### 3.2 Artefatos NÃO Disponíveis / Limitações de Escopo
- Pacote de dependências instaladas (`node_modules/` local ausente no repositório entregue).
- Banco de dados PostgreSQL / Supabase ativo populado para execução dinâmica de runtime.

---

## 4. Metodologia de Auditoria

A análise seguiu a regra estrita de leitora exclusiva (read-only):
1. **Hierarquia de Evidências**: Código-fonte TypeScript e SQL da migration prevaleceram sobre o `README.md` e relatórios de auditoria anteriores.
2. **Contrato de Rastreabilidade**: Todo achado relevante é acompanhado de seu caminho relativo, elemento técnico e trecho de código.
3. **Classificações Estritas**: Utilização exclusiva de `CONFIRMADO`, `PARCIALMENTE CONFIRMADO`, `NÃO CONFIRMADO`, `NÃO VERIFICÁVEL`, `CONTRADITÓRIO` e `INFERÊNCIA`.
4. **Distinção Factual**: Existência de código/testes no repositório foi rigorosamente distinguida de funcionamento em runtime.

---

## 5. Arquitetura Técnica

- **Organização de Diretórios**: `auditoria/mvp-1/src/backend` separado de forma modular em `controllers`, `services`, `repositories`, `routes`, `middlewares`, `db`, `views` e `tests`.
- **Frontend**: Páginas HTML estáticas e arquivos EJS em `src/frontend/pages/`, consumindo a API REST do backend via `fetch` nativo.
- **Backend & APIs**: Express 4.22.2 configurado com rotas modulares em `src/backend/routes/`.
- **Services e Repositories**: Padrão Repository bem implementado em TypeScript. Os repositories utilizam SQL parametrizado nativo para evitar SQL Injection (`auditoria/mvp-1/src/backend/repositories/alunoRepository.ts`).
- **Persistência**: Duplo acoplamento — utiliza o driver PostgreSQL `pg` em conjunto com a biblioteca cliente `@supabase/supabase-js`.
- **Logging e Observabilidade**: `CONTROLE NÃO EVIDENCIADO NO CÓDIGO`. Não há biblioteca de logging estruturado (ex.: Pino ou Winston); o código depende de `console.error` simples.

---

## 6. Modelo de Dados

Mapeamento do schema SQL obtido em `auditoria/mvp-1/src/backend/db/migrations/migration.sql`:

### 6.1 Principais Tabelas
- `usuario` (PK `id_usuario` SERIAL, `cpf` UNIQUE, `email` UNIQUE, `senha`, `nome`, `foto_url`).
- `aluno` (PK/FK `id_usuario` para `usuario`, `ativo`, `estagio_jornada` CHECK, `programa_ingresso`, `status_profissional`, `escolaridade`).
- `coordenador` (PK/FK `id_usuario` para `usuario`, `area`, `telefone`, `cargo`).
- `mentor` (PK/FK `id_usuario` para `usuario`, `tipo_vinculo`, `disponibilidade`, FK `id_coordenador`).
- `programa` (PK `id_programa` SERIAL, `titulo`, `inicio`, `fim`, `tipo`).
- `matricula` (PK Composta `id_programa`, `id_aluno`, `status_conclusao`, `data_ingresso`).
- `historico_profissional` (PK `id_historico` SERIAL, FK `id_aluno`, `empresa`, `cargo`, `renda`, `data_inicio`, `data_fim`).
- `oportunidade` (PK `id_oportunidade` SERIAL, `titulo`, `empresa`, `tipo`, `modalidade`, `prazo`).
- `presenca` (PK `id_presenca` SERIAL, UNIQUE `id_aluno`, `id_aula`, `status` CHECK).
- `conquista_manual` (PK `id_conquista` SERIAL, FK `id_aluno`, `titulo`, `categoria`, `arquivo_url`).

---

## 7. Os Três Pilares da Jornada

### A — Identity (Quem é o jovem?)
- **Identificador Estável**: O jovem é representado nativamente pela tabela `usuario` (chaves únicas `cpf` L14 e `email` L13) e pela extensão de perfil `aluno` (vinculada via `id_usuario` L100).
- **Risco de Duplicação**: Trava por `UNIQUE` constraint no banco.

### B — Event / Occurrence (O que aconteceu com esse jovem?)
- **Ocorrências Mapeadas**: `matricula` (vínculo a programas), `participa_evento` (eventos), `participa_mentoria` (encontros), `realiza_entrega` (atividades), `historico_profissional` (empregos) e `conquista_manual` (certificados).
- **Limitação**: Não possui tabela de registro de bolsas de estudo independentes.

### C — Current State (Qual é o estado atual do jovem?)
- **Representação**: Coluna `aluno.ativo` (BOOLEAN) e coluna `aluno.estagio_jornada` (VARCHAR com CHECK `conectado`, `capacitado`, `transformado`, `mentor`).
- **Problema de Sobrescrita**: Atualizações no estágio da jornada sobrescrevem o campo na tabela `aluno` sem gravar a data e o contexto da mudança anterior em uma tabela de transições.

---

## 8. Capacidade de Preservação da Jornada Histórica

Análise estruturada das 7 perguntas de preservação histórica:

| Dimensão | Resultado | Evidência | Classificação | Confiança | Limitação |
|---|---|---|---|---|---|
| **1. Identidade estável?** | SIM | `usuario` + `aluno` vinculados por `id_usuario` | CONFIRMADO | ALTA | Nenhuma |
| **2. Eventos explícitos?** | PARCIAL | Tabelas de `matricula`, `historico_profissional`, `presenca` | PARCIALMENTE CONFIRMADO | ALTA | Faltam eventos de bolsas de estudo |
| **3. Repetição legítima?** | PARCIAL | `historico_profissional` permite N empregos | PARCIALMENTE CONFIRMADO | ALTA | Estágio da jornada não é multiplicável |
| **4. Histórico preservado?** | NÃO | `estagio_jornada` em `aluno` é sobrescrito no `UPDATE` | CONTRADITÓRIO | ALTA | Histórico do estado anterior é perdido |
| **5. Estado atual separado?** | NÃO | Estado atual e histórico dividem a mesma tabela `aluno` | NÃO CONFIRMADO | ALTA | Sem tabela de logs de transição de estado |
| **6. Importação preserva histórico?** | PARCIAL | Parsing lido em `importacaoService.ts` L150-199 | PARCIALMENTE CONFIRMADO | ALTA | Gera placeholders e rejeita conflitos |
| **7. Risco de sobrescrita?** | ALTO | Atualizações de perfil editam diretamente a linha em `aluno` | RISCO IDENTIFICADO | ALTA | Não grava versão anterior |

---

## 9. Duplicidade x Repetição Legítima

- **Duplicidade Cadastral**: O modelo impede a criação de dois usuários com o mesmo CPF ou E-mail via constraints `uq_usuario_email` e `uq_usuario_cpf` em `migration.sql` (L13-14).
- **Repetição Legítima de Eventos**:
  - *Empregos*: A tabela `historico_profissional` aceita N linhas para o mesmo `id_aluno`, permitindo registrar trocas de emprego ao longo dos anos. (`CONFIRMADO`)
  - *Jornada/Estágio*: A mudança de "Conectado" para "Transformado" substitui a string `estagio_jornada` na tabela `aluno`, **não permitindo registrar que o jovem esteve Conectado em 2024 e se tornou Transformado em 2025**. (`CONTRADITÓRIO`)

---

## 10. Planilhão — Importação Histórica (Fase 1)

Análise da função `importarAlunos()` em `auditoria/mvp-1/src/backend/services/importacaoService.ts`:
- **Suporte a Formatos**: Lê arquivos `.csv` e `.xlsx` via `csv-parser` e `xlsx`. (L103-108)
- **Normalização de Cabeçalhos**: Mapeia colunas por aliases flexíveis em `ALIASES_POR_CAMPO` (L30-45).
- **Tratamento de Omissões**: Se uma linha da planilha não possuir Nome, E-mail ou CPF, a função `gerarPlaceholder()` (L131-138) gera dados sintéticos (`Aluno Importado X`, `importado.X@pendente.pulsemais.org.br`).
- **Tratamento de Conflitos**: Se o CPF ou E-mail da planilha já existirem no banco, o método `alunoSvc.criarAluno` lança `ConflictError`, a linha é adicionada ao array `conflitos` e descartada. **O sistema não realiza merge nem preserva o histórico de eventos de planilhas de anos diferentes para o mesmo jovem**.

---

## 11. Operação Futura (Fase 2)

- **Novos Eventos**: Durante a operação da plataforma, o coordenador pode registrar novos empregos em `historico_profissional` ou presenças em `presenca` sem apagar os anteriores. (`CONFIRMADO`)
- **Limitação de Progressão**: Ao alterar a fase do aluno no painel, a coluna `aluno.estagio_jornada` é atualizada via `UPDATE`, perdendo a data de transição original. (`RISCO IDENTIFICADO`)

---

## 12. Funcionalidades Evidenciadas

| Funcionalidade | Evidência no Código | Classificação | Confiança | Limitação |
|---|---|---|---|---|
| Autenticação de Usuários | `authController.ts`, `usuarioService.ts` | CONFIRMADO | ALTA | Não verificável em runtime |
| Gestão de Alunos (CRUD) | `alunoController.ts`, `alunoService.ts` | CONFIRMADO | ALTA | Desativação é lógica (`ativo=false`) |
| Importação CSV/XLSX | `importacaoService.ts`, `importacaoController.ts` | CONFIRMADO | ALTA | Descarta duplicados com erro |
| Histórico Profissional | `historicoProfissionalController.ts` | CONFIRMADO | ALTA | Tabela relacional dedicada |
| Gestão de Oportunidades | `oportunidadeController.ts` | CONFIRMADO | ALTA | Cadastro de vagas/bolsas |
| Registro de Frequência | `frequenciaController.ts`, `presenca` table | CONFIRMADO | ALTA | Tabela `presenca` vinculada a aulas |

---

## 13. Regras de Negócio Observáveis

1. **Idade Mínima (RN)**: `alunoService.ts` L67-69 valida se o aluno possui no mínimo 15 anos de idade no cadastro manual, lançando `BadRequestError` se inferior.
2. **Data de Ingresso (RN)**: `alunoService.ts` L77-79 impede o cadastro com data de ingresso futura.
3. **Senha Padrão (RN)**: `alunoService.ts` L89 define a senha inicial como o CPF limpo quando a senha não é informada no cadastro.
4. **Inativação Lógica (RN02)**: `alunoService.ts` L208-218 inativa o aluno (`ativo = false`) e desfaz os vínculos com programas e mentores sem excluir fisicamente o registro.

---

## 14. Segurança

- **Autenticação**: Senhas são armazenadas com hash `bcryptjs` (salt 10 em `alunoService.ts` L327). (`CONFIRMADO`)
- **Autorização**: `authMiddleware.ts` valida sessão/tokens Express. (`CONFIRMADO`)
- **Row Level Security (RLS)**: `CONTROLE NÃO EVIDENCIADO NO CÓDIGO`. As queries SQL não utilizam contexto de tenant/RLS no PostgreSQL; a segurança de isolamento é 100% dependente das checagens do Express.
- **SQL Injection**: Protegido via consultas parametrizadas com `$1, $2` no driver `pg`. (`CONTROLE EVIDENCIADO`)

---

## 15. LGPD e Dados Sensíveis

- **Tratamento de Dados Pessoais**: Armazena CPF, e-mail, telefone, endereço e data de nascimento na tabela `usuario` e `aluno`.
- **Anotações Privadas**: Tabela `anotacao_privada` armazena texto livre do mentor sobre o aluno. Textos são salvos em texto claro (`TEXT`) sem criptografia em nível de coluna no banco de dados. (`RISCO IDENTIFICADO`)
- **Direito ao Esquecimento**: O sistema oferece exclusão permanente via `alunoService.ts` L228 (`excluirAlunoPermanentemente`), que remove em cascata o perfil de aluno e a conta de `usuario`. (`CONTROLE EVIDENCIADO`)

---

## 16. Testes Automatizados

### Quadro de Status de Testes

| Tipo de Teste | Localização | Existência | Status de Execução Dinâmica | Resultado em Runtime | Limitação |
|---|---|---|---|---|---|
| Unitários / Integração | `src/backend/tests/` (27 arquivos) | CONFIRMADO | EXECUÇÃO BLOQUEADA | NÃO VERIFICÁVEL | Ausência de `node_modules` local / `cross-env`. |
| Conexão PostgreSQL | `src/tests/pg.connection.spec.ts` | CONFIRMADO | EXECUÇÃO BLOQUEADA | NÃO VERIFICÁVEL | Depende de banco dinâmico ativo. |
| Testes E2E Frontend | N/A | NÃO CONFIRMADO | EXECUÇÃO BLOQUEADA | NÃO VERIFICÁVEL | Nenhuma suíte Playwright/Cypress. |

*Nota Factual*: A presença dos 27 arquivos de teste confirma a implementação da suíte no código, porém nenhum teste foi executado em runtime nesta auditoria para preservar o repositório candidato intocado.

---

## 17. Runtime e Infraestrutura

- **Aplicação Web**: `EXECUÇÃO BLOQUEADA`. Tentativa de execução local do script `npm run dev` resulta em falha por ausência das dependências executáveis em `node_modules`.
- **Banco de Dados**: Exige instância PostgreSQL externa ou Supabase ativa configurada no arquivo `.env`.

---

## 18. Evidências Negativas e Lacunas

1. **Tabela de Histórico da Jornada**: Procurada tabela dedicada para registrar transições de estágio (`Conectado -> Capacitado -> Transformado`). **Evidência Negativa Confirmada**: Não existe tabela de log de transição; o estágio é uma string única na tabela `aluno`.
2. **Registro de Bolsas de Estudo**: Procurada tabela relacional para concessão de bolsas. **Evidência Negativa Confirmada**: Bolsas são cadastradas apenas como tipo de oportunidade geral na tabela `oportunidade`.
3. **Logs Estruturados**: Procurados módulos Winston/Pino. **Evidência Negativa Confirmada**: Inexistente.

---

## 19. Findings Críticos

### Finding MVP01-01 — Representação Estática da Jornada do Jovem
- **Classificação:** `CONTRADITÓRIO`
- **Confiança:** `ALTA`
- **Evidência**: Coluna `estagio_jornada` em `auditoria/mvp-1/src/backend/db/migrations/migration.sql` L307-309.
- **Interpretação**: O estágio da jornada do jovem é um atributo escalar único na tabela de aluno.
- **Risco**: `RISCO IDENTIFICADO`. Atualizações no estágio da jornada sobrescrevem o estado anterior, impossibilitando auditoria histórica do momento em que o jovem mudou de fase.
- **Limitação**: Análise estática não permite verificar se há salvamento externo de logs no Supabase Dashboard.
- **Rastreabilidade**:
  - Caminho relativo: `auditoria/mvp-1/src/backend/db/migrations/migration.sql`
  - Arquivo: `migration.sql`
  - Elemento técnico: `ALTER TABLE aluno ADD COLUMN estagio_jornada`
  - Linha: L307-309

### Finding MVP01-02 — Descarte de Conflitos na Carga do Planilhão
- **Classificação:** `PARCIALMENTE CONFIRMADO`
- **Confiança:** `ALTA`
- **Evidência**: Bloco `try/catch` em `auditoria/mvp-1/src/backend/services/importacaoService.ts` L200-206.
- **Interpretação**: Quando a planilha importada contém um CPF ou E-mail que já existe no banco de dados, o registro é jogado no array de `conflitos` e ignorado.
- **Risco**: `RISCO IDENTIFICADO`. Impedimento de importar múltiplos eventos históricos da mesma pessoa que constem em planilhas diferentes.
- **Limitação**: Nenhuma.
- **Rastreabilidade**:
  - Caminho relativo: `auditoria/mvp-1/src/backend/services/importacaoService.ts`
  - Arquivo: `importacaoService.ts`
  - Elemento técnico: `importarAlunos()`
  - Linha: L200-206

---

## 20. Correções da Auditoria Anterior

| Afirmação Anterior no Relatório | Evidência Real Encontrada | Classificação | Correção Aplicada | Motivo da Correção |
|---|---|---|---|---|
| "Mapeia totalmente a jornada histórica e acumulativa dos jovens." | Coluna estática `estagio_jornada` em `aluno` (`migration.sql` L307). | CONTRADITÓRIO | Ajustado para informar ausência de histórico relacional de transição. | Evitar falso positivo sobre suporte a histórico acumulativo de jornada. |
| "Possui módulo completo de importação que realiza deduplicação." | `importacaoService.ts` L200 descarta linhas com conflito de CPF/e-mail sem merge. | PARCIALMENTE CONFIRMADO | Registrado que a importação descarta registros conflitantes. | Esclarecer que trava de banco não é deduplicação/merge. |

---

## 21. Capacidades Reaproveitáveis

- **Mapeamento Flexível de Cabeçalhos em Planilhas**:
  - *Evidência*: `auditoria/mvp-1/src/backend/services/importacaoService.ts` (L30-45).
  - *Descrição*: Uso de aliases normalizados (`ALIASES_POR_CAMPO`) tolerante a acentos e pequenas variações no nome das colunas do Excel/CSV. Capacidade potencialmente reaproveitável.
- **Suíte de Testes com Supertest**:
  - *Evidência*: `auditoria/mvp-1/src/backend/tests/` (27 arquivos Jest).
  - *Descrição*: Estrutura bem organizada de testes de integração HTTP. Capacidade potencialmente reaproveitável.

---

## 22. Matriz Consolidada do MVP-01

| Dimensão | Resultado Factual | Classificação | Confiança | Evidência Principal |
|---|---|---|---|---|
| **Identidade** | Tabela `usuario` + `aluno` com CPF/E-mail `UNIQUE` | CONFIRMADO | ALTA | `migration.sql` L6-15 |
| **Eventos** | Ocorrências de presença, entregas e empregos | CONFIRMADO | ALTA | Tabelas `matricula`, `historico_profissional` |
| **Estado Atual** | Colunas estáticas no perfil do aluno | CONFIRMADO | ALTA | `aluno.estagio_jornada` L307 |
| **Histórico** | Empregos possuem histórico; Jornada NÃO possui | CONTRADITÓRIO | ALTA | Falta tabela de log de estágios |
| **Duplicidade** | Trava por `UNIQUE` constraint no banco | CONFIRMADO | ALTA | `uq_usuario_cpf` em `migration.sql` |
| **Importação** | Lê CSV/XLSX, cria placeholders, descarta conflitos | PARCIALMENTE CONFIRMADO | ALTA | `importacaoService.ts` L150-209 |
| **Operação Futura** | Suporta novos empregos; Sobrescreve estágio | PARCIALMENTE CONFIRMADO | ALTA | `alunoService.ts` L174-198 |
| **Segurança** | Hashing bcrypt e rotas autenticadas Express | CONFIRMADO | ALTA | `alunoService.ts` L327 |
| **LGPD** | Anotações privadas em texto claro sem RLS | RISCO IDENTIFICADO | ALTA | `anotacao_privada` em `migration.sql` L134 |
| **Testes** | 27 arquivos Jest estruturados | CONFIRMADO | ALTA | Diretório `src/backend/tests/` |
| **Runtime** | Execução bloqueada por ausência de `node_modules` | EXECUÇÃO BLOQUEADA | ALTA | Falha no `npm run dev` |
| **Arquitetura** | MVC limpo em 3 camadas com TypeScript | CONFIRMADO | ALTA | Estrutura de subpastas em `src/backend/` |
| **Dados** | Schema SQL relacional PostgreSQL | CONFIRMADO | ALTA | `migration.sql` |

---

## 23. Limitações da Auditoria

1. **Ambiente em Runtime Não Executado**: Não foi possível rodar a aplicação dinamicamente por falta de dependências e banco de dados populado.
2. **Serviço Supabase Não Validado**: As integrações com o SDK do Supabase não puderam ser testadas contra um projeto ativo.

---

## 24. Conclusão Factual

1. **Comprovadamente Implementado**: Estrutura MVC em TypeScript, schema relacional PostgreSQL com constraints, CRUD de alunos, histórico profissional relacional, importador de CSV/XLSX com aliases e suíte Jest com 27 arquivos.
2. **Parcialmente Implementado**: Importação do Planilhão (descarta conflitos sem reconciliação de histórico).
3. **Não Confirmado / Contraditório**: Preservação do histórico acumulativo de estágios da jornada do jovem (sobrescrito no `UPDATE`).
4. **Principais Riscos**: Perda de histórico de transição da jornada e armazenamento de anotações privadas sem criptografia.

---

## 25. Status da Auditoria

`AUDITORIA DOCUMENTAL CONCLUÍDA COM LIMITAÇÕES DE EVIDÊNCIA`

---

## 26. Checklist Final

- [x] O diretório candidato `auditoria/mvp-1` não foi alterado.
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
Todas as análises contidas neste relatório baseiam-se exclusivamente nos artefatos localizados em `auditoria/mvp-1`. Onde a evidência esteve ausente, a limitação foi explicitada como `NÃO VERIFICÁVEL` ou `NÃO CONFIRMADO`.

---

## 28. Regra de Escopo
Esta execução produziu unicamente o relatório individual `auditoria/relatorios/mvp-01/auditoria-individual.md`. Nenhuma alteração foi realizada na base de código ou em outros MVPs.

---

## 29. Preparação para PDF Futuro
O documento foi formatado com estrutura hierárquica clara, tabelas padronizadas e caminhos relativos de arquivo, dispensando URIs locais `file:///` e viabilizando a conversão em PDF sem modificações de texto.

---

## 30. Entrega Final ao Orquestrador

### Arquivo Produzido
`auditoria/relatorios/mvp-01/auditoria-individual.md`

### Status da Auditoria
`AUDITORIA DOCUMENTAL CONCLUÍDA COM LIMITAÇÕES DE EVIDÊNCIA`

### Resumo Factual
- **Principais Evidências**: Código TypeScript estruturado em MVC com 27 suítes de teste Jest e suporte a múltiplos perfis.
- **Contradição Corrigida**: A jornada não possui histórico acumulativo relacional; é representada por uma coluna estática que sobrescreve estados anteriores.
- **Principais Riscos**: Perda de histórico de transição de fase e falta de criptografia em anotações privadas.
- **Capacidades Reaproveitáveis**: Mapeador de cabeçalhos por aliases flexíveis em `importacaoService.ts` e suíte de testes HTTP Supertest.

### Integridade do Workspace
> "Não foram identificadas alterações realizadas durante esta execução no diretório `auditoria/mvp-1`, conforme verificação do workspace."


