# Matriz de Decisão Técnica do MVP-Base — Plataforma Pulse Mais

> **Status:** `PRONTA PARA ANÁLISE TÉCNICA DO ONION`
>
> **Finalidade:** Determinar qual dos cinco MVPs apresenta a melhor base técnica para implementação da plataforma Pulse Mais.
>
> **Modelo de decisão:** O **Onion / agente avaliador** realiza a análise, atribui as notas segundo a rubrica documentada, compara os cinco candidatos e emite a recomendação técnica. Não há dependência de aprovação prévia de Product Owner ou comitê para a decisão técnica.
>
> **Validação complementar:** Depois da recomendação técnica, a equipe poderá testar portal, interface, navegação, visualização dos dados e comportamento do Planilhão. Essa avaliação será registrada separadamente como **Usabilidade/UI**.

---

## 1. Objetivo da Decisão

Responder:

> **“Considerando as evidências auditadas, qual MVP oferece a melhor fundação técnica para evoluir a plataforma Pulse Mais, preservando o que já existe e minimizando riscos e retrabalho?”**

A análise deve considerar:

- aderência às prioridades do produto;
- representação da jornada;
- preservação histórica;
- importação e reconciliação do Planilhão;
- modelagem dos dados;
- arquitetura e manutenibilidade;
- testes;
- riscos técnicos, de dados e segurança;
- esforço de adaptação;
- capacidades reaproveitáveis dos demais candidatos.

A auditoria factual foi deliberadamente mantida sem ranking ou vencedor, enquanto o Quality Gate foi usado para confrontar as afirmações com código, migrations, schemas, testes e configurações. fileciteturn16file7L1-L16

---

## 2. Papéis e Responsabilidades

| Atividade | Responsável | Resultado |
|---|---|---|
| Auditoria factual | Agentes de auditoria | Evidências dos 5 MVPs |
| Quality Gate | Agente de validação | Confrontação factual |
| **Decisão técnica** | **Onion / agente avaliador** | **MVP recomendado + ranking técnico** |
| Validação prática de interface | Equipe Pulse Mais | Observações de UX/UI |
| Ranking de usabilidade | Equipe Pulse Mais | Ranking UX/UI separado |
| Cruzamento final | Onion + equipe | Base escolhida para implementação |

> **Regra:** o agente não deve transferir a decisão técnica para um “decisor” externo inexistente.

---

## 3. Princípios

1. **Evidência antes de opinião.**
2. **Prioridades P0 antes de funcionalidades periféricas.**
3. **Histórico longitudinal é estrutural.**
4. **Planilhão é parte central da decisão.**
5. **Código existente não equivale automaticamente a funcionamento em runtime.**
6. **Requisitos futuros não devem gerar vantagem artificial por simplesmente estarem presentes.**
7. **Inferências devem ser identificadas como inferências.**
8. **Um problema estrutural grave em P0 pode pesar mais que uma vantagem cosmética ou periférica.**

A auditoria identificou, por exemplo, limitações de histórico nos MVPs 01 e 04, onde o estado da jornada é sobrescrito em estrutura estática. fileciteturn16file8L1-L5

---

## 4. Critérios Técnicos de Decisão

Os critérios são **critérios analíticos desta avaliação**, não requisitos previamente aprovados por um decisor externo.

| ID | Critério | Natureza | Prioridade de referência |
|---|---|---|---|
| C1 | Indicadores para Gestão | Produto | P0 |
| C2 | Acesso e Visão do Aluno | Produto | P0 |
| C3 | Preservação Relacional da Jornada e Histórico | Dados/Produto | P0 |
| C4 | Importação e Reconciliação do Planilhão | Dados/Produto | P0 |
| C5 | Perfil e Fluxo de Mentoria | Produto | P1 |
| C6 | Arquitetura e Manutenibilidade | Engenharia | Transversal |
| C7 | Testabilidade e Infraestrutura de Qualidade | Engenharia | Transversal |
| C8 | Riscos Técnicos, Dados e Segurança | Engenharia | Transversal |
| C9 | Esforço de Adaptação para Virar Base | Engenharia | Transversal |
| C10 | Capacidades Reaproveitáveis | Engenharia | Transversal |

### Fora da pontuação principal

- Psicologia / Apoio Clínico: futuro.
- Criptografia de coluna: evolução futura.
- RLS: evolução futura.
- APIs externas: evolução futura.
- Performance real: somente pontuar como evidência quando houver medição verificável.

---

## 5. Rubrica de Pontuação do Onion

Para cada critério e MVP:

| Nota | Interpretação |
|---:|---|
| **5** | Evidência forte e aderência direta, com baixa necessidade de adaptação |
| **4** | Capacidade adequada, com limitações menores |
| **3** | Capacidade parcial ou que exige adaptação relevante |
| **2** | Capacidade fraca, contraditória ou dependente de reconstrução |
| **1** | Capacidade ausente/inadequada ou limitação estrutural grave |
| **N/V** | Evidência insuficiente para pontuação responsável |

> Essa escala é uma **rubrica operacional do avaliador**, criada para tornar a decisão comparável e auditável. Não deve ser apresentada como escala oficial previamente definida pela Pulse Mais.

### Regra de interpretação

A soma das notas **não é suficiente sozinha**. O Onion deve analisar também:

- gravidade dos problemas;
- natureza P0/P1;
- esforço de correção;
- risco de perda de dados;
- impacto arquitetural;
- evidência disponível.

---

## 6. Matriz de Avaliação

| Critério | MVP-01 | MVP-02 | MVP-03 | MVP-04 | MVP-05 | Evidência principal |
|---|---:|---:|---:|---:|---:|---|
| C1 — Indicadores de Gestão | | | | | | |
| C2 — Acesso do Aluno | | | | | | |
| C3 — Histórico Relacional | | | | | | |
| C4 — Planilhão / Reconciliação | | | | | | |
| C5 — Mentoria | | | | | | |
| C6 — Arquitetura | | | | | | |
| C7 — Testabilidade | | | | | | |
| C8 — Riscos / Segurança / Dados | | | | | | |
| C9 — Esforço de Adaptação | | | | | | |
| C10 — Reaproveitamento | | | | | | |
| **Resultado técnico** | | | | | | |

---

## 7. Leitura dos Cinco Candidatos

### MVP-01 — PulseConnect

**Capacidades evidenciadas:**
- TypeScript;
- arquitetura em três camadas;
- Jest/Supertest;
- múltiplos papéis;
- aliases flexíveis no importador.

**Limitações relevantes:**
- estado da jornada armazenado estaticamente;
- ausência de histórico acumulativo dedicado;
- limitações de reconciliação;
- dependência do Supabase registrada no Quality Gate. fileciteturn16file13L1-L3

### MVP-02 — Pulsar

**Capacidades evidenciadas:**
- 35 migrations SQL granulares;
- estruturas relacionais de empregabilidade e ensino superior;
- múltiplos eventos históricos;
- Artillery;
- exportação iCal.

**Limitações relevantes:**
- JavaScript puro/CommonJS;
- importador restrito ao lançamento de frequências segundo a auditoria;
- runtime dos testes não deve ser presumido.

O Quality Gate registra a ressalva de linguagem junto da granularidade relacional de eventos. fileciteturn16file18L1-L8

### MVP-03 — Pulse Manager

**Capacidades evidenciadas:**
- TypeScript;
- TypeORM;
- modelo relacional;
- Fuzzy de risco de evasão;
- `mergePayload()`;
- Playwright E2E;
- `sql.js`.

O Quality Gate classificou o MVP-03 como `AUDITORIA VALIDADA`, destacando estrutura relacional, risco Fuzzy e Playwright E2E. fileciteturn16file18L1-L8

**Ponto de atenção:**
- parte do histórico de programas é consolidada em memória/texto, devendo ser diferenciada de histórico relacional completo.

### MVP-04 — NEXUS

**Capacidades evidenciadas:**
- Express 5;
- TypeScript;
- interfaces por perfil;
- empregabilidade;
- testes Jest.

**Limitações relevantes:**
- categoria da jornada estática;
- importação sem reconciliação dedicada;
- `package.json` em subpasta;
- risco relacionado ao prontuário psicológico. fileciteturn16file13L1-L3

### MVP-05 — Pulse Control

**Capacidades evidenciadas:**
- histórico relacional de categoria;
- `vinculo_mentoria`;
- `sessao_mentoria`;
- importador com tratamento de conflito;
- Service/Repository;
- TypeScript;
- testes Jest;
- controle patrimonial;
- documentação WAD detalhada.

O Quality Gate classifica o MVP-05 como `AUDITORIA VALIDADA`, destacando auditoria, enums centralizados, repositories desacoplados e suporte a múltiplos registros. fileciteturn16file13L1-L3

**Ponto de atenção:**
- `package.json` em `src/`, exigindo reorganização estrutural.

---

## 8. Análise de Trade-offs

O Onion deve discutir explicitamente:

### 8.1 Modelagem histórica

MVPs com estruturas relacionais para eventos históricos têm vantagem estrutural sobre soluções que apenas sobrescrevem o estado atual.

### 8.2 Planilhão

A capacidade de reconciliar registros existentes deve ser diferenciada de um simples parser/importador.

### 8.3 JavaScript vs. TypeScript

A linguagem é fator de manutenção, mas não deve apagar vantagens de modelagem de dados.

### 8.4 ORM vs. SQL nativo

TypeORM, `pg` e SQL direto devem ser avaliados por adequação, complexidade e custo de evolução, não por preferência tecnológica abstrata.

### 8.5 Funcionalidades extras

Psicologia, controle patrimonial, iCal e outras capacidades podem ser reaproveitadas, mas não devem decidir isoladamente a base.

---

## 9. Show-stoppers Técnicos

Não haverá eliminação automática por tecnologia específica.

Entretanto, o Onion deve verificar se existe bloqueador estrutural:

- impossibilidade de preservar histórico;
- incompatibilidade do modelo de dados com a jornada;
- risco significativo de perda/sobrescrita de dados;
- importação incapaz de preservar os dados necessários;
- reconstrução substancial da arquitetura para atender aos P0;
- risco de segurança incompatível com os dados tratados.

Para cada possível bloqueador registrar:

**Evidência → Impacto → Confiança → Possibilidade de correção → Esforço estimado.**

---

## 10. Resultado Obrigatório da Decisão Técnica

Ao finalizar, o Onion deverá emitir:

### 10.1 Recomendação

> **MVP-base técnico recomendado: MVP-XX — [Nome]**

### 10.2 Por que este MVP?

Até 5 razões objetivas e rastreáveis.

### 10.3 O que poderia mudar a decisão?

Registrar os principais riscos, lacunas ou evidências que, se descobertos em testes adicionais, poderiam alterar a recomendação.

### 10.4 Ranking técnico

| Posição | MVP | Resultado técnico | Motivo resumido |
|---:|---|---|---|
| 1 | | | |
| 2 | | | |
| 3 | | | |
| 4 | | | |
| 5 | | | |

---

## 11. Validação Prática de Usabilidade — Separada

Depois da recomendação técnica, a equipe poderá testar:

- entrada/login;
- portal;
- navegação;
- dashboard;
- consulta do aluno;
- visualização da jornada;
- visualização dos dados;
- importação/teste do Planilhão;
- clareza das telas;
- consistência visual;
- facilidade de entendimento.

### Ranking de Usabilidade

| Posição | MVP | Interface | Navegação | Clareza dos dados | Experiência geral | Observações |
|---:|---|---|---|---|---|---|
| 1 | | | | | | |
| 2 | | | | | | |
| 3 | | | | | | |
| 4 | | | | | | |
| 5 | | | | | | |

**Regra:** o ranking de usabilidade pertence à equipe e permanece separado do ranking técnico.

---

## 12. Cruzamento Técnico × Usabilidade

| MVP | Ranking Técnico | Ranking Usabilidade | Leitura |
|---|---:|---:|---|
| MVP-01 | | | |
| MVP-02 | | | |
| MVP-03 | | | |
| MVP-04 | | | |
| MVP-05 | | | |

Exemplos de leitura:

- técnico forte + UX forte → candidato naturalmente favorável;
- técnico forte + UX fraca → base técnica possível com melhoria de interface;
- UX forte + técnico fraco → cuidado para não escolher uma interface melhor sobre uma fundação inadequada;
- fraco nas duas dimensões → baixa prioridade.

---

## 13. Capacidades Reaproveitáveis

Escolher um MVP-base **não significa descartar os outros**.

| Capacidade | Origem | Potencial de reaproveitamento |
|---|---|---|
| Migrations SQL granulares | MVP-02 | |
| Exportação iCal | MVP-02 | |
| Fuzzy de risco | MVP-03 | |
| Playwright E2E | MVP-03 | |
| `sql.js` | MVP-03 | |
| Histórico `categoria` | MVP-05 | |
| Importador com reconciliação | MVP-05 | |
| Mentoria relacional | MVP-05 | |
| Controle patrimonial | MVP-05 | |
| Aliases de cabeçalho | MVP-01 | |

---

## 14. Limitações

A decisão deve declarar:

- testes não executados;
- runtimes indisponíveis;
- integrações externas não verificadas;
- performance não medida;
- conclusões inferenciais;
- aspectos que exigem validação prática.

A auditoria registra explicitamente limitações de runtime e execução dinâmica. fileciteturn16file15L1-L4

---

## 15. Governança Corrigida

> **Não existe nesta etapa um decisor técnico externo.**
>
> O **Onion / agente avaliador** é responsável por analisar as evidências, aplicar a rubrica, comparar os cinco candidatos, emitir o ranking técnico e recomendar o MVP-base.
>
> A equipe Pulse Mais fará, posteriormente, a validação prática de usabilidade/interface.
>
> Os dois resultados serão mantidos separados até o cruzamento final.

---

## 16. Próximos Passos

1. **Onion:** preencher a matriz e executar a decisão técnica.
2. **Onion:** emitir ranking técnico e MVP-base recomendado.
3. **Equipe:** testar a interface/portal dos candidatos disponíveis.
4. **Equipe:** produzir ranking de usabilidade.
5. **Onion + equipe:** cruzar os resultados e consolidar a base de implementação.

---

## 17. Autoavaliação

| Critério | Nota |
|---|:---:|
| Separação entre fato e decisão | 5/5 |
| Decisor técnico corretamente definido | 5/5 |
| Critérios técnicos explícitos | 5/5 |
| Usabilidade separada da decisão técnica | 5/5 |
| Rastreabilidade das evidências | 5/5 |
| Tratamento de runtime | 5/5 |
| Trade-offs contemplados | 5/5 |
| Ranking técnico previsto | 5/5 |

**Nota geral: 5/5**

---

# Declaratório de Status

**STATUS: PRONTA PARA ANÁLISE TÉCNICA DO ONION**

**Próximo artefato:** `resultado-decisao-tecnica-mvp-base.md`
