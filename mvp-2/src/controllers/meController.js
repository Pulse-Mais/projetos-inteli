// src/controllers/meController.js

const bcrypt = require('bcrypt');
const usuarioRepository = require('../repositories/usuarioRepository');
const jovemService = require('../services/jovemService');
const { asyncHandler } = require('../middlewares/asyncHandler');
const { BadRequestError } = require('../errors/AppError');

const obterPerfil = asyncHandler(async (req, res) => {
    const usuario = await usuarioRepository.buscarPorId(req.usuario.id);

    const resultado = {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
        cargo: usuario.cargo,
        foto_url: usuario.foto_url,
        fuso_horario: usuario.fuso_horario,
        data_inicio_mentoria: usuario.data_inicio_mentoria,
        jovem_id: usuario.jovem_id,
    };

    if (usuario.jovem_id) {
        resultado.ficha = await jovemService.buscarFicha(usuario.jovem_id);
    }

    res.json(resultado);
});

const atualizarPerfil = asyncHandler(async (req, res) => {
    const { nome, email, cpf, telefone, cargo, foto_url } = req.body;

    if (!nome && !email && !cpf && !telefone && !cargo && foto_url === undefined)
        throw new BadRequestError('Informe ao menos um campo para atualizar.');
    if (nome && nome.trim().length < 2) throw new BadRequestError('Nome deve ter ao menos 2 caracteres.');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new BadRequestError('E-mail inválido.');

    if (foto_url !== undefined && foto_url !== null) {
        if (typeof foto_url !== 'string' || !foto_url.startsWith('data:image/'))
            throw new BadRequestError('Foto deve ser uma imagem em formato base64.');
        if (foto_url.length > 500_000)
            throw new BadRequestError('A imagem é muito grande. Tente uma foto menor.');
    }

    if (email) {
        const existente = await usuarioRepository.buscarPorEmail(email);
        if (existente && existente.id !== req.usuario.id) throw new BadRequestError('E-mail já está em uso.');
    }

    const dadosUsuario = {
        ...(nome     && { nome: nome.trim() }),
        ...(email    && { email: email.trim().toLowerCase() }),
        ...(telefone !== undefined && { telefone: telefone || null }),
        ...(cargo    !== undefined && { cargo: cargo?.trim() || null }),
        ...(foto_url !== undefined && { foto_url: foto_url || null }),
    };

    let atualizado;
    if (Object.keys(dadosUsuario).length) {
        atualizado = await usuarioRepository.atualizar(req.usuario.id, dadosUsuario);
    } else {
        atualizado = await usuarioRepository.buscarPorId(req.usuario.id);
    }

    if (atualizado.jovem_id && (nome || cpf)) {
        await jovemService.atualizar(atualizado.jovem_id, {
            ...(nome && { nome: nome.trim() }),
            ...(cpf  && { cpf }),
        });
    }

    res.json({
        id: atualizado.id,
        nome: atualizado.nome,
        email: atualizado.email,
        foto_url: atualizado.foto_url,
    });
});

const alterarSenha = asyncHandler(async (req, res) => {
    const { senha_atual, nova_senha, confirmar_senha } = req.body;

    if (!senha_atual || !nova_senha || !confirmar_senha)
        throw new BadRequestError('Todos os campos de senha são obrigatórios.');
    if (nova_senha.length < 6)
        throw new BadRequestError('A nova senha deve ter ao menos 6 caracteres.');
    if (nova_senha !== confirmar_senha)
        throw new BadRequestError('A confirmação não confere com a nova senha.');
    if (senha_atual === nova_senha)
        throw new BadRequestError('A nova senha deve ser diferente da senha atual.');

    const usuario = await usuarioRepository.buscarPorId(req.usuario.id);
    const senhaValida = await bcrypt.compare(senha_atual, usuario.senha_hash);
    if (!senhaValida) throw new BadRequestError('Senha atual incorreta.');

    const senha_hash = await bcrypt.hash(nova_senha, 12);
    await usuarioRepository.atualizar(req.usuario.id, { senha_hash });

    res.json({ mensagem: 'Senha alterada com sucesso.' });
});

module.exports = { obterPerfil, atualizarPerfil, alterarSenha };