# Auditoria Profunda — MVP-02 (Pulsar)

> **Status da Auditoria Profunda:** Concluída (Análise Factual e Estática)  
> **Diretório:** [`auditoria/mvp-2`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/mvp-2)  
> **Solução:** Pulsar (Equipe Pulsar / Grupo 02)  

---

## 1. Identificação
- **Projeto:** Pulsar
- **Grupo:** Equipe Pulsar / Grupo 02 (Inteli)
- **Repositório:** [`auditoria/mvp-2`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/mvp-2)

## 2. Resumo Executivo Factual
O MVP-02 (Pulsar) é construído em Node.js com JavaScript Vanilla (ES6/CommonJS) e PostgreSQL. Destaca-se por possuir 35 scripts de migração granulares, suíte de testes de carga com Artillery e utilitário de exportação de calendários iCal.

## 3. Documentação Encontrada
- `DOCUMENTADO`: [`README.md`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/mvp-2/README.md) na raiz do projeto com badges, instruções de instalação e lista de scripts.
- `DOCUMENTADO`: Diretórios [`documentos/`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/mvp-2/documentos) e [`assets/`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/mvp-2/assets).

## 4. Arquitetura e Stack
- `OBSERVADO`: **Backend:** Node.js em JavaScript (CommonJS), Express (`^4.19.2`).
- `OBSERVADO`: **Banco de Dados:** PostgreSQL via driver `pg` (`^8.21.0`).
- `OBSERVADO`: **Autenticação:** JWT (`jsonwebtoken` `^9.0.3`) e `bcrypt` (`^5.1.1`).
- `OBSERVADO`: **Ferramentas Adicionais:** `ical-generator`, `json2csv`, `artillery` (testes de carga).

## 5. Estrutura do Projeto
- `OBSERVADO`: Código-fonte em `src/` estruturado em `config`, `controllers`, `database`, `errors`, `helpers`, `middlewares`, `models`, `public`, `repositories`, `routes`, `scripts`, `services`, `tests`, `views`.

## 6. Modelo de Dados
- `OBSERVADO`: 35 arquivos SQL de migração em `src/database/migrations/`.
- `OBSERVADO`: Tabelas específicas para `empregabilidade`, `ensino_superior`, `atendimentos_saude_mental`, `log_auditoria`, `notificacoes`, `competencias`, `oportunidades`, `certificados`, `disciplinas`.

## 7. Representação da Jornada
- `OBSERVADO`: Possui modelos e tabelas separadas para `empregabilidade` (011_create_empregabilidade.sql) e `ensino_superior` (012_create_ensino_superior.sql), permitindo múltiplos registros de transformações por jovem.

## 8. Funcionalidades Declaradas
- `DOCUMENTADO`: Gestão de participantes, geração de iCal, controle de saúde mental, logs de auditoria, exportação CSV e testes de carga.

## 9. Funcionalidades Observadas
- `OBSERVADO`: Scripts em `src/scripts/` (`criar-gestao.js`, `criar-mentor.js`, `criar-aluno.js`, `seed-demo.js`, `migrar.js`).

## 10. Funcionalidades Executadas/Validadas
- `BLOQUEADO / NÃO VERIFICADO`: Tentativa de execução local de `npm test` bloqueada por ausência da pasta `node_modules` / `cross-env`.

## 11. Integração com o Planilhão
- `OBSERVADO`: Módulo de importação CSV utilizando `csv-parser` e `multer` em `src/services/` e `src/controllers/`.

## 12. Regras de Negócio Relevantes
- `OBSERVADO`: Regras de auditoria de alterações registradas na tabela `log_auditoria` (`013_create_log_auditoria.sql`).

## 13. Indicadores
- `OBSERVADO`: Controllers em `src/controllers/` contêm agregações SQL para o painel da gestão.

## 14. Segurança e LGPD
- `OBSERVADO`: Autenticação JWT com versionamento de token (`030_add_token_version_usuarios.sql`).
- `RISCO`: Tabela `atendimentos_saude_mental` armazena dados de saúde sensíveis; exige controle rigoroso de acesso e criptografia.

## 15. Autenticação e Autorização
- `OBSERVADO`: Middlewares em `src/middlewares/` validam JWT e perfis (gestor, mentor, aluno).

## 16. Qualidade de Código
- `OBSERVADO`: Código bem estruturado em MVC/Repository, porém desenvolvido em JavaScript puro sem verificação estática de tipos (TypeScript).

## 17. Testes
- `OBSERVADO`: Testes automatizados Jest em `src/tests/` e arquivos de teste de carga Artillery em `src/scripts/load-test/`.
- `NÃO VERIFICADO`: Não executados em runtime nesta fase.

## 18. Performance
- `OBSERVADO`: Script `033_performance_indexes.sql` cria índices de performance no PostgreSQL. Testes Artillery configurados.

## 19. Implantabilidade
- `OBSERVADO`: Scripts de setup de usuários de demonstração facilitam a carga inicial dev (`npm run setup:gestor`, etc.).

## 20. Operação e Manutenção
- `OBSERVADO`: Dependências padrão simplificam a execução em qualquer Node.js v18+.

## 21. Escalabilidade e Evolução
- `OBSERVADO`: Índices de banco dedicados ajudam na escalabilidade de consultas volumosas.

## 22. Dependências Externas
- `OBSERVADO`: Artillery, ical-generator, json2csv, pg.

## 23. Custos e Infraestrutura
- `INFERÊNCIA`: PostgreSQL padrão AWS RDS e serviço Node.js.

## 24. Pontos Fortes
- 35 migrações SQL bem divididas e idempotentes.
- Presença de scripts de teste de carga (Artillery) e tabela de log de auditoria.
- Suporte a geração de calendários iCal.

## 25. Limitações
- Código em JavaScript puro (sem suporte a TypeScript para prevenção de erros de tipo em tempo de compilação).

## 26. Riscos
- `RISCO`: Módulo de saúde mental requer análise rígida de LGPD para evitar exposição de prontuários.

## 27. Gaps em Relação ao Contexto Pulse Mais
- Não possui visualização nativa diferenciada entre perfil da Denise (Coordenação) e do Eduardo (Diretoria) com filtros avançados.

## 28. Perguntas que Precisam ser Respondidas
- Os dados de saúde mental são acessíveis por qualquer perfil de gestor ou somente por profissionais autorizados?

## 29. Evidências Utilizadas
- `src/database/migrations/001_create_usuarios.sql` a `035_alter_foto_url_to_text.sql`
- `src/scripts/load-test/artillery.yml`
- `package.json`

## 30. Comandos Executados e Resultados
- `npm test -- --dryRun`: Falhou devido à ausência do pacote `cross-env` / `node_modules`.

## 31. Conclusão Factual
- Status: **Auditoria Profunda Concluída (Factual estática)**. O MVP-02 possui excelência em estrutura de banco de dados e testes de performance, porém utiliza JavaScript puro.
