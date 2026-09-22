// src/repositories/competenciaRepository.js

const { pool } = require('../database/db');
const Competencia = require('../models/Competencia');

const COLUNAS = `
    id, jovem_id, nome, tipo, nivel, instituicao, carga_horaria, criado_em
`;

class CompetenciaRepository {
    
    async criar(dados) {
        const { jovem_id, nome, tipo, nivel, instituicao, carga_horaria } = dados;

        const { rows } = await pool.query(
            `INSERT INTO competencias (jovem_id, nome, tipo, nivel, instituicao, carga_horaria)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING ${COLUNAS}`,
            [jovem_id, nome, tipo, nivel || null, instituicao || null, carga_horaria || null]
        );

        return new Competencia(rows[0]);
    }

    async buscarPorId(id) {
        const { rows } = await pool.query(
            `SELECT ${COLUNAS} FROM competencias WHERE id = $1`,
            [id]
        );
        return rows[0] ? new Competencia(rows[0]) : null;
    }

    async listarTodos(filtros = {}) {
        const condicoes = [];
        const valores = [];
        let idx = 1;

        if (filtros.jovem_id) {
            condicoes.push(`jovem_id = $${idx++}`);
            valores.push(filtros.jovem_id);
        }

        if (filtros.tipo) {
            condicoes.push(`tipo = $${idx++}`);
            valores.push(filtros.tipo);
        }

        if (filtros.nivel) {
            condicoes.push(`nivel = $${idx++}`);
            valores.push(filtros.nivel);
        }

        const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}`: '';

        const { rows } = await pool.query(
            `SELECT ${COLUNAS} FROM competencias ${where} ORDER BY criado_em DESC`,
            valores
        );

        return rows.map(row => new Competencia(row));
    }

    async atualizar(id, dados) {
        const campos = [];
        const valores = [];
        let idx = 1;

        const atualizaveis = ['nome', 'tipo', 'nivel', 'instituicao', 'carga_horaria'];

        for (const campo of atualizaveis) {
            if (dados[campo] !== undefined) {
                campos.push(`${campo} = $${idx++}`);
                valores.push(dados[campo]);
            } 
        }

        if (!campos.length) return null;

        valores.push(id);

        const  { rows } = await pool.query(
            `UPDATE competencias
            SET ${campos.join(', ')}
            WHERE id = $${idx}
            RETURNING ${COLUNAS}`,
            valores
        );

        return rows[0] ? new Competencia(rows[0]) : null;
    }

    async excluir(id) {
        const { rows } = await pool.query(
            `DELETE FROM competencias WHERE id = $1 RETURNING id`,
            [id]
        );
        return rows[0] || null;
    }
}

module.exports = new CompetenciaRepository();