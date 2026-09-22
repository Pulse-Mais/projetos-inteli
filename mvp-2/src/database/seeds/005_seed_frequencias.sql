-- Seed 005: Frequências
-- Registros variados de preseça para exercitar COUNT, AVG, GROUP BY + HAVING
-- responsavel_id referencia usuarios (quem registrou)

INSERT INTO frequencia (jovem_id, data_aula, tipo_presenca, responsavel_id, observacao) VALUES
    -- Ana Clara (id=1): 8 aulas, 7 presencial, 1 gravação → 100% presença
    (1, '2024-02-05', 'Presencial', 2, NULL),
    (1, '2024-02-12', 'Presencial', 2, NULL),
    (1, '2024-02-19', 'Presencial', 2, NULL),
    (1, '2024-02-26', 'Presencial', 2, NULL),
    (1, '2024-03-04', 'Presencial', 2, NULL),
    (1, '2024-03-11', 'Gravacao', 2, 'Avisou que não poderia comparecer.'),
    (1, '2024-03-18', 'Presencial', 2, NULL),
    (1, '2024-03-25', 'Presencial', 2, NULL),

    -- Bruno (id=2): 8 aulas, 6 presencial, 1 gravação, 1 ausente → 87.5%
    (2, '2024-02-05', 'Presencial', 2, NULL),
    (2, '2024-02-12', 'Presencial', 2, NULL),
    (2, '2024-02-19', 'Ausente', 2, 'Falta justificada — atestado médico.'),
    (2, '2024-02-26', 'Presencial', 2, NULL),
    (2, '2024-03-04', 'Presencial', 2, NULL),
    (2, '2024-03-11', 'Gravacao', 2, NULL),
    (2, '2024-03-18', 'Presencial', 2, NULL),
    (2, '2024-03-25', 'Presencial', 2, NULL),

    -- Henrique (id=8): 8 aulas, 3 presencial, 2 gravação, 3 ausente → 62.5%
    (8, '2024-02-05', 'Presencial', 3, NULL),
    (8, '2024-02-12', 'Ausente', 3, NULL),
    (8, '2024-02-19', 'Ausente', 3, NULL),
    (8, '2024-02-26', 'Presencial', 3, NULL),
    (8, '2024-03-04', 'Gravacao', 3, NULL),
    (8, '2024-03-11', 'Ausente', 3, 'Terceira falta consecutiva — alerta enviado.'),
    (8, '2024-03-18', 'Gravacao', 3, NULL),
    (8, '2024-03-25', 'Presencial', 3, NULL),

    -- Carla (id=3): 8 aulas, todas presencial → 100%
    (3, '2024-02-05', 'Presencial', 2, NULL),
    (3, '2024-02-12', 'Presencial', 2, NULL),
    (3, '2024-02-19', 'Presencial', 2, NULL),
    (3, '2024-02-26', 'Presencial', 2, NULL),
    (3, '2024-03-04', 'Presencial', 2, NULL),
    (3, '2024-03-11', 'Presencial', 2, NULL),
    (3, '2024-03-18', 'Presencial', 2, NULL),
    (3, '2024-03-25', 'Presencial', 2, NULL),

    -- Diego (id=4): 6 aulas registradas
    (4, '2024-02-05', 'Presencial', 3, NULL),
    (4, '2024-02-12', 'Presencial', 3, NULL),
    (4, '2024-02-19', 'Presencial', 3, NULL),
    (4, '2024-02-26', 'Ausente', 3, NULL),
    (4, '2024-03-04', 'Presencial', 3, NULL),
    (4, '2024-03-11', 'Presencial', 3, NULL);
