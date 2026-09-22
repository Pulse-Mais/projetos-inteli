# Inventário Inicial — MVP-03 (Pulse Manager)

> **Status:** Inventário Concluído (Factual)  
> **Diretório:** [`auditoria/mvp-3`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/mvp-3)  
> **Nome do Projeto:** Pulse Manager (Grupo 03)  

---

## 1. Identificação e Visão Geral

- **Nome da Solução:** Pulse Manager
- **Equipe / Grupo:** Grupo 03
- **Integrantes:** Ana Luiza Lima de Carvalho, Felipe Sodré Pessôa, Gabrieli Marques Battini, José Isaias Menezes Santos, Nicolas Rigolin Carrascossa, Raffael Cabral Bensoussan, Vitor Medrado Lisboa.
- **Documentação Principal Encontrada:**
  - [`README.md`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/mvp-3/README.md) na raiz do projeto.
  - Pasta [`docs/`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/mvp-3/docs) contendo documentos e imagens.

---

## 2. Estrutura de Arquivos e Diretórios

A estrutura observada no diretório [`auditoria/mvp-3`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/mvp-3) é:

```text
auditoria/mvp-3/
├── .env.example
├── .gitignore
├── jest.config.ts
├── package.json
├── README.md
├── tsconfig.json
├── docs/
└── src/
    ├── server.ts
    ├── backend/
    │   ├── database/ (migrate.ts, seed.ts)
    │   ├── controllers/
    │   ├── entities/
    │   ├── repositories/
    │   └── services/
    ├── frontend/
    ├── scripts/
    │   ├── test-db.ts
    │   └── recalcular-risco-evasao.ts
    └── tests/
        ├── unit/
        ├── integration/
        ├── e2e/ (playwright.config.ts)
        └── run-performance-tests.js
```

---

## 3. Stack Tecnológica e Dependências

Observado em [`package.json`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/mvp-3/package.json):

- **Backend:** Node.js, TypeScript (`ts-node-dev`), Express (`^4.18.3`), TypeORM (`^0.3.20`).
- **Banco de Dados:** PostgreSQL via `pg` (`^8.11.5`) / Supabase (`@supabase/supabase-js`), com fallback para `sql.js` (SQLite in-memory) para desenvolvimento local (`npm run dev:local`).
- **Frontend & Gráficos:** Arquivos estáticos em `src/frontend`, Chart.js (`^4.4.0`).
- **Testes & Qualidade:** Jest (`^29.7.0`), Playwright (`@playwright/test` `^1.61.0` para testes E2E), Supertest (`^7.0.0`).

---

## 4. Scripts e Instruções de Execução

Observado em [`package.json`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/mvp-3/package.json):

- **Desenvolvimento:** `npm run dev` ou `npm run dev:local` (modo com `sql.js`).
- **Migrações e Seeds:** `npm run migrate`, `npm run seed`.
- **Cálculo de Risco:** `npm run risco:recalcular` (`ts-node src/scripts/recalcular-risco-evasao.ts`).
- **Testes:**
  - Unitários: `npm run test:unit`
  - Integração: `npm run test:integration`
  - End-to-End: `npm run test:e2e` (Playwright)
  - Performance: `npm run test:performance`
  - CI completo: `npm run test:ci`

---

## 5. Representação da Jornada e Modelo de Dados

### Estrutura de Banco de Dados e Mapeamento ORM Observados
- Utiliza **TypeORM** com entidades explicitamente tipadas e decoradas (`@Entity()`) em `src/backend/entities/`.
- Script dedicado para cálculo de risco de evasão em `src/scripts/recalcular-risco-evasao.ts`.

---

## 6. Funcionalidades Declaradas vs. Observadas

| Funcionalidade / Aspecto | Classificação | Observações / Caminho |
|---|---|---|
| ORM Estruturado (TypeORM) | **Observado** | `typeorm` em `package.json`, entidades em `src/backend/entities/` |
| Fallback para SQL.js (Local) | **Observado** | Script `npm run dev:local` com `DB_TYPE=sqljs` |
| Algoritmo de Risco de Evasão | **Observado** | Script `src/scripts/recalcular-risco-evasao.ts` |
| Testes E2E (Playwright) | **Observado** | `@playwright/test` e config em `src/tests/e2e/playwright.config.ts` |
| Suporte a Supabase | **Observado** | `@supabase/supabase-js` e script `supabase:check` |
| Execução em Runtime | **Não verificado** | Não executado nesta fase de inventário inicial. |

---

## 7. Pontos de Atenção para Auditoria

1. **Uso do TypeORM:** Verificar se o mapeamento de entidades do TypeORM suporta chaves compostas e histórico sem sobrescrever registros.
2. **Script de Recálculo de Risco:** Investigar a lógica exata aplicada no script `recalcular-risco-evasao.ts` (70% progresso / 3 mentorias pendentes).
3. **Playwright E2E:** Verificar se os cenários de teste E2E em `src/tests/e2e` cobrem o fluxo da Denise (Coordenação) e do Eduardo (Diretoria).
