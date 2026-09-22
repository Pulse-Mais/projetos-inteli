// src/repositories/oportunidadeRepository.js

const { pool } = require('../database/db');
const Oportunidade = require('../models/Oportunidade');

const COLUNAS = `
    id, tipo, titulo, instituicao, descricao, local,
    data_inicio, data_fim, duracao, vagas, valor,
    modalidade, link, ativo, criado_em
    `;

    class OportunidadeRepository {

        async criar(dados) {
            const {
                tipo, titulo, instituicao, descricao, local,
                data_inicio, data_fim, duracao, vagas, valor,
                modalidade, link, ativo
            } = dados;

            const { rows } = await pool.query(
                `INSERT INTO oportunidades
                    (tipo, titulo, instituicao, descricao, local, data_inicio, data_fim,
                    duracao, vagas, valor, modalidade, link, ativo)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                RETURNING ${COLUNAS}`,
                [
                    tipo, titulo, instituicao || null, descricao || null, local || null,
                    data_inicio || null, data_fim || null, duracao || null,
                    vagas || null, valor || null, modalidade || null, link || null,
                    ativo ?? true
                ]
            );

            return new Oportunidade(rows[0]);
        }

        async buscarPorId(id) {
            const { rows } = await pool.query(
                `SELECT ${COLUNAS} FROM oportunidades WHERE id = $1`,
                [id]
            );
            return rows[0] ? new Oportunidade(rows[0]) : null;
        }

        async listarTodos(filtros ={}) {
            const condicoes = [];
            const valores = [];
            let idx = 1;

            const ativo = filtros.ativo !== undefined ? filtros.ativo : true;
            condicoes.push(`ativo = $${idx++}`);
            valores.push(ativo);

            if (filtros.tipo) {
                condicoes.push(`tipo = $${idx++}`);
                valores.push(filtros.tipo);
            }

            if (filtros.modalidade) {
                condicoes.push(`modalidade = $${idx++}`);
                valores.push(filtros.modalidade);
            }

            const where = `WHERE ${condicoes.join(' AND ')}`;

            const { rows } = await pool.query(
                `SELECT ${COLUNAS} FROM oportunidades ${where} ORDER BY criado_em DESC`,
                valores
            );
            
            return rows.map(row => new Oportunidade(row));
        }

        async atualizar(id, dados) {
            const campos = [];
            const valores = [];
            let idx = 1;

            const atualizaveis = [
                'tipo', 'titulo', 'instituicao', 'descricao', 'local',
                'data_inicio', 'data_fim', 'duracao', 'vagas', 'valor',
                'modalidade', 'link', 'ativo'
            ];

            for (const campo of atualizaveis) {
                if (dados[campo] !== undefined) {
                    campos.push(`${campo} = $${idx++}`);
                    valores.push(dados[campo]);
                }
            }

            if (!campos.length) return null;

            valores.push(id);

            const { rows } = await pool.query(
                `UPDATE oportunidades
                SET ${campos.join(', ')}
                WHERE id = $${idx}
                RETURNING ${COLUNAS}`,
                valores
            );

            return rows [0] ? new Oportunidade(rows[0]) : null;
        }

        async excluir(id) {
            const { rows } = await pool.query(
                `DELETE FROM oportunidades WHERE id = $1 RETURNING id`,
                [id]
            );
            return rows[0] || null;
        }
    }

    module.exports = new OportunidadeRepository();