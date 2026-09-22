// src/repositories/disciplinaRepository.js

const { pool } = require('../database/db');
const Disciplina = require('../models/Disciplina');

const COLUNAS = `
    id, ensino_superior_id, nome, status, semestre, criado_em
`;

class DisciplinaRepository {

    async criar(dados) {
        const { ensino_superior_id, nome, status, semestre } = dados;

        const { rows } = await pool.query(
            `INSERT INTO disciplinas (ensino_superior_id, nome, status, semestre)
            VALUES ($1, $2, $3, $4)
            RETURNING ${COLUNAS}`,
            [ensino_superior_id, nome, status, semestre || null]
        );

        return new Disciplina(rows[0]);
    }

    async buscarPorId(id) {
        const { rows } = await pool.query(
            `SELECT ${COLUNAS} FROM disciplinas WHERE id = $1`,
            [id]
        );
        return rows[0] ? new Disciplina(rows[0]) : null;
    }

    async listarTodos(filtros = {}) {
        const condicoes = [];
        const valores = [];
        let idx = 1;

        let from = 'FROM disciplinas d';

        if (filtros.jovem_id) {
            from = 'FROM disciplinas d JOIN ensino_superior es ON es.id = d.ensino_superior_id';
            condicoes.push(`es.jovem_id = $${idx++}`);
            valores.push(filtros.jovem_id);
        }

        if (filtros.ensino_superior_id) {
            condicoes.push(`d.ensino_superior_id = $${idx++}`);
            valores.push(filtros.ensino_superior_id);
        }

        if (filtros.status) {
            condicoes.push(`d.status = $${idx++}`);
            valores.push(filtros.status);
        }

        const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';
        const cols  = 'd.id, d.ensino_superior_id, d.nome, d.status, d.semestre, d.criado_em';

        const { rows } = await pool.query(
            `SELECT ${cols} ${from} ${where} ORDER BY d.semestre DESC NULLS LAST, d.nome ASC`,
            valores
        );

        return rows.map(row => new Disciplina(row));
    }

    async atualizar(id, dados) {
        const campos = [];
        const valores = [];
        let idx = 1;

        const atualizaveis = ['nome', 'status', 'semestre'];

        for (const campo of atualizaveis) {
            if (dados[campo] !== undefined) {
                campos.push(`${campo} = $${idx++}`);
                valores.push(dados[campo]);
            }
        }

        if (!campos.length) return null;

        valores.push(id);

        const { rows } = await pool.query(
            `UPDATE disciplinas
            SET ${campos.join(', ')}
            WHERE id = $${idx}
            RETURNING ${COLUNAS}`,
            valores
        );

        return rows[0] ? new Disciplina(rows[0]) : null;
    }

    async excluir(id) {
        const { rows } = await pool.query(
            `DELETE FROM disciplinas WHERE id = $1 RETURNING id`,
            [id]
        );
        return rows[0] || null;
    }
}

module.exports = new DisciplinaRepository();
