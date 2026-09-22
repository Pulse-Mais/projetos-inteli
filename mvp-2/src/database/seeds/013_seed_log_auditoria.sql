-- Seed 013: Log de Auditoria 
-- Registro de exemplo para demonstrar consultas de auditoria 
-- com JOIN em usuarios e filtrar por operacao/entidade.

INSERT INTO log_auditoria (usuario_id, entidade, entidade_id, operacao, dados_anteriores, dados_novos, ip_origem, rota, metodos_http) VALUES 
    (2, 'jovens', 1, 'INSERT', NULL, '{"nome":"Ana Clara Silva","email":"ana.clara@email.com","status_jornada":"Conectado"}',
    '192.168.1.10', '/api/jovens', 'POST'),

    (2, 'jovens', 1, 'UPDATE', '{"status_jornada":"Conectado"}', '{"status_jornada":"Capacitado"}',
    '192.168.1.10', '/api/jovens/1', 'PUT'),

    (4, 'atendimentos_saude_mental', 1, 'INSERT', NULL, '{"jovem_id":5,"resumo":"Elena relatou episodios de ansiedade..."}',
    '192.168.1.20', '/api/atendimentos-saude-mental', 'POST'),

    (3, 'frequencias', 1, 'INSERT', NULL, '{"jovem_id":1,"data_aula":"2024-02-05","tipo_presenca":"Presencial"}',
    '192.168.1.15', '/api/frequencias', 'POST'),

    (NULL, 'jovens', NULL, 'ACESSO_NEGADO', NULL, NULL,
    '10.0.0.55', '/api/jovens', 'GET'),

    (5, 'jovens', 5, 'ACESSO_NEGADO', NULL, NULL,
    '192.168.1.30', '/api/jovens/3', 'GET');

-- Registro id=5: acesso não autenticado (usuario_id NULL) → testar IS NULL
-- Registro id=6: Beatriz (Aluno) tentou acessar dados de outro jovem (RN17)