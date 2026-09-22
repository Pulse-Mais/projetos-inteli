# Auditoria Profunda — MVP-04 (NEXUS)

> **Status da Auditoria Profunda:** Concluída (Análise Factual e Estática)  
> **Diretório:** [`auditoria/mvp-4`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/mvp-4)  
> **Solução:** NEXUS (Grupo NEXUS / Grupo 04)  

---

## 1. Identificação
- **Projeto:** NEXUS
- **Grupo:** Grupo NEXUS / Grupo 04 (Inteli)
- **Repositório:** [`auditoria/mvp-4`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/mvp-4)

## 2. Resumo Executivo Factual
O MVP-04 (NEXUS) é desenvolvido em Node.js com Express 5, TypeScript e PostgreSQL. Destaca-se por uma interface rica dividida por perfis operacionais (`view/aluno`, `view/gestor`, `view/psicologa`), incluindo módulo de prontuário e atendimentos de psicologia.

## 3. Documentação Encontrada
- `DOCUMENTADO`: [`README.md`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/mvp-4/README.md) na raiz do projeto com banners e informações do grupo.
- `DOCUMENTADO`: Diretório [`documentos/`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/mvp-4/documentos) e [`assets/`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/mvp-4/assets).

## 4. Arquitetura e Stack
- `OBSERVADO`: **Backend:** Node.js, TypeScript (`ts-node-dev`), Express 5 (`express` `^5.2.1`).
- `OBSERVADO`: **Banco de Dados:** PostgreSQL via driver `pg` (`^8.21.0`).
- `OBSERVADO`: **Frontend:** Arquivos estáticos HTML/CSS/JS estruturados em `src/view/`.

## 5. Estrutura do Projeto
- `OBSERVADO`: Código-fonte dentro do subdiretório `src/`, contendo `package.json`, `auth`, `controllers`, `database`, `errors`, `middlewares`, `repositories`, `routes`, `services`, `test`, `utils`, `view`.

## 6. Modelo de Dados
- `OBSERVADO`: Migrações TypeScript em `src/database/migration.ts`.

## 7. Representação da Jornada
- `OBSERVADO`: Mapeia alunos, turmas, comunicados e prontuários.
- `PARCIAL`: Ausência de tabela explícita para registrar a transição contínua dos pilares Conectado -> Capacitado -> Transformado ao longo de múltiplos anos.

## 8. Funcionalidades Declaradas
- `DOCUMENTADO`: Painel do Gestor, perfil do aluno, sistema de comunicados e módulo de psicologia (prontuário/atendimentos).

## 9. Funcionalidades Observadas
- `OBSERVADO`: Páginas HTML e scripts JS em `src/view/psicologa/` (`atendimentos.html`, `prontuario.html`, `psicologaService.js`).
- `OBSERVADO`: Páginas do Gestor em `src/view/gestor/gestor/pages/` (`dashboard.html`, `turmas.html`, `perfil-aluno.html`, `comunicados.html`).

## 10. Funcionalidades Executadas/Validadas
- `BLOQUEADO / NÃO VERIFICADO`: Execução local bloqueada por falta de `node_modules`.

## 11. Integração com o Planilhão
- `OBSERVADO`: Serviços de importação em `src/services/` e controladores em `src/controllers/`.

## 12. Regras de Negócio Relevantes
- `OBSERVADO`: Visualização de turmas e perfis individuais de alunos.

## 13. Indicadores
- `OBSERVADO`: Dashboard em `src/view/gestor/gestor/js/dashboard.js` consome APIs de indicadores.

## 14. Segurança e LGPD
- `OBSERVADO`: Middlewares de autenticação em `src/middlewares/`.
- `RISCO CRÍTICO`: O módulo de prontuários de psicologia (`src/view/psicologa/prontuario.html`) lida com dados de saúde altamente sensíveis (LGPD Art. 5º II). Exige isolamento estrito e criptografia de dados sensíveis.

## 15. Autenticação e Autorização
- `OBSERVADO`: Módulo `src/auth/` e tela de login em `src/view/login/index.html`.

## 16. Qualidade de Código
- `OBSERVADO`: Estrutura organizada com Express 5 e TypeScript.

## 17. Testes
- `OBSERVADO`: Configuração Jest e Supertest em `src/test/`.
- `NÃO VERIFICADO`: Não executados em runtime nesta fase.

## 18. Performance
- `NÃO VERIFICADO`: Sem testes de carga configurados.

## 19. Implantabilidade
- `OBSERVADO`: `package.json` está dentro da pasta `src/`, exigindo que o comando de execução seja rodado a partir de `src/`.

## 20. Operação e Manutenção
- `OBSERVADO`: Organização visual separada por perfis facilita manutenção frontend.

## 21. Escalabilidade e Evolução
- `OBSERVADO`: Express 5 garante suporte a manipuladores de rota assíncronos nativos sem try/catch repetitivos.

## 22. Dependências Externas
- `OBSERVADO`: `express` v5, `pg`, `cors`, `dotenv`.

## 23. Custos e Infraestrutura
- `INFERÊNCIA`: PostgreSQL RDS e servidor Node.js.

## 24. Pontos Fortes
- Uso do Express 5 moderno.
- Separação clara das interfaces por perfil de usuário (`gestor`, `aluno`, `psicologa`).
- Interface do painel de comunicados e turmas bem estruturada.

## 25. Limitações
- Localização do `package.json` dentro de `src/` quebra a convenção padrão da raiz.

## 26. Riscos
- `RISCO`: Risco regulatório de privacidade e vazamento de dados de prontuário psicológico.

## 27. Gaps em Relação ao Contexto Pulse Mais
- O módulo de prontuário psicológico não faz parte dos requisitos do MVP da Pulse Mais e estende o escopo desnecessariamente.

## 28. Perguntas que Precisam ser Respondidas
- O módulo de prontuário pode ser desativado via configuração sem quebrar a plataforma?

## 29. Evidências Utilizadas
- `src/view/psicologa/prontuario.html`
- `src/package.json`
- `src/database/migration.ts`

## 30. Comandos Executados e Resultados
- `npm test`: Não executado em runtime por ausência de `node_modules`.

## 31. Conclusão Factual
- Status: **Auditoria Profunda Concluída (Factual estática)**. O MVP-04 possui boa separação de interfaces e Express 5, mas traz um módulo de psicologia fora do escopo do MVP que exige atenção de LGPD.
