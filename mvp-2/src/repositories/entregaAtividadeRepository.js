// src/repositories/entregaAtividadeRepository.js

const { pool } = require('../database/db');
const EntregaAtividade = require('../models/EntregaAtividade');
const { ConflictError } = require('../errors/AppError');

const COLUNAS = `
id, atividades_id, jovem_id, status, nota, data_entrega, observacao, criado_em, atualizado_em
`;

class EntregaAtividadeRepository {

    async criar(dados) {
        const { atividades_id, jovem_id, status, nota, data_entrega, observacao } = dados;

        try {
            const { rows } = await pool.query(
                `INSERT INTO entregas_atividades (atividades_id, jovem_id, status, nota, data_entrega, observacao)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING ${COLUNAS}`,
                [atividades_id, jovem_id, status || 'Pendente', nota || null, data_entrega || null, observacao || null]
            );
            return new EntregaAtividade(rows[0]);
        } catch (err) {
            if (err.code === '23505') {
                throw new ConflictError('Este jovem já possui uma entrega para esta atividade');
            }
            throw err;
        }
    }

    async buscarPorId(id) {
        const { rows } = await pool.query(
            `SELECT ${COLUNAS} FROM entregas_atividades WHERE id = $1`,
            [id]
        );
        return rows[0] ? new EntregaAtividade(rows[0]) : null;
    }

    async listarTodos(filtros = {}) {
        const condicoes = [];
        const valores = [];
        let idx = 1;

        if (filtros.atividades_id) {
            condicoes.push(`ea.atividades_id = $${idx++}`);
            valores.push(filtros.atividades_id);
        }

        if (filtros.jovem_id) {
            condicoes.push(`ea.jovem_id = $${idx++}`);
            valores.push(filtros.jovem_id);
        }

        if (filtros.status) {
            condicoes.push(`ea.status = $${idx++}`);
            valores.push(filtros.status);
        }

        const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';

        const { rows } = await pool.query(
            `SELECT ea.id, ea.atividades_id, a.titulo AS atividade_nome, ea.jovem_id, ea.status,
                    ea.nota, ea.data_entrega, ea.observacao, ea.criado_em, ea.atualizado_em
            FROM entregas_atividades ea
            LEFT JOIN atividades a ON a.id = ea.atividades_id
            ${where} ORDER BY ea.criado_em DESC`,
            valores
        );

        return rows.map(row => new EntregaAtividade(row));
    }

    async atualizar(id, dados) {
        const campos = [];
        const valores = [];
        let idx = 1;

        const atualizaveis = ['status', 'nota', 'data_entrega', 'observacao'];

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
            `UPDATE entregas_atividades
            SET ${campos.join(', ')}
            WHERE id = $${idx}
            RETURNING ${COLUNAS}`,
            valores
        );

        return rows[0] ? new EntregaAtividade(rows[0]) : null;
    }

    async excluir(id) {
        const { rows } = await pool.query(
            `DELETE FROM entregas_atividades WHERE id = $1 RETURNING id`,
            [id]
        );
        return rows[0] || null;
    }
}

module.exports = new EntregaAtividadeRepository();