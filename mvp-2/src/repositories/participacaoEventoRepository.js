// src/repositories/participacaoEventoRepository.js

// Aqui, importamos a conexão com o banco de dados.
const { pool } = require('../database/db');

// Aqui, importamos o model que representa a entidade ParticipacaoEvento.
const ParticipacaoEvento = require('../models/ParticipacaoEvento');

// Aqui, importamos o erro usado quando a constraint de unicidade é violada.
const { ConflictError } = require('../errors/AppError');

// Aqui, definimos as colunas retornadas nas consultas simples da tabela participacoes_eventos.
const COLUNAS = `
id, jovem_id, evento_id, presente, criado_em
`;

// Aqui, definimos as colunas usadas nas consultas que precisam exibir dados do jovem e do evento.
const COLUNAS_COM_DETALHES = `
    pe.id,
    pe.jovem_id,
    pe.evento_id,
    pe.presente,
    pe.criado_em,
    j.nome AS jovem_nome,
    j.email AS jovem_email,
    e.nome AS evento_nome,
    e.data_inicio AS evento_data_inicio,
    e.data_fim AS evento_data_fim,
    e.tipo AS evento_tipo,
    e.local AS evento_local
`;

// Aqui, criamos a classe responsável por acessar os dados da tabela participacoes_eventos.
class ParticipacaoEventoRepository {

    // Aqui, registramos a participação de um jovem em um evento.
    async criar(dados) {

        // Aqui, extraímos os dados necessários para inserir a participação.
        const { jovem_id, evento_id, presente } = dados;

        try {
            // Aqui, executamos o INSERT usando parâmetros para evitar injeção de SQL.
            const { rows } = await pool.query(
                `INSERT INTO participacoes_eventos (jovem_id, evento_id, presente)
                VALUES ($1, $2, $3)
                RETURNING ${COLUNAS}`,
                [jovem_id, evento_id, presente ?? true]
            );

            // Aqui, retornamos a participação criada como instância do model ParticipacaoEvento.
            return new ParticipacaoEvento(rows[0]);
        } catch (err) {
            // Aqui, traduzimos a violação de UNIQUE (jovem_id, evento_id) para um erro de conflito.
            if (err.code === '23505') {
                throw new ConflictError('Este jovem ja possui participacao registrada neste evento');
            }

            throw err;
        }
    }

    // Aqui, buscamos uma participação pelo ID.
    async buscarPorId(id) {

        // Aqui, executamos a consulta filtrando pelo ID informado.
        const { rows } = await pool.query(
            `SELECT ${COLUNAS} FROM participacoes_eventos WHERE id = $1`,
            [id]
        );

        // Aqui, retornamos a participação encontrada ou null quando ela não existe.
        return rows[0] ? new ParticipacaoEvento(rows[0]) : null;
    }

    // Aqui, buscamos uma participação pela combinação de jovem e evento.
    async buscarPorJovemEEvento(jovem_id, evento_id) {

        // Aqui, usamos a mesma combinação protegida pela constraint UNIQUE da tabela.
        const { rows } = await pool.query(
            `SELECT ${COLUNAS}
            FROM participacoes_eventos
            WHERE jovem_id = $1 AND evento_id = $2`,
            [jovem_id, evento_id]
        );

        // Aqui, retornamos a participação encontrada ou null quando não existe vínculo.
        return rows[0] ? new ParticipacaoEvento(rows[0]) : null;
    }

    // Aqui, listamos participações com filtros opcionais.
    async listarTodos(filtros = {}) {

        // Aqui, criamos os arrays que armazenam as condições e os valores da consulta.
        const condicoes = [];
        const valores = [];
        let idx = 1;

        // Aqui, adicionamos o filtro por jovem quando ele é informado.
        if (filtros.jovem_id) {
            condicoes.push(`jovem_id = $${idx++}`);
            valores.push(filtros.jovem_id);
        }

        // Aqui, adicionamos o filtro por evento quando ele é informado.
        if (filtros.evento_id) {
            condicoes.push(`evento_id = $${idx++}`);
            valores.push(filtros.evento_id);
        }

        // Aqui, adicionamos o filtro de presença quando ele é informado.
        if (filtros.presente !== undefined) {
            condicoes.push(`presente = $${idx++}`);
            valores.push(filtros.presente);
        }

        // Aqui, montamos a cláusula WHERE apenas quando existem filtros.
        const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';

        // Aqui, executamos a consulta ordenando os registros mais recentes primeiro.
        const { rows } = await pool.query(
            `SELECT ${COLUNAS}
            FROM participacoes_eventos
            ${where}
            ORDER BY criado_em DESC, id DESC`,
            valores
        );

        // Aqui, retornamos a lista como instâncias do model ParticipacaoEvento.
        return rows.map(row => new ParticipacaoEvento(row));
    }

    // Aqui, listamos o histórico de eventos de um jovem com dados completos do evento.
    async listarPorJovem(jovem_id) {

        // Aqui, fazemos JOIN com jovens e eventos para alimentar prontuário, painel do aluno e visão do mentor.
        const { rows } = await pool.query(
            `SELECT ${COLUNAS_COM_DETALHES}
            FROM participacoes_eventos pe
            INNER JOIN jovens j ON j.id = pe.jovem_id
            INNER JOIN eventos e ON e.id = pe.evento_id
            WHERE pe.jovem_id = $1
            ORDER BY e.data_inicio DESC, e.nome ASC`,
            [jovem_id]
        );

        // Aqui, retornamos objetos simples porque a consulta contém campos agregados de outras entidades.
        return rows;
    }

    // Aqui, listamos os participantes de um evento com dados básicos dos jovens.
    async listarPorEvento(evento_id) {

        // Aqui, fazemos JOIN com jovens e eventos para exibir a lista operacional de presença.
        const { rows } = await pool.query(
            `SELECT ${COLUNAS_COM_DETALHES}
            FROM participacoes_eventos pe
            INNER JOIN jovens j ON j.id = pe.jovem_id
            INNER JOIN eventos e ON e.id = pe.evento_id
            WHERE pe.evento_id = $1
            ORDER BY j.nome ASC`,
            [evento_id]
        );

        // Aqui, retornamos objetos simples porque a consulta contém campos agregados de outras entidades.
        return rows;
    }

    // Aqui, atualizamos os dados de uma participação existente.
    async atualizar(id, dados) {

        // Aqui, criamos os arrays que armazenam os campos e valores da atualização.
        const campos = [];
        const valores = [];
        let idx = 1;

        // Aqui, permitimos atualizar apenas o status de presença, preservando o vínculo jovem-evento.
        const atualizaveis = ['presente'];

        // Aqui, percorremos os campos permitidos e adicionamos somente os que foram enviados.
        for (const campo of atualizaveis) {
            if (dados[campo] !== undefined) {
                campos.push(`${campo} = $${idx++}`);
                valores.push(dados[campo]);
            }
        }

        // Aqui, retornamos null quando não existe nenhum campo válido para atualizar.
        if (!campos.length) return null;

        // Aqui, adicionamos o ID ao final dos valores usados na query.
        valores.push(id);

        // Aqui, executamos o UPDATE da participação no banco de dados.
        const { rows } = await pool.query(
            `UPDATE participacoes_eventos
            SET ${campos.join(', ')}
            WHERE id = $${idx}
            RETURNING ${COLUNAS}`,
            valores
        );

        // Aqui, retornamos a participação atualizada ou null quando ela não existe.
        return rows[0] ? new ParticipacaoEvento(rows[0]) : null;
    }

    // Aqui, excluímos uma participação do banco de dados quando a remoção física for necessária.
    async excluir(id) {

        // Aqui, executamos o DELETE usando o ID informado.
        const { rows } = await pool.query(
            `DELETE FROM participacoes_eventos WHERE id = $1 RETURNING id`,
            [id]
        );

        // Aqui, retornamos o ID removido ou null quando a participação não existe.
        return rows[0] || null;
    }
}

// Aqui, exportamos uma instância única do repository de participação em eventos.
module.exports = new ParticipacaoEventoRepository();
