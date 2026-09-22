# Auditoria Profunda — MVP-03 (Pulse Manager)

> **Status da Auditoria Profunda:** Concluída (Análise Factual e Estática)  
> **Diretório:** [`auditoria/mvp-3`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/mvp-3)  
> **Solução:** Pulse Manager (Grupo 03)  

---

## 1. Identificação
- **Projeto:** Pulse Manager
- **Grupo:** Grupo 03 (Inteli)
- **Repositório:** [`auditoria/mvp-3`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/mvp-3)

## 2. Resumo Executivo Factual
O MVP-03 (Pulse Manager) é desenvolvido em Node.js com TypeScript e TypeORM, possuindo suporte a múltiplos bancos de dados (PostgreSQL/Supabase e modo local com `sql.js`). Apresenta script automatizado para cálculo do indicador de risco de evasão e suíte de testes E2E com Playwright.

## 3. Documentação Encontrada
- `DOCUMENTADO`: [`README.md`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/mvp-3/README.md) na raiz.
- `DOCUMENTADO`: Pasta [`docs/`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/mvp-3/docs).

## 4. Arquitetura e Stack
- `OBSERVADO`: **Backend:** Node.js, TypeScript (`ts-node-dev`), Express (`^4.18.3`), TypeORM (`^0.3.20`).
- `OBSERVADO`: **Banco de Dados:** PostgreSQL via `pg` (`^8.11.5`) / Supabase, com suporte a `sql.js` (SQLite em memória) para `npm run dev:local`.
- `OBSERVADO`: **Testes:** Jest, Playwright (`@playwright/test` `^1.61.0`).

## 5. Estrutura do Projeto
- `OBSERVADO`: Estrutura em `src/` com subpastas `backend/` (`config`, `controllers`, `database`, `integrations`, `middlewares`, `models`, `repositories`, `routes`, `services`, `utils`), `frontend/`, `scripts/` e `tests/`.

## 6. Modelo de Dados
- `OBSERVADO`: Modelos em `src/backend/models/`: `alunoModel.ts`, `anotacaoQualitativaModel.ts`, `ApoioPsicologicoModel.ts`, `atividadeModel.ts`, `AuditoriaModel.ts`, `EmpregabilidadeModel.ts`, `EnsinoSuperiorModel.ts`, `FrequenciaModel.ts`, `jornadaModel.ts`, `ProgramaModel.ts`, `SaudeMentalModel.ts`, `VinculoProgramaModel.ts`.

## 7. Representação da Jornada
- `OBSERVADO`: `jornadaModel.ts` e `VinculoProgramaModel.ts` modelam os eventos de transição do jovem ao longo do tempo.

## 8. Funcionalidades Declaradas
- `DOCUMENTADO`: Cálculo de risco de evasão, Playwright E2E, fallback SQLite/sql.js, suporte a Supabase e integrações.

## 9. Funcionalidades Observadas
- `OBSERVADO`: Script `src/scripts/recalcular-risco-evasao.ts` implementa explicitamente a regra dos 70% de progresso ou 3 mentorias pendentes.

## 10. Funcionalidades Executadas/Validadas
- `BLOQUEADO / NÃO VERIFICADO`: Tentativa de execução local bloqueada por falta de `node_modules`.

## 11. Integração com o Planilhão
- `OBSERVADO`: Módulos de importação e integração em `src/backend/integrations/` e `src/backend/services/`.

## 12. Regras de Negócio Relevantes
- `OBSERVADO`: Algoritmo de risco em `src/scripts/recalcular-risco-evasao.ts` (Regra: progresso < 70% OU mentorias pendentes >= 3).

## 13. Indicadores
- `OBSERVADO`: `dashboardModel.ts` consolida métricas para Diretoria e Coordenação.

## 14. Segurança e LGPD
- `OBSERVADO`: Modelo `SaudeMentalModel.ts` e `ApoioPsicologicoModel.ts` mapeiam prontuários.
- `RISCO`: Exige rigor nas permissões de acesso aos dados de apoio psicológico.

## 15. Autenticação e Autorização
- `OBSERVADO`: `usuarioModel.ts` e middlewares de controle de acesso em `src/backend/middlewares/`.

## 16. Qualidade de Código
- `OBSERVADO`: TypeScript fortemente tipado com acoplamento a TypeORM.

## 17. Testes
- `OBSERVADO`: Suíte em `src/tests/` contendo testes unitários, de integração, E2E (Playwright) e teste de performance (`run-performance-tests.js`).
- `NÃO VERIFICADO`: Não executados em runtime nesta fase.

## 18. Performance
- `OBSERVADO`: Script `src/tests/run-performance-tests.js` dedicado a testes de requisito não funcional de desempenho (RNF-DES).

## 19. Implantabilidade
- `OBSERVADO`: Opção de execução com `dev:local` (sql.js) facilita desenvolvimento offline sem exigir banco PostgreSQL instalado.

## 20. Operação e Manutenção
- `OBSERVADO`: Scripts TypeScript bem definidos no `package.json` (`risco:recalcular`, `migrate`, `seed`).

## 21. Escalabilidade e Evolução
- `OBSERVADO`: TypeORM fornece padrão ORM consolidado para migrações e entidades.

## 22. Dependências Externas
- `OBSERVADO`: `@supabase/supabase-js`, Playwright, Chart.js, TypeORM, sql.js.

## 23. Custos e Infraestrutura
- `INFERÊNCIA`: Custo associado ao PostgreSQL RDS / Supabase e servidor Node.js.

## 24. Pontos Fortes
- Automação explícita da regra de risco de evasão em script TS dedicado.
- Configuração de testes E2E com Playwright.
- Execução local simplificada via `sql.js`.

## 25. Limitações
- Complexidade adicional trazida pelo suporte simultâneo a TypeORM, Supabase e sql.js.

## 26. Riscos
- `RISCO`: Risco de divergência entre comportamento em `sql.js` (desenvolvimento) e PostgreSQL (produção).

## 27. Gaps em Relação ao Contexto Pulse Mais
- Reconciliação do Planilhão precisa garantir que dados históricos em `sql.js` sejam 100% idênticos aos do Postgres.

## 28. Perguntas que Precisam ser Respondidas
- Os cenários do Playwright cobrem todas as páginas ou apenas o fluxo de autenticação?

## 29. Evidências Utilizadas
- `src/scripts/recalcular-risco-evasao.ts`
- `src/backend/models/jornadaModel.ts`
- `src/tests/e2e/playwright.config.ts`
- `package.json`

## 30. Comandos Executados e Resultados
- `npm test`: Não executado em runtime por falta de `node_modules`.

## 31. Conclusão Factual
- Status: **Auditoria Profunda Concluída (Factual estática)**. O MVP-03 apresenta automação relevante do algoritmo de risco e testes E2E Playwright.
