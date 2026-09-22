// src/repositories/frequenciaRepository.js

const { pool } = require('../database/db');
const Frequencia = require('../models/Frequencia');

const COLUNAS = `
    id, jovem_id, data_aula, tipo_presenca,
    responsavel_id, programa_id, observacao, criado_em
    `;

    class frequenciaRepository {
        
        async criar(dados) {
            const { jovem_id, data_aula, tipo_presenca, responsavel_id, programa_id, observacao} = dados;

            const { rows } = await pool.query(
                `INSERT INTO frequencia (jovem_id, data_aula, tipo_presenca, responsavel_id, programa_id, observacao)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING ${COLUNAS}`,
                [jovem_id, data_aula, tipo_presenca, responsavel_id, programa_id || null, observacao || null]
            );

            return new Frequencia(rows[0]);
        }

        async buscarPorId(id) {
            const { rows } = await pool.query(
                `SELECT ${COLUNAS} FROM frequencia WHERE id = $1`,
                [id]
            );
            return rows[0] ? new Frequencia(rows[0]) : null;
        }

        // Verifica se já existe frequência para o mesmo jovem na mesma data
        // excluirId permite ignorar o próprio registro no PUT
        async buscarDuplicata(jovem_id, data_aula, programa_id = null, excluirId = null) {
            const { rows } = await pool.query(
                `SELECT id FROM frequencia
                WHERE jovem_id = $1 AND data_aula = $2
                AND programa_id IS NOT DISTINCT FROM $3
                AND ($4::int IS NULL OR id <> $4)`,
                [jovem_id, data_aula, programa_id, excluirId]
            );
            return rows[0] || null;
        }

        async listarTodos(filtros = {}) {
            const condicoes = [];
            const valores = [];
            let idx = 1;

            if (filtros.jovem_id) {
                condicoes.push(`jovem_id = $${idx++}`);
                valores.push(filtros.jovem_id);
            }

            if (filtros.data_aula) {
                condicoes.push(`data_aula = $${idx++}`);
                valores.push(filtros.data_aula);
            }

            if (filtros.tipo_presenca) {
                condicoes.push(`tipo_presenca = $${idx++}`);
                valores.push(filtros.tipo_presenca);
            }

            if (filtros.programa_id) {
                condicoes.push(`programa_id = $${idx++}`);
                valores.push(filtros.programa_id);
            }

            const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';

            const { rows } = await pool.query(
                `SELECT ${COLUNAS} FROM frequencia ${where} ORDER BY data_aula DESC, jovem_id`,
                valores 
            );

            return rows.map(row => new Frequencia(row));
        }

        async atualizar(id, dados) {
            const campos = [];
            const valores = [];
            let idx = 1;

            // jovem_id e responsavel_id não são atualizáveis - registro pertence a quem criou
            const atualizaveis = ['data_aula', 'tipo_presenca', 'observacao'];

            for (const campo of atualizaveis) {
                if (dados[campo] !== undefined) {
                    campos.push(`${campo} = $${idx++}`);
                    valores.push(dados[campo]);
                }
            }

            if (!campos.length) return null;

            valores.push(id);

            const { rows } = await pool.query(
                `UPDATE frequencia
                SET ${campos.join(', ')}
                WHERE id = $${idx}
                RETURNING ${COLUNAS}`,
                valores
            );

            return rows[0] ? new Frequencia(rows[0]) : null;
        }

        async excluir(id) {
            const { rows } = await pool.query(
                `DELETE FROM frequencia WHERE id = $1 RETURNING id`,
                [id]
            );
            return rows[0] || null;
        }

        // Lista os alunos matriculados (ativos) em um programa, com a turma da matrícula
        // e o status de frequência na data informada (se houver). Sem data_aula, retorna
        // todos os alunos do programa sem nenhuma presença marcada ainda.
        async listarAlunosPrograma(filtros = {}) {
            const { programa_id, data_aula = null, turma = null } = filtros;

            const { rows } = await pool.query(
                `SELECT
                    j.id AS jovem_id,
                    j.nome,
                    j.cpf,
                    (SELECT u.foto_url FROM usuarios u WHERE u.jovem_id = j.id LIMIT 1) AS foto_url,
                    m.id AS matricula_id,
                    m.turma,
                    f.id AS frequencia_id,
                    f.tipo_presenca,
                    f.observacao,
                    stats.pct AS frequencia
                FROM matriculas m
                JOIN jovens j ON j.id = m.jovem_id
                LEFT JOIN frequencia f
                    ON f.jovem_id = j.id
                    AND f.programa_id = m.programa_id
                    AND f.data_aula = $2::date
                LEFT JOIN (
                    SELECT jovem_id, programa_id,
                        ROUND(100.0 * COUNT(*) FILTER (WHERE tipo_presenca IN ('Presencial', 'Gravacao')) / NULLIF(COUNT(*), 0)) AS pct
                    FROM frequencia
                    WHERE programa_id = $1
                    GROUP BY jovem_id, programa_id
                ) stats ON stats.jovem_id = j.id AND stats.programa_id = m.programa_id
                WHERE m.programa_id = $1
                    AND m.status = 'Ativo'
                    AND j.ativo = TRUE
                    AND ($3::varchar IS NULL OR m.turma = $3)
                ORDER BY j.nome`,
                [programa_id, data_aula, turma]
            );

            return rows;
        }

        async resumoPorJovem(programa_id = null) {
            const valores = [];
            let where = '';
            if (programa_id) {
                where = 'WHERE programa_id = $1';
                valores.push(programa_id);
            }

            const { rows } = await pool.query(
                `SELECT
                    jovem_id,
                    COUNT(*)::int AS total_aulas,
                    COUNT(CASE WHEN tipo_presenca IN ('Presencial', 'Gravacao') THEN 1 END)::int AS presencas,
                    ROUND(
                        COUNT(CASE WHEN tipo_presenca IN ('Presencial', 'Gravacao') THEN 1 END)::numeric
                        / NULLIF(COUNT(*), 0) * 100, 1
                    )::float AS percentual
                FROM frequencia ${where}
                GROUP BY jovem_id`,
                valores
            );
            return rows;
        }
    }

    module.exports = new frequenciaRepository();