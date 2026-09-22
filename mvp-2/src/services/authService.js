const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const usuarioRepository = require('../repositories/usuarioRepository');
const jovemRepository = require('../repositories/jovemRepository');
const { pool } = require('../database/db');
const { BadRequestError, UnauthorizedError } = require('../errors/AppError');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

class AuthService {

    async login (email, senha) {
        if (!email || !senha) {
            throw new BadRequestError('E-mail e senha são obrigatórios');
        }

        const usuario = await usuarioRepository.buscarPorEmail(email);
        if (!usuario) {
            throw new UnauthorizedError('Credenciais inválidas');
        }

        const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
        if (!senhaValida) {
            throw new UnauthorizedError('Credenciais inválidas');
        }

        if (!usuario.ativo) {
            throw new UnauthorizedError('Usuário inativo');
        }

        const token = jwt.sign(
            { id: usuario.id, perfil: usuario.perfil, nome: usuario.nome, jovem_id: usuario.jovem_id || null, token_version: usuario.token_version },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );


        return {
            token,
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                perfil: usuario.perfil,
                cargo: usuario.cargo,
                foto_url: usuario.foto_url,
                jovem_id: usuario.jovem_id || null,
            }
        };
    }

    async cadastrarAluno(dados) {
        const {
            nome, email, cpf, senha,
            telefone, data_nascimento, genero, autodeclaracao_racial,
            renda_familiar, pcd, bairro, cidade, estado, tipo_moradia,
            consentimento_lgpd
        } = dados;

        if (!nome || !email || !cpf || !senha) {
            throw new BadRequestError('Nome, e-mail, CPF e senha são obrigatórios');
        }
        if (!consentimento_lgpd) {
            throw new BadRequestError('É necessário aceitar os termos de uso e privacidade');
        }

        const emailJaExiste = await usuarioRepository.buscarPorEmail(email);
        if (emailJaExiste) throw new BadRequestError('E-mail já cadastrado');

        const cpfJaExiste = await jovemRepository.buscarPorCpf(cpf);
        if (cpfJaExiste) throw new BadRequestError('CPF já cadastrado');

        const senha_hash = await bcrypt.hash(senha, 12);

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const { rows: jovemRows } = await client.query(
                `INSERT INTO jovens
                    (nome, cpf, email, telefone, data_nascimento, genero,
                     autodeclaracao_racial, renda_familiar, pcd,
                     bairro, cidade, estado, tipo_moradia, consentimento_lgpd,
                     status_jornada, ativo)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,false)
                 RETURNING id`,
                [
                    nome, cpf, email, telefone || null, data_nascimento || null,
                    genero || null, autodeclaracao_racial || null, renda_familiar || null,
                    pcd ?? false, bairro || null, cidade || null, estado || null,
                    tipo_moradia || null, true,
                    'Conectado'
                ]
            );
            const jovem_id = jovemRows[0].id;

            await client.query(
                `INSERT INTO usuarios (nome, email, senha_hash, perfil, ativo, jovem_id)
                 VALUES ($1, $2, $3, 'Aluno', false, $4)`,
                [nome, email, senha_hash, jovem_id]
            );

            await client.query('COMMIT');
            return { mensagem: 'Cadastro realizado com sucesso! Aguarde a aprovação da equipe Pulse Mais.' };
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    // Invalida todos os tokens ativos do usuário (logout global) incrementando token_version.
    async logoutAll(userId) {
        await usuarioRepository.incrementarTokenVersion(userId);
        return { mensagem: 'Todos os tokens foram invalidados' };
    }

    // Desativa logicamente a conta do usuário (soft delete via ativo = false).
    async desativarConta(userId) {
        await usuarioRepository.desativar(userId);
        return { mensagem: 'Conta desativada com sucesso' };
    }

    verificarToken(token) {
        try {
            return jwt.verify(token, JWT_SECRET);
        } catch {
            throw new UnauthorizedError('Token inválido ou expirado');
        }
    }
}

module.exports = new AuthService();