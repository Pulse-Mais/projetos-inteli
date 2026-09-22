# Relatório Executivo — Escolha do MVP-Base da Plataforma Pulse Mais

> **Status:** Recomendação Técnica Concluída  
> **MVP Recomendado como Base:** **MVP-05 — Pulse Control**  
> **Público:** Diretoria, Coordenação, Equipe de Produto e Equipe de Engenharia.

---

## 1. O que Analisamos?

Analisamos detalhadamente os **cinco projetos de software (MVPs 01 a 05)** desenvolvidos para a plataforma interna da Pulse Mais. A avaliação examinou como cada projeto organiza as informações dos alunos, guarda a história do jovem ao longo dos anos, importa o "Planilhão" sem perder dados e garante a segurança do sistema.

---

## 2. O que Descobrimos?

Descobrimos que cada projeto trouxe contribuições importantes, mas eles possuem diferenças fundamentais de construção:

- **MVPs 01 e 04**: Possuem telas e organização de código modernas, mas quando o aluno muda de fase na jornada, o sistema **apaga a fase anterior** e grava por cima a nova fase, perdendo a data exata e o histórico de como ele evoluiu.
- **MVP-02**: Possui uma excelente estrutura de banco de dados para guardar empregos e cursos, mas foi escrito em uma linguagem antiga de programação que exige bastante retrabalho para ser modernizada.
- **MVP-03**: Trouxe recursos inovadores (como um sistema inteligente que calcula o risco de o aluno faltar ou desistir), mas guarda parte dos dados históricos misturados como texto simples.
- **MVP-05**: Foi o único projeto que construiu uma **tabela de histórico dedicada e auditada**. Sempre que um jovem muda de categoria, o sistema guarda a fase antiga, a nova fase, quem fez a alteração e a data exata. Além disso, ele é o único que consegue ler o Planilhão e atualizar cadastros repetidos sem apagar informações.

---

## 3. Qual MVP Recomendamos?

> **Recomendamos o MVP-05 (Pulse Control) como a base oficial do sistema.**

---

## 4. Por que Escolhemos o MVP-05? (5 Razões Simples)

1. **Guarda a História Real do Aluno**: É o único que não apaga o passado do jovem quando ele avança na jornada (Conectado $\rightarrow$ Capacitado $\rightarrow$ Transformado).
2. **Resolve o Planilhão Sem Erros**: Quando uma planilha é importada, o sistema reconhece se o aluno já existe pelo CPF/E-mail e atualiza o cadastro em vez de dar erro ou criar duplicados.
3. **Módulo de Mentoria Completo**: Já possui estrutura própria para organizar quem é o mentor do aluno e acompanhar as sessões de mentoria realizadas.
4. **Código Moderno e Organizado**: Foi construído em **TypeScript** (a linguagem padrão da indústria), o que facilita a manutenção e evolução da plataforma.
5. **Menor Risco de Retrabalho**: É a solução que exige a menor quantidade de alterações perigosas na estrutura do banco de dados para entrar em funcionamento.

---

## 5. O que Ainda Precisa Ser Melhorado no MVP-05?

- Reorganizar a pasta do projeto (um arquivo de configuração precisa ser movido da pasta interna para a pasta principal).
- Realizar a limpeza e o ajuste final das telas para a identidade visual oficial da Pulse Mais.
- Configurar os acessos finais para os servidores de produção.

---

## 6. O que Vamos Aproveitar dos Outros MVPs?

Escolher o MVP-05 não significa jogar os outros fora. Vamos integrar as melhores ideias dos outros projetos ao MVP-05:

- **Do MVP-02**: O sistema de exportação de agendas de mentoria para o Google Calendar/Outlook e os testes automatizados de estresse.
- **Do MVP-03**: O algoritmo inteligente que calcula o Risco de Evasão do aluno e o sistema de testes automatizados de navegação (Playwright).
- **Do MVP-01**: A rotina inteligente de leitura de planilhas com nomes de colunas flexíveis.
- **Do MVP-04**: O validador de envio de fotos de perfil dos alunos.

---

## 7. Ranking Técnico dos 5 MVPs

| Posição | MVP | Nome | Avaliação Geral | Motivo Principal |
|:---:|---|---|:---:|---|
| **1º** | **MVP-05** | **Pulse Control** | **Excelente (8,9)** | Melhor histórico de dados, mentoria dedicada e importação do Planilhão. |
| **2º** | **MVP-03** | **Pulse Manager** | **Muito Bom (8,1)** | Excelente importador de planilhas e cálculo inteligente de risco de evasão. |
| **3º** | **MVP-02** | **Pulsar** | **Bom (6,9)** | Banco de dados muito bom, mas feito em linguagem mais antiga. |
| **4º** | **MVP-01** | **PulseConnect** | **Regular (5,9)** | Código muito limpo, mas apaga o histórico antigo do aluno ao atualizar a fase. |
| **5º** | **MVP-04** | **NEXUS** | **Regular (5,3)** | Boas telas, mas apaga o histórico e não possui importador com reconciliação. |

---

## 8. O que a Equipe Ainda Precisa Testar? (Validação de Usabilidade)

A decisão técnica do MVP-base já foi concluída: com base nas auditorias, comparativos e análise técnica consolidada, o MVP-05 — Pulse Control foi recomendado como a base técnica para a implementação da plataforma Pulse Mais.

A próxima etapa não é escolher novamente o MVP-base. A equipe fará uma avaliação complementar exclusivamente da usabilidade e da experiência de interface (UI/UX) dos cinco MVPs.

O objetivo é identificar qual solução apresenta a melhor experiência visual e de navegação para os usuários da plataforma.

O que será avaliado pela equipe
Login e acesso como aluno, mentor e coordenador;
Navegação entre telas, módulos e dashboards;
Clareza de menus, informações e ações disponíveis;
Forma como os dados dos alunos são apresentados;
Visualização de indicadores, históricos e relatórios;
Facilidade para consultar e interpretar as informações;
Comportamento da interface durante a utilização do Planilhão;
Organização visual e percepção geral de facilidade de uso.
Resultado esperado

A equipe poderá produzir um ranking independente de usabilidade/interface dos cinco MVPs, por exemplo:

Posição	MVP	Avaliação de Usabilidade
1º	MVP-X	Melhor experiência de interface
2º	MVP-Y	Muito boa
3º	MVP-Z	Boa
4º	MVP-W	Regular
5º	MVP-V	Precisa de melhorias

Esse ranking terá finalidade complementar e não substitui a decisão técnica já realizada.

Separação das decisões

Decisão técnica: MVP-05 — Pulse Control → base recomendada para implementação.

Decisão de usabilidade: avaliação da equipe → definir quais interfaces, fluxos e componentes visuais dos MVPs devem ser reaproveitados ou melhorados.

Dessa forma, a plataforma não precisa ficar limitada à interface do MVP-05. A equipe poderá identificar as melhores experiências visuais dos demais MVPs e, posteriormente, a Engenharia poderá avaliar o reaproveitamento desses elementos sobre a fundação técnica escolhida.

---

## 9. Conclusão

> *"Tecnicamente, recomendamos o **MVP-05** como base para a implementação da plataforma Pulse Mais. A equipe fará uma validação complementar de usabilidade das telas antes do início do desenvolvimento definitivo."*
