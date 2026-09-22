-- Seed 015: Entregas de Atividades
-- Registros de entrega por jovem, cruzando atividades com matrículas existentes
-- Dependência: atividades (014), jovens (002)
--
-- Referência de matrículas:
--   programa_id=1 → jovens 1,2,3,4,5,6,8,15  |  atividades 1,2,3
--   programa_id=4 → jovens 1,4,7,12,13        |  atividades 7,8,9

INSERT INTO entregas_atividades (atividades_id, jovem_id, status, nota, data_entrega, observacao) VALUES
    -- Atividade 1: Exercício CSS Responsivo (prazo 2024-03-20)
    (1, 1, 'Entregue',  9.5,  '2024-03-18', NULL),
    (1, 2, 'Entregue',  8.0,  '2024-03-19', NULL),
    (1, 3, 'Entregue',  10.0, '2024-03-15', 'Melhor entrega da turma.'),
    (1, 4, 'Entregue',  7.5,  '2024-03-20', NULL),
    (1, 5, 'Entregue',  8.5,  '2024-03-20', NULL),
    (1, 8, 'Atrasada',  NULL, NULL,          'Não entregou dentro do prazo.'),

    -- Atividade 2: Lista de Exercícios: JavaScript (prazo 2024-04-30)
    (2, 1, 'Entregue',  10.0, '2024-04-28', NULL),
    (2, 2, 'Entregue',  9.0,  '2024-04-29', NULL),
    (2, 3, 'Entregue',  9.5,  '2024-04-25', NULL),
    (2, 4, 'Entregue',  6.5,  '2024-04-30', 'Precisou de ajuda extra com closures.'),
    (2, 8, 'Atrasada',  NULL, NULL,          NULL),

    -- Atividade 3: Projeto Final — App Web (prazo 2024-07-10)
    (3, 1, 'Entregue',  9.0,  '2024-07-08', 'App de cadastro de jovens.'),
    (3, 2, 'Entregue',  8.5,  '2024-07-09', NULL),
    (3, 3, 'Entregue',  10.0, '2024-07-05', 'Apresentação excelente.'),
    (3, 5, 'Entregue',  8.0,  '2024-07-10', NULL),
    (3, 8, 'Atrasada',  NULL, NULL,          'Evadiu antes de concluir o projeto.'),

    -- Atividade 7: Exercício SQL — Consultas Avançadas (prazo 2025-04-30)
    (7, 1,  'Entregue', 8.5,  '2025-04-28', NULL),
    (7, 4,  'Entregue', 7.0,  '2025-04-30', NULL),
    (7, 12, 'Entregue', 9.5,  '2025-04-27', 'Demonstra facilidade com banco de dados.'),
    (7, 7,  'Pendente', NULL, NULL,          NULL),
    (7, 13, 'Pendente', NULL, NULL,          NULL),

    -- Atividade 8: Mini Projeto: API REST (prazo 2025-05-30)
    (8, 1,  'Pendente', NULL, NULL, NULL),
    (8, 4,  'Pendente', NULL, NULL, NULL),
    (8, 12, 'Pendente', NULL, NULL, NULL),

    -- Atividade 9: Projeto Final — Sistema CRUD (prazo 2025-07-15)
    (9, 1,  'Pendente', NULL, NULL, NULL),
    (9, 4,  'Pendente', NULL, NULL, NULL),
    (9, 7,  'Pendente', NULL, NULL, NULL),
    (9, 12, 'Pendente', NULL, NULL, NULL),
    (9, 13, 'Pendente', NULL, NULL, NULL);

-- Henrique (id=8) tem 3 entregas Atrasada → útil para filtro de risco
-- Atividades 7-9 do programa 2025: maioria Pendente → dashboard de progresso
-- Leonardo (id=12) destaca-se em SQL (nota 9.5)
