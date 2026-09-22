-- ============================================================
-- DIAGNÓSTICO DE PERFORMANCE — S5-T10
-- Execute este script no SQL Editor do Supabase (ou psql).
-- Substitua :jovem_id e :mentor_id por IDs reais antes de rodar.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. ÍNDICES EXISTENTES NAS TABELAS CRÍTICAS
--    Confirma quais índices o banco reconhece de fato.
-- ────────────────────────────────────────────────────────────
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN (
    'jovens', 'frequencia', 'matriculas', 'entregas_atividades',
    'mentorias', 'mentorias_jovens', 'anotacoes', 'empregabilidade',
    'ensino_superior', 'participacoes_eventos', 'competencias',
    'certificados', 'oportunidades', 'eventos'
)
ORDER BY tablename, indexname;


-- ────────────────────────────────────────────────────────────
-- 2. TAMANHO DAS TABELAS CRÍTICAS
--    Tabelas grandes sem índice composto são o principal gargalo.
-- ────────────────────────────────────────────────────────────
SELECT
    relname AS tabela,
    n_live_tup AS linhas_estimadas,
    pg_size_pretty(pg_total_relation_size(relid)) AS tamanho_total
FROM pg_stat_user_tables
WHERE relname IN (
    'jovens', 'frequencia', 'matriculas', 'entregas_atividades',
    'mentorias', 'mentorias_jovens', 'anotacoes'
)
ORDER BY n_live_tup DESC;


-- ────────────────────────────────────────────────────────────
-- 3. EXPLAIN ANALYZE — Dashboard Gestão: jovens em risco
--    Chamado em TODA carga do dashboard de gestão.
--    Faz JOIN em toda a tabela de jovens sem LIMIT.
-- ────────────────────────────────────────────────────────────
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT
    j.id,
    j.nome,
    COUNT(CASE WHEN f.tipo_presenca IN ('Presencial', 'Gravacao') THEN 1 END)::float
        / NULLIF(COUNT(f.id), 0) * 100 AS frequencia_ultimos_30_dias,
    COALESCE(
        EXTRACT(DAY FROM NOW() - MAX(f.data_aula)),
        999
    )::int AS dias_sem_interacao,
    COUNT(CASE WHEN ea.status = 'Atrasada' THEN 1 END)::int AS atividades_em_atraso
FROM jovens j
LEFT JOIN frequencia f
    ON f.jovem_id = j.id
    AND f.data_aula >= NOW() - INTERVAL '30 days'
LEFT JOIN entregas_atividades ea
    ON ea.jovem_id = j.id
WHERE j.ativo = true
GROUP BY j.id, j.nome;


-- ────────────────────────────────────────────────────────────
-- 4. EXPLAIN ANALYZE — Dashboard Mentor: query principal
--    4 subqueries correlacionadas por jovem (problema N+1).
--    Substitua $1 por um mentor_id real.
-- ────────────────────────────────────────────────────────────
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT DISTINCT ON (j.id)
    j.id, j.nome, j.cpf, j.status_jornada, j.status_empregabilidade,
    (
        SELECT prog.nome
        FROM matriculas mat
        JOIN programas prog ON prog.id = mat.programa_id
        WHERE mat.jovem_id = j.id AND mat.status = 'Ativo'
        ORDER BY mat.id DESC LIMIT 1
    ) AS programa_nome,
    NULL::text AS turma,
    COALESCE((
        SELECT ROUND(
            COUNT(CASE WHEN f.tipo_presenca IN ('Presencial', 'Gravacao') THEN 1 END)::numeric
            / NULLIF(COUNT(f.id), 0) * 100, 1
        )::float
        FROM frequencia f WHERE f.jovem_id = j.id
    ), 0) AS frequencia_pct,
    (
        SELECT COUNT(*)::int
        FROM entregas_atividades ea
        WHERE ea.jovem_id = j.id AND ea.status IN ('Pendente', 'Atrasada')
    ) AS atividades_pendentes,
    (
        SELECT m2.data_mentoria
        FROM mentorias m2
        JOIN mentorias_jovens mj2 ON mj2.mentoria_id = m2.id
        WHERE mj2.jovem_id = j.id
          AND m2.mentor_id = 1            -- substitua pelo mentor_id real
          AND m2.status_mentoria = 'Realizada'
        ORDER BY m2.data_mentoria DESC LIMIT 1
    ) AS ultima_sessao
FROM jovens j
JOIN mentorias_jovens mj ON mj.jovem_id = j.id
JOIN mentorias m ON m.id = mj.mentoria_id
WHERE m.mentor_id = 1                     -- substitua pelo mentor_id real
  AND j.ativo = true
ORDER BY j.id, j.nome;


-- ────────────────────────────────────────────────────────────
-- 5. EXPLAIN ANALYZE — Frequência média global
--    Full scan na tabela frequencia (sem filtro efetivo).
-- ────────────────────────────────────────────────────────────
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT ROUND(
    COUNT(CASE WHEN tipo_presenca IN ('Presencial', 'Gravacao') THEN 1 END)::numeric
    / NULLIF(COUNT(*), 0) * 100,
1)::float AS media
FROM frequencia;


-- ────────────────────────────────────────────────────────────
-- 6. EXPLAIN ANALYZE — Contagem de alertas ativos (30 dias)
--    Combina filtros em tipo_alerta e criado_em.
--    Índices separados existem; falta composto (tipo_alerta, criado_em).
-- ────────────────────────────────────────────────────────────
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT COUNT(DISTINCT jovem_id)::int AS total
FROM anotacoes
WHERE tipo_alerta = 'Alerta'
AND criado_em >= NOW() - INTERVAL '30 days';


-- ────────────────────────────────────────────────────────────
-- 7. EXPLAIN ANALYZE — Dashboard Aluno: frequência do jovem
--    Substitua 1 por um jovem_id real.
-- ────────────────────────────────────────────────────────────
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT
    COUNT(CASE WHEN tipo_presenca IN ('Presencial', 'Gravacao') THEN 1 END)::int AS presencas,
    COUNT(*)::int AS total_aulas,
    ROUND(
        COUNT(CASE WHEN tipo_presenca IN ('Presencial', 'Gravacao') THEN 1 END)::numeric
        / NULLIF(COUNT(*), 0) * 100,
    1)::float AS percentual
FROM frequencia WHERE jovem_id = 1;    -- substitua pelo jovem_id real


-- ────────────────────────────────────────────────────────────
-- 8. EXPLAIN ANALYZE — Distribuição por programa (donut gestão)
-- ────────────────────────────────────────────────────────────
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT
    p.id,
    p.nome,
    COUNT(m.jovem_id)::int AS total_jovens
FROM programas p
LEFT JOIN matriculas m ON m.programa_id = p.id AND m.status = 'Ativo'
WHERE p.ativo = true
GROUP BY p.id, p.nome
ORDER BY total_jovens DESC;


-- ────────────────────────────────────────────────────────────
-- 9. CONSULTA DE APOIO — Queries mais lentas (pg_stat_statements)
--    Requer extensão pg_stat_statements (disponível no Supabase).
-- ────────────────────────────────────────────────────────────
SELECT
    LEFT(query, 120) AS query_resumida,
    calls,
    ROUND((mean_exec_time)::numeric, 2) AS media_ms,
    ROUND((total_exec_time)::numeric, 2) AS total_ms,
    ROUND((stddev_exec_time)::numeric, 2) AS desvio_ms,
    rows
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat%'
ORDER BY mean_exec_time DESC
LIMIT 20;
