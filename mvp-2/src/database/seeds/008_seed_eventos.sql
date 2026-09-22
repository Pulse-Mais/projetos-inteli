-- Seed 008: Eventos
-- Variedade de tipo para filtros com IN e GROUP BY
-- Colunas: data_inicio (TIMESTAMP), data_fim (TIMESTAMP), vagas

INSERT INTO eventos (nome, data_inicio, data_fim, tipo, descricao, local, vagas) VALUES
    ('Evento Tech Junho 2024',       '2024-06-15 09:00:00', '2024-06-15 18:00:00', 'Eventos_Tech',  'Apresentação de projetos finais da turma 2024.',               'Auditório Pulse Mais',     80),
    ('Encontro da Rede Agosto 2024', '2024-08-20 14:00:00', '2024-08-20 18:00:00', 'Encontro_Rede', 'Networking entre jovens formados e mentores.',                  'Espaço Coworking ABC',     50),
    ('Workshop Git e GitHub',        '2024-09-10 09:00:00', '2024-09-10 13:00:00', 'Workshop',      'Workshop prático de versionamento de código.',                  'Lab Pulse Mais',           30),
    ('Palestra Mercado de Trabalho', '2024-10-05 15:00:00', '2024-10-05 17:00:00', 'Palestra',      'Como se preparar para processos seletivos em tech.',            'Online — Google Meet',     NULL),
    ('Pulse+ Dezembro 2024',         '2024-12-14 17:00:00', '2024-12-14 22:00:00', 'Pulse_Mais',    'Confraternização e celebração de conquistas do ano.',           'Sede Pulse Mais',          120),
    ('Evento Tech Março 2025',       '2025-03-22 09:00:00', '2025-03-22 18:00:00', 'Eventos_Tech',  'Hackathon de impacto social — edição 2025.',                    'Inteli',                   60),
    ('Workshop SQL e Banco de Dados','2025-04-12 09:00:00', '2025-04-12 13:00:00', 'Workshop',      'Introdução a bancos relacionais com PostgreSQL.',               'Lab Pulse Mais',           30),
    ('Encontro da Rede Maio 2025',   '2025-05-10 14:00:00', '2025-05-10 18:00:00', 'Encontro_Rede', 'Painel com ex-alunos empregados em empresas parceiras.',        'Online — Zoom',            NULL);
