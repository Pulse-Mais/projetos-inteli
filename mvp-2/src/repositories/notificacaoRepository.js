// src/repositories/notificacaoRepository.js

const { pool } = require('../database/db');
const Notificacao = require('../models/Notificacao');

const COLUNAS = `
id, usuario_id, tipo, titulo, descricao, lida, link, criado_em
`;

class NotificacaoRepository {

    async criar(dados) {
        const { usuario_id, tipo, titulo, descricao, lida, link } = dados;

        const { rows } = await pool.query(
            `INSERT INTO notificacoes (usuario_id, tipo, titulo, descricao, lida, link)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING ${COLUNAS}`,
            [usuario_id || null, tipo, titulo, descricao || null, lida ?? false, link || null]
        );

        return new Notificacao(rows[0]);
    }

    // Cria a notificação apenas se ainda não existir uma equivalente (mesmo
    // destinatário, tipo, título e link). Evita que notificações geradas
    // automaticamente (ex.: "Risco de evasão") sejam recriadas a cada acesso
    // ao dashboard. Retorna null quando uma equivalente já existe.
    async criarSeInedita(dados) {
        const { usuario_id, tipo, titulo, descricao, lida, link } = dados;

        const { rows } = await pool.query(
            `INSERT INTO notificacoes (usuario_id, tipo, titulo, descricao, lida, link)
            SELECT $1, $2, $3, $4, $5, $6
            WHERE NOT EXISTS (
                SELECT 1 FROM notificacoes
                WHERE tipo = $2
                  AND titulo = $3
                  AND usuario_id IS NOT DISTINCT FROM $1
                  AND link IS NOT DISTINCT FROM $6
            )
            RETURNING ${COLUNAS}`,
            [usuario_id || null, tipo, titulo, descricao || null, lida ?? false, link || null]
        );

        return rows[0] ? new Notificacao(rows[0]) : null;
    }

    async buscarPorId(id) {
        const { rows } = await pool.query(
            `SELECT ${COLUNAS} FROM notificacoes WHERE id = $1`,
            [id]
        );
        return rows[0] ? new Notificacao(rows[0]) : null;
    }

    async listarTodos(filtros = {}) {
        const condicoes = [];
        const valores = [];
        let idx = 1;

        if (filtros.usuario_id !== undefined) {
            condicoes.push(`usuario_id = $${idx++}`);
            valores.push(filtros.usuario_id);
        }

        if (filtros.tipo) {
            condicoes.push(`tipo = $${idx++}`);
            valores.push(filtros.tipo);
        }

        if (filtros.lida !== undefined) {
            condicoes.push(`lida = $${idx++}`);
            valores.push(filtros.lida);
        }

        const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';

        const { rows } = await pool.query(
            `SELECT ${COLUNAS} FROM notificacoes ${where} ORDER BY criado_em DESC`,
            valores
        );

        return rows.map(row => new Notificacao(row));
    }

    async marcarComoLida(id) {
        const { rows } = await pool.query(
            `UPDATE notificacoes SET lida = TRUE WHERE id = $1 RETURNING ${COLUNAS}`,
            [id]
        );
        return rows[0] ? new Notificacao(rows[0]) : null;
    }

    async atualizar(id, dados) {
        const campos = [];
        const valores = [];
        let idx = 1;

        const atualizaveis = ['tipo', 'titulo', 'descricao', 'lida', 'link'];

        for (const campo of atualizaveis) {
            if (dados[campo] !== undefined) {
                campos.push(`${campo} = $${idx++}`);
                valores.push(dados[campo]);
            }
        }

        if (!campos.length) return null;

        valores.push(id);

        const { rows } = await pool.query(
            `UPDATE notificacoes
            SET ${campos.join(', ')}
            WHERE id = $${idx}
            RETURNING ${COLUNAS}`,
            valores
        );

        return rows[0] ? new Notificacao(rows[0]) : null;
    }

    async excluir(id) {
        const { rows } = await pool.query(
            `DELETE FROM notificacoes WHERE id = $1 RETURNING id`,
            [id]
        );
        return rows[0] || null;
    }

    async purgarAntigas() {
        const { rowCount } = await pool.query(`
            DELETE FROM notificacoes
            WHERE (lida = true  AND criado_em < NOW() - INTERVAL '30 days')
               OR (lida = false AND criado_em < NOW() - INTERVAL '90 days')
        `);
        return rowCount;
    }
}

module.exports = new NotificacaoRepository();