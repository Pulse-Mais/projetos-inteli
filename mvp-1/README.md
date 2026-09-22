# Inteli - Instituto de Tecnologia e Liderança


<p align="center">
<a href="https://www.inteli.edu.br/"><img src="documents/others/assets/inteli.png" alt="Inteli - Instituto de Tecnologia e Liderança" border="0"></a>
</p>


<h1 align="center">PulseConnect</h1>


<p align="center">
<img src="./documents/others/assets/logoPulseConnect.png" alt="Pulse Mais" height="90">
</p>


## Grupo 01


### :student: Integrantes


- <a href="https://www.linkedin.com/in/bernardo-bittencourt-27b8643aa">Bernardo de Assis Bittencourt e Silva</a>
- <a href="https://www.linkedin.com/in/breno-gallego-martins/">Breno Gallego Martins</a>
- <a href="https://www.linkedin.com/in/eric-ferraz-52069b3b8/">Eric Pimentel Ferraz</a>
- <a href="https://www.linkedin.com/in/erika-vieira-tech/">Erika Vieira de Souza</a>
- <a href="https://www.linkedin.com/in/gabriel-lorenzo-baglioli-de-loyola/">Gabriel Lorenzo Baglioli de Loyola</a>
- <a href="https://www.linkedin.com/in/guilhermebarbosa-souza">Guilherme Barbosa de Souza</a>
- <a href="https://www.linkedin.com/in/leticia-antunes-0a3a843aa/">Leticia Antunes de Freitas</a>
- <a href="https://www.linkedin.com/in/matteus-haikal-86b2bb39b/">Matteus Ferreira Haikal Giglio</a>


### :teacher: Professores


**Orientador(a)**


- <a href="https://www.linkedin.com/in/juliastateri/">Julia Stateri</a>


**Instrutores**


- <a href="https://www.linkedin.com/in/anacristinadossantos/">Ana Cristina dos Santos</a>
- <a href="https://www.linkedin.com/in/zotovici/">Andréa Zotovici</a>
- <a href="https://www.linkedin.com/in/fabiocassiosouza/">Fábio Cássio de Souza</a>
- <a href="https://www.linkedin.com/in/fernando-pizzo-208b526a/">Fernando Pizzo Ribeiro</a>
- <a href="https://www.linkedin.com/in/vanunes/">Vanessa Tavares Nunes</a>


---


## 📝 Descrição


A **PulseConnect** é uma aplicação web desenvolvida para a **Pulse Mais**, organização sem fins lucrativos que atua na formação de jovens de baixa renda para carreiras em tecnologia. Atualmente, grande parte das informações da instituição encontra-se distribuída entre planilhas, documentos e conversas em aplicativos de mensagens, dificultando o acompanhamento da trajetória dos participantes e a mensuração do impacto gerado pelos programas oferecidos.


A solução proposta atua como uma **Única Fonte da Verdade (Single Source of Truth – SSOT)**, centralizando e organizando os dados da organização em uma única plataforma segura e acessível. O sistema permite o gerenciamento de informações de alunos, ex-alunos, mentores, coordenadores e demais participantes dos programas, possibilitando o acompanhamento completo da jornada de cada jovem desde sua entrada na instituição até sua inserção no mercado de trabalho.


A plataforma oferece funcionalidades como cadastro e consulta de perfis, registro de frequência, acompanhamento de atividades e mentorias, histórico acadêmico e profissional, além de dashboards com indicadores estratégicos que auxiliam a coordenação na tomada de decisões e na avaliação dos resultados alcançados. O sistema também conta com mecanismos de importação de dados por planilhas, reduzindo o trabalho manual e facilitando a atualização das informações.


Por ser uma aplicação web, a PulseConnect pode ser acessada por diferentes perfis de usuários em dispositivos desktop e móveis, proporcionando praticidade e flexibilidade no uso da ferramenta. Sua arquitetura foi desenvolvida seguindo o padrão em camadas, utilizando tecnologias modernas como Node.js, Express, TypeScript, PostgreSQL e Supabase, garantindo segurança, escalabilidade e facilidade de manutenção.


O desenvolvimento do projeto ocorre ao longo de 10 semanas e é realizado por uma equipe multidisciplinar de estudantes do Inteli, em parceria com a Pulse Mais. O principal diferencial da solução está na capacidade de consolidar informações dispersas em um ambiente único e confiável, permitindo uma visão longitudinal da trajetória dos jovens atendidos e fortalecendo a gestão baseada em dados. Dessa forma, a PulseConnect contribui diretamente para ampliar a eficiência operacional da organização e potencializar seu impacto social.

## 🎬 Link de demonstração

https://youtu.be/DtBBhbaugA4

## 📁 Estrutura de pastas

Dentre os arquivos e pastas presentes no projeto, definem-se:

```txt
g01/
├── assets/
├── documents/
│   ├── wad.md                  # Web Application Document (WAD)
│   └── others/
│       └── assets/             # Diagramas e materiais de apoio
│
├── src/
│   ├── frontend/
│   │   ├── assets/             # Imagens e elementos estáticos (logos, ícones, etc.)
│   │   ├── css/                # Folhas de estilo das páginas
│   │   ├── js/                 # Scripts do front-end
│   │   ├── pages/              # Páginas HTML da aplicação
│   │   └── index.html          # Página inicial da aplicação
│   │
│   └── backend/
│       ├── controllers/        # Recebem requisições HTTP e retornam respostas
│       ├── services/           # Regras de negócio da aplicação
│       ├── repositories/       # Acesso e manipulação dos dados
│       ├── routes/             # Definição das rotas da API
│       ├── db/
│       │   └── migrations/     # Scripts de migração
│       ├── middlewares/        # Interceptação e tratamento de requisições
│       ├── helpers/            # Funções utilitárias reutilizáveis
│       ├── errors/             # Classes de tratamento de erros personalizados
│       ├── docs/               # Documentação da API
│       ├── views/              # Templates renderizados pelo servidor
│       ├── tests/              # Testes unitários e de integração
│       ├── app.ts              # Configuração principal do Express
│       └── server.ts           # Ponto de entrada da aplicação
│
├── .env.example                # Modelo de variáveis de ambiente
├── .gitattributes              # Configurações de atributos dos arquivos no Git
├── .gitignore                  # Arquivos e pastas ignorados pelo Git
├── package.json                # Dependências e scripts npm
├── tsconfig.json               # Configuração do TypeScript
├── jest.config.cjs             # Configuração dos testes
└── README.md                   # Documentação principal do projeto
```

## 💻 Configuração e execução

### ✅ Pré-requisitos


Antes de começar, verifique se você tem instalado:


- **Node.js** versão 18 ou superior → [nodejs.org](https://nodejs.org/) — verifique com `node -v`
- **npm** (vem junto com o Node) — verifique com `npm -v`
- **Git** → [git-scm.com](https://git-scm.com/) — verifique com `git -v`
- **VSCode** (recomendado) → [code.visualstudio.com](https://code.visualstudio.com/)
- Acesso ao projeto no **[Supabase](https://supabase.com/)** (ou um banco PostgreSQL próprio) para obter as credenciais do `.env`.


### Passo a passo


**1. Clone o repositório**


```sh
git clone https://git.inteli.edu.br/graduacao/2026-1b/t29/g01.git
cd g01
```


**2. Instale as dependências**


```sh
npm install
```


Aguarde terminar — vai aparecer algo como `added 123 packages`. Esse passo só precisa ser repetido quando alguém adicionar uma nova dependência.


**3. Configure o arquivo `.env`**


O projeto precisa de um arquivo `.env` na raiz com as credenciais do Supabase. Esse arquivo **não está versionado** (já está no `.gitignore`) — cada pessoa cria o seu a partir do modelo `.env.example`:


```sh
# Mac/Linux
cp .env.example .env


# Windows (PowerShell)
copy .env.example .env
```


Em seguida, preencha os valores conforme a seção **🔑 Variáveis de ambiente** abaixo.


> ⚠️ Os valores reais (chaves do Supabase, SMTP) **não ficam no repositório**. Peça-os a um membro do time que já tem acesso. Nunca faça commit do arquivo `.env`.


**4. Suba o servidor (modo desenvolvimento)**


```sh
npm run dev
```


Se tudo estiver certo, o terminal mostra:


```
🚀 Servidor rodando em http://localhost:3000
   Health check: http://localhost:3000/health
```


O servidor precisa ficar rodando neste terminal enquanto você usa a aplicação. `Ctrl+C` encerra; rode `npm run dev` de novo para subir.


**5. Verifique se está funcionando**


Com o servidor no ar, acesse no navegador:


- `http://localhost:3000/health` → deve retornar `{"status":"ok","db":"connected","project":"Pulse Mais G01"}`
- `http://localhost:3000/alunos` → retorna `[]` ou a lista de alunos
- `http://localhost:3000/docs` → documentação navegável de todos os endpoints da API
- `http://localhost:3000/` → front-end (páginas estáticas em `pages/`)


### Execução com o banco de dados


A aplicação se conecta ao **PostgreSQL** de duas formas, dependendo do que está em uso:


- **Cliente Supabase** (`@supabase/supabase-js`) — usado pela maior parte das consultas; precisa de `SUPABASE_URL` + uma chave (`SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_KEY` ou `SUPABASE_ANON_KEY`).
- **Pool `pg`** (conexão direta) — usado por migrações e alguns testes de integração; precisa de `DATABASE_URL`.


**Rodar as migrações** (cria/atualiza a estrutura de tabelas a partir de `src/backend/db/migrations/migration.sql`):


```sh
npm run migrate
```


> O script de migração lê a `DATABASE_URL`. Em produção (`NODE_ENV=production`) a conexão usa SSL automaticamente.


Para testar apenas a conexão com o banco:


```sh
npm run test:connection
```


### Comandos disponíveis


| Comando | O que faz |
| --- | --- |
| `npm run dev` | Sobe o servidor em modo desenvolvimento (reinicia ao salvar) |
| `npm run build` | Compila o TypeScript (`src/`) para JavaScript (`dist/`) |
| `npm start` | Roda a versão compilada (`dist/server.js`) — use após `npm run build` |
| `npm run migrate` | Executa as migrações do banco de dados |
| `npm test` | Roda toda a suíte de testes |
| `npm run test:connection` | Testa apenas a conexão com o PostgreSQL |
| `npm run test:watch` | Roda os testes observando mudanças |
| `npm run test:coverage` | Roda os testes e mostra a cobertura de código |


## 🐛 Problemas comuns


**"Cannot find module" ou erro de dependência**
→ Rode `npm install` novamente.


**`db: disconnected` no `/health`**
→ Verifique se o `.env` existe na raiz e se `SUPABASE_URL` e a chave do Supabase estão corretas (sem espaços nem aspas extras).


**Porta 3000 já em uso**
→ Mude o valor de `PORT` no `.env` para `3001` (ou outro número).


**`tsx: command not found`**
→ Rode `npm install` novamente.


## 📦 Histórico de lançamentos


- **0.5.0** — 2026-06-25 — Versão final para entrega acadêmica: integração completa entre front-end e back-end, refinamento dos fluxos de navegação, consolidação da arquitetura, documentação técnica revisada e Sprint Review finalizada.


- **0.4.0** — 2026-06-11 — Evolução funcional da plataforma: implementação dos fluxos de acompanhamento longitudinal, melhorias nos dashboards e visualizações, refinamento das permissões por perfil, atualização dos diagramas UML (arquitetura, classes, sequência e implantação) e dos padrões de projeto.


- **0.3.0** — 2026-05-28 — Consolidação da qualidade: suíte de testes automatizados ampliada (31 suítes / 439 testes, todos aprovados), Matriz de Rastreabilidade (RTM) validada contra os testes, ampliação da documentação arquitetural e documentação do WAD finalizada para entrega.


- **0.2.0** — 2026-05-14 — Segunda versão funcional do back-end: fluxos principais operando (alunos, eventos, mentorias, dashboards, importação) e documentação da API em `/docs`.


- **0.1.0** — 2026-04-30 — Estrutura inicial do projeto, modelagem do banco de dados e wireframes.


## 📋 Licença


<img style="height:22px!important;margin-left:3px;vertical-align:text-bottom;" src="https://mirrors.creativecommons.org/presskit/icons/cc.svg?ref=chooser-v1">
<img style="height:22px!important;margin-left:3px;vertical-align:text-bottom;" src="https://mirrors.creativecommons.org/presskit/icons/by.svg?ref=chooser-v1">

<p xmlns:cc="http://creativecommons.org/ns#"
xmlns:dct="http://purl.org/dc/terms/">

<a property="dct:title" rel="cc:attributionURL" href="#">
PulseConnect
</a> by <a rel="cc:attributionURL dct:creator" property="cc:attributionName" href="https://www.inteli.edu.br/">
Inteli — Instituto de Tecnologia e Liderança</a>, <a rel="cc:attributionURL dct:creator" property="cc:attributionName" href="https://www.linkedin.com/in/bernardo-bittencourt-27b8643aa">
Bernardo de Assis Bittencourt e Silva</a>, <a rel="cc:attributionURL dct:creator" property="cc:attributionName" href="https://www.linkedin.com/in/breno-gallego-martins/">
Breno Gallego Martins</a>, <a rel="cc:attributionURL dct:creator" property="cc:attributionName" href="https://www.linkedin.com/in/eric-ferraz-52069b3b8/">
Eric Pimentel Ferraz</a>, <a rel="cc:attributionURL dct:creator" property="cc:attributionName" href="https://www.linkedin.com/in/erika-vieira-tech/">
Erika Vieira de Souza</a>, <a rel="cc:attributionURL dct:creator" property="cc:attributionName" href="https://www.linkedin.com/in/gabriel-lorenzo-baglioli-de-loyola/">
Gabriel Lorenzo Baglioli de Loyola</a>, <a rel="cc:attributionURL dct:creator" property="cc:attributionName" href="https://www.linkedin.com/in/guilhermebarbosa-souza">
Guilherme Barbosa de Souza</a>, <a rel="cc:attributionURL dct:creator" property="cc:attributionName" href="https://www.linkedin.com/in/leticia-antunes-0a3a843aa/">
Leticia Antunes de Freitas</a> e <a rel="cc:attributionURL dct:creator" property="cc:attributionName" href="https://www.linkedin.com/in/matteus-haikal-86b2bb39b/">
Matteus Ferreira Haikal Giglio</a> is licensed under <a href="https://creativecommons.org/licenses/by/4.0/?ref=chooser-v1"
target="_blank"
rel="license noopener noreferrer"
style="display:inline-block;">
Attribution 4.0 International</a>.

</p>