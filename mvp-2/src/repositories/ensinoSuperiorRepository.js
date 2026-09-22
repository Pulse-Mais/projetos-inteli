// src/repositories/ensinoSuperiorRepository.js

const { pool } = require('../database/db');
const EnsinoSuperior = require('../models/EnsinoSuperior');

const COLUNAS = `
    id, jovem_id, instituicao, cursos, modalidade_bolsa,
    status, data_inicio, data_conclusao,
    semestre_atual, numero_matricula_ies, criado_em, atualizado_em
    `;

    class EnsinoSuperiorRepository {

        async criar(dados) {
            const {
                jovem_id, instituicao, cursos, status,
                modalidade_bolsa, data_inicio, data_conclusao,
                semestre_atual, numero_matricula_ies
            } = dados;

            const { rows } = await pool.query(
                `INSERT INTO ensino_superior
                    (jovem_id, instituicao, cursos, status,
                    modalidade_bolsa, data_inicio, data_conclusao,
                    semestre_atual, numero_matricula_ies)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING ${COLUNAS}`,
                [
                    jovem_id, instituicao, cursos, status,
                    modalidade_bolsa || null, data_inicio || null, data_conclusao || null,
                    semestre_atual || null, numero_matricula_ies || null
                ]
            );

            return new EnsinoSuperior(rows[0]);
        }

        async buscarPorId(id) {
            const { rows } = await pool.query(
                `SELECT ${COLUNAS} FROM ensino_superior WHERE id = $1`,
                [id]
            );
            return rows[0] ? new EnsinoSuperior(rows[0]) : null;
        }

        async listarTodos(filtros = {}) {
            const condicoes = [];
            const valores = [];
            let idx = 1;

            if (filtros.jovem_id) {
                condicoes.push(`jovem_id = $${idx++}`);
                valores.push(filtros.jovem_id);
            }

            if (filtros.status) {
                condicoes.push(`status = $${idx++}`);
                valores.push(filtros.status);
            }

            const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';

            const { rows } = await pool.query(
            `SELECT ${COLUNAS} FROM ensino_superior ${where} ORDER BY criado_em DESC`,
            valores
            );

            return rows.map(row => new EnsinoSuperior(row));
        }

        async atualizar(id, dados) {
            const campos = [];
            const valores = [];
            let idx = 1;

            const atualizaveis = [
                'instituicao', 'cursos', 'modalidade_bolsa',
                'status', 'data_inicio', 'data_conclusao',
                'semestre_atual', 'numero_matricula_ies'
            ];

            for (const campo of atualizaveis) {
                if (dados[campo] !== undefined) {
                    campos.push(`${campo} = $${idx++}`);
                    valores.push(dados[campo]);
                }
            }

            if (!campos.length) return null;

            campos.push(`atualizado_em = NOW()`);
            valores.push(id);

            const { rows } = await pool.query(
                `UPDATE ensino_superior
                SET ${campos.join(', ')}
                WHERE id = $${idx}
                RETURNING ${COLUNAS}`,
                valores
            );

            return rows[0] ? new EnsinoSuperior(rows[0]) : null;
        }

        async excluir(id) {
            const { rows } = await pool.query(
                `DELETE FROM ensino_superior WHERE id = $1 RETURNING id`,
                [id]
            );
            return rows[0] || null;
        }
    }

    module.exports = new EnsinoSuperiorRepository();