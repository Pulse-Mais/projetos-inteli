-- Seed 014: Atividades dos Programas
-- Tarefas, exercícios e projetos vinculados a programas
-- Dependência: programas (003)

INSERT INTO atividades (programa_id, titulo, descricao, data_limite) VALUES
    -- Formação Tech 2024 (programa_id=1)
    (1, 'Exercício CSS Responsivo',            'Criar uma landing page responsiva usando Flexbox e Grid.',              '2024-03-20'),
    (1, 'Lista de Exercícios: JavaScript',     'Resolver 20 exercícios de lógica com funções, arrays e objetos.',      '2024-04-30'),
    (1, 'Projeto Final — App Web',             'Desenvolver uma aplicação web completa com HTML, CSS, JS e Node.js.',  '2024-07-10'),

    -- Programa de Mentoria 2024 (programa_id=2)
    (2, 'Plano de Desenvolvimento Individual', 'Preencher o PDI com metas de carreira para os próximos 6 meses.',      NULL),

    -- Projeto Impacto Social (programa_id=3)
    (3, 'Diagnóstico Comunitário',             'Entrevistar 5 moradores do bairro e mapear problemas locais.',         '2024-05-15'),
    (3, 'Apresentação de Resultados',          'Apresentar o projeto desenvolvido para a comunidade e parceiros.',     '2024-08-10'),

    -- Formação Tech 2025 (programa_id=4)
    (4, 'Exercício SQL — Consultas Avançadas', 'Escrever queries com JOIN, GROUP BY, HAVING e subqueries.',            '2025-04-30'),
    (4, 'Mini Projeto: API REST',              'Construir uma API REST com Node.js, Express e PostgreSQL.',            '2025-05-30'),
    (4, 'Projeto Final — Sistema CRUD',        'Desenvolver sistema completo com autenticação e CRUD de entidades.',   '2025-07-15'),

    -- Ciclo de Palestras Tech 2025 (programa_id=5)
    (5, 'Resumo da Palestra Mensal',           'Escrever um resumo de 1 página sobre os aprendizados da palestra.',    NULL);

-- Atividades 1-3: programa Formação Tech 2024 → jovens com matrícula em programa_id=1
-- Atividades 7-9: programa Formação Tech 2025 → jovens com matrícula em programa_id=4
-- data_limite NULL = atividade contínua / sem prazo definido
