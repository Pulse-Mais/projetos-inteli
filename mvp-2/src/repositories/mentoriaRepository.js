// src/repositories/mentoriaRepository.js

// Aqui, importamos a conexão com o banco de dados e o model Mentoria.
const { pool } = require('../database/db');
const Mentoria = require('../models/Mentoria');

// Aqui, definimos o SELECT base com JOIN para retornar o nome do mentor junto.
const SELECT_COM_MENTOR = `
    SELECT
        m.id,
        m.mentor_id,
        u.nome AS mentor_nome,
        m.status_mentoria,
        m.data_mentoria,
        m.duracao_minutos,
        m.observacao_mentoria,
        m.temas,
        m.criado_em,
        COALESCE(
            (SELECT json_agg(json_build_object('jovem_id', mj.jovem_id, 'jovem_nome', j.nome))
             FROM mentorias_jovens mj
             JOIN jovens j ON j.id = mj.jovem_id
             WHERE mj.mentoria_id = m.id),
            '[]'::json
        ) AS jovens
    FROM mentorias m
    JOIN usuarios u ON u.id = m.mentor_id
`;


// Aqui, criamos a classe responsável por acessar e manipular os dados da tabela mentoria.
class MentoriaRepository {

    // Aqui, criamos um novo registro de mentoria no banco de dados.
    async criar(dados) {

        // Aqui, extraímos os dados recebidos do objeto enviado para o método.
        const { mentor_id, status_mentoria, data_mentoria, duracao_minutos, observacao_mentoria, jovem_ids, temas } = dados;

        // Aqui, executamos o INSERT da mentoria e obtemos o ID gerado.
        const { rows } = await pool.query(
            `
            INSERT INTO mentorias (mentor_id, status_mentoria, data_mentoria, duracao_minutos, observacao_mentoria, temas)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
            `,
            [mentor_id, status_mentoria, data_mentoria, duracao_minutos, observacao_mentoria || null, temas || []]
        );

        const mentoriaId = rows[0].id;

        // Aqui, inserimos os jovens associados à mentoria na tabela N:N.
        if (Array.isArray(jovem_ids) && jovem_ids.length > 0) {
            const placeholders = jovem_ids.map((_, i) => `($1, $${i + 2})`).join(', ');
            await pool.query(
                `INSERT INTO mentorias_jovens (mentoria_id, jovem_id) VALUES ${placeholders}`,
                [mentoriaId, ...jovem_ids]
            );
        }

        // Aqui, retornamos o resultado completo com jovens e mentor via buscarPorId.
        return this.buscarPorId(mentoriaId);
    }

    // Aqui, buscamos uma mentoria específica pelo ID.
    async buscarPorId(id) {

        // Aqui, executamos uma consulta SELECT com JOIN filtrando pelo ID informado.
        const { rows } = await pool.query(
            `${SELECT_COM_MENTOR} WHERE m.id = $1`,
            [id]
        );

        // Aqui, retornamos a mentoria encontrada ou null caso ela não exista.
        return rows[0] ? new Mentoria(rows[0]) : null;
    }

    // Aqui, listamos todas as mentorias com filtros opcionais.
    async listarTodos(filtros = {}) {

        // Aqui, criamos arrays para armazenar condições e valores da consulta.
        const condicoes = [];
        const valores = [];
        let idx = 1;

        // Aqui, adicionamos filtros
        if (filtros.mentor_id) {
            condicoes.push(`m.mentor_id = $${idx++}`);
            valores.push(filtros.mentor_id);
        }

        if (filtros.status_mentoria) {
            condicoes.push(`m.status_mentoria = $${idx++}`);
            valores.push(filtros.status_mentoria);
        }

        if (filtros.data_mentoria) {
            condicoes.push(`m.data_mentoria = $${idx++}`);
            valores.push(filtros.data_mentoria);
        }

        // Aqui, adicionamos filtro por jovem via subquery na tabela N:N.
        if (filtros.jovem_id) {
            condicoes.push(`m.id IN (SELECT mentoria_id FROM mentorias_jovens WHERE jovem_id = $${idx++})`);
            valores.push(filtros.jovem_id);
        }

        // Aqui, montamos dinamicamente a cláusula WHERE da consulta.
        const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';

        // Aqui, executamos a consulta para listar as mentorias.
        const { rows } = await pool.query(
            `${SELECT_COM_MENTOR} ${where} ORDER BY m.data_mentoria DESC`,
            valores
        );

        // Aqui, transformamos cada resultado em uma instância do model Mentoria.
        return rows.map(row => new Mentoria(row));
    }

    // Aqui, atualizamos os dados de uma mentoria existente.
    async atualizar(id, dados) {

        // Aqui, criamos arrays para armazenar os campos e valores da atualização.
        const campos = [];
        const valores = [];
        let idx = 1;

        // Aqui, definimos quais campos escalares podem ser atualizados.
        const atualizaveis = [
            'mentor_id',
            'status_mentoria',
            'data_mentoria',
            'duracao_minutos',
            'observacao_mentoria',
            'temas'
        ];

        // Aqui, percorremos os campos permitidos para verificar quais foram enviados.
        for (const campo of atualizaveis) {
            if (dados[campo] !== undefined) {
                campos.push(`${campo} = $${idx++}`);
                valores.push(dados[campo]);
            }
        }

        // Aqui, retornamos null quando não há campos nem jovens para atualizar.
        if (!campos.length && !Array.isArray(dados.jovem_ids)) return null;

        // Aqui, executamos o UPDATE dos campos escalares quando houver algum.
        if (campos.length) {
            valores.push(id);
            const { rows } = await pool.query(
                `
                UPDATE mentorias
                SET ${campos.join(', ')}
                WHERE id = $${idx}
                RETURNING id
                `,
                valores
            );
            if (!rows[0]) return null;
        }

        // Aqui, substituímos os jovens associados quando jovem_ids foi enviado.
        if (Array.isArray(dados.jovem_ids)) {
            await pool.query('DELETE FROM mentorias_jovens WHERE mentoria_id = $1', [id]);

            if (dados.jovem_ids.length > 0) {
                const placeholders = dados.jovem_ids.map((_, i) => `($1, $${i + 2})`).join(', ');
                await pool.query(
                    `INSERT INTO mentorias_jovens (mentoria_id, jovem_id) VALUES ${placeholders}`,
                    [id, ...dados.jovem_ids]
                );
            }
        }

        // Aqui, retornamos a mentoria atualizada com jovens e mentor.
        return this.buscarPorId(id);
    }


    // Aqui, removemos uma mentoria do banco de dados.
    async excluir(id) {

        // Aqui, executamos o DELETE utilizando o ID informado.
        const { rows } = await pool.query(
            `DELETE FROM mentorias WHERE id = $1 RETURNING id`,
            [id]
        );

        // Aqui, retornamos o ID removido ou null caso o registro não exista.
        return rows[0] || null;
    }
}

// Aqui, exportamos uma instância única do repositório para ser utilizada no sistema.
module.exports = new MentoriaRepository();
