// src/repositories/atividadesRepository.js

const { pool } = require('../database/db');
const Atividades = require('../models/Atividades');

const COLUNAS = `
id, programa_id, titulo, descricao, data_limite, criado_em
`;

class AtividadesRepository {

    async criar(dados) {
        const { programa_id, titulo, descricao, data_limite } = dados;

        const { rows } = await pool.query(
            `INSERT INTO atividades (programa_id, titulo, descricao, data_limite)
            VALUES ($1, $2, $3, $4)
            RETURNING ${COLUNAS}`,
            [programa_id, titulo, descricao || null, data_limite || null]
        );

        return new Atividades(rows[0]);
    }

    async buscarPorId(id) {
        const { rows } = await pool.query(
            `SELECT ${COLUNAS} FROM atividades WHERE id = $1`,
            [id]
        );
        return rows[0] ? new Atividades(rows[0]) : null;
    }

    async listarTodos(filtros = {}) {
        const condicoes = [];
        const valores = [];
        let idx = 1;

        if (filtros.programa_id) {
            condicoes.push(`programa_id = $${idx++}`);
            valores.push(filtros.programa_id);
        }

        const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';

        const { rows } = await pool.query(
            `SELECT ${COLUNAS} FROM atividades ${where} ORDER BY data_limite ASC, criado_em DESC`,
            valores
        );

        return rows.map(row => new Atividades(row));
    }

    async atualizar(id, dados) {
        const campos = [];
        const valores = [];
        let idx = 1;

        const atualizaveis = ['titulo', 'descricao', 'data_limite'];

        for (const campo of atualizaveis) {
            if (dados[campo] !== undefined) {
                campos.push(`${campo} = $${idx++}`);
                valores.push(dados[campo]);
            }
        }

        if (!campos.length) return null;

        valores.push(id);

        const { rows } = await pool.query(
            `UPDATE atividades
            SET ${campos.join(', ')}
            WHERE id = $${idx}
            RETURNING ${COLUNAS}`,
            valores
        );

        return rows[0] ? new Atividades(rows[0]) : null;
    }

    async excluir(id) {
        const { rows } = await pool.query(
            `DELETE FROM atividades WHERE id = $1 RETURNING id`,
            [id]
        );
        return rows[0] || null;
    }
}

module.exports = new AtividadesRepository();