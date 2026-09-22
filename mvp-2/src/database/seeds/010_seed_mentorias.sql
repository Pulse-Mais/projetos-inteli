-- Seed 010: Mentorias
-- Sessões individuais para demonstrar filtros por mentor, status e datas
-- mentor_id=7 → Mateo Sousa (Coordenador de Mentoria)
-- mentor_id=2 → Denise Ferreira (Coordenadora Pedagógica)

INSERT INTO mentorias (
    mentor_id,
    status_mentoria,
    data_mentoria,
    duracao_minutos,
    observacao_mentoria,
    temas
) VALUES
    (7, 'Realizada', '2024-08-10', 60, 'Ana Clara atualizou o perfil durante a sessao.', ARRAY['Carreira', 'Soft Skills']),
    (7, 'Realizada', '2024-09-14', 45, 'Boa performance, precisa trabalhar nervosismo.', ARRAY['Soft Skills', 'Carreira']),
    (7, 'Realizada', '2024-08-17', 60, 'Bruno tem interesse em DevOps. Sugerido estudar Docker.', ARRAY['Programacao', 'Carreira']),
    (7, 'Realizada', '2024-08-24', 50, 'Carla ja tem 3 projetos publicados.', ARRAY['Programacao', 'Empregabilidade']),
    (7, 'Realizada', '2024-09-07', 55, 'Elena relatou dificuldade em conciliar trabalho e estudos.', ARRAY['Soft Skills', 'Carreira']),
    (2, 'Agendada',  '2024-10-12', 40, NULL, ARRAY['Carreira']),
    (2, 'Realizada', '2024-10-19', 60, 'Felipe sera mentor na proxima turma.', ARRAY['Carreira', 'Empregabilidade']),
    (2, 'Cancelada', '2024-09-28', 45, 'Henrique voltou motivado. Planejou cronograma de recuperacao.', ARRAY['Soft Skills', 'Carreira']),
    (7, 'Agendada',  '2025-03-15', 50, 'Leonardo quer migrar para analise de dados.', ARRAY['Programacao', 'Carreira']),
    (7, 'Agendada',  '2025-04-05', 60, 'Ana Clara foi contratada, sessao de acompanhamento.', ARRAY['Empregabilidade', 'Carreira']);
