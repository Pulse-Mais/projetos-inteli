// src/repositories/dashboardRepository.js

const { pool } = require('../database/db');

class DashboardRepository {

    // programaId é opcional em todos os métodos abaixo: quando null/undefined, o KPI
    // continua sendo calculado globalmente (comportamento de antes do filtro existir).

    async contarJovensAtivos(programaId = null) {
        const { rows } = await pool.query(
            `SELECT COUNT(DISTINCT jovem_id)::int AS total
            FROM matriculas
            WHERE status = 'Ativo'
                AND ($1::int IS NULL OR programa_id = $1)`,
            [programaId]
        );
        return rows[0].total;
    }

    async contarJovensEmpregados(programaId = null) {
        const { rows } = await pool.query(
            `SELECT COUNT(DISTINCT e.jovem_id)::int AS total
            FROM empregabilidade e
            WHERE e.ativo = true
                AND ($1::int IS NULL OR e.jovem_id IN (
                    SELECT jovem_id FROM matriculas WHERE programa_id = $1 AND status = 'Ativo'
                ))`,
            [programaId]
        );
        return rows[0].total;
    }

    async contarJovensComBolsa(programaId = null) {
        const { rows } = await pool.query(
            `SELECT COUNT(*)::int AS total
            FROM ensino_superior es
            WHERE es.modalidade_bolsa != 'Sem_bolsa'
                AND es.status = 'Cursando'
                AND ($1::int IS NULL OR es.jovem_id IN (
                    SELECT jovem_id FROM matriculas WHERE programa_id = $1 AND status = 'Ativo'
                ))`,
            [programaId]
        );
        return rows[0].total;
    }

    async calcularIndiceEvasao(programaId = null) {
        const { rows } = await pool.query(
            `SELECT
                COUNT(*) FILTER (WHERE status = 'Evadido')::int AS evadidos,
                COUNT(*)::int AS total
            FROM matriculas
            WHERE ($1::int IS NULL OR programa_id = $1)`,
            [programaId]
        );
        return rows[0];
    }

    async contarJovensConectados(programaId = null) {
        const { rows } = await pool.query(
            `SELECT COUNT (DISTINCT jovem_id)::int AS total
            FROM participacoes_eventos pe
            WHERE ($1::int IS NULL OR pe.jovem_id IN (
                SELECT jovem_id FROM matriculas WHERE programa_id = $1 AND status = 'Ativo'
            ))`,
            [programaId]
        );
        return rows[0].total;
    }

    // Sem tabela dedicada ainda - retorna 0 até a tabela ser criada
    async contarComputadoresDoados() {
        return 0;
    }

    async contarMentoriasRealizadas(programaId = null) {
        const { rows } = await pool.query(
            `SELECT COUNT(*)::int AS total
            FROM mentorias m
            WHERE m.status_mentoria = 'Realizada'
                AND ($1::int IS NULL OR EXISTS (
                    SELECT 1 FROM mentorias_jovens mj
                    JOIN matriculas mat ON mat.jovem_id = mj.jovem_id
                        AND mat.programa_id = $1 AND mat.status = 'Ativo'
                    WHERE mj.mentoria_id = m.id
                ))`,
            [programaId]
        );
        return rows[0].total;
    }

    async calcularMediaFrequencia(programaId = null) {
        const { rows } = await pool.query(
            `SELECT ROUND(
                COUNT(CASE WHEN tipo_presenca IN ('Presencial', 'Gravacao') THEN 1 END)::numeric
                / NULLIF(COUNT(*), 0) * 100,
            1)::float AS media
            FROM frequencia
            WHERE ($1::int IS NULL OR programa_id = $1)`,
            [programaId]
        );
        return parseFloat(rows[0].media || 0);
    }

    async contarJovensComAlertaAtivo(programaId = null) {
        const { rows } = await pool.query(
            `SELECT COUNT(DISTINCT jovem_id)::int AS total
            FROM anotacoes
            WHERE tipo_alerta = 'Alerta'
                AND criado_em >= NOW() - INTERVAL '30 days'
                AND ($1::int IS NULL OR jovem_id IN (
                    SELECT jovem_id FROM matriculas WHERE programa_id = $1 AND status = 'Ativo'
                ))`,
            [programaId]
        );
        return rows[0].total;
    }

    async buscarDistribuicaoPorPrograma() {
        const { rows } = await pool.query(
            `SELECT
                p.id,
                p.nome,
                COUNT(m.jovem_id)::int AS total_jovens
            FROM programas p
            LEFT JOIN matriculas m ON m.programa_id = p.id AND m.status = 'Ativo'
            WHERE p.ativo = true
            GROUP BY p.id, p.nome
            ORDER BY total_jovens DESC`
        );
        return rows;
    }

    // Com um programa selecionado, "distribuição por programa" seria sempre 100% —
    // por isso o donut passa a mostrar a distribuição por turma DENTRO do programa.
    async buscarDistribuicaoPorTurma(programaId) {
        const { rows } = await pool.query(
            `SELECT
                COALESCE(turma, 'Sem turma') AS nome,
                COUNT(*)::int AS total_jovens
            FROM matriculas
            WHERE programa_id = $1 AND status = 'Ativo'
            GROUP BY turma
            ORDER BY total_jovens DESC`,
            [programaId]
        );
        return rows;
    }

    async buscarJornadaJovens(programaId = null) {
        const { rows } = await pool.query(
            `SELECT
                COUNT(*) FILTER (WHERE status_jornada LIKE '%Conectado%')::int AS conectado,
                COUNT(*) FILTER (WHERE status_jornada LIKE '%Capacitado%')::int AS capacitado,
                COUNT(*) FILTER (WHERE status_jornada LIKE '%Transformado%')::int AS transformado
            FROM jovens j
            WHERE j.ativo = true
                AND ($1::int IS NULL OR j.id IN (
                    SELECT jovem_id FROM matriculas WHERE programa_id = $1 AND status = 'Ativo'
                ))`,
            [programaId]
        );
        return rows[0];
    }

    async buscarJovensEmRisco(programaId = null) {
        // Só avalia risco para quem está atualmente matriculado (status Ativo) — um jovem
        // que já concluiu/evadiu um programa não deve ser julgado pela frequência daquele
        // programa antigo. A frequência considerada também é restrita à matrícula ativa
        // (frequencia.programa_id = matricula ativa), pra não herdar histórico de um
        // programa anterior/encerrado.
        //
        // CTEs pré-agregam antes do JOIN com jovens:
        // - matriculas_ativas: programas em que o jovem está ativo hoje
        // - freq_relevante: só a frequência ligada a essas matrículas ativas
        // - ultima_interacao: histórico COMPLETO dessa frequência relevante (sem filtro de
        //   30 dias) — usada para "dias sem interação" e para saber se já há alguma aula
        // - freq_30: janela dos últimos 30 dias — usada só para o % de frequência recente
        // - atrasos: 1 scan em entregas_atividades (usa idx_entregas_jovem_status)
        const { rows } = await pool.query(
            `WITH matriculas_ativas AS (
                SELECT DISTINCT jovem_id, programa_id
                FROM matriculas
                WHERE status = 'Ativo'
                    AND ($1::int IS NULL OR programa_id = $1)
            ),
            freq_relevante AS (
                SELECT f.jovem_id, f.data_aula, f.tipo_presenca
                FROM frequencia f
                JOIN matriculas_ativas ma
                    ON ma.jovem_id = f.jovem_id AND ma.programa_id = f.programa_id
            ),
            ultima_interacao AS (
                SELECT jovem_id, MAX(data_aula) AS ultima_aula, COUNT(*)::int AS total_aulas
                FROM freq_relevante
                GROUP BY jovem_id
            ),
            programas_jovem AS (
                SELECT ma.jovem_id, STRING_AGG(p.nome, ', ' ORDER BY p.nome) AS programa
                FROM matriculas_ativas ma
                JOIN programas p ON p.id = ma.programa_id
                GROUP BY ma.jovem_id
            ),
            freq_30 AS (
                SELECT
                    jovem_id,
                    COUNT(CASE WHEN tipo_presenca IN ('Presencial', 'Gravacao') THEN 1 END)::float AS presencas,
                    COUNT(*)::float AS total
                FROM freq_relevante
                WHERE data_aula >= NOW() - INTERVAL '30 days'
                GROUP BY jovem_id
            ),
            atrasos AS (
                SELECT jovem_id, COUNT(*)::int AS qtd
                FROM entregas_atividades
                WHERE status = 'Atrasada'
                GROUP BY jovem_id
            )
            SELECT
                j.id,
                j.nome,
                CASE WHEN ui.total_aulas > 0
                    THEN COALESCE(f.presencas / NULLIF(f.total, 0) * 100, 0)
                    ELSE NULL
                END::float AS frequencia_ultimos_30_dias,
                CASE WHEN ui.ultima_aula IS NOT NULL
                    THEN EXTRACT(DAY FROM NOW() - ui.ultima_aula)::int
                    ELSE NULL
                END AS dias_sem_interacao,
                COALESCE(a.qtd, 0) AS atividades_em_atraso,
                pj.programa
            FROM jovens j
            LEFT JOIN ultima_interacao ui ON ui.jovem_id = j.id
            LEFT JOIN freq_30 f ON f.jovem_id = j.id
            LEFT JOIN atrasos a ON a.jovem_id = j.id
            LEFT JOIN programas_jovem pj ON pj.jovem_id = j.id
            WHERE j.ativo = true
                AND j.id IN (SELECT jovem_id FROM matriculas_ativas)`,
            [programaId]
        );
        return rows;
    }

        async buscarDadosMentor(mentor_id) {
        // 4 queries rodam em paralelo (Promise.all).
        // As 2 primeiras eram N+1: cada jovem disparava 4 subqueries correlacionadas.
        // Reescritas com CTEs: pré-agregam 1 vez e fazem LEFT JOIN — custo O(1) por jovem.
        const [jovensResult, realizadasResult, proximasResult, alertasResult] = await Promise.all([
            pool.query(
                // Antes: 4 subqueries correlacionadas por jovem.
                // Agora: 4 CTEs pré-agregadas + 4 LEFT JOINs (independente de quantos jovens).
                `WITH jovens_mentor AS (
                    SELECT j.id, j.nome, j.cpf, j.status_jornada, j.status_empregabilidade,
                        (SELECT u.foto_url FROM usuarios u WHERE u.jovem_id = j.id LIMIT 1) AS foto_url
                    FROM jovens j
                    WHERE j.ativo = true
                      AND j.id IN (
                          SELECT DISTINCT mj.jovem_id
                          FROM mentorias_jovens mj
                          JOIN mentorias m ON m.id = mj.mentoria_id
                          WHERE m.mentor_id = $1
                      )
                ),
                freq_pct AS (
                    SELECT
                        jovem_id,
                        ROUND(
                            COUNT(CASE WHEN tipo_presenca IN ('Presencial', 'Gravacao') THEN 1 END)::numeric
                            / NULLIF(COUNT(*), 0) * 100, 1
                        )::float AS frequencia_pct
                    FROM frequencia
                    WHERE jovem_id IN (SELECT id FROM jovens_mentor)
                    GROUP BY jovem_id
                ),
                atividades_pend AS (
                    SELECT jovem_id, COUNT(*)::int AS total
                    FROM entregas_atividades
                    WHERE jovem_id IN (SELECT id FROM jovens_mentor)
                      AND status IN ('Pendente', 'Atrasada')
                    GROUP BY jovem_id
                ),
                programa_ativo AS (
                    SELECT DISTINCT ON (mat.jovem_id)
                        mat.jovem_id,
                        p.nome AS programa_nome
                    FROM matriculas mat
                    JOIN programas p ON p.id = mat.programa_id
                    WHERE mat.jovem_id IN (SELECT id FROM jovens_mentor)
                      AND mat.status = 'Ativo'
                    ORDER BY mat.jovem_id, mat.id DESC
                ),
                ultima_sessao AS (
                    SELECT DISTINCT ON (mj.jovem_id)
                        mj.jovem_id,
                        m.data_mentoria
                    FROM mentorias m
                    JOIN mentorias_jovens mj ON mj.mentoria_id = m.id
                    WHERE m.mentor_id = $1
                      AND m.status_mentoria = 'Realizada'
                      AND mj.jovem_id IN (SELECT id FROM jovens_mentor)
                    ORDER BY mj.jovem_id, m.data_mentoria DESC
                )
                SELECT
                    jm.id, jm.nome, jm.cpf, jm.status_jornada, jm.status_empregabilidade,
                    jm.foto_url,
                    pa.programa_nome,
                    NULL::text AS turma,
                    COALESCE(f.frequencia_pct, 0) AS frequencia_pct,
                    COALESCE(ap.total, 0) AS atividades_pendentes,
                    us.data_mentoria AS ultima_sessao
                FROM jovens_mentor jm
                LEFT JOIN freq_pct f        ON f.jovem_id  = jm.id
                LEFT JOIN atividades_pend ap ON ap.jovem_id = jm.id
                LEFT JOIN programa_ativo pa  ON pa.jovem_id = jm.id
                LEFT JOIN ultima_sessao us   ON us.jovem_id = jm.id
                ORDER BY jm.nome`,
                [mentor_id]
            ),
            pool.query(
                `SELECT COUNT(*)::int AS total FROM mentorias
                WHERE mentor_id = $1 AND status_mentoria = 'Realizada'`,
                [mentor_id]
            ),
            pool.query(
                `SELECT
                    m.id, m.data_mentoria, m.duracao_minutos, m.temas,
                    COALESCE(
                        json_agg(json_build_object('id', j.id, 'nome', j.nome))
                        FILTER (WHERE j.id IS NOT NULL),
                        '[]'::json
                    ) AS jovens
                FROM mentorias m
                LEFT JOIN mentorias_jovens mj ON mj.mentoria_id = m.id
                LEFT JOIN jovens j ON j.id = mj.jovem_id
                WHERE m.mentor_id = $1
                AND m.status_mentoria = 'Agendada'
                AND m.data_mentoria >= CURRENT_DATE
                GROUP BY m.id, m.data_mentoria, m.duracao_minutos, m.temas
                ORDER BY m.data_mentoria ASC
                LIMIT 5`,
                [mentor_id]
            ),
            pool.query(
                // Antes: 2 subqueries correlacionadas por alerta (programa_nome, dias_sem_interacao).
                // Agora: 2 CTEs pré-agregadas + LEFT JOINs.
                `WITH mentor_jovens_ids AS (
                    SELECT DISTINCT mj.jovem_id
                    FROM mentorias m
                    JOIN mentorias_jovens mj ON mj.mentoria_id = m.id
                    WHERE m.mentor_id = $1
                ),
                ultima_aula AS (
                    SELECT jovem_id, MAX(data_aula) AS max_aula
                    FROM frequencia
                    WHERE jovem_id IN (SELECT jovem_id FROM mentor_jovens_ids)
                    GROUP BY jovem_id
                ),
                programa_jovem AS (
                    SELECT DISTINCT ON (mat.jovem_id)
                        mat.jovem_id,
                        p.nome AS programa_nome
                    FROM matriculas mat
                    JOIN programas p ON p.id = mat.programa_id
                    WHERE mat.jovem_id IN (SELECT jovem_id FROM mentor_jovens_ids)
                      AND mat.status = 'Ativo'
                    ORDER BY mat.jovem_id, mat.id DESC
                )
                SELECT DISTINCT ON (a.jovem_id)
                    a.id, a.jovem_id, j.nome AS jovem_nome,
                    a.tipo_alerta, a.categoria, a.texto, a.criado_em,
                    pj.programa_nome,
                    COALESCE(EXTRACT(DAY FROM NOW() - ua.max_aula)::int, 999) AS dias_sem_interacao
                FROM anotacoes a
                JOIN jovens j             ON j.id  = a.jovem_id
                LEFT JOIN ultima_aula ua  ON ua.jovem_id = a.jovem_id
                LEFT JOIN programa_jovem pj ON pj.jovem_id = a.jovem_id
                WHERE a.tipo_alerta = 'Alerta'
                  AND a.jovem_id IN (SELECT jovem_id FROM mentor_jovens_ids)
                ORDER BY a.jovem_id, a.criado_em DESC`,
                [mentor_id]
            ),
        ]);

        return {
            meus_jovens: jovensResult.rows,
            mentorias_realizadas: realizadasResult.rows[0].total,
            proximas_mentorias: proximasResult.rows,
            alertas_jovens: alertasResult.rows,
        };
    }

        async buscarDadosAluno(jovem_id) {
        const [freqResult, atividadesResult, certsResult, compsResult, mentoriaResult, eventosResult, oportunidadesResult] = await Promise.all([
            pool.query(
                `SELECT
                    COUNT(CASE WHEN tipo_presenca IN ('Presencial', 'Gravacao') THEN 1 END)::int AS presencas,
                    COUNT(*)::int AS total_aulas,
                    ROUND(
                        COUNT(CASE WHEN tipo_presenca IN ('Presencial', 'Gravacao') THEN 1 END)::numeric
                        / NULLIF(COUNT(*), 0) * 100,
                    1)::float AS percentual
                FROM frequencia WHERE jovem_id = $1`,
                [jovem_id]
            ),
            pool.query(
                `SELECT COUNT(*)::int AS pendentes FROM entregas_atividades
                WHERE jovem_id = $1 AND status IN ('Pendente', 'Atrasada')`,
                [jovem_id]
            ),
            pool.query(
                `SELECT COUNT(*)::int AS total FROM certificados WHERE jovem_id = $1`,
                [jovem_id]
            ),
            pool.query(
                `SELECT COUNT(*)::int AS total FROM competencias WHERE jovem_id = $1`,
                [jovem_id]
            ),
            pool.query(
                `SELECT m.id, m.data_mentoria, m.status_mentoria, m.temas, u.nome AS mentor_nome
                FROM mentorias m
                JOIN usuarios u ON u.id = m.mentor_id
                JOIN mentorias_jovens mj ON mj.mentoria_id = m.id
                WHERE mj.jovem_id = $1
                ORDER BY m.data_mentoria DESC LIMIT 1`,
                [jovem_id]
            ),
            pool.query(
                `SELECT id, nome, data_inicio, data_fim, local, tipo FROM eventos
                WHERE data_inicio >= CURRENT_DATE
                ORDER BY data_inicio ASC LIMIT 3`
            ),
            pool.query(
                `SELECT id, tipo, titulo, data_inicio, valor, modalidade
                FROM oportunidades WHERE ativo = true
                ORDER BY criado_em DESC LIMIT 3`
            ),
        ]);

        return {
            frequencia: freqResult.rows[0],
            atividades_pendentes: atividadesResult.rows[0].pendentes,
            certificados: certsResult.rows[0].total,
            competencias: compsResult.rows[0].total,
            ultima_mentoria: mentoriaResult.rows[0] || null,
            proximos_eventos: eventosResult.rows,
            oportunidades_recentes: oportunidadesResult.rows,
        };
    }

}

module.exports = new DashboardRepository();