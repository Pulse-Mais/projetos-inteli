// src/repositories/logAuditoriaRepository.js

const { pool } = require('../database/db');
const LogAuditoria = require('../models/LogAuditoria');

const COLUNAS = `
    id, usuario_id, entidade, entidade_id, operacao,
    dados_anteriores, dados_novos, ip_origem, rota,
    metodos_http, criado_em
    `;

    class LogAuditoriaRepository {

        async buscarPorId(id) {
            const { rows } = await pool.query(
                `SELECT ${COLUNAS} FROM log_auditoria WHERE id = $1`,
                [id]
            );
            return rows[0] ? new LogAuditoria(rows[0]) : null;
        }

        async listarTodos(filtros = {}) {
            const condicoes = [];
            const valores = [];
            let idx = 1;

            if (filtros.usuario_id) {
                condicoes.push(`usuario_id = $${idx++}`);
                valores.push(filtros.usuario_id);
            }

            if (filtros.entidade) {
                condicoes.push(`entidade = $${idx++}`);
                valores.push(filtros.entidade);
            }

            if (filtros.operacao) {
                condicoes.push(`operacao = $${idx++}`);
                valores.push(filtros.operacao);
            }

            if (filtros.data_inicio) {
                condicoes.push(`criado_em >= $${idx++}`);
                valores.push(filtros.data_inicio);
            }

            if (filtros.data_fim) {
                condicoes.push(`criado_em <= $${idx++}`);
                valores.push(filtros.data_fim);
            }

            const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';

            const { rows } = await pool.query(
                `SELECT ${COLUNAS} FROM log_auditoria ${where} ORDER BY criado_em DESC`,
                valores
            );

            return rows.map(row => new LogAuditoria(row));
        }
    }

    module.exports = new LogAuditoriaRepository();