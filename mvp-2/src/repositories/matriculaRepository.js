// src/repositories/matriculaRepository.js

const { pool } = require('../database/db');
const Matricula = require('../models/Matricula');
const { ConflictError } = require('../errors/AppError');

const COLUNAS = `
id, jovem_id, programa_id, status, turma, data_matricula, data_conclusao, observacoes, codigo, criado_em, atualizado_em
`;

class MatriculaRepository {

    async criar(dados) {
        const { jovem_id, programa_id, status, turma, data_matricula, data_conclusao, observacoes } = dados;

        try {
            const { rows } = await pool.query(
                `INSERT INTO matriculas (jovem_id, programa_id, status, turma, data_matricula, data_conclusao, observacoes)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id, data_matricula`,
                [jovem_id, programa_id, status || 'Ativo', turma || null, data_matricula || null, data_conclusao || null, observacoes || null]
            );

            const { id } = rows[0];
            const ano = rows[0].data_matricula
                ? new Date(rows[0].data_matricula).getFullYear()
                : new Date().getFullYear();
            const codigo = `PM-${ano}-${String(id).padStart(4, '0')}`;

            await pool.query(`UPDATE matriculas SET codigo = $1 WHERE id = $2`, [codigo, id]);

            return this.buscarPorId(id);
        } catch (err) {
            if (err.code === '23505') {
                throw new ConflictError('Este jovem já possui matrícula neste programa');
            }
            throw err;
        }
    }


    async buscarPorId(id) {
        const { rows } = await pool.query(
            `SELECT ${COLUNAS} FROM matriculas WHERE id = $1`,
            [id]
        );
        return rows[0] ? new Matricula(rows[0]) : null;
    }

    async listarTodos(filtros = {}) {
        const condicoes = [];
        const valores = [];
        let idx = 1;

        if (filtros.jovem_id) {
            condicoes.push(`jovem_id = $${idx++}`);
            valores.push(filtros.jovem_id);
        }

        if (filtros.programa_id) {
            condicoes.push(`programa_id = $${idx++}`);
            valores.push(filtros.programa_id);
        }

        if (filtros.status) {
            condicoes.push(`status = $${idx++}`);
            valores.push(filtros.status);
        }

        if (filtros.turma) {
            condicoes.push(`turma = $${idx++}`);
            valores.push(filtros.turma);
        }

        const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}`: '';

        const { rows } = await pool.query(
            `SELECT ${COLUNAS} FROM matriculas ${where} ORDER BY criado_em DESC`,
            valores
        );

        return rows.map(row => new Matricula(row));
    }

    async atualizar(id, dados) {
        const campos = [];
        const valores = [];
        let idx = 1;

        const atualizaveis = ['status', 'turma', 'data_conclusao', 'observacoes'];

        for (const campo of atualizaveis) {
            if (dados[campo] !== undefined) {
                campos.push(`${campo} = $${idx++}`);
                valores.push(dados[campo]);
            }
        }

        if (!campos.length) return null;

        campos.push(`atualizado_em = CURRENT_TIMESTAMP`);
        valores.push(id);

        const { rows } = await pool.query(
            `UPDATE matriculas
            SET ${campos.join(', ')}
            WHERE id = $${idx}
            RETURNING ${COLUNAS}`,
            valores
        );

        return rows[0] ? new Matricula(rows[0]) : null;
    }

    async excluir(id) {
        const { rows } = await pool.query(
            `DELETE FROM matriculas WHERE id = $1 RETURNING id`,
            [id]
        );
        return rows[0] || null;
    }
}

module.exports = new MatriculaRepository();