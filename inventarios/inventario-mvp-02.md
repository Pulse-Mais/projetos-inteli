# Inventário Inicial — MVP-02 (Pulsar)

> **Status:** Inventário Concluído (Factual)  
> **Diretório:** [`auditoria/mvp-2`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/mvp-2)  
> **Nome do Projeto:** Pulsar (Equipe Pulsar / Grupo 02)  

---

## 1. Identificação e Visão Geral

- **Nome da Solução:** Pulsar
- **Equipe / Grupo:** Equipe Pulsar (Grupo 02)
- **Documentação Principal Encontrada:**
  - [`README.md`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/mvp-2/README.md) na raiz do projeto.
  - Pasta [`documentos/`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/mvp-2/documentos) e [`assets/`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/mvp-2/assets).

---

## 2. Estrutura de Arquivos e Diretórios

A estrutura observada no diretório [`auditoria/mvp-2`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/mvp-2) é:

```text
auditoria/mvp-2/
├── .env.example
├── .gitignore
├── jest.config.js
├── package.json
├── README.md
├── assets/
├── documentos/
└── src/
    ├── app.js
    ├── server.js
    ├── config/
    ├── controllers/
    ├── database/
    ├── errors/
    ├── helpers/
    ├── middlewares/
    ├── models/
    ├── public/
    ├── repositories/
    ├── routes/
    ├── scripts/
    │   ├── migrar.js
    │   ├── criar-gestao.js
    │   ├── criar-mentor.js
    │   ├── criar-aluno.js
    │   ├── seed-demo.js
    │   └── load-test/
    ├── services/
    ├── tests/
    └── views/
```

---

## 3. Stack Tecnológica e Dependências

Observado em [`package.json`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/mvp-2/package.json):

- **Backend:** Node.js (JavaScript CommonJS), Express (`^4.19.2`).
- **Banco de Dados:** PostgreSQL via driver [`pg`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/mvp-2/package.json) (`^8.21.0`).
- **Autenticação:** JSON Web Token (`jsonwebtoken` `^9.0.3`), `bcrypt` (`^5.1.1`).
- **Utilitários:** `csv-parser`, `json2csv`, `multer`, `ical-generator` (geração de agendas iCal).
- **Testes & Carga:** Jest (`^29.7.0`), Supertest (`^7.2.2`), Artillery (`^2.0.32` para testes de carga e fumaça).

---

## 4. Scripts e Instruções de Execução

Observado em [`package.json`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/mvp-2/package.json):

- **Desenvolvimento:** `npm run dev` (`nodemon src/server.js`).
- **Start:** `npm start` (`node src/server.js`).
- **Migrações e Seeds:** `npm run migrate`, `npm run setup:gestor`, `npm run setup:mentor`, `npm run setup:aluno`, `npm run seed:demo`.
- **Testes:** `npm test`, `npm run test:only-unit`, `npm run test:only-integration`.
- **Testes de Carga:** `npm run load:smoke`, `npm run load:carga` (via Artillery).

---

## 5. Representação da Jornada e Modelo de Dados

### Estrutura de Banco de Dados Observada
- Scripts de inicialização e migração localizados em `src/scripts/migrar.js` e `src/database/`.
- Repositórios e models mapeados em `src/repositories/` e `src/models/`.

### Componentes de Backend Observados
- Estrutura MVC / Repository-Service em `src/controllers/`, `src/services/`, `src/repositories/`.
- Suporte a múltiplos perfis (Gestão, Mentor, Aluno) evidenciado pelos scripts de setup específicos (`criar-gestao.js`, `criar-mentor.js`, `criar-aluno.js`).

---

## 6. Funcionalidades Declaradas vs. Observadas

| Funcionalidade / Aspecto | Classificação | Observações / Caminho |
|---|---|---|
| Autenticação JWT | **Observado** | `jsonwebtoken`, `bcrypt`, middlewares em `src/middlewares/` |
| Geração de Calendários / iCal | **Observado** | Pacote `ical-generator` em `package.json` |
| Exportação/Importação CSV | **Observado** | `csv-parser`, `json2csv`, `multer` em `package.json` |
| Scripts de Carga e Testes de Performance | **Observado** | Scripts Artillery em `src/scripts/load-test/` |
| Interface Pública / Frontend | **Observado** | Arquivos estáticos em `src/public/` e `src/views/` |
| Execução em Runtime | **Não verificado** | Não executado nesta fase de inventário inicial. |
| Cobertura de Testes Unitários/Integração | **Observado** | Arquivos de teste presentes em `src/tests/` |

---

## 7. Pontos de Atenção para Auditoria

1. **JavaScript Puro vs. TypeScript:** O projeto utiliza JavaScript Vanilla (ES6/CommonJS) ao invés de TypeScript no backend.
2. **Autenticação via JWT:** Verificar a gestão de tokens, expiração e segurança dos middlewares de autorização.
3. **Testes de Carga (Artillery):** Verificar se os scripts de teste de carga em `src/scripts/load-test` funcionam e se há relatórios de performance salvos.
