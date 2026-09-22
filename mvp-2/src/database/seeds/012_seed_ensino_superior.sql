-- Seed 012: Ensino Superior 
-- Situação acadêmica dos jovens - bolsas, status variados.
-- Permite LEFT JOIN para encontrar jovens sem ensino superior 

INSERT INTO ensino_superior (jovem_id, instituicao, cursos, modalidade_bolsa, status, data_inicio, data_conclusao) VALUES
    (3, 'FATEC', 'Análise e Desenv. de Sistemas', 'Sem_bolsa', 'Cursando', '2024-02-01', NULL),
    (6, 'Universidade XYZ', 'Ciência da Computação', 'ProUni', 'Cursando', '2023-02-01', NULL),
    (10, 'UNIP', 'Gestão de TI', 'Institucional', 'Cursando', '2024-08-01', NULL),
    (5, 'ETEC', 'Design Digital', 'Integral', 'Concluido', '2022-02-01', '2024-12-15'),
    (2, 'FIAP', 'Engenharia de Software', 'Parcial', 'Cursando',  '2025-02-01', NULL),
    (1, 'Universidade ABC', 'Sistemas de Informação', 'ProUni', 'Cursando', '2025-02-01', NULL),
    (13, 'Faculdade Delta', 'Administração', 'FIES', 'Trancado', '2024-02-01', NULL);

-- Mariana (id=13) trancou o curso
-- Jovens 4, 7, 8, 9, 11, 12, 14, 15 não têm registro → LEFT JOIN + IS NULL