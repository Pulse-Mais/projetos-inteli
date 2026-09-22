-- ====================================================================
-- S5-T11 — ÍNDICES COMPOSTOS PARA PERFORMANCE DOS DASHBOARDS
-- Cada índice elimina um gargalo identificado no diagnóstico (S5-T10).
-- Seguro para re-executar (IF NOT EXISTS em todos).
-- ====================================================================

-- frequencia(jovem_id, data_aula DESC)
-- Elimina seq scan ao buscar registros do aluno nos últimos 30 dias.
-- Usada em: buscarJovensEmRisco (gestão) e buscarDadosAluno (aluno).
CREATE INDEX IF NOT EXISTS idx_frequencia_jovem_data
    ON frequencia(jovem_id, data_aula DESC);

-- anotacoes(tipo_alerta, criado_em DESC)
-- Elimina seq scan ao contar jovens com alerta ativo nos últimos 30 dias.
-- Usada em: contarJovensComAlertaAtivo (dashboard gestão).
CREATE INDEX IF NOT EXISTS idx_anotacoes_tipo_data
    ON anotacoes(tipo_alerta, criado_em DESC);

-- matriculas(jovem_id, status)
-- Elimina seq scan ao buscar programa ativo de cada jovem.
-- Usada em: buscarDadosMentor (subquery programa_ativo por jovem).
CREATE INDEX IF NOT EXISTS idx_matriculas_jovem_status
    ON matriculas(jovem_id, status);

-- entregas_atividades(jovem_id, status)
-- Elimina seq scan ao contar atividades pendentes/atrasadas por jovem.
-- Usada em: buscarDadosMentor e buscarDadosAluno.
CREATE INDEX IF NOT EXISTS idx_entregas_jovem_status
    ON entregas_atividades(jovem_id, status);

-- mentorias(mentor_id, status_mentoria)
-- Elimina seq scan ao filtrar mentorias realizadas/agendadas de um mentor.
-- Usada em: buscarDadosMentor (contagem e próximas mentorias).
CREATE INDEX IF NOT EXISTS idx_mentorias_mentor_status
    ON mentorias(mentor_id, status_mentoria);
