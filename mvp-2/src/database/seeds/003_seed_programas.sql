-- Seed 003: Programa
-- 6 programas variados para demonstrar JOINs com matrículas e filtros por tipo/ano

INSERT INTO programas (nome, ano, tipo, carga_horaria, descricao, ativo) VALUES
    ('Formação Tech 2024', 2024, 'Curso', 120, 'Curso intensivo de desenvolvimento web com HTML, CSS, JS e Node.js.', TRUE),
    ('Programa de Mentoria 2024', 2024, 'Mentoria', 60, 'Programa de mentoria com profissionais de empresas parceiras.', TRUE),
    ('Projeto Impacto Social', 2024, 'Projeto', 80, 'Projeto comunitário de tecnologia aplicada a problemas locais.', TRUE),
    ('Formação Tech 2025', 2025, 'Curso', 140, 'Edição 2025 do curso de formação com módulo de banco de dados.', TRUE),
    ('Ciclo de Palestras Tech 2025', 2025, 'Evento_Recorrente', 20, 'Série mensal de palestras com profissionais do mercado.', TRUE),
    ('Formação Tech 2023', 2023, 'Curso', 100, 'Primeira edição do curso de formação tecnológica.', FALSE);

    -- Programa id=6 está inativo - edição encerrada

