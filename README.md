# Auditoria dos MVPs — Plataforma Pulse Mais

> Documento de controle do processo de auditoria dos MVPs recebidos ao final da sprint.

---

## 1. Objetivo

Esta pasta contém os projetos MVP recebidos para avaliação técnica, funcional e operacional antes da escolha da solução que será utilizada como base para a implantação da Plataforma Pulse Mais.

Foram recebidos cinco projetos que buscam resolver, de formas diferentes, o mesmo problema de negócio.

O objetivo da auditoria não é escolher o projeto com maior quantidade de funcionalidades, mas identificar qual solução apresenta a melhor combinação entre:

- aderência ao negócio da Pulse Mais;
- capacidade de representar a jornada dos jovens;
- mensuração de impacto e indicadores;
- usabilidade e experiência;
- facilidade de implantação;
- qualidade técnica;
- segurança;
- escalabilidade;
- potencial de evolução;
- custo de operação.

O MVP selecionado será utilizado como **base da implantação**, podendo receber posteriormente ajustes, correções e funcionalidades identificadas nos demais projetos.

---

## 2. Contexto da avaliação

A Pulse Mais receberá os projetos desenvolvidos por equipes externas no modelo de consultoria.

A organização será responsável pela continuidade do projeto após o encerramento da sprint, incluindo:

- implantação;
- operação;
- manutenção;
- evolução;
- governança dos dados;
- infraestrutura;
- custos;
- segurança;
- suporte aos usuários.

Por esse motivo, a escolha do MVP não deve considerar apenas a qualidade apresentada durante a sprint.

A solução escolhida precisa ser sustentável para a realidade operacional e financeira da Pulse Mais.

---

## 3. Escopo da auditoria

Cada MVP será avaliado considerando os seguintes aspectos:

### Negócio

- aderência ao contexto da Pulse Mais;
- aderência aos pilares de impacto;
- representação da jornada dos jovens;
- aderência às regras de negócio;
- capacidade de apoiar as decisões da Coordenação;
- capacidade de apresentar os indicadores da Diretoria.

### Dados

- modelo de dados;
- relacionamentos;
- integridade;
- histórico;
- duplicidades;
- capacidade de importação do Planilhão;
- capacidade de evolução do modelo;
- rastreabilidade dos dados.

### Funcionalidades

- gestão da jornada;
- acompanhamento dos capacitados;
- progresso;
- frequência;
- reposições;
- mentorias;
- identificação de risco de evasão;
- comparação entre turmas;
- indicadores da Coordenação;
- indicadores da Diretoria.

### Qualidade técnica

- arquitetura;
- organização do código;
- frontend;
- backend;
- banco de dados;
- APIs;
- tratamento de erros;
- testes;
- documentação;
- manutenção.

### Segurança

- autenticação;
- autorização;
- controle de acesso;
- proteção de dados;
- isolamento entre entidades;
- tratamento de informações sensíveis;
- configurações de segurança.

### Implantação

- facilidade para executar localmente;
- facilidade para configurar ambientes;
- documentação de instalação;
- configuração de produção;
- deploy;
- dependências externas;
- migração do banco;
- backup;
- recuperação.

### Infraestrutura e custos

- serviços utilizados;
- dependências de terceiros;
- infraestrutura necessária;
- estimativa de custo;
- complexidade operacional;
- riscos de crescimento de custo.

### Evolução

- escalabilidade;
- extensibilidade;
- facilidade para adicionar funcionalidades;
- qualidade da arquitetura para futuras integrações;
- capacidade de aproveitar funcionalidades dos demais MVPs.

---

# 4. Princípio de independência da auditoria

Os MVPs devem ser analisados inicialmente em seu estado original de entrega.

Durante a auditoria:

- não corrigir o código do candidato;
- não alterar sua arquitetura;
- não implementar funcionalidades;
- não modificar seu banco;
- não substituir dependências;
- não realizar melhorias estruturais antes da avaliação.

Problemas encontrados devem ser registrados como evidências e limitações.

Correções poderão ser realizadas posteriormente no MVP escolhido.

---

# 5. Regra de evidência

A documentação fornecida pela equipe do MVP não deve ser considerada automaticamente como prova de funcionamento.

Uma funcionalidade descrita no `README.md`, por exemplo, deve ser diferenciada de uma funcionalidade efetivamente comprovada.

## Classificação das evidências

| Classificação | Significado |
|---|---|
| **Confirmado** | Foi comprovado por código, teste ou execução da aplicação. |
| **Parcialmente confirmado** | Existe implementação, mas apresenta limitações ou comportamento incompleto. |
| **Declarado** | Foi informado na documentação, mas ainda não foi comprovado. |
| **Não encontrado** | Não foi localizada evidência da implementação. |
| **Não aplicável** | O critério não se aplica ao projeto avaliado. |
| **Bloqueado para avaliação** | Não foi possível verificar o critério por impedimento técnico ou operacional. |

### Regra principal

> **Declaração não equivale a evidência.**

Sempre que possível, as conclusões devem indicar de onde veio a evidência.

---

# 6. Fontes utilizadas na auditoria

A auditoria utilizará como referência os documentos oficiais da Pulse Mais e os próprios projetos recebidos.

## Documentação da Pulse Mais

### Contexto

- `docs/contexto/contexto-negocio.md`
- `docs/contexto/modelo-operacional.md`
- `docs/contexto/contexto-tecnico.md`

### Governança

- `docs/governança/criterios-aceite-mvp.md`
- `docs/governança/checklist-homologacao.md`
- `docs/governança/checklist-go-live.md`

### Impacto

- `docs/impacto/definicoes-impacto.md`
- `docs/impacto/indicadores.md`
- `docs/impacto/modelo-jornada.md`

### Produto

- `docs/produto/tapi-v1.md`
- `docs/produto/historias-usuario.md`
- `docs/produto/requisitos.md`
- `docs/produto/roadmap.md`

### Implantação

- `docs/implementação/plano-implantacao.md`

### Auditoria

- `docs/relatorios/protocolo-auditoria-mvp.md`
- `docs/relatorios/instrumento-avaliacao-pulse.md`
- `docs/relatorios/relatorio-auditoria.md`

---

# 7. Projetos Candidatos e Relatórios de Auditoria Profunda

Foram auditados factualmente cinco MVPs candidatos. Todos os relatórios foram elaborados sem atribuição de notas, rankings ou indicação prévia de vencedor:

| MVP | Nome da Solução / Grupo | Diretório do Código | Inventário Inicial | Relatório de Auditoria Profunda | Status |
|---|---|---|---|---|---|
| **MVP-01** | PulseConnect (Grupo 01) | [`auditoria/mvp-1/`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/mvp-1) | [`inventario-mvp-01.md`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/inventario-mvp-01.md) | [`auditoria-profunda.md`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/relatorios/mvp-01/auditoria-profunda.md) | Auditoria Profunda Concluída |
| **MVP-02** | Pulsar (Equipe Pulsar / G02) | [`auditoria/mvp-2/`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/mvp-2) | [`inventario-mvp-02.md`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/inventario-mvp-02.md) | [`auditoria-profunda.md`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/relatorios/mvp-02/auditoria-profunda.md) | Auditoria Profunda Concluída |
| **MVP-03** | Pulse Manager (Grupo 03) | [`auditoria/mvp-3/`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/mvp-3) | [`inventario-mvp-03.md`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/inventario-mvp-03.md) | [`auditoria-profunda.md`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/relatorios/mvp-03/auditoria-profunda.md) | Auditoria Profunda Concluída |
| **MVP-04** | NEXUS (Grupo NEXUS / G04) | [`auditoria/mvp-4/`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/mvp-4) | [`inventario-mvp-04.md`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/inventario-mvp-04.md) | [`auditoria-profunda.md`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/relatorios/mvp-04/auditoria-profunda.md) | Auditoria Profunda Concluída |
| **MVP-05** | Pulse Control (Grupo 05) | [`auditoria/mvp-5/`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/mvp-5) | [`inventario-mvp-05.md`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/inventario-mvp-05.md) | [`auditoria-profunda.md`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/relatorios/mvp-05/auditoria-profunda.md) | Auditoria Profunda Concluída |

- **Relatório Comparativo Factual entre MVPs:** [`auditoria/relatorios/comparativo-mvps.md`](file:///c:/Users/edumo/OneDrive/Documentos/pulsar/pulsar-plataforma/auditoria/relatorios/comparativo-mvps.md)

---

# 8. Estrutura esperada de cada candidato

Cada MVP deve permanecer isolado dentro de seu respectivo diretório.

Estrutura recomendada:

```text
auditoria/
├── README.md
│
├── mvp-01/
│   ├── projeto/
│   └── evidencias/
│
├── mvp-02/
│   ├── projeto/
│   └── evidencias/
│
├── mvp-03/
│   ├── projeto/
│   └── evidencias/
│
├── mvp-04/
│   ├── projeto/
│   └── evidencias/
│
└── mvp-05/
    ├── projeto/
    └── evidencias/
```


## Stack tecnológica comum

Os cinco MVPs recebidos utilizam a mesma base tecnológica:

- React
- TypeScript
- Node.js
- PostgreSQL

Portanto, a auditoria não utilizará a escolha dessas tecnologias como critério relevante de diferenciação entre os candidatos.

A avaliação deverá concentrar-se principalmente na qualidade da implementação, arquitetura, modelo de dados, aderência ao negócio, funcionalidades, experiência de uso, segurança, facilidade de implantação, custos e potencial de evolução.

Eventuais diferenças dentro dessa mesma stack deverão ser registradas quando representarem uma decisão técnica relevante para a manutenção, segurança, desempenho ou evolução da plataforma.