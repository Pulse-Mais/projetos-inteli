// src/repositories/programaRepository.js

// Aqui, importamos a conexão com o banco de dados.
const { pool } = require('../database/db');

// Aqui, importamos o model que representa a entidade Programa.
const Programa = require('../models/Programa');

// Aqui, definimos as colunas retornadas nas consultas da entidade Programa.
const COLUNAS = `
id, nome, ano, tipo, carga_horaria, coorte, data_inicio, data_fim,
descricao, ativo, total_etapas, criado_em, atualizado_em
`;

// Aqui, criamos a classe responsável por acessar os dados da tabela programas.
class ProgramaRepository {

    // Aqui, criamos um novo programa no banco de dados.
    async criar(dados) {

        // Aqui, extraímos os dados necessários para inserir um programa.
        const {
            nome,
            ano,
            tipo,
            carga_horaria,
            coorte,
            data_inicio,
            data_fim,
            descricao,
            ativo
        } = dados;

        // Aqui, executamos o INSERT usando parâmetros para evitar injeção de SQL.
        const { rows } = await pool.query(
            `INSERT INTO programas
                (nome, ano, tipo, carga_horaria, coorte, data_inicio, data_fim, descricao, ativo)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING ${COLUNAS}`,
            [
                nome,
                ano,
                tipo,
                carga_horaria || null,
                coorte || null,
                data_inicio || null,
                data_fim || null,
                descricao || null,
                ativo ?? true
            ]
        );

        // Aqui, retornamos o programa criado como instância do model Programa.
        return new Programa(rows[0]);
    }

    // Aqui, buscamos um programa pelo ID.
    async buscarPorId(id) {

        // Aqui, executamos a consulta filtrando pelo ID informado.
        const { rows } = await pool.query(
            `SELECT ${COLUNAS} FROM programas WHERE id = $1`,
            [id]
        );

        // Aqui, retornamos o programa encontrado ou null quando ele não existe.
        return rows[0] ? new Programa(rows[0]) : null;
    }

    // Aqui, listamos todos os programas com filtros opcionais.
    async listarTodos(filtros = {}) {

        // Aqui, criamos os arrays que armazenam as condições e os valores da consulta.
        const condicoes = [];
        const valores = [];
        let idx = 1;

        // Aqui, por padrão, retornamos apenas programas ativos na listagem.
        const ativo = filtros.ativo !== undefined ? filtros.ativo : true;
        condicoes.push(`ativo = $${idx++}`);
        valores.push(ativo);

        // Aqui, adicionamos o filtro de busca por nome quando ele é informado.
        if (filtros.nome) {
            condicoes.push(`nome ILIKE $${idx++}`);
            valores.push(`%${filtros.nome}%`);
        }

        // Aqui, adicionamos o filtro de ano quando ele é informado.
        if (filtros.ano) {
            condicoes.push(`ano = $${idx++}`);
            valores.push(filtros.ano);
        }

        // Aqui, adicionamos o filtro de tipo quando ele é informado.
        if (filtros.tipo) {
            condicoes.push(`tipo = $${idx++}`);
            valores.push(filtros.tipo);
        }

        // Aqui, adicionamos o filtro de coorte quando ele é informado.
        if (filtros.coorte) {
            condicoes.push(`coorte = $${idx++}`);
            valores.push(filtros.coorte);
        }

        // Aqui, montamos a cláusula WHERE com os filtros aplicados.
        const where = `WHERE ${condicoes.join(' AND ')}`;

        // Aqui, executamos a consulta ordenando os programas mais recentes primeiro.
        const { rows } = await pool.query(
            `SELECT ${COLUNAS} FROM programas ${where} ORDER BY ano DESC, nome ASC`,
            valores
        );

        // Aqui, retornamos a lista de programas como instâncias do model Programa.
        return rows.map(row => new Programa(row));
    }

    // Aqui, atualizamos os dados de um programa existente.
    async atualizar(id, dados) {

        // Aqui, criamos os arrays que armazenam os campos e valores da atualização.
        const campos = [];
        const valores = [];
        let idx = 1;

        // Aqui, definimos quais campos podem ser atualizados pelo repository.
        const atualizaveis = [
            'nome',
            'ano',
            'tipo',
            'carga_horaria',
            'coorte',
            'data_inicio',
            'data_fim',
            'descricao',
            'ativo',
            'total_etapas'
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

        // Aqui, atualizamos automaticamente a data de alteração do programa.
        campos.push('atualizado_em = NOW()');

        // Aqui, adicionamos o ID ao final dos valores usados na query.
        valores.push(id);

        // Aqui, executamos o UPDATE do programa no banco de dados.
        const { rows } = await pool.query(
            `UPDATE programas
            SET ${campos.join(', ')}
            WHERE id = $${idx}
            RETURNING ${COLUNAS}`,
            valores
        );

        // Aqui, retornamos o programa atualizado ou null quando ele não existe.
        return rows[0] ? new Programa(rows[0]) : null;
    }

    // Aqui, arquivamos um programa sem remover seu histórico do banco.
    async arquivar(id) {

        // Aqui, executamos a atualização lógica marcando o programa como inativo.
        const { rows } = await pool.query(
            `UPDATE programas
            SET ativo = false, atualizado_em = NOW()
            WHERE id = $1
            RETURNING ${COLUNAS}`,
            [id]
        );

        // Aqui, retornamos o programa arquivado ou null quando ele não existe.
        return rows[0] ? new Programa(rows[0]) : null;
    }
}

// Aqui, exportamos uma instância única do repository de programas.
module.exports = new ProgramaRepository();
