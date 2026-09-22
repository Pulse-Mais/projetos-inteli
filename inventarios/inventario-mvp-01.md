# Inventário Inicial — MVP-01 (PulseConnect)

> **Status:** Inventário Concluído (Factual)  
> **Diretório:** [`auditoria/mvp-1`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/mvp-1)  
> **Nome do Projeto:** PulseConnect (Grupo 01)  

---

## 1. Identificação e Visão Geral

- **Nome da Solução:** PulseConnect
- **Equipe / Grupo:** Grupo 01
- **Integrantes:** Bernardo de Assis Bittencourt e Silva, Breno Gallego Martins, Eric Pimentel Ferraz, Erika Vieira de Souza, Gabriel Lorenzo Baglioli de Loyola, Guilherme Barbosa de Souza, Leticia Antunes de Freitas, Matteus Ferreira Haikal Giglio.
- **Documentação Principal Encontrada:**
  - [`README.md`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/mvp-1/README.md) na raiz do projeto.
  - Pasta [`documents/`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/mvp-1/documents) contendo assets, diagramas e materiais adicionais.

---

## 2. Estrutura de Arquivos e Diretórios

A estrutura básica observada no diretório [`auditoria/mvp-1`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/mvp-1) é:

```text
auditoria/mvp-1/
├── .env.example
├── .gitignore
├── commitlint.config.mjs
├── jest.config.cjs
├── package.json
├── README.md
├── tsconfig.json
├── .husky/
├── assets/
├── documents/
└── src/
    ├── backend/
    │   ├── controllers/
    │   ├── db/
    │   │   ├── connection.ts
    │   │   └── migrations/
    │   ├── middlewares/
    │   ├── repositories/
    │   ├── routes/
    │   ├── services/
    │   ├── tests/
    │   └── views/ (templates EJS)
    └── frontend/
        ├── css/
        ├── js/ (scripts JavaScript Vanilla)
        └── pages/ (páginas HTML estáticas)
```

---

## 3. Stack Tecnológica e Dependências

Observado em [`package.json`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/mvp-1/package.json):

- **Backend:** Node.js com TypeScript (`tsx`), Express.js (`^4.22.2`).
- **Banco de Dados:** PostgreSQL via driver [`pg`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/mvp-1/src/backend/db/connection.ts) (`^8.21.0`). Também possui cliente Supabase (`@supabase/supabase-js`, `@supabase/ssr`).
- **Frontend:** HTML Vanilla (páginas em `src/frontend/pages`), CSS Vanilla, JavaScript client-side em `src/frontend/js`.
- **Utilitários:** `bcryptjs` (hash de senhas), `multer` (upload de arquivos), `csv-parser` e `xlsx` (processamento de planilhas), `nodemailer` (envio de e-mails).
- **Testes & Qualidade:** Jest (`^29.7.0`), Supertest (`^7.2.2`), Husky, Commitlint, ESLint.

---

## 4. Scripts e Instruções de Execução

Observado em [`package.json`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/mvp-1/package.json):

- **Desenvolvimento:** `npm run dev` (executa `tsx watch src/backend/server.ts`).
- **Build & Start:** `npm run build` (`tsc`) e `npm run start` (`node dist/server.js`).
- **Migrações de Banco:** `npm run migrate` (`tsx src/backend/db/migrations/migrate.ts`).
- **Testes:** `npm run test` (`cross-env NODE_ENV=test jest --runInBand`), `npm run test:coverage`.

---

## 5. Representação da Jornada e Modelo de Dados

### Estrutura de Banco de Dados Observada
- Script de migração presente em `src/backend/db/migrations/migrate.ts`.
- Contém tabelas/serviços para: `usuario`, `aluno` / `matricula`, `programa`, `evento`, `participaEvento`, `mentoria`, `mentor`, `frequencia`, `entrega`, `oportunidade`, `indicador`.

### Componentes de Backend Observados
- Controllers e Services mapeados em `src/backend/controllers/` e `src/backend/services/`:
  - `alunoController.ts`, `dashboardController.ts`, `eventoController.ts`, `importacaoController.ts`, `mentoriaController.ts`, `oportunidadeController.ts`, `usuarioController.ts`, entre outros.

---

## 6. Funcionalidades Declaradas vs. Observadas

| Funcionalidade / Aspecto | Classificação | Observações / Caminho |
|---|---|---|
| Autenticação e Login | **Observado** | `src/frontend/pages/login.html`, `src/frontend/js/login.js`, `usuarioController.ts` |
| Importação de Planilhas | **Observado** | `src/frontend/js/importarPlanilha.js`, `importacaoController.ts`, `importacaoService.ts` |
| Dashboard de Coordenação | **Observado** | `src/frontend/pages/dashboard.html`, `dashboardController.ts` |
| Portal e Perfil do Aluno | **Observado** | `src/frontend/pages/perfilAluno.html`, `perfilAlunoPortal.html` |
| Gestão de Mentorias | **Observado** | `src/frontend/pages/agendaMentorias.html`, `mentoriaService.ts` |
| Registro de Frequência | **Observado** | `src/frontend/pages/frequencia.html`, `frequenciaService.ts` |
| Cadastro de Oportunidades | **Observado** | `src/frontend/pages/oportunidades.html`, `oportunidadeService.ts` |
| Suporte a Múltiplos Tipos de Aluno/Ex-Aluno | **Observado** | Scripts `homepageAluno.js`, `homepageExAluno.js`, `homepageMentor.js` |
| Execução em Runtime | **Não verificado** | Não executado nesta fase de inventário inicial. |
| Testes E2E com Navegador | **Não encontrado** | Não há framework E2E (Playwright/Cypress) configurado no `package.json`. |

---

## 7. Pontos de Atenção para Auditoria

1. **Uso Concorrente de Supabase e Postgres Direto:** Verificar se a aplicação depende de serviço Supabase na nuvem ou funciona integralmente com PostgreSQL local/dockerizado via `pg`.
2. **Cobertura de Testes de Integração:** Verificar se os testes em `src/backend/tests` cobrem as regras de cálculo de risco e retenção da jornada.
3. **Mapeamento de Importação de Dados:** Verificar como o `importacaoService.ts` valida duplicações e preserva histórico do Planilhão.
