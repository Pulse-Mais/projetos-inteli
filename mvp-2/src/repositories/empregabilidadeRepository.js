// src/repositories/empregabilidadeRepository.js

const { pool } = require('../database/db');
const Empregabilidade = require('../models/Empregabilidade');

const COLUNAS = `
id, jovem_id, empresa, cargo, data_admissao, data_saida,
faixa_salarial, tipo_vinculo, modalidade, carga_horaria_semanal, area_tech, ativo,
criado_em, atualizado_em
`;

class EmpregabilidadeRepository {

    async criar(dados) {
        const {
            jovem_id, empresa, cargo, data_admissao, data_saida,
            faixa_salarial, tipo_vinculo, modalidade, carga_horaria_semanal, area_tech
        } = dados;

        const { rows } = await pool.query(
            `INSERT INTO empregabilidade
                (jovem_id, empresa, cargo, data_admissao, data_saida,
                faixa_salarial, tipo_vinculo, modalidade, carga_horaria_semanal, area_tech)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING ${COLUNAS}`,
             [
                jovem_id, empresa, cargo || null, data_admissao || null,
                data_saida || null, faixa_salarial || null,
                tipo_vinculo || null, modalidade || null, carga_horaria_semanal || null,
                area_tech ?? false
             ]
        );

        return new Empregabilidade(rows[0]);
    }

    async buscarPorId(id) {
        const { rows } = await pool.query(
            `SELECT ${COLUNAS} FROM empregabilidade WHERE id = $1`,
            [id]
        );
        return rows[0] ? new Empregabilidade(rows[0]) : null;
    }

    async listarTodos(filtros = {}) {
        const condicoes = [];
        const valores = [];
        let idx = 1;

        if (filtros.jovem_id) {
            condicoes.push(`jovem_id = $${idx++}`);
            valores.push(filtros.jovem_id);
        }

        if (filtros.ativo !== undefined) {
            condicoes.push(`ativo = $${idx++}`);
            valores.push(filtros.ativo);
        }

        if (filtros.tipo_vinculo) {
            condicoes.push(`tipo_vinculo = $${idx++}`);
            valores.push(filtros.tipo_vinculo);
        }

        const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';

        const { rows } = await pool.query(
            `SELECT ${COLUNAS} FROM empregabilidade ${where} ORDER BY criado_em DESC`,
            valores
        );

        return rows.map(row => new Empregabilidade(row));
    }

    async atualizar(id, dados) {
        const campos = [];
        const valores = [];
        let idx = 1;

        const atualizaveis = [
            'empresa', 'cargo', 'data_admissao', 'data_saida',
            'faixa_salarial', 'tipo_vinculo', 'modalidade', 'carga_horaria_semanal', 'area_tech'
        ];

        for (const campo of atualizaveis) {
            if (dados[campo] !== undefined) {
                campos.push(`${campo} = $${idx++}`);
                valores.push(dados[campo]);
            }
        }

        if (!campos.length) return null;

        campos.push(`atualizado_em = NOW()`);
        valores.push(id);

        const { rows } = await pool.query(
            `UPDATE empregabilidade
            SET ${campos.join(', ')}
            WHERE id = $${idx}
            RETURNING ${COLUNAS}`,
            valores
        );

        return rows[0] ? new Empregabilidade(rows[0]) : null;
    }

    async excluir(id) {
        const { rows } = await pool.query(
            `DELETE FROM empregabilidade WHERE id = $1 RETURNING id`,
            [id]
        );
        return rows[0] || null;
    }

    async arquivar(id) {
        const { rows } = await pool.query(
            `UPDATE empregabilidade
            SET ativo = false, atualizado_em = NOW()
            WHERE id = $1
            RETURNING ${COLUNAS}`,
            [id]
        );
        return rows[0] ? new Empregabilidade(rows[0]) : null;
    }
}

module.exports = new EmpregabilidadeRepository();