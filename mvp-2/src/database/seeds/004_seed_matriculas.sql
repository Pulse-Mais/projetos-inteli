-- Seed 004: Matrículas
-- Associação Jovem↔Programa com status variados
-- Alguns jovens em múltiplos programas (jornada completa)
-- Alguns sem matrícula (para LEFT JOIN + IS NULL)

INSERT INTO matriculas (jovem_id, programa_id, status, data_matricula, data_conclusao, observacoes) VALUES 
    (1, 1, 'Concluido', '2024-02-01', '2024-07-15', 'Aprovada com destaque em projeto final.'),
    (2, 1, 'Concluido', '2024-02-01', '2024-07-15', NULL),
    (3, 1, 'Concluido', '2024-02-01', '2024-07-15', 'Melhor nota da turma.'),
    (4, 1, 'Concluido', '2024-02-01', '2024-07-15', NULL),
    (5, 1, 'Concluido', '2024-02-01', '2024-07-15', NULL),
    (6, 6, 'Concluido', '2023-03-01', '2023-08-20', 'Turma piloto.'),
    (6, 1, 'Concluido', '2024-02-01', '2024-07-15', 'Retornou como monitor.'),
    (8, 1, 'Evadido', '2024-02-01', NULL, 'Desistiu por motivos pessoais no 3º mês.'),
    (2, 2, 'Concluido', '2024-08-01', '2024-12-15', 'Mentoria com empresa parceira X.'),
    (3, 2, 'Ativo', '2025-03-01', NULL, NULL),
    (1, 4, 'Ativo', '2025-02-01', NULL, NULL),
    (4, 4, 'Ativo', '2025-02-01', NULL, NULL),
    (7, 4, 'Ativo', '2025-02-01', NULL, NULL),
    (12, 4, 'Ativo', '2025-02-01', NULL, NULL),
    (13, 4, 'Trancado', '2025-02-01', NULL, 'Trancou temporariamente por questões de saúde.'),
    (15, 1, 'Evadido', '2024-02-01', NULL, 'Jovem inativa — evadiu do programa.');

    -- Jovens 9, 10, 11, 14 não têm matrícula, útil para LEFT JOIN + IS NULL
    -- Jovem 6 tem 2 matrículas (programas diferentes), demonstra jornada completa
    -- Jovem 8 evadiu, útil para filtros por status
    -- Jovem 13 trancou, status diferentes