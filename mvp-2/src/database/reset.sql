-- Reset: dropa todas as tabelas em ordem reversa de dependência
-- USE ONLY IN DEVELOPMENT

DROP TABLE IF EXISTS
    entregas_atividades,
    atividades,
    notificacoes,
    log_auditoria,
    ensino_superior,
    empregabilidade,
    mentorias,
    participacoes_eventos,
    atendimentos_saude_mental,
    anotacoes,
    frequencia,
    matriculas,
    eventos,
    programas,
    jovens,
    usuarios
CASCADE;
