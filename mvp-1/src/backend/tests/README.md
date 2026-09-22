# Testes automatizados — Pulse Mais

Este diretorio concentra os testes automatizados da WebAPI da Pulse Mais,
executados com Jest + Supertest + ts-jest.

## Convencao de nomenclatura

| Sufixo                  | Tipo de teste                        | O que mockar                                                                                |
| ----------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------- |
| `*.service.test.ts`     | Unitario de servico                  | Repositorios. Servico exercitado em isolamento, sem rede nem banco.                          |
| `*.controller.test.ts`  | Controller via Supertest             | Services. Faz request HTTP ao Express e verifica contrato (status, body).                    |
| `*.integration.test.ts` | Integracao end-to-end                | Nenhum (banco real de teste). Roda com `.env` apontando para um Supabase isolado.            |
| `*.spec.ts` (legado)    | Convencao antiga, integracao         | Mantidos por compatibilidade. Novos testes devem usar uma das convencoes acima.              |

## Determinismo

A infra garante:

- **Timezone fixo em UTC** (`jest.setup.ts`) para que datas e timestamps nao
  variem entre maquinas de desenvolvedores em fusos diferentes nem entre
  o CI runner e o local.
- **Env vars placeholder do Supabase** injetadas em `process.env` quando
  ausentes, evitando que o modulo `src/db/supabaseClient.ts` quebre ja
  na importacao por falta de credenciais. Os placeholders **nao conectam**
  em nada real — testes unitarios devem mockar o supabaseClient via
  `jest.mock('../db/supabaseClient')`.
- **`clearMocks: true`** no `jest.config.cjs` zera o estado dos mocks
  (calls, results, instances) entre cada teste, prevenindo vazamento.

## Comandos

```bash
npm test                    # roda todos os testes uma vez
npm run test:watch          # roda em modo watch (reinicia ao salvar)
npm run test:coverage       # gera relatorio de cobertura em coverage/
npm test -- --coverage      # equivalente ao anterior (forma curta)
```

## Esqueleto de referencia

`example.service.test.ts` neste diretorio e um teste-esqueleto 100%
deterministico, sem dependencias externas. Use como ponto de partida ao
adicionar um novo arquivo.

## Boas praticas

1. **Testes unitarios sempre mockam dependencias externas.** Use
   `jest.mock('../caminho/do/modulo')` no topo do arquivo (antes de
   importar o `app`/service que vai usar o modulo).
2. **Testes de integracao** (`*.integration.test.ts` ou `*.spec.ts` legado)
   devem ser executados localmente com `.env` configurado contra um
   Supabase de testes, **nao** o de producao nem o de desenvolvimento
   compartilhado.
3. **Datas nos testes** devem usar valores fixos (ex: `'2026-01-01'`),
   nunca `new Date()` ou `Date.now()` sem mock — para garantir
   reprodutibilidade.
4. **Limpe estado** em `afterEach` ou `afterAll` em testes de integracao
   que escrevem no banco, para nao deixar dados residuais.
