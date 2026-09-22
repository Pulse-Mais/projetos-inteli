// src/repositories/anotacaoRepository.js

const { pool } = require('../database/db');
const Anotacao = require('../models/Anotacao');

const COLUNAS = `
id, jovem_id, autor_id, categoria, tipo_alerta, texto, visivel_mentor, criado_em
`;

class AnotacaoRepository {

    async criar(dados) {
        const { jovem_id, autor_id, categoria, tipo_alerta, texto, visivel_mentor } = dados;

        const { rows } = await pool.query(
            `INSERT INTO anotacoes (jovem_id, autor_id, categoria, tipo_alerta, texto, visivel_mentor)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING ${COLUNAS}`,
            [jovem_id, autor_id, categoria, tipo_alerta, texto, visivel_mentor ?? false]
        );

        return new Anotacao(rows[0]);
    }

    async buscarPorId(id) {
        const { rows } = await pool.query(
            `SELECT ${COLUNAS} FROM anotacoes WHERE id = $1`,
            [id]
        );
        return rows[0] ? new Anotacao(rows[0]) : null;
    }

    async listarTodos(filtros ={}) {
        const condicoes = [];
        const valores = [];
        let idx = 1;

        if (filtros.jovem_id) {
            condicoes.push(`jovem_id = $${idx++}`);
            valores.push(filtros.jovem_id);
        }

        if (filtros.perfil === 'Mentor') {
            filtros.visivel_mentor = true;
        }
        delete filtros.perfil;

        if (filtros.visivel_mentor === true) {
            condicoes.push(`visivel_mentor = true`);
        }

        if (filtros.categoria) {
            condicoes.push(`categoria = $${idx++}`);
            valores.push(filtros.categoria);
        }

        if (filtros.tipo_alerta) {
            condicoes.push(`tipo_alerta = $${idx++}`);
            valores.push(filtros.tipo_alerta);
        }

        const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';

        const { rows } = await pool.query(
            `SELECT ${COLUNAS} FROM anotacoes ${where} ORDER BY criado_em DESC`,
            valores
        );

        return rows.map(row => new Anotacao(row));
    }

    async atualizar(id, dados) {
        const campos = []
        const valores = [];
        let idx = 1;

        // jovem_id e autor_id não são atualizáveis
        const atualizaveis = ['categoria', 'texto', 'tipo_alerta', 'visivel_mentor'];

        for (const campo of atualizaveis) {
            if (dados[campo] !== undefined) {
                campos.push(`${campo} = $${idx++}`);
                valores.push(dados[campo]);
            }
        }

        if (!campos.length) return null;

        valores.push(id);

        const { rows } = await pool.query(
            `UPDATE anotacoes
            SET ${campos.join(', ')}
            WHERE id = $${idx}
            RETURNING ${COLUNAS}`,
            valores
        );

        return rows[0] ? new Anotacao(rows[0]) : null;
    }

    async excluir(id) {
        const { rows } = await pool.query(
            `DELETE FROM anotacoes WHERE id = $1 RETURNING id`,
            [id]
        );
        return rows[0] || null;
    }
}

module.exports = new AnotacaoRepository();