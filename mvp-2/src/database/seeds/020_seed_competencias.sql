-- Seed 020: Competências
-- Habilidades técnicas e não-técnicas de jovens variados
-- Tipos mistos para exercitar filtros por tipo e nivel

INSERT INTO competencias (jovem_id, nome, tipo, nivel, instituicao, carga_horaria) VALUES
    (1, 'HTML/CSS', 'Competencia', 'Intermediario', NULL, NULL),
    (1, 'JavaScript', 'Competencia', 'Basico', NULL, NULL),
    (1, 'Python Básico', 'Curso', NULL, 'Alura', '40h'),
    (2, 'React', 'Competencia', 'Intermediario', NULL, NULL),
    (2, 'Git', 'Competencia', 'Basico', NULL, NULL),
    (2, 'Workshop Git', 'Evento', NULL, 'Pulse Mais', '8h'),
    (3, 'SQL', 'Competencia', 'Avancado', NULL, NULL),
    (3, 'AWS Cloud Practitioner', 'Certificacao', NULL, 'AWS', NULL),
    (4, 'Java', 'Competencia', 'Basico', NULL, NULL),
    (5, 'Node.js', 'Competencia', 'Intermediario', NULL, NULL),
    (5, 'React Advanced', 'Curso', NULL, 'Rocketseat', '60h'),
    (6, 'Scrum Master', 'Certificacao', NULL, 'Scrum.org', NULL);
