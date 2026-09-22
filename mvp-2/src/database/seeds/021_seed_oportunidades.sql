-- Seed 021: Oportunidades
-- Catálogo de cursos, eventos e bolsas para a tela de Oportunidades do aluno

INSERT INTO oportunidades (tipo, titulo, instituicao, descricao, local, data_inicio, data_fim, duracao, vagas, valor, modalidade, link, ativo) VALUES
    ('Curso', 'Python para Dados', 'Alura', 'Fundamentos de Python com foco em análise de dados', NULL, '2025-07-01', '2026-01-01', '6 meses',  200, 'Gratuito', 'Online', NULL, TRUE),
    ('Curso', 'React Avançado', 'Rocketseat', 'Hooks, context, performance e testes em React', NULL, '2025-08-01', NULL, '60h', 100, 'R$ 299,00', 'Online', NULL, TRUE),
    ('Evento', 'TechFest São Paulo 2025', 'Pulse Mais', 'Feira de tecnologia e networking', 'São Paulo', '2025-09-15', '2025-09-16', '2 dias', 500, 'Gratuito', 'Presencial', NULL, TRUE),
    ('Evento', 'Workshop de UX Design', 'Instituto X', 'Introdução ao design centrado no usuário', 'São Paulo', '2025-07-20', '2025-07-20', '8h', 50, 'Gratuito', 'Presencial', NULL, TRUE),
    ('Bolsa', 'Bolsa Tech Mulheres', 'FAPESP', 'Bolsa de R$ 15.000 para mulheres em tecnologia', NULL, '2025-10-01', NULL, NULL, 30, 'R$ 15.000', NULL, NULL, TRUE),
    ('Bolsa', 'ProUni 2025.2', 'MEC', 'Programa Universidade para Todos — 2º semestre', NULL, '2025-07-01', '2025-07-31', NULL, 5000, 'Integral/Parcial',  NULL, NULL, TRUE);
