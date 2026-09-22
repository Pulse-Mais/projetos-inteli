// src/repositories/certificadoRepository.js

const { pool } = require('../database/db');
const Certificado = require('../models/Certificado');

const COLUNAS = `
    id, jovem_id, nome, instituicao, data_conclusao, link_documento, criado_em
`;

class CertificadoRepository {

    async criar(dados) {
        const { jovem_id, nome, instituicao, data_conclusao, link_documento } = dados;

        const { rows } = await pool.query(
            `INSERT INTO certificados (jovem_id, nome, instituicao, data_conclusao, link_documento)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING ${COLUNAS}`,
            [jovem_id, nome, instituicao || null, data_conclusao || null, link_documento || null]
        );

        return new Certificado(rows[0]);
    }

    async buscarPorId(id) {
        const { rows } = await pool.query(
            `SELECT ${COLUNAS} FROM certificados WHERE id = $1`,
            [id]
        );
        return rows[0] ? new Certificado(rows[0]) : null;
    }

    async listarTodos(filtros = {}) {
        const condicoes = [];
        const valores = [];
        let idx = 1;

        if (filtros.jovem_id) {
            condicoes.push(`jovem_id = $${idx++}`);
            valores.push(filtros.jovem_id);
        }

        const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';

        const { rows } = await pool.query(
            `SELECT ${COLUNAS} FROM certificados ${where} ORDER BY data_conclusao DESC NULLS LAST`,
            valores
        );

        return rows.map(row => new Certificado(row));
    }

    async atualizar(id, dados) {
        const campos = [];
        const valores = [];
        let idx = 1;

        const atualizaveis = ['nome', 'instituicao', 'data_conclusao', 'link_documento'];

        for (const campo of atualizaveis) {
            if (dados[campo] !== undefined) {
                campos.push(`${campo} = $${idx++}`);
                valores.push(dados[campo]);
            }
        }

        if (!campos.length) return null;

        valores.push(id);

        const { rows } = await pool.query(
            `UPDATE certificados
            SET ${campos.join(', ')}
            WHERE id = $${idx}
            RETURNING ${COLUNAS}`,
            valores
        );

        return rows[0] ? new Certificado(rows[0]) : null;
    }

    async excluir(id) {
        const { rows } = await pool.query(
            `DELETE FROM certificados WHERE id = $1 RETURNING id`,
            [id]
        );
        return rows[0] || null;
    }
}

module.exports = new CertificadoRepository();
