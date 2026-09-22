// src/repositories/usuarioRepository.js

// Aqui, importamos a conexão com o banco de dados.
const { pool } = require('../database/db');

// Aqui, importamos o model que representa a entidade Usuario.
const Usuario = require('../models/Usuario');

// Aqui, definimos as colunas que retornamos nas consultas da entidade Usuario.
const COLUNAS = `
        id, nome, email, senha_hash, perfil, ativo, cargo, telefone, foto_url, fuso_horario, data_inicio_mentoria, jovem_id, token_version, criado_em, atualizado_em
`;

// Aqui, criamos a classe responsável por acessar os dados da tabela usuarios.
class UsuarioRepository {

    // Aqui, criamos um novo usuário no banco de dados.
    async criar(dados) {

        // Aqui, extraímos os dados necessários para inserir um usuário.
        const { nome, email, senha_hash, perfil, ativo, cargo, telefone, foto_url, fuso_horario, jovem_id } = dados;

        // Aqui, executamos o INSERT usando parâmetros para evitar injeção de SQL.
        const { rows } = await pool.query(
            `INSERT INTO usuarios (nome, email, senha_hash, perfil, ativo, cargo, telefone, foto_url, fuso_horario, jovem_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING ${COLUNAS}`,
            [nome, email, senha_hash, perfil, ativo ?? true, cargo || null, telefone || null, foto_url || null, fuso_horario || null, jovem_id || null]
        );


        // Aqui, retornamos o usuário criado como instância do model Usuario.
        return new Usuario(rows[0]);
    }

    // Aqui, buscamos um usuário pelo ID.
    async buscarPorId(id) {

        // Aqui, executamos a consulta filtrando pelo ID informado.
        const { rows } = await pool.query(
            `SELECT ${COLUNAS} FROM usuarios WHERE id = $1`,
            [id]
        );

        // Aqui, retornamos o usuário encontrado ou null quando ele não existe.
        return rows[0] ? new Usuario(rows[0]) : null;
    }

    // Aqui, buscamos um usuário pelo e-mail.
    async buscarPorEmail(email) {

        // Aqui, executamos a consulta filtrando pelo e-mail informado.
        const { rows } = await pool.query(
            `SELECT ${COLUNAS} FROM usuarios WHERE email = $1`,
            [email]
        );

        // Aqui, retornamos o usuário encontrado ou null quando ele não existe.
        return rows[0] ? new Usuario(rows[0]) : null;
    }

    // Aqui, listamos todos os usuários com filtros opcionais.
    async listarTodos(filtros = {}) {

        // Aqui, criamos os arrays que armazenam as condições e os valores da consulta.
        const condicoes = [];
        const valores = [];
        let idx = 1;

        // Aqui, adicionamos o filtro de perfil quando ele é informado.
        if (filtros.perfil) {
            condicoes.push(`perfil = $${idx++}`);
            valores.push(filtros.perfil);
        }

        // Aqui, adicionamos o filtro de ativo quando ele é informado.
        if (filtros.ativo !== undefined) {
            condicoes.push(`ativo = $${idx++}`);
            valores.push(filtros.ativo);
        }

        // Aqui, adicionamos o filtro de busca por nome ou e-mail quando ele é informado.
        if (filtros.busca) {
            condicoes.push(`(nome ILIKE $${idx} OR email ILIKE $${idx})`);
            valores.push(`%${filtros.busca}%`);
            idx++;
        }

        // Aqui, montamos a cláusula WHERE apenas quando existem filtros.
        const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';

        // Aqui, executamos a consulta ordenando os usuários mais recentes primeiro.
        const { rows } = await pool.query(
            `SELECT ${COLUNAS} FROM usuarios ${where} ORDER BY criado_em DESC`,
            valores
        );

        // Aqui, retornamos a lista de usuários como instâncias do model Usuario.
        return rows.map(row => new Usuario(row));
    }

    // Aqui, atualizamos os dados de um usuário existente.
    async atualizar(id, dados) {

        // Aqui, criamos os arrays que armazenam os campos e valores da atualização.
        const campos = [];
        const valores = [];
        let idx = 1;

        // Aqui, definimos quais campos podem ser atualizados pelo repository.
        const atualizaveis = [
            'nome',
            'email',
            'senha_hash',
            'perfil',
            'ativo',
            'cargo',
            'telefone',
            'foto_url',
            'fuso_horario',
            'data_inicio_mentoria',
            'jovem_id'
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

        // Aqui, atualizamos automaticamente a data de alteração do usuário.
        campos.push('atualizado_em = NOW()');

        // Aqui, adicionamos o ID ao final dos valores usados na query.
        valores.push(id);

        // Aqui, executamos o UPDATE do usuário no banco de dados.
        const { rows } = await pool.query(
            `UPDATE usuarios
            SET ${campos.join(', ')}
            WHERE id = $${idx}
            RETURNING ${COLUNAS}`,
            valores
        );

        // Aqui, retornamos o usuário atualizado ou null quando ele não existe.
        return rows[0] ? new Usuario(rows[0]) : null;
    }

    // Aqui, desativamos um usuário sem remover seu histórico do banco.
    async desativar(id) {

        // Aqui, executamos a atualização lógica marcando o usuário como inativo.
        const { rows } = await pool.query(
            `UPDATE usuarios
            SET ativo = false, atualizado_em = NOW()
            WHERE id = $1
            RETURNING ${COLUNAS}`,
            [id]
        );

        // Aqui, retornamos o usuário desativado ou null quando ele não existe.
        return rows[0] ? new Usuario(rows[0]) : null;
    }

    // Aqui, incrementamos a versão do token, invalidando todos os tokens emitidos
    // anteriormente para o usuário (logout global).
    async incrementarTokenVersion(id) {

        // Aqui, somamos 1 à token_version atual de forma atômica.
        const { rows } = await pool.query(
            `UPDATE usuarios
            SET token_version = token_version + 1, atualizado_em = NOW()
            WHERE id = $1
            RETURNING token_version`,
            [id]
        );

        // Aqui, retornamos a nova token_version ou null quando o usuário não existe.
        return rows[0] || null;
    }

    // Aqui, reativamos um usuário previamente desativado.
    async reativar(id) {

        // Aqui, reativamos o usuário e, quando há jovem_id vinculado, também reativamos o jovem.
        const { rows } = await pool.query(
            `WITH updated_usuario AS (
                UPDATE usuarios
                SET ativo = true, atualizado_em = NOW()
                WHERE id = $1
                RETURNING ${COLUNAS}
            ),
            updated_jovem AS (
                UPDATE jovens
                SET ativo = true
                WHERE id = (SELECT jovem_id FROM updated_usuario)
                  AND (SELECT jovem_id FROM updated_usuario) IS NOT NULL
            )
            SELECT * FROM updated_usuario`,
            [id]
        );

        // Aqui, retornamos o usuário reativado ou null quando ele não existe.
        return rows[0] ? new Usuario(rows[0]) : null;
    }

    // Aqui, excluímos um usuário do banco de dados quando a remoção física for necessária.
    async excluir(id) {

        // Aqui, executamos o DELETE usando o ID informado.
        const { rows } = await pool.query(
            'DELETE FROM usuarios WHERE id = $1 RETURNING id',
            [id]
        );

        // Aqui, retornamos o ID removido ou null quando o usuário não existe.
        return rows[0] || null;
    }
}

// Aqui, exportamos uma instância única do repository de usuários.
module.exports = new UsuarioRepository();
