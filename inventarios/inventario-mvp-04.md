# Inventário Inicial — MVP-04 (NEXUS)

> **Status:** Inventário Concluído (Factual)  
> **Diretório:** [`auditoria/mvp-4`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/mvp-4)  
> **Nome do Projeto:** NEXUS (Grupo NEXUS / Grupo 04)  

---

## 1. Identificação e Visão Geral

- **Nome da Solução:** NEXUS
- **Equipe / Grupo:** Grupo NEXUS (Grupo 04)
- **Documentação Principal Encontrada:**
  - [`README.md`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/mvp-4/README.md) na raiz do projeto.
  - Pasta [`documentos/`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/mvp-4/documentos) e [`assets/`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/mvp-4/assets).

---

## 2. Estrutura de Arquivos e Diretórios

A estrutura observada no diretório [`auditoria/mvp-4`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/mvp-4) é:

```text
auditoria/mvp-4/
├── .gitattributes
├── .gitignore
├── README.md
├── assets/
├── documentos/
└── src/
    ├── package.json  <-- Nota: package.json localizado dentro de src/
    ├── app.ts
    ├── controllers/
    ├── database/
    │   └── migration.ts
    ├── middlewares/
    ├── models/
    ├── repositories/
    ├── routes/
    ├── services/
    └── view/
        ├── aluno/
        ├── gestor/
        │   ├── gestor/ (js, pages, styles)
        │   └── globalStyle/
        ├── login/
        └── psicologa/
```

---

## 3. Stack Tecnológica e Dependências

Observado em [`src/package.json`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/mvp-4/src/package.json):

- **Backend:** Node.js com TypeScript (`ts-node-dev`), Express.js v5 (`^5.2.1`).
- **Banco de Dados:** PostgreSQL via driver [`pg`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/mvp-4/src/package.json) (`^8.21.0`).
- **Frontend:** HTML/CSS/JS estáticos organizados por perfil de usuário (`src/view/aluno`, `src/view/gestor`, `src/view/psicologa`, `src/view/login`).
- **Testes & Qualidade:** Jest (`^29.7.0`), Supertest (`^7.2.2`), `ts-jest`.

---

## 4. Scripts e Instruções de Execução

Observado em [`src/package.json`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/mvp-4/src/package.json):

> *Nota:* Como `package.json` está dentro da pasta `src/`, os comandos `npm` devem ser executados dentro de `src/` (ou configurando a pasta de trabalho).

- **Desenvolvimento:** `npm run dev` (`ts-node-dev --respawn --transpile-only app.ts`).
- **Build & Start:** `npm run build` (`tsc`) e `npm run start` (`node dist/app.js`).
- **Migrações:** `npm run migrate` (`ts-node database/migration.ts`).
- **Testes:** `npm run test` (`jest`), `npm run test:coverage`.

---

## 5. Representação da Jornada e Modelo de Dados

### Estrutura Observada no Código
- Migrações SQL/TypeScript em `src/database/migration.ts`.
- Módulo específico para perfil de atendimento psicológico (`src/view/psicologa/` com `prontuario.html`, `atendimentos.html` e `psicologaService.js`), estendendo o modelo de acompanhamento do jovem.

---

## 6. Funcionalidades Declaradas vs. Observadas

| Funcionalidade / Aspecto | Classificação | Observações / Caminho |
|---|---|---|
| Visão do Gestor / Coordenação | **Observado** | `src/view/gestor/gestor/pages/dashboard.html`, `turmas.html` |
| Perfil do Aluno | **Observado** | `src/view/gestor/gestor/pages/perfil-aluno.html` |
| Módulo de Psicologia / Prontuário | **Observado** | `src/view/psicologa/prontuario.html`, `atendimentos.html` |
| Autenticação / Login | **Observado** | `src/view/login/index.html`, `login.js` |
| Express 5 | **Observado** | `express` v5 em `src/package.json` |
| Execução em Runtime | **Não verificado** | Não executado nesta fase de inventário inicial. |
| Arquivo `package.json` na raiz | **Não encontrado** | `package.json` localiza-se dentro do subdiretório `src/`. |

---

## 7. Pontos de Atenção para Auditoria

1. **Localização do `package.json`:** `package.json` está dentro de `src/`, afetando a instrução padrão de instalação e execução se executado da raiz `auditoria/mvp-4`.
2. **Módulo de Psicologia (Prontuário):** Investigar o alinhamento desse módulo específico com os requisitos formais de privacidade/LGPD e escopo do MVP da Pulse Mais.
3. **Versão do Express (v5):** Verificar compatibilidade e comportamento das rotas no Express 5.
