// src/repositories/saudeMentalRepository.js

// Aqui, importamos a conexão com o banco de dados.
const { pool } = require('../database/db');

// Aqui, importamos o model que representa o atendimento de saúde mental.
const AtendimentoSaudeMental = require('../models/AtendimentoSaudeMental');

// Aqui, definimos as colunas que retornamos nas consultas de saúde mental.
const COLUNAS = `
id, jovem_id, profissional_id, data_atendimento, resumo, encaminhamento, criado_em
`;

// Aqui, criamos a classe responsável por acessar os dados da tabela de saúde mental.
class SaudeMentalRepository {

    // Aqui, criamos um novo atendimento de saúde mental no banco de dados.
    async criar(dados) {

        // Aqui, extraímos os dados necessários para inserir um atendimento.
        const {
            jovem_id,
            profissional_id,
            data_atendimento,
            resumo,
            encaminhamento
        } = dados;

        // Aqui, executamos o INSERT usando parâmetros para evitar injeção de SQL.
        const { rows } = await pool.query(
            `INSERT INTO atendimentos_saude_mental
                (jovem_id, profissional_id, data_atendimento, resumo, encaminhamento)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING ${COLUNAS}`,
            [
                jovem_id,
                profissional_id,
                data_atendimento,
                resumo,
                encaminhamento || null
            ]
        );

        // Aqui, retornamos o atendimento criado como instância do model.
        return new AtendimentoSaudeMental(rows[0]);
    }

    // Aqui, buscamos um atendimento de saúde mental pelo ID.
    async buscarPorId(id) {

        // Aqui, executamos a consulta filtrando pelo ID informado.
        const { rows } = await pool.query(
            `SELECT ${COLUNAS}
            FROM atendimentos_saude_mental
            WHERE id = $1`,
            [id]
        );

        // Aqui, retornamos o atendimento encontrado ou null quando ele não existe.
        return rows[0] ? new AtendimentoSaudeMental(rows[0]) : null;
    }

    // Aqui, listamos atendimentos de saúde mental com filtros opcionais.
    async listarTodos(filtros = {}) {

        // Aqui, criamos os arrays que armazenam as condições e os valores da consulta.
        const condicoes = [];
        const valores = [];
        let idx = 1;

        // Aqui, adicionamos o filtro de jovem quando ele é informado.
        if (filtros.jovem_id) {
            condicoes.push(`jovem_id = $${idx++}`);
            valores.push(filtros.jovem_id);
        }

        // Aqui, adicionamos o filtro de profissional quando ele é informado.
        if (filtros.profissional_id) {
            condicoes.push(`profissional_id = $${idx++}`);
            valores.push(filtros.profissional_id);
        }

        // Aqui, adicionamos o filtro de data quando ele é informado.
        if (filtros.data_atendimento) {
            condicoes.push(`data_atendimento = $${idx++}`);
            valores.push(filtros.data_atendimento);
        }

        // Aqui, montamos a cláusula WHERE apenas quando existem filtros.
        const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';

        // Aqui, executamos a consulta ordenando os atendimentos mais recentes primeiro.
        const { rows } = await pool.query(
            `SELECT ${COLUNAS}
            FROM atendimentos_saude_mental
            ${where}
            ORDER BY data_atendimento DESC, criado_em DESC`,
            valores
        );

        // Aqui, retornamos a lista de atendimentos como instâncias do model.
        return rows.map(row => new AtendimentoSaudeMental(row));
    }

    // Aqui, atualizamos os dados de um atendimento de saúde mental existente.
    async atualizar(id, dados) {

        // Aqui, criamos os arrays que armazenam os campos e valores da atualização.
        const campos = [];
        const valores = [];
        let idx = 1;

        // Aqui, definimos quais campos podem ser atualizados pelo repository.
        const atualizaveis = [
            'data_atendimento',
            'resumo',
            'encaminhamento'
        ];

        // Aqui, percorremos os campos permitidos e adicionamos somente os que foram enviados.
        for (const campo of atualizaveis) {
            if (dados[campo] !== undefined) {
                campos.push(`${campo} = $${idx++}`);
                valores.push(dados[campo]);
            }
        }

        // Aqui, retornamos null quando não existe nenhum campo para atualizar.
        if (!campos.length) return null;

        // Aqui, adicionamos o ID ao final dos valores usados na query.
        valores.push(id);

        // Aqui, executamos o UPDATE do atendimento no banco de dados.
        const { rows } = await pool.query(
            `UPDATE atendimentos_saude_mental
            SET ${campos.join(', ')}
            WHERE id = $${idx}
            RETURNING ${COLUNAS}`,
            valores
        );

        // Aqui, retornamos o atendimento atualizado ou null quando ele não existe.
        return rows[0] ? new AtendimentoSaudeMental(rows[0]) : null;
    }

    // Aqui, excluímos um atendimento de saúde mental do banco de dados.
    async excluir(id) {

        // Aqui, executamos o DELETE usando o ID informado.
        const { rows } = await pool.query(
            'DELETE FROM atendimentos_saude_mental WHERE id = $1 RETURNING id',
            [id]
        );

        // Aqui, retornamos o ID removido ou null quando o atendimento não existe.
        return rows[0] || null;
    }
}

// Aqui, exportamos uma instância única do repository de saúde mental.
module.exports = new SaudeMentalRepository();
