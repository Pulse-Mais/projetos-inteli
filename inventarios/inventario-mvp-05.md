# Inventário Inicial — MVP-05 (Pulse Control)

> **Status:** Inventário Concluído (Factual)  
> **Diretório:** [`auditoria/mvp-5`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/mvp-5)  
> **Nome do Projeto:** Pulse Control (Grupo Pulse Control / Grupo 05)  

---

## 1. Identificação e Visão Geral

- **Nome da Solução:** Pulse Control
- **Equipe / Grupo:** Grupo Pulse Control (Grupo 05)
- **Documentação Principal Encontrada:**
  - [`README.md`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/mvp-5/README.md) na raiz do projeto.
  - Documento WAD detalhado em [`documentos/wad.md`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/mvp-5/documentos/wad.md) (572 KB com especificações técnicas e diagramas).
  - Documentação gráfica e protótipos na pasta [`assets/`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/mvp-5/assets).

---

## 2. Estrutura de Arquivos e Diretórios

A estrutura observada no diretório [`auditoria/mvp-5`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/mvp-5) é:

```text
auditoria/mvp-5/
├── .gitattributes
├── .gitignore
├── README.md
├── assets/
│   ├── cobertura/
│   ├── diagramas/
│   ├── prototipos/
│   └── wireframes/
├── documentos/
│   ├── wad.md (Web Application Document completo)
│   ├── outros/ (webapi-docs.html)
│   └── tests/  <-- Nota: suíte de testes Jest localizada em documentos/tests/
└── src/
    ├── package.json <-- Nota: package.json localizado dentro de src/
    ├── app.ts
    ├── server.ts
    ├── jest.config.ts
    ├── tsconfig.json
    ├── controllers/
    ├── db/ (migrate.ts)
    ├── errors/
    ├── helpers/
    ├── middlewares/
    ├── models/
    ├── repositories/
    ├── routes/
    ├── services/
    └── view/
```

---

## 3. Stack Tecnológica e Dependências

Observado em [`src/package.json`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/mvp-5/src/package.json):

- **Backend:** Node.js com TypeScript (`ts-node-dev`), Express.js v5 (`^5.2.1`).
- **Banco de Dados:** PostgreSQL via driver [`pg`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/mvp-5/src/package.json) (`^8.20.0`).
- **Frontend / Template:** Views EJS (`ejs` `^5.0.2`), ícones `lucide` (`^1.17.0`), servidas via Express.
- **Utilitários:** `csv-parse`, `csv-stringify`, `multer` (upload/download de CSV e planilhas).
- **Testes & Qualidade:** Jest (`^30.4.2`), Supertest (`^7.2.2`), `ts-jest`.

---

## 4. Scripts e Instruções de Execução

Observado em [`src/package.json`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/mvp-5/src/package.json):

> *Nota:* Como `package.json` está dentro de `src/`, os comandos `npm` devem ser executados a partir de `src/`.

- **Desenvolvimento:** `npm run dev` (`ts-node-dev --respawn --transpile-only server.ts`).
- **Build & Start:** `npm run build` (`tsc -p tsconfig.build.json && cpSync view dist/view`) e `npm run start` (`node dist/server.js`).
- **Migrações:** `npm run migrate` (`ts-node db/migrate.ts`).
- **Testes:** `npm run test` (`jest`).

---

## 5. Representação da Jornada e Modelo de Dados

### Estrutura Observada no Código e nos Testes (`documentos/tests/`)
- Testes unitários cobrem múltiplos domínios específicos:
  - `jovemService.test.ts`, `jovemController.test.ts`
  - `empregabilidadeService.test.ts`, `ensinoSuperiorService.test.ts` (Bolsas)
  - `frequenciaService.test.ts`, `aulaService.test.ts`
  - `mentoriaService.test.ts`, `programaService.test.ts`
  - `dashboardService.test.ts`, `exportService.test.ts`, `importService.test.ts`
  - `computadorDoadoRepository.test.ts` (Controle de notebooks doados)

---

## 6. Funcionalidades Declaradas vs. Observadas

| Funcionalidade / Aspecto | Classificação | Observações / Caminho |
|---|---|---|
| Documentação WAD Extensa | **Observado** | `documentos/wad.md` (572 KB) |
| Testes Unitários de Regra de Negócio | **Observado** | 27 arquivos de teste em `documentos/tests/` |
| Importação e Exportação CSV | **Observado** | `csv-parse`, `csv-stringify` em `package.json`, `importService.ts`, `exportService.ts` |
| Rastreio de Empregabilidade e Ensino Superior | **Observado** | Controllers e Services dedicados em `src/controllers/` |
| Gestão de Notebooks Doados | **Observado** | `computadorDoadoRepository.test.ts` |
| Execução em Runtime | **Não verificado** | Não executado nesta fase de inventário inicial. |
| Localização dos Testes | **Observado** | Suíte de testes Jest localiza-se na pasta `documentos/tests/` em vez de `src/tests/`. |
| Arquivo `package.json` na raiz | **Não encontrado** | `package.json` localiza-se dentro do subdiretório `src/`. |

---

## 7. Pontos de Atenção para Auditoria

1. **Configuração do Jest para Pasta de Testes Externa:** Como os testes estão em `documentos/tests/`, verificar a propriedade `rootDir` / `testMatch` no `jest.config.ts` para garantir que o Jest os executa corretamente.
2. **Localização do `package.json`:** `package.json` está dentro de `src/`, exigindo atenção na execução de scripts.
3. **Mapeamento de Ensino Superior e Empregabilidade:** Investigar como o modelo de dados armazena múltiplos eventos de bolsas e empregos para o mesmo jovem sem sobrescrever.
