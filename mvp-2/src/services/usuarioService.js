// src/services/usuarioService.js

// Aqui, importamos o bcrypt para gerar e comparar hashes de senha.
const bcrypt = require('bcrypt');

// Aqui, importamos o repository responsável por acessar os dados de usuários.
const usuarioRepository = require('../repositories/usuarioRepository');

// Aqui, importamos os erros personalizados usados nas validações do service.
const { BadRequestError, NotFoundError, ConflictError } = require('../errors/AppError');

// Aqui, definimos os perfis permitidos para usuários do sistema.
const PERFIS_VALIDOS = [
    'GestaoGeral',
    'Coordenacao',
    'Assistente',
    'Psicologa',
    'Aluno',
    'Mentor'
];

// Aqui, definimos o custo utilizado pelo bcrypt para gerar hashes de senha.
const BCRYPT_SALT_ROUNDS = 10;

class UsuarioService {

    // Aqui, criamos um novo usuário aplicando as regras de negócio antes da persistência.
    async criar(dados) {
        this._validarCamposObrigatorios(dados);
        this._validarEmail(dados.email);
        this._validarPerfil(dados.perfil);
        this._validarSenha(dados.senha);

        const usuarioExistente = await usuarioRepository.buscarPorEmail(dados.email);
        if (usuarioExistente) {
            throw new ConflictError('E-mail já cadastrado');
        }

        const senha_hash = await bcrypt.hash(dados.senha, BCRYPT_SALT_ROUNDS);

        const usuario = await usuarioRepository.criar({
            nome: dados.nome,
            email: dados.email,
            senha_hash,
            perfil: dados.perfil,
            ativo: dados.ativo,
            cargo: dados.cargo,
            telefone: dados.telefone,
            foto_url: dados.foto_url,
            fuso_horario: dados.fuso_horario
        });


        return this._removerSenhaHash(usuario);
    }

    // Aqui, buscamos um usuário pelo ID.
    async buscarPorId(id) {
        const usuario = await usuarioRepository.buscarPorId(id);
        if (!usuario) throw new NotFoundError('Usuário');
        return this._removerSenhaHash(usuario);
    }

    // Aqui, buscamos um usuário pelo e-mail.
    async buscarPorEmail(email) {
        const usuario = await usuarioRepository.buscarPorEmail(email);
        if (!usuario) throw new NotFoundError('Usuário');
        return this._removerSenhaHash(usuario);
    }

    // Aqui, listamos usuários com filtros opcionais.
    async listarTodos(filtros = {}) {
        if (filtros.perfil) {
            this._validarPerfil(filtros.perfil);
        }

        if (filtros.ativo !== undefined) {
            filtros.ativo = filtros.ativo === 'true' || filtros.ativo === true;
        }

        const usuarios = await usuarioRepository.listarTodos(filtros);
        return usuarios.map(usuario => this._removerSenhaHash(usuario));
    }

    // Aqui, atualizamos um usuário existente.
    async atualizar(id, dados) {
        const usuarioExistente = await usuarioRepository.buscarPorId(id);
        if (!usuarioExistente) throw new NotFoundError('Usuário');

        if (dados.email !== undefined) {
            this._validarEmail(dados.email);

            const usuarioComMesmoEmail = await usuarioRepository.buscarPorEmail(dados.email);
            if (usuarioComMesmoEmail && usuarioComMesmoEmail.id !== Number(id)) {
                throw new ConflictError('E-mail já cadastrado');
            }
        }

        if (dados.perfil !== undefined) {
            this._validarPerfil(dados.perfil);
        }

        if (dados.senha !== undefined) {
            this._validarSenha(dados.senha);
            dados.senha_hash = await bcrypt.hash(dados.senha, BCRYPT_SALT_ROUNDS);
            delete dados.senha;
        }

        const usuario = await usuarioRepository.atualizar(id, dados);
        return this._removerSenhaHash(usuario);
    }

    // Aqui, desativamos um usuário existente sem excluir o registro do banco.
    async desativar(id) {
        const usuarioExistente = await usuarioRepository.buscarPorId(id);
        if (!usuarioExistente) throw new NotFoundError('Usuário');

        const usuario = await usuarioRepository.desativar(id);
        return this._removerSenhaHash(usuario);
    }

    // Aqui, reativamos um usuário previamente desativado.
    async reativar(id) {
        const usuarioExistente = await usuarioRepository.buscarPorId(id);
        if (!usuarioExistente) throw new NotFoundError('Usuário');

        const usuario = await usuarioRepository.reativar(id);
        return this._removerSenhaHash(usuario);
    }

    // Aqui, excluímos um usuário existente quando a remoção física for necessária.
    async excluir(id) {
        const usuarioExistente = await usuarioRepository.buscarPorId(id);
        if (!usuarioExistente) throw new NotFoundError('Usuário');
        return usuarioRepository.excluir(id);
    }

    // Aqui, validamos se os campos obrigatórios foram enviados.
    _validarCamposObrigatorios(dados) {
        const obrigatorios = ['nome', 'email', 'senha', 'perfil'];
        const ausentes = obrigatorios.filter(c => !dados[c]);

        if (ausentes.length) {
            throw new BadRequestError(`Campos obrigatórios ausentes: ${ausentes.join(', ')}`);
        }
    }

    // Aqui, validamos se o e-mail possui um formato básico válido.
    _validarEmail(email) {
        const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

        if (!emailValido) {
            throw new BadRequestError('E-mail inválido');
        }
    }

    // Aqui, validamos se o perfil informado está entre os perfis permitidos.
    _validarPerfil(perfil) {
        if (!PERFIS_VALIDOS.includes(perfil)) {
            throw new BadRequestError(
                `perfil inválido. Valores permitidos: ${PERFIS_VALIDOS.join(', ')}`
            );
        }
    }

    // Aqui, validamos se a senha atende ao tamanho mínimo definido no WAD.
    _validarSenha(senha) {
        if (!senha || senha.length < 8) {
            throw new BadRequestError('A senha deve ter no mínimo 8 caracteres');
        }
    }

    // Aqui, removemos o hash da senha antes de retornar o usuário para outras camadas.
    _removerSenhaHash(usuario) {
        if (!usuario) return null;

        const usuarioSemSenha = { ...usuario };
        delete usuarioSemSenha.senha_hash;

        return usuarioSemSenha;
    }
}

module.exports = new UsuarioService();
