// src/repositories/eventoRepository.js

// Aqui, importamos a conexão com o banco de dados.
const { pool } = require('../database/db');

// Aqui, importamos o model que representa a entidade Evento.
const Evento = require('../models/Evento');

// Aqui, definimos as colunas retornadas nas consultas da entidade Evento.
const COLUNAS = `
id, nome, data_inicio, data_fim, tipo, descricao, local, vagas, criado_em, atualizado_em
`;

// Aqui, criamos a classe responsável por acessar os dados da tabela eventos.
class EventoRepository {

    // Aqui, criamos um novo evento no banco de dados.
    async criar(dados) {

        // Aqui, extraímos os dados necessários para inserir um evento.
        const {
            nome,
            data_inicio,
            data_fim,
            tipo,
            descricao,
            local,
            vagas
        } = dados;

        // Aqui, executamos o INSERT usando parâmetros para evitar injeção de SQL.
        const { rows } = await pool.query(
            `INSERT INTO eventos
                (nome, data_inicio, data_fim, tipo, descricao, local, vagas)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING ${COLUNAS}`,
            [
                nome,
                data_inicio,
                data_fim || null,
                tipo,
                descricao || null,
                local || null,
                vagas ?? null
            ]
        );

        // Aqui, retornamos o evento criado como instância do model Evento.
        return new Evento(rows[0]);
    }

    // Aqui, buscamos um evento pelo ID.
    async buscarPorId(id) {

        // Aqui, executamos a consulta filtrando pelo ID informado.
        const { rows } = await pool.query(
            `SELECT ${COLUNAS} FROM eventos WHERE id = $1`,
            [id]
        );

        // Aqui, retornamos o evento encontrado ou null quando ele não existe.
        return rows[0] ? new Evento(rows[0]) : null;
    }

    // Aqui, listamos todos os eventos com filtros opcionais.
    async listarTodos(filtros = {}) {

        // Aqui, criamos os arrays que armazenam as condições e os valores da consulta.
        const condicoes = [];
        const valores = [];
        let idx = 1;

        // Aqui, adicionamos o filtro de busca por nome quando ele é informado.
        if (filtros.nome) {
            condicoes.push(`nome ILIKE $${idx++}`);
            valores.push(`%${filtros.nome}%`);
        }

        // Aqui, adicionamos o filtro de tipo quando ele é informado.
        if (filtros.tipo) {
            condicoes.push(`tipo = $${idx++}`);
            valores.push(filtros.tipo);
        }

        // Aqui, adicionamos o filtro de local quando ele é informado.
        if (filtros.local) {
            condicoes.push(`local ILIKE $${idx++}`);
            valores.push(`%${filtros.local}%`);
        }

        // Aqui, adicionamos o filtro de data inicial quando ele é informado.
        if (filtros.data_inicio) {
            condicoes.push(`data_inicio >= $${idx++}`);
            valores.push(filtros.data_inicio);
        }

        // Aqui, adicionamos o filtro de data final quando ele é informado.
        if (filtros.data_fim) {
            condicoes.push(`data_inicio <= $${idx++}`);
            valores.push(filtros.data_fim);
        }

        // Aqui, montamos a cláusula WHERE apenas quando existem filtros.
        const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';

        // Aqui, executamos a consulta ordenando os próximos eventos primeiro.
        const { rows } = await pool.query(
            `SELECT ${COLUNAS} FROM eventos ${where} ORDER BY data_inicio ASC, nome ASC`,
            valores
        );

        // Aqui, retornamos a lista de eventos como instâncias do model Evento.
        return rows.map(row => new Evento(row));
    }

    // Aqui, atualizamos os dados de um evento existente.
    async atualizar(id, dados) {

        // Aqui, criamos os arrays que armazenam os campos e valores da atualização.
        const campos = [];
        const valores = [];
        let idx = 1;

        // Aqui, definimos quais campos podem ser atualizados pelo repository.
        const atualizaveis = [
            'nome',
            'data_inicio',
            'data_fim',
            'tipo',
            'descricao',
            'local',
            'vagas'
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

        // Aqui, atualizamos automaticamente a data de alteração do evento.
        campos.push('atualizado_em = NOW()');

        // Aqui, adicionamos o ID ao final dos valores usados na query.
        valores.push(id);

        // Aqui, executamos o UPDATE do evento no banco de dados.
        const { rows } = await pool.query(
            `UPDATE eventos
            SET ${campos.join(', ')}
            WHERE id = $${idx}
            RETURNING ${COLUNAS}`,
            valores
        );

        // Aqui, retornamos o evento atualizado ou null quando ele não existe.
        return rows[0] ? new Evento(rows[0]) : null;
    }

    // Aqui, excluímos um evento do banco de dados quando a remoção física for necessária.
    async excluir(id) {

        // Aqui, executamos o DELETE usando o ID informado.
        const { rows } = await pool.query(
            'DELETE FROM eventos WHERE id = $1 RETURNING id',
            [id]
        );

        // Aqui, retornamos o ID removido ou null quando o evento não existe.
        return rows[0] || null;
    }
}

// Aqui, exportamos uma instância única do repository de eventos.
module.exports = new EventoRepository();
