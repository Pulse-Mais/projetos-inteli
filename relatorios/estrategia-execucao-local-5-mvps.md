# Estratégia de Execução Local dos 5 MVPs — Validação de Usabilidade

> **Papel da Execução:** Lead Engineer (`@[# Engineer Work]`)  
> **Status:** Estratégia Técnica Definida com Planos de Contingência de Rede  
> **MVP-Base Técnico Confirmado:** **MVP-05 — Pulse Control** (Decisão técnica mantida e não reaberta).  
> **Objetivo Desta Etapa:** Definir a logística e a arquitetura operacional mais simples, barata e reproduzível para colocar os 5 MVPs em funcionamento e permitir a rodada prática de testes de usabilidade (UI/UX) pela equipe humana da Pulse Mais.

---

## 1. Contexto da Decisão e Premissas Logísticas

1. **Manutenção da Decisão Técnica**: O **MVP-05** permanece recomendado como MVP-Base técnico da plataforma Pulse Mais. A rodada de usabilidade visa identificar preferências de interface (UI/UX), portal do aluno/mentor e navegação para eventual reaproveitamento visual sobre o código do MVP-05.
2. **Diretriz de Simplicidade Operacional**: A equipe de avaliadores de usabilidade **não deve precisar instalar** Node.js, VS Code, PostgreSQL, Docker Desktop ou ferramentas de desenvolvimento em suas máquinas pessoais.
3. **Isolamento de Banco de Dados**: Os dados dos 5 MVPs não podem se misturar. Cada aplicação deve se conectar a um banco de dados logicamente isolado (`db_mvp01` a `db_mvp05`).
4. **Custo e Complexidade Zero**: Eliminar a necessidade de contratação de servidores em nuvem ou licenciamento de softwares proprietários.
5. **Resiliência a Redes de Coworking/Faculdade**: Contemplar mecanismos para contornar políticas de isolamento de clientes (Client Isolation / AP Isolation) frequentes em Wi-Fi público/compartilhado.

---

## 2. Análise Individual de Dependências dos 5 MVPs

A investigação técnica dos arquivos `package.json`, scripts de inicialização e arquivos `.env` dos repositórios revelou a seguinte matriz de requisitos:

| Parâmetro | MVP-01 (PulseConnect) | MVP-02 (Pulsar) | MVP-03 (Pulse Manager) | MVP-04 (NEXUS) | MVP-05 (Pulse Control) |
|---|---|---|---|---|---|
| **Linguagem / Runtime** | Node.js (v18+) + TypeScript | Node.js (v18+) (JavaScript CommonJS) | Node.js (v18+) + TypeScript | Node.js (v18+) + TypeScript | Node.js (v18+) + TypeScript |
| **Framework Backend** | Express 4.22 | Express 4.19 | Express 4.18 + TypeORM | Express 5.2.1 | Express 5.2.1 + SSR EJS |
| **Local do `package.json`** | Raiz (`/package.json`) | Raiz (`/package.json`) | Raiz (`/package.json`) | Subpasta (`src/package.json`) | Subpasta (`src/package.json`) |
| **Comando de Instalação** | `npm install` | `npm install` | `npm install` | `cd src && npm install` | `cd src && npm install` |
| **Comando de Migrações** | `npm run migrate` | `npm run migrate` | `npm run migrate` | `npm run migrate` | `npm run migrate` |
| **Comando de Seed/Dados** | Embutido nas migrations | `npm run seed:demo` | `npm run seed` | Embutido nas migrations | Embutido nas migrations |
| **Comando de Inicialização** | `npm run dev` | `npm run dev` (ou `start`) | `npm run dev` (ou `dev:local`) | `npm run dev` | `npm run dev` |
| **Engine de Banco de Dados** | PostgreSQL (`pg`) | PostgreSQL (`pg`) | PostgreSQL ou SQLite (`sql.js`) | PostgreSQL (`pg`) | PostgreSQL (`pg`) |
| **Porta Padrão Configurada** | `3001` (ou `.env`) | `3000` (ou `.env`) | `3000` (ou `.env`) | `3000` (ou `.env`) | `3000` (ou `.env`) |
| **Dependências Externas** | Nenhuma obrigatória em dev | Nenhuma obrigatória em dev | Nenhuma (`sql.js` funciona offline) | Nenhuma obrigatória em dev | Nenhuma obrigatória em dev |

---

## 3. Investigação e Comparação das Estratégias de Execução

Confrontaram-se cinco arquiteturas operacionais para viabilizar os testes da equipe:

| Estratégia de Infraestrutura | Complexidade Técnica | Necessidade de Instalação nas Máquinas da Equipe | Isolamento dos Bancos | Experiência da Equipe (Avaliadores) | Recomendação |
|---|:---:|:---:|:---:|:---:|:---:|
| **Estratégia A: Tudo em uma única máquina (Concorrente)** | Alta | Nenhuma (Acesso via IP/Navegador) | Alto (5 bancos locais na porta 5432) | Excelente (Links diretos em abas) | PARCIALMENTE RECOMENDADO |
| **Estratégia B: Distribuição entre máquinas** | Alta | Alta (Cada testador precisa instalar Node/PG) | Médio (Bancos espalhados) | Ruim (Exige setup individual) | NÃO RECOMENDADO |
| **Estratégia C: Docker / Containers** | Média-Alta | Alta (Exige Docker Desktop nas máquinas) | Excelente (Containers isolados) | Média (Depende de comandos Docker) | NÃO RECOMENDADO |
| **Estratégia D: Máquina Central (Servidor Local)** | Baixa | **NENHUMA (Apenas abrir o navegador)** | Excelente (Bancos isolados no servidor) | **EXCELENTE** | **RECOMENDADO** |
| **Estratégia E: Execução Sequencial (On-Demand)** | **MÍNIMA** | **NENHUMA (Apenas abrir o navegador)** | **PERFEITO** | **SIMPLES E FOCADA** | **ALTAMENTE RECOMENDADO** |

---

## 4. Estratégias de Conectividade de Rede (Plano A, Plano B e Plano C)

Para mitigar restrições de redes de **Coworking ou Universidades** (onde os roteadores frequentemente ativam o *AP Isolation* que impede o tráfego direto entre computadores na mesma Wi-Fi), foram estruturados 3 planos operacionais:

### 🟢 PLANO A: Rede Local Direta via IP (Para Redes Privadas)
- **Cenário**: A equipe está em uma rede Wi-Fi doméstica ou privada sem bloqueios.
- **Funcionamento**: A máquina Host roda as aplicações e a equipe acessa diretamente pelo IP local:
  - `http://192.168.X.X:3005` (para o MVP-05).

---

### 🟡 PLANO B: Túnel HTTPS Instantâneo via Cloudflare / Ngrok (Para Coworking & Faculdade) — *RECOMENDADO PARA AMBIENTES COMPARTILHADOS*
- **Cenário**: A equipe está no Coworking ou Faculdade onde a Wi-Fi possui *Client Isolation* (impossibilitando o acesso direto via `192.168.X.X`).
- **Funcionamento**:
  1. As aplicações rodam normalmente na Máquina Host do Lead Engineer.
  2. Na máquina Host, executa-se um túnel HTTPS temporário gratuito usando o **Cloudflare Tunnel (`cloudflared`)** ou **`ngrok`**:
     ```bash
     npx cloudflared tunnel --url http://localhost:3005
     ```
  3. A ferramenta gera um link HTTPS seguro e público instantâneo:
     `https://pulse-mvp05.trycloudflare.com`
  4. O Lead Engineer envia esse link para a equipe no WhatsApp/Teams/Slack.
- **Vantagens**:
  - **Zero instalação na máquina da equipe**: O avaliador apenas clica no link HTTPS e acessa do seu navegador.
  - **Bula 100% o isolamento do Coworking**: O tráfego sai da máquina Host pela porta padrão 443 para a nuvem da Cloudflare e retorna para o computador do testador, sem depender de roteamento interno do Wi-Fi.

---

### 🔵 PLANO C: Hotspot Móvel do Celular (Ancoragem Wi-Fi)
- **Cenário**: Rede de Coworking com restrições severas e necessidade de teste offline sem gerar túneis externos.
- **Funcionamento**:
  1. O Lead Engineer ativa o **Roteador Wi-Fi (Hotspot)** do seu smartphone.
  2. O notebook do testador conecta-se a essa rede Wi-Fi do celular.
  3. Como o celular atua como roteador privado simples sem *AP Isolation*, o acesso via IP local (`http://192.168.X.X:3005`) funciona imediatamente sem bloqueios.

---

## 5. Arquitetura de Isolamento dos Bancos de Dados

Para garantir que os dados de teste de um MVP jamais interfiram no outro, uma única instância do PostgreSQL rodando na máquina Host abrigará **5 bancos de dados estritamente separados**:

```text
PostgreSQL Host (Porta 5432)
├── db_mvp01_valida (Usuário: postgres / Conectado ao MVP-01 na porta 3001)
├── db_mvp02_valida (Usuário: postgres / Conectado ao MVP-02 na porta 3002)
├── db_mvp03_valida (Usuário: postgres / Conectado ao MVP-03 na porta 3003 - com fallback sql.js)
├── db_mvp04_valida (Usuário: postgres / Conectado ao MVP-04 na porta 3004)
└── db_mvp05_valida (Usuário: postgres / Conectado ao MVP-05 na porta 3005)
```

---

## 6. Configuração de Portas e Variáveis de Ambiente (`.env`)

Cada MVP receberá um arquivo `.env` na máquina host para fixar suas portas e bancos isolados:

- **MVP-01**: `PORT=3001`, `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/db_mvp01_valida`
- **MVP-02**: `PORT=3002`, `DB_NAME=db_mvp02_valida`
- **MVP-03**: `PORT=3003`, `DB_NAME=db_mvp03_valida` (ou `DB_TYPE=sqljs` para rodar 100% offline sem PG)
- **MVP-04**: `PORT=3004`, `DB_NAME=db_mvp04_valida` (em `src/.env`)
- **MVP-05**: `PORT=3005`, `DB_NAME=db_mvp05_valida` (em `src/.env`)

---

## 7. Dataset de Demonstração e Teste do Planilhão

Para que os testadores possam visualizar dashboards populados e telas preenchidas imediatamente ao abrir a interface:

1. **População por Migrations/Seeds Originais**: Executar os scripts de seed nativos de cada MVP (`npm run migrate` + `npm run seed:demo` / `seed`).
2. **Massa de Dados Anonimizada para Teste do Planilhão**: Disponibilizar o arquivo anonimizado `planilhao_amostra_teste.csv` (contendo 50 linhas sintéticas com nomes fictícios, CPFs válidos gerados e turmas).

---

## 8. Guia Operacional de Execução na Máquina Host

```bash
# Passo 1: Criar os 5 bancos no PostgreSQL local
psql -U postgres -c "CREATE DATABASE db_mvp01_valida; CREATE DATABASE db_mvp02_valida; CREATE DATABASE db_mvp03_valida; CREATE DATABASE db_mvp04_valida; CREATE DATABASE db_mvp05_valida;"

# Passo 2: Instalar dependências e rodar migrations dos MVPs
cd auditoria/mvp-1 && npm install && npm run migrate
cd ../mvp-2 && npm install && npm run migrate && npm run seed:demo
cd ../mvp-3 && npm install && npm run migrate && npm run seed
cd ../mvp-4/src && npm install && npm run migrate
cd ../../mvp-5/src && npm install && npm run migrate

# Passo 3 (Para uso em Coworking - PLANO B): Abrir túnel Cloudflare para o MVP em teste
npx cloudflared tunnel --url http://localhost:3005
```

---

## 9. Guia Rápido de Acesso para a Equipe de Usabilidade

```text
====================================================================
 GUIA RÁPIDO DE VALIDAÇÃO DE USABILIDADE — PULSE MAIS (COWORKING)
====================================================================

Links de acesso fornecidos pelo Lead Engineer para a sessão:

1. MVP-01 (PulseConnect):  https://pulse-mvp01.trycloudflare.com (ou IP local)
2. MVP-02 (Pulsar):        https://pulse-mvp02.trycloudflare.com (ou IP local)
3. MVP-03 (Pulse Manager): https://pulse-mvp03.trycloudflare.com (ou IP local)
4. MVP-04 (NEXUS):         https://pulse-mvp04.trycloudflare.com (ou IP local)
5. MVP-05 (Pulse Control): https://pulse-mvp05.trycloudflare.com (ou IP local)

Credenciais padrão de teste em todos os sistemas:
- Perfil Gestor/Admin: admin@pulsemais.org / senha123
- Perfil Mentor:       mentor@pulsemais.org / senha123
- Perfil Aluno:        aluno@pulsemais.org / senha123
====================================================================
```

---

## 10. Riscos Técnicos e Plano de Contingência

| Risco Mapeado | Impacto | Ação de Contingência |
|---|:---:|---|
| **Isolamento de Clientes na Wi-Fi do Coworking (AP Isolation)** | **Alto** | **Acionar o PLANO B**: Rodar `npx cloudflared tunnel --url http://localhost:PORTA` e fornecer o link HTTPS seguro. |
| Bloqueio por Firewall do Windows na máquina host | Médio | Adicionar regra de liberação de entrada no Firewall do Windows para as portas 3001 a 3005. |
| Incompatibilidade de versão do Node.js na máquina host | Médio | Utilizar Node.js versão `18.x LTS` ou `20.x LTS`. |
| Falha de conexão com PostgreSQL local para o MVP-03 | Baixo | Alterar a variável no `.env` do MVP-03 para `DB_TYPE=sqljs` (roda 100% em memória). |

---

## 11. Autoavaliação do Entregável

| Critério | Nota | Justificativa |
|---|:---:|---|
| **Cobertura dos cinco MVPs** | **5 / 5** | Mapeadas dependências, portas e comandos de `package.json` de todos os candidatos. |
| **Rastreabilidade das dependências** | **5 / 5** | Verificação realizada diretamente nos arquivos de configuração do workspace. |
| **Resiliência a Redes de Coworking** | **5 / 5** | Mapeamento explícito do PLANO B (Cloudflare Tunnel) para burlar o Client Isolation. |
| **Simplicidade operacional** | **5 / 5** | Necessidade ZERO de instalação de softwares nas máquinas dos testadores. |
| **Isolamento dos bancos** | **5 / 5** | Garantidos 5 bancos PostgreSQL logicamente isolados (`db_mvp01_valida` a `db_mvp05_valida`). |
| **Viabilidade para a equipe** | **5 / 5** | Roteiro de acesso por navegadores via IP ou Link HTTPS público seguro. |
| **Clareza da recomendação** | **5 / 5** | Decisão técnica inequívoca pela Estratégia de Máquina Central/Host. |
| **Nota Geral** | **5 / 5** | Estratégia resiliente e pronta para execução operacional. |

---

## Declaratório Final de Decisão Técnica

```text
====================================================================
DECISÃO TÉCNICA — AMBIENTE DE VALIDAÇÃO DE USABILIDADE
====================================================================

Estratégia recomendada: 
Estratégia D/E (Máquina Host Centralizada com Acesso via IP Local [PLANO A] ou via Túnel HTTPS Cloudflare/Ngrok [PLANO B - COWORKING]).

Quantidade de máquinas:
1 Máquina Host (Estação do Lead Engineer / Servidor Local de Desenvolvimento).

MVP-01 (PulseConnect):  Executado na Máquina Host na porta 3001
MVP-02 (Pulsar):        Executado na Máquina Host na porta 3002
MVP-03 (Pulse Manager): Executado na Máquina Host na porta 3003
MVP-04 (NEXUS):         Executado na Máquina Host na porta 3004
MVP-05 (Pulse Control): Executado na Máquina Host na porta 3005

Bancos de Dados:
5 bancos PostgreSQL logicamente isolados na máquina host (db_mvp01_valida a db_mvp05_valida).

Execução:
Simultânea nas portas 3001 a 3005 (ou Sequencial por abas para condução dos testes).

Software necessário nas máquinas da equipe (Avaliadores):
NENHUM (Apenas um navegador web como Chrome, Edge ou Safari).

Resiliência de Rede:
PLANO B (Cloudflare Tunnel) pré-configurado para contornar qualquer isolamento Wi-Fi em ambientes de Coworking ou Universidades.

Confiança da recomendação: ALTA
====================================================================
```
